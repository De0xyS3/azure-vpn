# App Azure - Docker Compose Configuration

## Overview
This repository contains Docker Compose configurations for deploying a Next.js application that manages RADIUS access and integrates with FortiGate.

## Services

### App Azure (VPN Authentication)
- Builds the image from the provided `Dockerfile`.
- Exposes port 3000 for API communication.
- Loads SSL certificates from mounted volumes.
- Uses an `.env.local` file for configuration.
- Runs with user privileges set to `root`.
- Connects to the `app-network`.

## Configuration

### Environment Variables
These variables should be defined in `.env.local`:

```plaintext
# Azure AD Configuration
AZURE_CLIENT_ID=<random_client_id>
AZURE_CLIENT_SECRET=<random_client_secret>
AZURE_TENANT_ID=<random_tenant_id>

# FortiGate API Configuration
FORTIGATE_API_TOKEN=<random_api_token>
FORTIGATE_API_URL=https://10.172.0.1:9443/api/v2

# FortiGate SSH Connection Details
FORTIGATE_IP=10.172.0.1
FORTIGATE_SSH_PORT=1337
FORTIGATE_SSH_USERNAME=<random_username>
FORTIGATE_SSH_PASSWORD=<random_password>

# Database Connection
DB_HOST=10.172.0.93
DB_NAME=db-radius1
DB_USER=radiususer
DB_PASSWORD=<random_db_password>

# SSL Configuration
SSL_KEY_PATH=/app/certs/server.key
SSL_CERT_PATH=/app/certs/server.crt

# Server Configuration
PORT=3000

# JWT Secret for Authentication
JWT_SECRET=<random_jwt_secret>

# Node Environment
NODE_ENV=production
```

## Usage

### Start the Service
To start the service, run:
```sh
docker-compose up -d
```

### Stop the Service
To stop the service, run:
```sh
docker-compose down
```

## Network Configuration

- Uses a custom bridge network `app-network`.
- Allows inter-container communication within the network.

## Volumes

- `./server.key:/app/certs/server.key:ro` - SSL key for App Azure.
- `./server.crt:/app/certs/server.crt:ro` - SSL certificate for App Azure.

## Docker Compose Configuration

```yaml
version: '3.8'

services:
  app_azure:
    build: 
      context: .
      dockerfile: Dockerfile
    image: de0xys/app_azure
    container_name: app_azure
    ports:
      - "3000:3000"
    volumes:
      - ./server.key:/app/certs/server.key:ro
      - ./server.crt:/app/certs/server.crt:ro
    environment:
      NODE_ENV: production
      PORT: 3000
      SSL_KEY_PATH: /app/certs/server.key
      SSL_CERT_PATH: /app/certs/server.crt
    env_file:
      - .env.local
    restart: unless-stopped
    networks:
      - app-network
    user: root  # Ejecutar como root

networks:
  app-network:
    driver: bridge
```

## Notes
- Ensure your `.env.local` file is properly configured before starting the service.
- The `de0xys/app_azure` image is pulled from Docker Hub.
- Modify `JWT_SECRET` for authentication security.
- Modify app/api/users/route.ts line 21 @yourdomain.
- Modify components/DashboardClient.tsx line 51 @yourdomain.
- Modify lib/azure.ts line 25 @yourdomain.

