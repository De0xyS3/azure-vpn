import { NextResponse } from "next/server"
import mysql from "mysql2/promise"

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number.parseInt(process.env.DB_PORT || "3306", 10),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
})

export async function GET() {
  try {
    const [rows] = await pool.query("SELECT * FROM radius_servers")
    return NextResponse.json(rows)
  } catch (error) {
    console.error("Error fetching RADIUS servers:", error)
    return NextResponse.json({ error: "Failed to fetch RADIUS servers" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { name, description, db_host, db_port, db_name, db_user, db_password } = await request.json()

    // Map the database connection fields to the host/port fields in radius_servers table
    const [result] = await pool.query(
      "INSERT INTO radius_servers (name, description, host, port, users_table, db_host, db_port, db_name, db_user, db_password) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [name, description, db_host, db_port, "allowed_users", db_host, db_port, db_name, db_user, db_password],
    )

    return NextResponse.json({
      id: (result as any).insertId,
      name,
      description,
      host: db_host,
      port: db_port,
      users_table: "allowed_users",
      db_host,
      db_port,
      db_name,
      db_user,
      db_password,
    })
  } catch (error) {
    console.error("Error adding RADIUS server:", error)
    return NextResponse.json({ error: "Failed to add RADIUS server", details: error }, { status: 500 })
  }
}

