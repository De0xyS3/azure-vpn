import { NextResponse } from "next/server"
import { fetchAzureUsers, type AzureUser } from "@/lib/azure"
import { query, transaction } from "@/lib/db"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function POST(request: Request) {
  try {
    console.log("🔄 Iniciando sincronización con Azure AD...")

    const azureUsers: AzureUser[] = await fetchAzureUsers()
    console.log("✅ Usuarios obtenidos de Azure AD:", azureUsers.length)

    const currentUsers = await query<{ userPrincipalName: string }>("SELECT userPrincipalName FROM users_azure")

    const azureUserSet = new Set(azureUsers.map((user) => user.userPrincipalName))
    const currentUserSet = new Set(currentUsers.map((user) => user.userPrincipalName))

    const addedUsers = azureUsers.filter((user) => !currentUserSet.has(user.userPrincipalName))
    const removedUsers = currentUsers.filter((user) => !azureUserSet.has(user.userPrincipalName))
    const updatedUsers = azureUsers.filter((user) => currentUserSet.has(user.userPrincipalName))

    await transaction(async (connection) => {
      // Eliminar acceso RADIUS para usuarios removidos
      for (const user of removedUsers) {
        await query("DELETE FROM user_radius_access WHERE user_principal_name = ?", [user.userPrincipalName])
        console.log(`🗑️ Acceso RADIUS eliminado para: ${user.userPrincipalName}`)
      }

      // Limpiar la tabla users_azure
      await query("TRUNCATE TABLE users_azure")
      console.log("🗑️ Tabla users_azure limpiada")

      // Insertar los usuarios actuales de Azure AD
      for (const user of azureUsers) {
        await query("INSERT INTO users_azure (id, displayName, userPrincipalName) VALUES (?, ?, ?)", [
          user.id,
          user.displayName,
          user.userPrincipalName,
        ])
      }

      // Registrar el evento de sincronización
      await query(
        "INSERT INTO sync_events (users_added, users_updated, users_deleted, total_users) VALUES (?, ?, ?, ?)",
        [addedUsers.length, updatedUsers.length, removedUsers.length, azureUsers.length],
      )
    })

    console.log(`✅ Sincronización completada. ${azureUsers.length} usuarios en la base de datos.`)
    console.log(
      `📊 Usuarios añadidos: ${addedUsers.length}, actualizados: ${updatedUsers.length}, eliminados: ${removedUsers.length}`,
    )

    return NextResponse.json(
      {
        message: "Sincronización completada",
        usersAdded: addedUsers.length,
        usersUpdated: updatedUsers.length,
        usersDeleted: removedUsers.length,
        totalUsers: azureUsers.length,
      },
      { headers: { "Cache-Control": "no-store" } },
    )
  } catch (error: any) {
    console.error("❌ Error durante la sincronización:", error.message)
    return NextResponse.json(
      { error: "Error durante la sincronización de usuarios", details: error.message },
      { status: 500 },
    )
  }
}

