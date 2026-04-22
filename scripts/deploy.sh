#!/bin/bash
set -e

APP_DIR="/opt/craftconnect"
cd "$APP_DIR"

echo "==> Logging into GHCR..."
echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USER" --password-stdin

echo "==> Pulling new images (tag: ${IMAGE_TAG:-latest})..."
IMAGE_TAG="${IMAGE_TAG:-latest}" docker compose -f docker-compose.prod.yml pull backend frontend

echo "==> Restarting services..."
IMAGE_TAG="${IMAGE_TAG:-latest}" docker compose -f docker-compose.prod.yml up -d --remove-orphans

echo "==> Cleaning up old images..."
docker image prune -f

echo "==> Deploy complete."
