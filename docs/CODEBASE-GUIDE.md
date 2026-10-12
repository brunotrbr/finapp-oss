# Finapp Codebase Guide

> Primary orientation for coding assistants working in this repository. Read
> this file first, then follow the links for architecture or infrastructure
> details. The source code remains authoritative when documentation differs.

## 1. System summary

Finapp is an early-stage personal finance application. The repository contains:

- A Next.js 16 frontend in `finapp/frontend`.
- An ASP.NET Core Minimal API in `finapp/backend`.
- PostgreSQL persistence through Entity Framework Core.
- Firebase Authentication shared by the browser, Next.js server, and backend.
- GitHub Actions workflows that build and validate each application.

The implemented product slice is authentication and a protected connectivity
check. Financial features such as accounts, transactions, balances, and budgets
are not implemented yet.

## 2. Documentation map

| Document | Responsibility |
|---|---|
| [`CODEBASE-GUIDE.md`](CODEBASE-GUIDE.md) | Orientation, source-of-truth rules, conventions, and maintenance |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | Runtime modules, authentication flows, data model, and design constraints |
| [`INFRASTRUCTURE.md`](INFRASTRUCTURE.md) | Local services, configuration, CI, deployment status, and operational gaps |
| [`codebase-index.md`](codebase-index.md) | Generated inventory of documentation, source, and configuration files |
| [`../finapp/frontend/docs/auth-implementation.md`](../finapp/frontend/docs/auth-implementation.md) | Detailed record of the Firebase authentication implementation |
| [`../README.md`](../README.md) | Repository-level human entry point |

Keep each fact in the document that owns it and link to that document from the
others. Avoid copying architecture details into this guide.

## 3. Repository map

```text
finapp-oss/
|-- .github/workflows/       Frontend and backend validation workflows
|-- docs/                    Cross-application technical documentation
|   |-- scripts/             Documentation maintenance tools
|-- finapp/
|   |-- backend/             ASP.NET Core API, EF Core model, migrations
|   |-- frontend/            Next.js App Router application
|   `-- docker-compose.yml   Local PostgreSQL service
`-- README.md
```

## 4. Source-of-truth rules

- Backend endpoints, middleware order, authentication, and dependency
  registration are defined in `finapp/backend/Program.cs`.
- The relational model is defined by `Entities/AppDbContext.cs`, entity files,
  and the EF Core migrations. A model change is incomplete without a migration.
- Frontend routes are defined by the `finapp/frontend/app` directory.
- Server authorization is defined by `lib/auth/session.ts` and each protected
  server page. `proxy.ts` is only an early redirect based on cookie presence.
- Browser-to-backend calls use a Firebase ID token as a Bearer token. The
  Next.js `__session` cookie is for the Next.js server and is not accepted by
  the ASP.NET Core API.
- Runtime versions and commands come from `package.json`, `Finapp.Api.csproj`,
  and the workflow files.
- Production hosting is not defined in this repository. Do not infer a cloud,
  environment, or release process that is not represented in source control.

## 5. Working conventions and gotchas

### Frontend

- This is Next.js 16. Before changing framework behavior, read the relevant
  local guide under `finapp/frontend/node_modules/next/dist/docs/` as required
  by `finapp/frontend/AGENTS.md`.
- Keep Firebase browser code in client-only modules and Firebase Admin code in
  server-only modules.
- Initialize both Firebase SDKs lazily. Eager initialization can break builds
  when credentials are absent during prerendering.
- Authorize protected pages with `getCurrentUser()`. Cookie presence in
  `proxy.ts` is not proof of a valid or non-revoked session.
- Logout must clear both the browser Firebase state and the server session
  cookie.

### Backend

- `Program.cs` is currently the single composition root and endpoint module.
  Keep cross-cutting middleware ordering visible there.
- Every protected endpoint must call `RequireAuthorization()` or belong to an
  authorized route group.
- Resolve ownership from the validated Firebase UID claim. Never accept a user
  ID from the request as authorization evidence.
- Database access goes through `AppDbContext`. Keep entity relationships and
  database constraints aligned.
- The current CORS policy allows every origin, method, and header. Treat that as
  a development setting that must be narrowed before production deployment.

### Domain growth

- `Tenant` is the current ownership root, and `User` references one
  `DefaultTenant`. There is no membership model yet.
- Before implementing Account CRUD, decide and document whether Account belongs
  to a User or Tenant. The existing model points toward Tenant ownership, but
  that decision is not encoded yet.
- Prefer a financial module with a small HTTP interface that owns validation,
  authorization, persistence, and error mapping. Avoid spreading ownership
  checks across endpoint handlers and frontend components.

## 6. Verification commands

Run commands from the indicated project directory.

```powershell
# Frontend: finapp/frontend
npm ci
npm run lint
npx tsc --noEmit
npm run build

# Backend: finapp/backend
dotnet restore
dotnet build --configuration Release
dotnet test --configuration Release --no-build
```

There are currently no test projects or frontend test scripts, so the test
step mainly confirms that the solution remains test-discoverable.

## 7. Documentation maintenance

Update `ARCHITECTURE.md` when modules, flows, interfaces, data ownership, or
security decisions change. Update `INFRASTRUCTURE.md` when runtime services,
environment configuration, CI, hosting, or deployment changes.

Regenerate the index when source or documentation files are added, removed, or
renamed:

```powershell
.\docs\scripts\Update-CodebaseIndex.ps1
```

Review generated summaries after every run because symbols and topics are
derived with lightweight heuristics.
