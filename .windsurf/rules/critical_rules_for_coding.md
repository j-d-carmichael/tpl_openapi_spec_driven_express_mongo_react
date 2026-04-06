---
trigger: always_on
---

# DDD Workflow with npm boats - Implementation Guide

OpenAPI Specification file used to generate boiler plate API code and frontend API consumers.

## Project Structure
```
project/
├── api_spec/src/
│   ├── index.yml              # Entry point
│   ├── paths/                 # URL structure = folder structure
│   └── components/            # Shared OpenAPI parts
├── api/
│   └── domain/                # YOUR CODE (preserved)
│   └── http/                  # AUTO-GENERATED (don't edit)
│   └── database/              # YOUR CODE (preserved)
│   └── services/              # YOUR CODE (preserved)
│   └── utils/                 # YOUR CODE (preserved)
├── frontends/
│   └── apis/                  # Generated API consumers
```

## High Level Flow
1. Evolve the OpenAPI specification by adjusting the files in `api_spec/src/`
2. From `api_spec/`, run `npm run build`
3. From `api/`, run `npm run generate:server`, then complete the domain logic
4. From `frontends/apis/`, run `npm run generate:api-consumers`
5. Use the generated API consumers in your frontend applications

## Handling permissions and async validators (aka db checks)

This template has two complementary access-control mechanisms built into the OpenAPI → generated-route pipeline. Both are configured declaratively in the OpenAPI spec and wired automatically into every generated route — no manual middleware registration needed.

### 1. Route-level permissions (`x-permission`)

**What it does:** Every route gets a unique permission code. The generated route calls `PermissionService.middleware(req, res, next, permissionCode)` before hitting the domain.

**How it's configured:** In `api_spec/src/index.yml`, the BOATS `inject` helper applies `x-permission` to every operation (except `/health`):
```yaml
{
  toAllOperations: {
    excludePaths: ['/health'],
    content: {
      'x-permission': '{{ routePermission( {removeMethod: true} ) }}'
    }
  }
}
```
The `routePermission` helper auto-generates a unique camelCase code from the URL, e.g.:
- `GET /api/user/current` → `apiUserCurrentRead`
- `PUT /api/user/current` → `apiUserCurrentUpdate`
- `POST /api/company/{companyId}/idea` → `apiCompanyCompanyIdIdeaCreate`

You can also add `x-permission` directly to individual path files to override the injected value.

**Generated route example (never edit — this is in `http/`):**
```typescript
router.get(
  '/current',
  express.json({ limit: '50mb' }),
  permissionMiddleware('apiUserCurrentRead'),   // ← injected by x-permission
  asyncValidationMiddleware(['companyCheck']),   // ← injected by x-async-validators
  async (req, res) => { /* ... domain call ... */ }
);
```

**Syncing permissions to the database:** On startup, `src/utils/syncPermissions.ts`:
1. Loads permissions from `src/constants/PERMISSIONS_GROUP_MAPPING.ts` (authoritative source with group assignments)
2. Inserts any missing permissions into the `permissions` collection (never overwrites existing)
3. Extracts all `x-permission` codes from the compiled OpenAPI file
4. Inserts any new codes not yet in the database (logged as warnings — they need group assignment)
5. Removes stale permissions no longer in the spec

**Permission model (`src/database/models/PermissionModel.ts`):**
| Field | Description |
|---|---|
| `code` | Unique permission code (e.g. `apiUserCurrentRead`) |
| `name` | Human-readable name (auto-generated from code) |
| `group` | Permission group name — used to bundle permissions into assignable sets |
| `isCustom` | `true` for manually created permissions (not from OpenAPI); these survive stale-permission cleanup |

**Permission groups and role mapping architecture:**
- Each permission has a `group` field (e.g. `"User Management"`, `"Billing"`, `"Condominium Admin"`)
- Groups bundle related permissions together so administrators don't manage 100+ individual permissions
- Roles map to one or more permission groups (e.g. role `"Manager"` → groups `["User Management", "Billing"]`)
- Users are assigned roles, which resolve to their effective permission set
- In multi-tenant systems (e.g. condominiums, clubs), tenant administrators can create custom roles for their own members by mapping different permission groups — without affecting other tenants
- `PermissionRepository` provides helpers: `getAllGroups()`, `renameGroup()`, `doesPermissionExistInGroups()`

**Implementing the check — `src/services/PermissionService.ts`:**
This is developer-owned. The generated middleware calls `PermissionService.middleware(req, res, next, permissionCode)`. You implement the logic to check whether the authenticated user's role(s) include the required permission. The default template passes all requests through (`next()`) — replace this with your actual check.

### 2. Async validators (`x-async-validators`)

**What it does:** Runs async checks (typically database lookups) **before** the request reaches the domain. If the check fails, the validator throws an HTTP error (e.g. `403`, `422`) and the request never hits business logic.

