import { startScheduledSync } from "./scheduledSync"

export function initializeSync() {
  console.log("Iniciando proceso de sincronización...")
  startScheduledSync()
}

