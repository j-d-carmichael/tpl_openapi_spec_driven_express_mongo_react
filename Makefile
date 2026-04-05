COMPOSE_FILE := docker-compose.dev.yml

.PHONY: setup up down logs reset

## First-time setup: install mkcert, generate trusted certs, create .env
setup:
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
