"use client"

import { useState, useCallback, useEffect } from "react"
import { Users, Shield, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import useSWR from "swr"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { UserAccessManagement } from "@/components/UserAccessManagement"

interface User {
  id: string
  displayName: string
  userPrincipalName: string
  hasVpnAccess: boolean
  vpnServers: number[]
}

interface RadiusServer {
  id: string
  name: string
  db_name: string
}

const fetcher = (url: string) => fetch(url, { cache: "no-store" }).then((res) => res.json())

export function DashboardClient() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [isSyncing, setIsSyncing] = useState(false)
  const { toast } = useToast()

  const {
    data: usersData,
    error: usersError,
    mutate: mutateUsers,
  } = useSWR<{ users: User[] }>("/api/users", fetcher, {
    refreshInterval: 0, // Desactivamos el intervalo de actualización automática
    revalidateOnFocus: false, // Desactivamos la revalidación al enfocar la ventana
    dedupingInterval: 0, // Desactivamos la deduplicación de solicitudes
  })
  const { data: radiusServersData, error: radiusServersError } = useSWR<RadiusServer[]>("/api/radius/servers", fetcher)

  const users = usersData?.users || []
  const radiusServers = radiusServersData || []

  const itemsPerPage = 10

  const filteredUsers = users.filter(
    (user) =>
      user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.userPrincipalName.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)

  const handleAccessUpdated = useCallback(() => {
    mutateUsers()
  }, [mutateUsers])

  useEffect(() => {
    if (usersData) {
      console.log("Dashboard data updated:", usersData.users.length, "users")
    }
  }, [usersData])

  const syncUsers = async () => {
    setIsSyncing(true)
    try {
      const response = await fetch("/api/sync-users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to synchronize users")
      }

      const data = await response.json()

      toast({
        title: "Sincronización completada",
        description: `Se han sincronizado ${data.usersCount} usuarios con Azure AD.`,
      })

      // Forzar una actualización inmediata de los datos
      await mutateUsers()
    } catch (error) {
      console.error("Error syncing users:", error)
      toast({
        title: "Error",
        description: "No se pudo sincronizar los usuarios",
        variant: "destructive",
      })
    } finally {
      setIsSyncing(false)
    }
  }

  // Función para actualizar manualmente los datos
  const handleManualRefresh = useCallback(async () => {
    try {
      await mutateUsers()
      toast({
        title: "Datos actualizados",
        description: "Los datos de usuarios se han actualizado correctamente.",
      })
    } catch (error) {
      console.error("Error refreshing data:", error)
      toast({
        title: "Error",
        description: "No se pudieron actualizar los datos",
        variant: "destructive",
      })
    }
  }, [mutateUsers, toast])

  if (usersError || radiusServersError) {
    return <div>Error loading data</div>
  }

  return (
    <>
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleManualRefresh} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Actualizar datos
            </Button>
            <Button onClick={syncUsers} disabled={isSyncing} className="gap-2">
              <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
              {isSyncing ? "Sincronizando..." : "Sincronizar con Azure AD"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-4 w-4" />
                Total Users
              </CardTitle>
              <CardDescription>Total users in your tenant</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{users.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="mr-2 h-4 w-4" />
                VPN Access
              </CardTitle>
              <CardDescription>Users with VPN access</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{users.filter((user) => user.hasVpnAccess).length}</div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>Manage user access to VPN</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 mb-4">
              <Input
                type="text"
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
                className="flex-grow"
              />
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>VPN Access</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.displayName}</TableCell>
                    <TableCell>{user.userPrincipalName}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-sm ${
                          user.vpnServers.length > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}
                      >
                        {user.vpnServers.length > 0 ? `Enabled (${user.vpnServers.length} servers)` : "Disabled"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedUser(user)
                          setDialogOpen(true)
                        }}
                      >
                        Manage Access
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex items-center justify-between mt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Link href="/radius-management">
          <Button className="w-full md:w-auto">
            <Shield className="mr-2 h-4 w-4" />
            RADIUS Server Management
          </Button>
        </Link>
      </div>
      {selectedUser && (
        <UserAccessManagement
          user={selectedUser}
          radiusServers={radiusServers}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onAccessUpdated={handleAccessUpdated}
        />
      )}
      <Toaster />
    </>
  )
}