**How it's configured:** In `api_spec/src/index.yml` via the `inject` helper, or directly on individual path files:
```yaml
# Applied to all /_admin/** routes
{
  toAllOperations: {
    includeOnlyPaths: ['/_admin/**'],
    content: {
      'x-async-validators': ['isAdmin'],
      'x-passRequest': true
    }
  }
}

# Applied to all non-admin, non-health routes
{
  toAllOperations: {
    excludePaths: ['/health', '/_admin/**'],
    content: {
      'x-async-validators': ['companyCheck'],
      'x-passRequest': true
    }
  }
}
```

**How it works at runtime:**
1. The generated route calls `asyncValidationMiddleware(['companyCheck'])` (or whatever validators are listed)
2. The middleware iterates the array and calls the matching method on `src/services/AsyncValidationService.ts`
3. Each method receives `(req: NodegenRequest, asyncValidatorParams: string[])`
4. If the check fails, the method **throws** an HTTP error (e.g. `throw http403()`) — the request is rejected
5. If all validators pass, `next()` is called and the domain executes

**Passing parameters via colon separators:** Validator names can include `:` separated params:
```yaml
'x-async-validators': ['membershipCheck:companyId']
```
At runtime: `methodToCall` = `membershipCheck`, `asyncValidatorParams` = `['companyId']`. This tells the validator which path/query parameter holds the tenant ID to check against.

**Implementing validators — `src/services/AsyncValidationService.ts`:**
This is developer-owned. Add a method for each validator name used in the spec. Example patterns:

```typescript
class AsyncValidationService {
  // Verify the authenticated user is a system administrator
  async isAdmin(req: NodegenRequest, asyncValidatorParams: string[]): Promise<void> {
    const user = req.workosUser;
    if (!user || !await UserRepository.isAdmin(user.id)) {
      throw http403();
    }
  }

  // Verify the authenticated user has access to the company in the URL
  async companyCheck(req: NodegenRequest, asyncValidatorParams: string[]): Promise<void> {
    const companyId = req.params.companyId;
    if (!companyId) return; // No company context in this route
    const hasAccess = await MembershipRepository.isMember(req.workosUser.id, companyId);
    if (!hasAccess) {
      throw http403();
    }
  }
}
```

**Multi-tenancy pattern:** For applications with tenant isolation (condominiums, clubs, workspaces), the typical pattern is:
- The REST URL includes a tenant ID segment (e.g. `/company/{companyId}/members`)
- An async validator (`companyCheck`) extracts the tenant ID from `req.params` and verifies the authenticated user is a member of that tenant
- This runs on **every** request under that URL prefix, guaranteeing tenant isolation at the routing layer before any domain logic executes

### 3. Related OpenAPI spec helpers

| Attribute | Purpose | Where implemented |
|---|---|---|
| `x-permission` | Injects `PermissionService.middleware()` before the domain | `src/services/PermissionService.ts` |
| `x-async-validators` | Injects `AsyncValidationService` methods before the domain | `src/services/AsyncValidationService.ts` |
| `x-passRequest` | Passes the full Express `req` object to the domain method | Generated route — domain method receives `req` as a parameter |
| `x-passResponse` | Passes the Express `res` object to the domain method | Generated route — you must manually complete the response (e.g. `res.json(...)`) |
| `x-passThruWithoutJWT` | Allows unauthenticated requests through; domain receives `jwtData \| undefined` | `src/services/AccessTokenService.ts` |
| `x-raw-body` | Disables validation, auth, and body parsing — domain gets the raw body | Useful for webhooks (e.g. Stripe) |
| `x-cache` | Injects `CacheService` middleware before the domain | `src/services/CacheService.ts` |

### Key rules

- **`x-permission` and `x-async-validators` are configured in the OpenAPI spec** and wired automatically — never manually register these middlewares
- **`PermissionService` and `AsyncValidationService` are developer-owned** — implement your actual logic there
- **Permission codes are auto-generated** from URLs by the `routePermission` BOATS helper — they stay in sync with the API surface
- **`syncPermissions` keeps the database in sync** with the spec on every startup — new permissions are inserted, stale ones removed
- **Async validators throw HTTP errors** to reject requests — they never return a value to indicate failure
- **Use `x-passRequest: true`** alongside `x-async-validators` so validators have access to the full request (params, body, authenticated user)

---

## Part 1: Evolving the OpenAPI Spec

