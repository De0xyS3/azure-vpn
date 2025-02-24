import { Client } from "@microsoft/microsoft-graph-client"
import { TokenCredentialAuthenticationProvider } from "@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials"
import { ClientSecretCredential } from "@azure/identity"

export interface AzureUser {
  id: string
  displayName: string
  userPrincipalName: string
}

export function getGraphClient() {
  const credential = new ClientSecretCredential(
    process.env.AZURE_TENANT_ID!,
    process.env.AZURE_CLIENT_ID!,
    process.env.AZURE_CLIENT_SECRET!,
  )

  const authProvider = new TokenCredentialAuthenticationProvider(credential, {
    scopes: ["https://graph.microsoft.com/.default"],
  })

  return Client.initWithMiddleware({ authProvider })
}

export async function fetchAzureUsers(): Promise<AzureUser[]> {
  const graphClient = getGraphClient()

  try {
    const response = await graphClient.api("/users").select("id,displayName,userPrincipalName").get()

    return response.value
  } catch (error) {
    console.error("Error fetching users from Azure AD:", error)
    throw error
  }
}

