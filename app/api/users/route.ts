import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getSession } from "@/lib/auth"

export const dynamic = "force-dynamic"
export const revalidate = 0

// This endpoint now specifically handles Azure AD users
export async function GET() {
  try {
    // Check authentication
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("🔄 API: Fetching fresh users from users_azure table...")

    const users = await query<{
      id: string
      displayName: string
      userPrincipalName: string
      vpnServers: string
    }>(`
      SELECT DISTINCT
        ua.id, 
        ua.displayName, 
        ua.userPrincipalName,
        GROUP_CONCAT(DISTINCT ura.radius_server_id) as vpnServers
      FROM 
        users_azure ua
      LEFT JOIN 
        user_radius_access ura ON ua.userPrincipalName = ura.user_principal_name
      GROUP BY 
        ua.id, ua.displayName, ua.userPrincipalName
      ORDER BY 
        ua.displayName ASC
    `)

    console.log("📊 API: Number of users fetched:", users.length)
    console.log("📝 API: Raw user data:", JSON.stringify(users, null, 2))

    const formattedUsers = users.map((user) => ({
      ...user,
      vpnServers: user.vpnServers ? user.vpnServers.split(",").map(Number) : [],
      hasVpnAccess: !!user.vpnServers,
    }))

    console.log("📊 API: Number of formatted users:", formattedUsers.length)

    return NextResponse.json({ users: formattedUsers }, { headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    console.error("❌ API: Error fetching users:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}