**Tooling:** [BOATS](https://j-d-carmichael.github.io/boats/#/)

### Path & File Conventions
- Create folders matching your URLs in `api_spec/src/paths/`:
```
  paths/user/index.yml        → GET /user
  paths/user/{id}/index.yml   → GET /user/{id}
```
- All path files are named by their HTTP verb only (e.g. `get.yml`, `post.yml`)
- Path params are indicated in the folder name with curly braces like `{id}`

### Components Conventions
- In `components/parameters/`, each file name clearly indicates its purpose — path or query — e.g. `pathCompanyId.yml`, `queryLimit.yml`
- In `components/schemas/`, the **only** permitted file names are: `put`, `post`, `patch`, `model`, `models`, `baseAttributes`, and `enum`
  - `model` and `post`/`put` use `baseAttributes` and add their own attributes as needed using the `allOf` operator
- In `components/schemas/` when creating a pagination block always use the mixin `pagination.yml` and pass the model and models as variables ensuring the directory traversal is relative to the current file.

### Rules
- **Always** use `$ref` for all parameters and components — never inline them ever
- **Never** use `oneOf` or `anyOf` — only `allOf` is permitted
- The `inject` template Nunjucks helper is used to inject common content into path files so it doesn't need to be duplicated unless overriding
- The main `index.yml` is the entry point and uses the BOATS inject helper to inject common elements

### Build Command
```bash
cd api_spec
npm run build
```
Outputs the compiled spec to `api_spec/release/api_spec.yml`.

### Example Spec Files
```yaml
# api_spec/src/paths/idea/{companyId}/post.yml
parameters:
  - $ref: ../../../components/parameters/pathCompanyId.yml
requestBody:
  required: true
  content:
    application/json:
      schema:
        $ref: ../../../components/schemas/idea/post.yml
responses:
  '200':
    content:
      application/json:
        schema:
          $ref: ../../../components/schemas/idea/model.yml
```
```yaml
# api_spec/src/components/schemas/idea/post.yml
allOf:
  - $ref: ./baseAttributes.yml
```
```yaml
# api_spec/src/components/schemas/idea/model.yml
allOf:
  - $ref: ./baseAttributes.yml
  - type: object
    required:
      - _id
      - companyId
      - title
      - createdAt
      - updatedAt
      - createdBy
    properties:
      _id:
        type: string
        format: uuid
      companyId:
        type: string
        format: uuid
      updatedAt:
        type: string
        format: date-time
      createdBy:
        type: string
        format: uuid
      isArchived:
        type: boolean
      archiveMetadata:
        $ref: ./archiveMetadata/model.yml
```

---

## Part 2: Regenerating the Server

**Tooling:** [generate-it](https://acr-lfr.github.io/generate-it/)
```bash
cd api
npm run generate:server
```

- The `http/` folder is **deleted and fully regenerated** on each run — never edit files in it directly
- All routes, input/output validation etc and TypeScript interfaces live in `http/`
- The generated server uses the compiled OpenAPI file for each run
- The interfaces generated in `http/nodegen/interfaces/**` are used by the domain logic


### Package.json Scripts Reference
```json
// api_spec
{ "scripts": { "build": "boats -i ./src/index.yml -o ./release/api-spec.yml -x -O" } }

// api
{ "scripts": { "generate:server": "generate-it ../api-spec/release/api-spec.yml --yes -t https://github.com/johncarmichael-rgb/gen-tpl-express-server.git" } }

// frontends/apis
{ "scripts": { "generate:api-consumers": "node generate-apis.js && pnpm lint:fix" } }
```

---

## Part 3: Implementing Domain Logic

After generation, complete the domain files — they will be stubs for new domains, or require new stubs added when a domain is expanded.
After each generation there is an empty example of the domain `apis/api-mono/api/.openapi-nodegen/cache/compare/src/domains` to review for reference of what the domain would have been if generated from scratch.
Always follow the interface the domain implements.

### Rules
- Generated interfaces in `http/` tell you exactly what methods to implement
- **Only** implement methods defined in the generated interface — do not add extra methods to domain classes
- Custom/shared logic belongs in `utils/` or `services/` classes as appropriate
- The database layer uses **typegoose**
- All queries must be implemented **only** in the repository class — never anywhere else
- Never call a model directly anywhere outside its own repository class
- When code is mission-critical or complex, add a unit test to verify correct behaviour
- **"Find it, report it, fix it"** — if you spot obvious mistakes unrelated to the current task, report them and ask whether to fix them; never silently ignore them
- Never add other methods to the domains, only the methods defined in the interface, additional code should be added to a util or service class

### Example Domain Implementation
```typescript
// api/src/domains/IdeaDomain.ts
import {
  Idea,
  IdeaCompanyIdGetPath,
  IdeaCompanyIdPostPath,
  IdeaCompanyIdPostPost,
  Ideas,
} from '@/http/nodegen/interfaces';
import { IdeaDomainInterface } from '@/http/nodegen/domainInterfaces/IdeaDomainInterface';

class IdeaDomain implements IdeaDomainInterface {
  public async ideaCompanyIdPost(
    body: IdeaCompanyIdPostPost,
    params: IdeaCompanyIdPostPath
  ): Promise<Idea> {
    return {}; // TODO: implement business logic
  }
}

export default new IdeaDomain();
```

---

## Quick Reference

| What | Where | Rule |
|------|-------|------|
| API spec | `api_spec/src/` | ✅ Edit freely |
| Business logic | `api/domain/` | ✅ Edit freely — preserved on regeneration |
| Database queries | `api/database/` (repository classes only) | ✅ Queries here and nowhere else |
| Generated server | `api/http/` | ❌ Never edit — deleted on each regeneration |