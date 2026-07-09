# Clinic App

A full-stack clinic patient registration application built with ASP.NET Core 10 Web API and Next.js 14. The application provides secure user authentication using JWT access and refresh tokens and allows authenticated users to manage patient records through a responsive web interface.

## Features

- Secure user authentication
  - JWT access tokens with refresh token support
  - Password hashing using BCrypt
- Patient registration
- View patient records
- Update patient information
- Delete patient records
- Responsive user interface
- Swagger/OpenAPI documentation for the backend API

## Tech Stack

**Frontend**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Axios

**Backend**
- ASP.NET Core 10 Web API
- Entity Framework Core (Code-First with Migrations)
- SQLite

**Authentication**
- JWT Access Tokens
- Refresh Tokens
- BCrypt Password Hashing
- Cookie-based token storage

## Prerequisites

Before running the project, ensure the following are installed:

- .NET 10 SDK
- Node.js 18 or later
- npm

## Project Structure

```
ClinicApp/
├── backend/
│   └── ClinicApp.API/
│       ├── Migrations/
│       ├── program.cs
│       ├── appsettings.json
│       └── clinicapp.csproj
├── frontend/
│   └── clinic-app/
│       ├── src/
│       │   ├── app/
│       │   │   ├── login/
│       │   │   └── patients/
│       │   └── lib/
│       │       └── api.ts
│       ├── next.config.js
│       ├── tailwind.config.js
│       ├── postcss.config.js
│       ├── tsconfig.json
│       ├── package.json
│       └── .env
├── AGENTS.md
├── README.md
└── package-lock.json
```

> Note: `clinicapp.db` is generated locally when the backend runs migrations and is intentionally excluded from version control via `.gitignore`.

## Installation

### Clone the repository

```bash
git clone https://github.com/21-UR-0241/Clinic-App-.git
cd Clinic-App-
```

### Backend

```bash
cd backend/ClinicApp.API
dotnet restore
```

### Frontend

```bash
cd frontend/clinic-app
npm install
```

## Configuration (Required Before First Run)

### 1. Backend — JWT secret

The backend will **not start** without a configured JWT signing secret. This is intentional — the secret must never be committed to source control, so it's supplied via .NET User Secrets (for local development) rather than `appsettings.json`.

From `backend/ClinicApp.API`, run:

```bash
dotnet user-secrets init
dotnet user-secrets set "JwtSettings:Secret" "REPLACE_WITH_A_LONG_RANDOM_STRING_AT_LEAST_32_CHARS"
```

To generate a secure random value:

```bash
# macOS / Linux
openssl rand -base64 64

# Windows (PowerShell)
[Convert]::ToBase64String((1..64 | ForEach-Object { Get-Random -Maximum 256 }))
```

Alternatively, the secret can be supplied as an environment variable instead of user secrets:

```bash
# Windows (cmd)
set JwtSettings__Secret=your-generated-secret

# PowerShell
$env:JwtSettings__Secret = "your-generated-secret"
```

`appsettings.json` only contains non-sensitive configuration (`Issuer`, `Audience`, connection string) and is safe to commit as-is.

### 2. Frontend — environment variables

Create a `.env` file inside `frontend/clinic-app/` (this file is gitignored and must be created locally):

```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

Adjust the port if your backend runs somewhere other than `5000`.

## Running the Application

### Start the backend

```bash
cd backend/ClinicApp.API
dotnet run
```

On first run, this applies EF Core migrations automatically and creates `clinicapp.db`, seeding a default development account (see [Development Account](#development-account) below).

### Start the frontend

```bash
cd frontend/clinic-app
npm run dev
```

Both applications must be running simultaneously.

By default:

- Frontend: http://localhost:3000
- Backend: http://localhost:5000 (or the port shown in the console)
- Swagger UI: http://localhost:5000/swagger

If the backend uses a different port, update `NEXT_PUBLIC_API_URL` in the frontend `.env` and the CORS origin in `Program.cs` accordingly.

## Building

**Backend**
```bash
cd backend/ClinicApp.API
dotnet build
```

**Frontend**
```bash
cd frontend/clinic-app
npm run build
```

## Code Formatting

**Frontend**
```bash
npm run lint
```

**Backend**
```bash
dotnet format
```

## API Documentation

Swagger/OpenAPI documentation is available while the backend is running.

Navigate to: `http://localhost:5000/swagger` (replace the port if your backend is running on a different one).

