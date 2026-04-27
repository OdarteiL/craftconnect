# CraftConnect — Hetzner Deployment Guide

## Prerequisites
- Hetzner account with a server created (CX22/CX23, Ubuntu 24.04)
- SSH key added to the server during creation
- GitHub repository with the code

---

## 1. Create the Hetzner Server

1. Log in to [hetzner.com](https://hetzner.com) → Cloud → New Server
2. Select:
   - **Location**: Falkenstein (eu-central) or closest to your users
   - **OS**: Ubuntu 24.04
   - **Type**: CX23 (2 vCPU, 4GB RAM, 40GB disk)
   - **SSH Key**: add your public key
3. Create the server and note the **IP address**

---

## 2. Connect to the Server

```bash
ssh root@<YOUR_SERVER_IP>
```

---

## 3. Install Docker Compose Plugin

Docker was pre-installed via cloud-config. Install the Compose plugin:

```bash
mkdir -p /usr/local/lib/docker/cli-plugins
curl -SL https://github.com/docker/compose/releases/download/v2.35.0/docker-compose-linux-x86_64 \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
docker compose version
```

---

## 4. Clone the Repository

```bash
git clone https://github.com/OdarteiL/craftconnect.git /opt/craftconnect
cd /opt/craftconnect
```

---

## 5. Create the Production `.env`

```bash
cat > /opt/craftconnect/.env << 'EOF'
DB_USER=craftconnect
DB_PASSWORD=Cc@Prod2026!
DB_NAME=craftconnect

JWT_SECRET=<your-jwt-secret>
JWT_REFRESH_SECRET=<your-refresh-secret>
COOKIE_PASSWORD=<your-cookie-password>

FRONTEND_URL=http://<YOUR_SERVER_IP>
GITHUB_REPOSITORY=odarteil/craftconnect
IMAGE_TAG=latest

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<your-gmail>
SMTP_PASS=<your-app-password>

VITE_CLOUDINARY_CLOUD_NAME=<your-cloudinary-name>
VITE_CLOUDINARY_UPLOAD_PRESET=<your-upload-preset>
EOF
```

---

## 6. Update CORS in docker-compose.yml

Edit `docker-compose.yml` and set:

```yaml
CORS_ORIGIN: http://<YOUR_SERVER_IP>
```

---

## 7. Build and Start All Containers

```bash
cd /opt/craftconnect
docker compose up --build -d
```

This starts: **postgres**, **redis**, **backend**, **frontend**, **prometheus**, **grafana**

---

## 8. Rebuild Frontend with Correct API URL

The frontend must be built with the server's IP baked in:

```bash
docker compose stop frontend && docker compose rm -f frontend
docker compose build --build-arg VITE_API_URL=http://<YOUR_SERVER_IP>/api frontend
docker compose up -d frontend
```

---

## 9. Add Nginx Reverse Proxy (Clean URLs)

Run Nginx on port 80 to remove port numbers from URLs:

```bash
docker run -d \
  --name craftconnect-nginx \
  --network craftconnect_default \
  -p 80:80 \
  -v /opt/craftconnect/nginx/default.conf:/etc/nginx/conf.d/default.conf:ro \
  --restart unless-stopped \
  nginx:alpine
```

---

## 10. Set Admin Password

The server has a fresh database. Set the admin password:

```bash
# Generate bcrypt hash
docker exec craftconnect-api node -e \
  "const b = require('bcryptjs'); b.hash('YourPassword', 10).then(h => console.log(h));"

# Apply to database (replace <hash> with output above)
docker exec craftconnect-db psql -U craftconnect -d craftconnect -c \
  "UPDATE users SET password_hash = '<hash>', is_verified = true WHERE email = 'admin@craftconnect.com';"
```

---

## 11. Verify Everything is Running

```bash
docker ps
curl http://localhost/api/health
```

---

## Live URLs

| Service | URL |
|---|---|
| Frontend | `http://<YOUR_SERVER_IP>` |
| API | `http://<YOUR_SERVER_IP>/api` |
| Admin Panel | `http://<YOUR_SERVER_IP>/admin` |
| Grafana | `http://<YOUR_SERVER_IP>:3000` |

---

## 12. Set Up CI/CD (Auto-deploy on push to main)

Add these secrets in **GitHub → Settings → Secrets → Actions**:

| Secret | Value |
|---|---|
| `HETZNER_HOST` | Your server IP |
| `HETZNER_USER` | `root` |
| `HETZNER_SSH_KEY` | Your private SSH key |
| `VITE_API_URL` | `http://<YOUR_SERVER_IP>/api` |
| `VITE_CLOUDINARY_CLOUD_NAME` | Your Cloudinary name |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | Your upload preset |

After adding secrets, every push to `main` will automatically:
1. Scan for secrets (Gitleaks)
2. Audit dependencies
3. Build & push Docker images to GHCR
4. SSH into the server and deploy

---

## Useful Server Commands

```bash
# View running containers
docker ps

# View logs
docker logs craftconnect-api --tail 50 -f

# Restart a service
docker compose -f /opt/craftconnect/docker-compose.yml restart backend

# Check memory / disk
free -h && df -h

# Live container resource usage
docker stats
```

---

## Adding a Domain Later

1. Point your domain's A record to `<YOUR_SERVER_IP>`
2. Update `/opt/craftconnect/nginx/default.conf` — change `server_name _;` to `server_name yourdomain.com;`
3. Install Certbot for free SSL:
   ```bash
   apt install certbot python3-certbot-nginx -y
   certbot --nginx -d yourdomain.com
   ```
4. Update `FRONTEND_URL`, `CORS_ORIGIN`, and rebuild the frontend with the new domain
