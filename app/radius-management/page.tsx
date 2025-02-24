"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"

interface RadiusServer {
  id: number
  name: string
  description: string
  db_host: string
  db_port: number
  db_name: string
  db_user: string
  db_password: string
}

interface FormErrors {
  name?: string
  db_host?: string
  db_port?: string
  db_name?: string
  db_user?: string
  db_password?: string
}

export default function RadiusManagementPage() {
  const [radiusServers, setRadiusServers] = useState<RadiusServer[]>([])
  const [newServer, setNewServer] = useState<Partial<RadiusServer>>({
    name: "",
    description: "",
    db_host: "",
    db_port: 3306,
    db_name: "",
    db_user: "",
    db_password: "",
  })
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const { toast } = useToast()

  useEffect(() => {
    fetchRadiusServers()
  }, [])

  const fetchRadiusServers = async () => {
    try {
      const response = await fetch("/api/radius/servers")
      if (!response.ok) throw new Error("Failed to fetch RADIUS servers")
      const data = await response.json()
      setRadiusServers(data)
    } catch (error) {
      console.error("Error fetching RADIUS servers:", error)
      toast({
        title: "Error",
        description: "Failed to load RADIUS servers",
        variant: "destructive",
      })
    }
  }

  const validateForm = (): boolean => {
    const errors: FormErrors = {}
    if (!newServer.name) errors.name = "Name is required"
    if (!newServer.db_host) errors.db_host = "Database host is required"
    if (!newServer.db_port) errors.db_port = "Database port is required"
    if (!newServer.db_name) errors.db_name = "Database name is required"
    if (!newServer.db_user) errors.db_user = "Database user is required"
    if (!newServer.db_password) errors.db_password = "Database password is required"

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleAddServer = async () => {
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/radius/servers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newServer),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to add RADIUS server")
      }
      fetchRadiusServers()
      setNewServer({
        name: "",
        description: "",
        db_host: "",
        db_port: 3306,
        db_name: "",
        db_user: "",
        db_password: "",
      })
      setFormErrors({})
      toast({
        title: "Success",
        description: "RADIUS server added successfully",
      })
    } catch (error) {
      console.error("Error adding RADIUS server:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add RADIUS server",
        variant: "destructive",
      })
    }
  }

  const handleUpdateServer = async (server: RadiusServer) => {
    try {
      const response = await fetch(`/api/radius/servers/${server.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(server),
      })
      if (!response.ok) throw new Error("Failed to update RADIUS server")
      fetchRadiusServers()
      toast({
        title: "Success",
        description: "RADIUS server updated successfully",
      })
    } catch (error) {
      console.error("Error updating RADIUS server:", error)
      toast({
        title: "Error",
        description: "Failed to update RADIUS server",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container mx-auto p-4">
      <Toaster />
      <h1 className="text-2xl font-bold mb-4">RADIUS Server Management</h1>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Add New RADIUS Server</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="Name"
              value={newServer.name || ""}
              onChange={(e) => setNewServer({ ...newServer, name: e.target.value })}
              className={formErrors.name ? "border-red-500" : ""}
            />
            {formErrors.name && <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>}
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="Description"
              value={newServer.description || ""}
              onChange={(e) => setNewServer({ ...newServer, description: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="db_host">Database Host</Label>
            <Input
              id="db_host"
              placeholder="Database Host"
              value={newServer.db_host || ""}
              onChange={(e) => setNewServer({ ...newServer, db_host: e.target.value })}
              className={formErrors.db_host ? "border-red-500" : ""}
            />
            {formErrors.db_host && <p className="text-red-500 text-sm mt-1">{formErrors.db_host}</p>}
          </div>
          <div>
            <Label htmlFor="db_port">Database Port</Label>
            <Input
              id="db_port"
              placeholder="Database Port"
              type="number"
              value={newServer.db_port || ""}
              onChange={(e) => setNewServer({ ...newServer, db_port: Number(e.target.value) })}
              className={formErrors.db_port ? "border-red-500" : ""}
            />
            {formErrors.db_port && <p className="text-red-500 text-sm mt-1">{formErrors.db_port}</p>}
          </div>
          <div>
            <Label htmlFor="db_name">Database Name</Label>
            <Input
              id="db_name"
              placeholder="Database Name"
              value={newServer.db_name || ""}
              onChange={(e) => setNewServer({ ...newServer, db_name: e.target.value })}
              className={formErrors.db_name ? "border-red-500" : ""}
            />
            {formErrors.db_name && <p className="text-red-500 text-sm mt-1">{formErrors.db_name}</p>}
          </div>
          <div>
            <Label htmlFor="db_user">Database User</Label>
            <Input
              id="db_user"
              placeholder="Database User"
              value={newServer.db_user || ""}
              onChange={(e) => setNewServer({ ...newServer, db_user: e.target.value })}
              className={formErrors.db_user ? "border-red-500" : ""}
            />
            {formErrors.db_user && <p className="text-red-500 text-sm mt-1">{formErrors.db_user}</p>}
          </div>
          <div>
            <Label htmlFor="db_password">Database Password</Label>
            <Input
              id="db_password"
              placeholder="Database Password"
              type="password"
              value={newServer.db_password || ""}
              onChange={(e) => setNewServer({ ...newServer, db_password: e.target.value })}
              className={formErrors.db_password ? "border-red-500" : ""}
            />
            {formErrors.db_password && <p className="text-red-500 text-sm mt-1">{formErrors.db_password}</p>}
          </div>
        </div>
        <Button onClick={handleAddServer} className="mt-4">
          Add Server
        </Button>
      </div>

      <h2 className="text-xl font-semibold mb-2">RADIUS Servers</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Database</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {radiusServers.map((server) => (
            <TableRow key={server.id}>
              <TableCell>{server.id}</TableCell>
              <TableCell>{server.name}</TableCell>
              <TableCell>{server.description}</TableCell>
              <TableCell>{server.db_name}</TableCell>
              <TableCell>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline">Edit</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit RADIUS Server</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-name" className="text-right">
                          Name
                        </Label>
                        <Input
                          id="edit-name"
                          value={server.name}
                          onChange={(e) =>
                            setRadiusServers(
                              radiusServers.map((s) => (s.id === server.id ? { ...s, name: e.target.value } : s)),
                            )
                          }
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-description" className="text-right">
                          Description
                        </Label>
                        <Input
                          id="edit-description"
                          value={server.description}
                          onChange={(e) =>
                            setRadiusServers(
                              radiusServers.map((s) =>
                                s.id === server.id ? { ...s, description: e.target.value } : s,
                              ),
                            )
                          }
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-db_host" className="text-right">
                          DB Host
                        </Label>
                        <Input
                          id="edit-db_host"
                          value={server.db_host}
                          onChange={(e) =>
                            setRadiusServers(
                              radiusServers.map((s) => (s.id === server.id ? { ...s, db_host: e.target.value } : s)),
                            )
                          }
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-db_port" className="text-right">
                          DB Port
                        </Label>
                        <Input
                          id="edit-db_port"
                          type="number"
                          value={server.db_port}
                          onChange={(e) =>
                            setRadiusServers(
                              radiusServers.map((s) =>
                                s.id === server.id ? { ...s, db_port: Number(e.target.value) } : s,
                              ),
                            )
                          }
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-db_name" className="text-right">
                          DB Name
                        </Label>
                        <Input
                          id="edit-db_name"
                          value={server.db_name}
                          onChange={(e) =>
                            setRadiusServers(
                              radiusServers.map((s) => (s.id === server.id ? { ...s, db_name: e.target.value } : s)),
                            )
                          }
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-db_user" className="text-right">
                          DB User
                        </Label>
                        <Input
                          id="edit-db_user"
                          value={server.db_user}
                          onChange={(e) =>
                            setRadiusServers(
                              radiusServers.map((s) => (s.id === server.id ? { ...s, db_user: e.target.value } : s)),
                            )
                          }
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-db_password" className="text-right">
                          DB Password
                        </Label>
                        <Input
                          id="edit-db_password"
                          type="password"
                          value={server.db_password}
                          onChange={(e) =>
                            setRadiusServers(
                              radiusServers.map((s) =>
                                s.id === server.id ? { ...s, db_password: e.target.value } : s,
                              ),
                            )
                          }
                          className="col-span-3"
                        />
                      </div>
                    </div>
                    <Button onClick={() => handleUpdateServer(server)}>Update Server</Button>
                  </DialogContent>
                </Dialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

