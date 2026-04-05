# App Template

## Getting Started

Before anything else you need two (free) accounts:

1. **MongoDB Atlas** — [mongodb.com/atlas](https://www.mongodb.com/atlas) — create a free shared cluster and grab the connection credentials
2. **WorkOS** — [workos.com](https://workos.com/) — sign up, create an application, and note the API key, client ID, and redirect URI

Then:

```bash
make setup          # creates .env from .env.example
```

Open `.env` and fill in your **MongoDB** and **WorkOS** credentials:

| Variable | Where to find it |
|---|---|
| `MONGO_HOST` | Atlas connection string host |
| `MONGO_USER` / `MONGO_PW` | Atlas database user credentials |
| `WORKOS_API_KEY` | WorkOS Dashboard → API Keys |
| `WORKOS_CLIENT_ID` | WorkOS Dashboard → Environment → Client ID |
| `WORKOS_COOKIE_PASSWORD` | Any 32+ character secret you generate |
| `WORKOS_REDIRECT_URI` | Must match what you set in WorkOS (default `http://localhost:8080/auth/callback`) |

See the [Makefile](./Makefile) for all available commands and the [API README](./apis/api-mono/api/README.md) for full details on authentication, database, email, permissions, and more.

## Project Structure

```
├── Makefile                    # Docker shortcuts (setup, up, down, logs, reset)
├── .env                        # Local environment variables (not committed)
├── .env.example                # Template for .env
├── docker-compose.dev.yml      # Local dev services (nginx, api, mailhog)
├── nginx/                      # Nginx reverse proxy config
├── apis/
│   └── api-mono/
│       ├── api-spec/           # OpenAPI spec (BOATS)
│       │   └── src/            # Spec source files (paths, components, schemas)
│       └── api/                # Express API (generated + domain logic)
│           ├── src/http/       # AUTO-GENERATED — do not edit
│           ├── src/domains/    # YOUR business logic
│           ├── src/database/   # Models and repositories (typegoose/MongoDB)
│           └── src/services/   # Shared services
└── frontends/
    ├── pnpm-workspace.yaml     # Workspace: apis, services, users
    ├── apis/                   # Auto-generated API consumer services
    ├── services/               # Shared frontend services (HttpService, etc.)
    └── users/                  # React app (Vite + MUI + Zustand)
```

## Running the App

### 1. Install frontend dependencies

```bash
cd frontends
pnpm install
```

### 2. Start the backend

```bash
make up           # Starts nginx, api-mono, and mailhog
```

This brings up:
- **Nginx** on `http://localhost:8999` — reverse proxies to the API
- **API** — Express server (hot-reloads via tsc-watch)
- **Mailhog** — dev email UI on `http://localhost:8025`

### 3. Start the React app

```bash
cd frontends/users
pnpm dev          # Vite dev server on http://localhost:3004
```

The React app calls the API through nginx at `http://localhost:8999`.

### Makefile Commands

| Command      | Description                          |
|--------------|--------------------------------------|
| `make setup` | Create `.env` from `.env.example`    |
| `make up`    | Start all Docker services            |
| `make up-d`  | Start all services (detached)        |
| `make down`  | Stop all services                    |
| `make logs`  | Tail logs from all services          |
| `make reset` | Stop, remove volumes, and restart    |

## Authentication

The API uses [WorkOS AuthKit](https://workos.com/docs/authkit) for authentication via sealed session cookies. See the [API README](./apis/api-mono/api/README.md#authentication--workos-authkit) for full details on auth routes, accessing the authenticated user, and WorkOS Dashboard setup.

## Frontend Workspace

The `frontends/` directory is a **pnpm workspace** containing three packages:

- **`apis`** — Auto-generated API consumer classes (one per API endpoint). Generated from the OpenAPI spec. Import as `apis/api-mono/services/HealthService`.
- **`services`** — Shared frontend services like `HttpService` (axios wrapper with interceptors). Import as `services`.
- **`users`** — The React application. Depends on both `apis` and `services` as workspace packages.

This means the React app imports API clients directly:

```typescript
import HealthService from 'apis/api-mono/services/HealthService';
const health = await HealthService.healthGet();
```

## Creating a New API Endpoint

This project follows **API-first development**: design your OpenAPI spec first, generate the server and client code, then implement the business logic.

### 1. Define the path

Create a folder matching your URL structure in `apis/api-mono/api-spec/src/paths/`:

```
paths/widget/get.yml          → GET /widget
paths/widget/post.yml         → POST /widget
paths/widget/{id}/get.yml     → GET /widget/{id}
```

### 2. Define schemas

Add request/response schemas in `api-spec/src/components/schemas/`:

```yaml
# components/schemas/widget/baseAttributes.yml
type: object
properties:
  name:
    type: string
  description:
    type: string

# components/schemas/widget/model.yml
allOf:
  - $ref: ./baseAttributes.yml
  - type: object
    required: [_id, name, createdAt, updatedAt]
    properties:
      _id:
        type: string
        format: uuid
      createdAt:
        type: string
        format: date-time
      updatedAt:
        type: string
        format: date-time
```

### 3. Build the spec

```bash
cd apis/api-mono/api-spec
npm run build
```

### 4. Generate the server

```bash
cd apis/api-mono/api
npm run generate:server
```

This regenerates `src/http/` (routes, validation, interfaces) and creates stub domain files in `src/domains/` if they don't already exist.

### 5. Implement domain logic

Open the generated domain file and implement the methods. Follow the interface contract:

```typescript
// src/domains/WidgetDomain.ts
class WidgetDomain implements WidgetDomainInterface {
  public async widgetGet(req: any): Promise<Widget[]> {
    return WidgetRepository.findAll();
  }
}
```

### 6. Generate frontend API consumers

```bash
cd frontends/apis
npm run generate:api-consumers
```

You can now use `WidgetService` in the React app.

## Key Rules

- **Never edit `src/http/`** — it is regenerated on every `generate:server` run
- **Domain files** are created once and preserved — your business logic lives here
- **All database queries** go through repository classes, never call models directly
- **Always use `$ref`** in OpenAPI specs for parameters and schemas
- **Use `allOf`** for schema composition (never `oneOf` or `anyOf`)
