"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Plus, Trash2, Info } from "lucide-react"
import useSWR from "swr"

interface RadiusServer {
  id: number
  name: string
  description: string | null
  created_at: string
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function RadiusServerManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const { data, error, mutate } = useSWR<{ servers: RadiusServer[] }>("/api/radius/servers", fetcher)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)

    const formData = new FormData(event.currentTarget)
    const serverData = {
      name: formData.get("name"),
      description: formData.get("description"),
    }

    try {
      const response = await fetch("/api/radius/servers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(serverData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create server")
      }

      await mutate()
      setIsDialogOpen(false)
      toast({
        title: "Success",
        description: "RADIUS server created successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create server",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (serverId: number) => {
    if (!confirm("Are you sure you want to delete this server? This will remove access for all users.")) {
      return
    }

    try {
      const response = await fetch(`/api/radius/servers/${serverId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete server")
      }

      await mutate()
      toast({
        title: "Success",
        description: "RADIUS server deleted successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete server",
        variant: "destructive",
      })
    }
  }

  if (error) return <div>Failed to load RADIUS servers</div>

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>RADIUS Servers</CardTitle>
              <CardDescription>Manage your RADIUS servers</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Server
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New RADIUS Server</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Server Name</Label>
                    <Input id="name" name="name" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea id="description" name="description" />
                  </div>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Creating..." : "Create Server"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Alert variant="info" className="mb-4">
            <Info className="h-4 w-4" />
            <AlertTitle>Importante</AlertTitle>
            <AlertDescription>
              Utiliza el ID del servidor RADIUS para registrarlo en el fichero env de tu contenedor radius.
            </AlertDescription>
          </Alert>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-bold text-primary">ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.servers.map((server) => (
                <TableRow key={server.id}>
                  <TableCell className="font-bold text-primary">
                    {server.id}
                  </TableCell>
                  <TableCell>{server.name}</TableCell>
                  <TableCell>{server.description || "-"}</TableCell>
                  <TableCell>{new Date(server.created_at).toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(server.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

