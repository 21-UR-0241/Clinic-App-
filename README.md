Clinic App

A full-stack clinic patient registration application built with ASP.NET Core 10 Web API and Next.js 14. The application provides secure user authentication using JWT access and refresh tokens and allows authenticated users to manage patient records through a responsive web interface.

Features
Secure user authentication
JWT access tokens with refresh token support
Password hashing using BCrypt
Patient registration
View patient records
Update patient information
Delete patient records
Responsive user interface
Swagger/OpenAPI documentation for the backend API
Tech Stack


Frontend
Next.js 14 (App Router)
TypeScript
Tailwind CSS
Axios
Backend
ASP.NET Core 10 Web API
Entity Framework Core
SQLite
Authentication
JWT Access Tokens
Refresh Tokens
BCrypt Password Hashing
Cookie-based authentication
Prerequisites

Before running the project, ensure the following are installed:

.NET 10 SDK
Node.js 18 or later
npm
Project Structure
ClinicApp/
├── backend/
│   └── ClinicApp.API/
│       ├── program.cs
│       ├── appsettings.json
│       ├── clinicapp.csproj
│       └── clinicapp.db
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


Installation
Clone the repository
git clone https://github.com/yourusername/clinic-app.git
cd clinic-app


Backend
cd backend/ClinicApp.API
dotnet restore


Frontend
cd frontend/clinic-app
npm install


Running the Application
Start the backend
cd backend/ClinicApp.API
dotnet run

Start the frontend
cd frontend/clinic-app
npm run dev

Both applications must be running simultaneously.

By default:

Frontend: http://localhost:3000
Backend: http://localhost:5000 (or the port shown in the console)
Swagger UI: http://localhost:5000/swagger

If the backend uses a different port, update the frontend configuration and CORS settings accordingly.

Building
Backend
cd backend/ClinicApp.API
dotnet build
Frontend
cd frontend/clinic-app
npm run build
Code Formatting
Frontend
npm run lint
Backend
dotnet format
API Documentation

Swagger/OpenAPI documentation is available while the backend is running.

Navigate to:

http://localhost:5000/swagger

Replace the port if your backend is running on a different one.

Development Database

The application uses SQLite for development.

The database file (clinicapp.db) is automatically created on the first run if it does not already exist.

This setup is intended for local development only and is not designed for production workloads.

Development Account

A default administrator account is seeded for local development.

Email

admin@clinic.com

Password

Admin@123

Warning: These credentials are for local development only. Never use default credentials in a production environment.

Authentication

Authentication uses:

JWT Access Tokens
Refresh Tokens
BCrypt password hashing
Cookies for token storage
Axios request interceptor for authenticated API requests
Development Notes

Some architectural decisions were intentionally made to keep the application simple for a small project:

Backend logic is intentionally contained in a single program.cs file.
SQLite is used for development.
Entity Framework Core is used for data access.
The project currently does not use EF Core migrations.
JWT authentication is cookie-based.
CORS is configured for the frontend origin.

Additional contributor guidance is available in AGENTS.md.

Manual Testing Checklist

Before committing changes, verify:

Backend builds successfully
Frontend builds successfully
User login works
Patient CRUD operations work
JWT authentication functions correctly
Refresh token flow works end-to-end
Known Limitations

Current limitations include:

No role-based access control
No API versioning
Limited logging
Limited error handling
No automated unit or integration tests
SQLite intended for development only
Cookie-based token storage is simpler than using HTTP-only authentication cookies
Future Improvements

Potential enhancements include:

Role-based access control
Comprehensive logging
Automated testing
API versioning
Environment-specific configuration
Improved error handling
HTTP-only and Secure authentication cookies
Production database support (e.g., SQL Server or PostgreSQL)
AI Assistance

This project was developed with assistance from AI programming tools.

AI was used for:

Boilerplate code generation
Debugging assistance
Refactoring suggestions
Documentation generation

All AI-generated code was reviewed, tested, and modified where necessary before being incorporated into the project.

References
ASP.NET Core Documentation
Next.js Documentation
Entity Framework Core Documentation
Tailwind CSS Documentation
JWT.io