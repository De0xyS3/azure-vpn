import { fetchAzureUsers } from "./azure"
import { query, transaction } from "./db"

async function syncUsers() {
  try {
    console.log("Iniciando sincronización programada con Azure AD...")
    const azureUsers = await fetchAzureUsers()
    console.log("Usuarios obtenidos de Azure AD:", azureUsers.length)

    await transaction(async (connection) => {
      // Limpiar la tabla users_azure
      await query("TRUNCATE TABLE users_azure")
      console.log("Tabla users_azure limpiada")

      // Insertar los usuarios de Azure AD
      for (const user of azureUsers) {
        await query("INSERT INTO users_azure (id, displayName, userPrincipalName) VALUES (?, ?, ?)", [
          user.id,
          user.displayName,
          user.userPrincipalName,
        ])
      }
    })

    console.log(`Sincronización programada completada. ${azureUsers.length} usuarios insertados.`)
  } catch (error) {
    console.error("Error durante la sincronización programada:", error)
  }
}

let syncInterval: NodeJS.Timeout | null = null

export function startScheduledSync() {
  if (syncInterval) {
    clearInterval(syncInterval)
  }

  // Ejecutar la sincronización inmediatamente al iniciar
  syncUsers()

  // Configurar la sincronización para que se ejecute cada 5 minutos
  syncInterval = setInterval(syncUsers, 5 * 60 * 1000)
  console.log("Sincronización programada iniciada. Se ejecutará cada 5 minutos.")
}

export function stopScheduledSync() {
  if (syncInterval) {
    clearInterval(syncInterval)
    syncInterval = null
    console.log("Sincronización programada detenida.")
  }
}

