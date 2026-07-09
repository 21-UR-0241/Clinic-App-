Project

Clinic Patient Registration System

Frontend

Next.js (App Router)
TypeScript
Tailwind CSS


Backend

ASP.NET Core 10
Entity Framework Core (SQLite)


Authentication


JWT (stored in cookies, attached via Axios request interceptor)
BCrypt password hashing


Repo Structure

ClinicApp/
├── backend/
│   └── ClinicApp.API/
│       ├── program.cs        # single file 
│       ├── appsettings.json
│       ├── clinicapp.csproj
│       └── clinicapp.db      # SQLite dev database 
├── frontend/
│   └── clinic-app/
│       ├── src/
│       │   └── app/           # Next.js App Router pages (e.g. app/patients)
│       ├── next.config.js
│       ├── tailwind.config.js
│       ├── postcss.config.js
│       ├── tsconfig.json
│       ├── package.json
│       └── .env
├── AGENTS.md
├── package-lock.json
└── README.md

Setup

bash# Backend
cd backend/ClinicApp.API
dotnet restore

# Frontend
cd frontend/clinic-app
npm install

Running Locally

bash# Backend (from backend/ClinicApp.API/)
dotnet run

# Frontend (from frontend/clinic-app/)
npm run dev

Both must run simultaneously. Backend must be reachable from the frontend's configured CORS origin (see appsettings.json / JwtSettings).

Build

bash# Backend (from backend/ClinicApp.API/)
dotnet build

# Frontend (from frontend/clinic-app/)
npm run build

Lint / Format

bash# Frontend (from frontend/clinic-app/)
npm run lint

# Backend (from backend/ClinicApp.API/)
dotnet format

Development Guidelines


Follow the existing folder structure.
Backend logic stays in program.cs. This project intentionally does NOT use a Controllers/Services split — it's a single-file backend by design, not an oversight. Do not refactor into that pattern unless explicitly asked.
Use async methods for I/O-bound backend operations.
Use Entity Framework Core for all database access (no raw SQL unless there's a clear need).
No EF Core migrations are in use. The schema is managed directly via clinicapp.db. Don't introduce a migrations workflow (dotnet ef migrations add, etc.) without confirming — it's a workflow change, not a bug fix.
Do not introduce unnecessary dependencies.
Preserve the existing JWT authentication flow — token is stored in a cookie, not localStorage. Don't "simplify" this into localStorage; it was a deliberate (if imperfect) choice.
Use TypeScript types instead of any.
Follow existing naming conventions.


Coding Standards


PascalCase for C# classes.
camelCase for variables.
Prefer dependency injection.
Validate all API inputs.
Return appropriate HTTP status codes.


Architecture Notes (read before making structural changes)


program.cs is intentionally monolithic. Deliberate simplicity tradeoff for a small app.
SQLite is dev-only. Don't assume production-grade concurrency or scaling behavior.
CORS is configured for a specific frontend origin. Update the policy in program.cs if ports/environments change — don't loosen it to AllowAnyOrigin as a shortcut.
.NET version is pinned to net10.0 after prior migration friction (net6.0 → net8.0 → net10.0). Don't downgrade without checking package compatibility.
Tailwind version matters — this project has hit v3/v4 compatibility issues before. Check the installed version before changing Tailwind config syntax.
.env in frontend/clinic-app/ holds local secrets/config. Never print its contents, commit it, or overwrite it. If new env vars are needed, add them to .env.example (create one if it doesn't exist) rather than editing .env directly.


Known Gaps / Things Not to "Fix" Silently

These are known, intentional limitations — flag them rather than silently changing them:


No role-based access control yet
No API versioning
Limited error handling / logging
No automated test suite (unit or integration)
No EF Core migrations workflow
Cookie-based token storage is simpler but less secure than HTTP-only cookies — known tradeoff, not a bug


If asked to improve the app, these are reasonable starting points — but confirm before making structural changes to auth, the database workflow, or the single-file backend.

Testing

No automated test suite currently exists. Before committing, verify manually:


 Backend builds successfully (dotnet build)
 Frontend builds successfully (npm run build)
 Login works
 Patient CRUD operations work
 JWT authentication is functioning end-to-end


AI Usage

AI tools may assist with:


Boilerplate generation
Debugging
Refactoring
Documentation


All generated code must be reviewed and understood before being committed.

References


ASP.NET Core Documentation
Next.js Documentation
Entity Framework Core Documentation
Tailwind CSS Documentation