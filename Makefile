COMPOSE_FILE := docker-compose.dev.yml

.PHONY: setup up down logs reset

## First-time setup: ensure pnpm, install deps, create .env
setup:
	@command -v pnpm >/dev/null 2>&1 || { echo "[INFO] Installing pnpm..."; npm i -g pnpm; }
	@echo "[INFO] Installing frontend dependencies..."
	cd frontends && pnpm install
	@echo "[INFO] Installing API dependencies..."
	cd apis/api-mono/api && npm install
	@echo "[INFO] Installing API spec dependencies..."
	cd apis/api-mono/api-spec && npm install
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "[INFO] Created .env from .env.example — edit it with your credentials"; \
	fi

## Start all services
up:
	docker compose -f $(COMPOSE_FILE) up

## Start all services (detached)
up-d:
	docker compose -f $(COMPOSE_FILE) up -d

## Stop all services
down:
	docker compose -f $(COMPOSE_FILE) down

## Tail logs
logs:
	docker compose -f $(COMPOSE_FILE) logs -f

## Stop, remove volumes, and restart
reset:
	docker compose -f $(COMPOSE_FILE) down -v
	docker compose -f $(COMPOSE_FILE) up
