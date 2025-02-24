"use client"

import { useState, useEffect } from "react"
import useSWR from "swr"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

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

interface UserAccessManagementProps {
  user: User
  radiusServers: RadiusServer[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onAccessUpdated: () => void
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function UserAccessManagement({
  user,
  radiusServers,
  open,
  onOpenChange,
  onAccessUpdated,
}: UserAccessManagementProps) {
  const { toast } = useToast()

  const {
    data: userAccess,
    error,
    mutate,
  } = useSWR(open ? `/api/radius/allowed-users/${encodeURIComponent(user.userPrincipalName)}` : null, fetcher)

  const [allowedServers, setAllowedServers] = useState<number[]>([])

  useEffect(() => {
    if (userAccess) {
      setAllowedServers(userAccess.radiusServers || [])
    }
  }, [userAccess])

  const handleAccessToggle = async (serverId: number, checked: boolean) => {
    const updatedServers = checked ? [...allowedServers, serverId] : allowedServers.filter((id) => id !== serverId)

    try {
      const response = await fetch("/api/radius/allowed-users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userPrincipalName: user.userPrincipalName,
          radiusServers: updatedServers,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update user access")
      }

      await mutate()
      onAccessUpdated()

      toast({
        title: "Success",
        description: `VPN access ${checked ? "granted" : "revoked"} for ${user.displayName}`,
      })
    } catch (error) {
      console.error("Error updating user access:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update VPN access",
        variant: "destructive",
      })
    }
  }

  if (error) {
    return <div>Error loading user access</div>
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage VPN Access for {user.displayName}</DialogTitle>
          <DialogDescription>Toggle access for each RADIUS server</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {radiusServers.map((server) => {
            const isEnabled = allowedServers.includes(Number(server.id))
            return (
              <div key={server.id} className="flex items-center justify-between space-x-2">
                <Label htmlFor={`server-${server.id}`} className="flex-grow">
                  {server.name} ({server.db_name})
                </Label>
                <Switch
                  id={`server-${server.id}`}
                  checked={isEnabled}
                  onCheckedChange={(checked) => handleAccessToggle(Number(server.id), checked)}
                />
              </div>
            )
          })}
        </div>
        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