## Database Migrations

This project uses EF Core Code-First Migrations rather than `EnsureCreated()`, so schema changes are tracked and versioned.

Whenever a model changes (adding/removing/renaming a property on `Patient` or `User`), generate and apply a new migration:

```bash
cd backend/ClinicApp.API
dotnet ef migrations add <DescriptiveMigrationName>
dotnet ef database update
```

If the `dotnet ef` command isn't recognized, ensure the EF Core tools are installed:

```bash
dotnet tool install --global dotnet-ef
```

## Development Database

The application uses SQLite for local development.

The database file (`clinicapp.db`) is created automatically on first run via `db.Database.Migrate()`, applying any pending migrations. This setup is intended for local development only and is not designed for production workloads.

## Development Account

A default administrator account is seeded for local development.

| Field | Value |
|---|---|
| Email | `admin@clinic.com` |
| Password | `Admin@123` |

**Warning:** These credentials are for local development only. Never use default credentials in a production environment.

## Authentication

Authentication uses:

- JWT Access Tokens
- Refresh Tokens (hashed with BCrypt before storage, rotated on each refresh)
- BCrypt password hashing
- Cookies for token storage on the frontend
- Axios request interceptor for authenticated API requests

## Development Notes

Some architectural decisions were intentionally made to keep the application simple for a small project:

- Backend logic is intentionally contained in a single `program.cs` file, using minimal APIs.
- SQLite is used for development.
- Entity Framework Core Code-First Migrations are used for schema management (see [Database Migrations](#database-migrations)).
- JWT authentication uses cookie-based token storage on the client.
- CORS is configured for the frontend origin (`http://localhost:3000`).

Additional contributor and AI-usage guidance is available in [AGENTS.md](./AGENTS.md).

## Manual Testing Checklist

Before committing changes, verify:

- [ ] Backend builds successfully
- [ ] Frontend builds successfully
- [ ] User login works
- [ ] Patient CRUD operations work
- [ ] JWT authentication functions correctly
- [ ] Refresh token flow works end-to-end
- [ ] `dotnet ef migrations list` shows no pending model changes

## Known Limitations

Current limitations include:

- No role-based access control
- No API versioning
- Limited logging
- Limited error handling
- No automated unit or integration tests
- SQLite intended for development only
- Token stored in a client-readable cookie rather than an `HttpOnly` cookie — chosen for simplicity in this small project; see [Future Improvements](#future-improvements)

## Future Improvements

Potential enhancements include:

- Role-based access control
- Comprehensive logging
- Automated testing
- API versioning
- Environment-specific configuration
- Improved error handling
- `HttpOnly` and `Secure` authentication cookies
- Production database support (e.g., SQL Server or PostgreSQL)

## AI Assistance

This project was developed with assistance from AI programming tools.

AI was used for:

- Boilerplate code generation
- Debugging assistance (JWT configuration, EF Core migrations, package version conflicts)
- Refactoring suggestions
- UI/UX adjustments
- Documentation generation

All AI-generated code was reviewed, tested, and modified where necessary before being incorporated into the project. See [AGENTS.md](./AGENTS.md) for details on how AI assistance was used throughout development.

## References

- [ASP.NET Core Documentation](https://learn.microsoft.com/aspnet/core)
- [Next.js Documentation](https://nextjs.org/docs)
- [Entity Framework Core Documentation](https://learn.microsoft.com/ef/core)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [JWT.io](https://jwt.io)