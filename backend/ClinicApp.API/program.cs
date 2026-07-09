using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.ComponentModel.DataAnnotations;
using BCrypt.Net;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "ClinicApp API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme.",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new List<string>()
        }
    });
});

// Database
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

// JWT Authentication
var key = Encoding.ASCII.GetBytes(builder.Configuration["JwtSettings:Secret"]!);
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(key),
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["JwtSettings:Issuer"],
            ValidateAudience = true,
            ValidAudience = builder.Configuration["JwtSettings:Audience"],
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddCors(options =>
    options.AddPolicy("AllowNextJS", policy =>
        policy.WithOrigins("http://localhost:3000")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials()));

var app = builder.Build();

// Ensure database
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();
}

// Middleware
app.UseSwagger();
app.UseSwaggerUI();
app.UseHttpsRedirection();
app.UseCors("AllowNextJS");
app.UseAuthentication();
app.UseAuthorization();

// ==================== API ENDPOINTS ====================

// Auth Endpoint
app.MapPost("/api/auth/login", async (LoginDto login, AppDbContext db, IConfiguration config) =>
{
    var user = await db.Users.FirstOrDefaultAsync(u => u.Email == login.Email);
    if (user == null || !BCrypt.Net.BCrypt.Verify(login.Password, user.PasswordHash))
        return Results.Unauthorized();

    var tokenHandler = new JwtSecurityTokenHandler();
    var key = Encoding.ASCII.GetBytes(config["JwtSettings:Secret"]!);
    var tokenDescriptor = new SecurityTokenDescriptor
    {
        Subject = new ClaimsIdentity(new[] { 
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email) 
        }),
        Expires = DateTime.UtcNow.AddMinutes(60),
        Issuer = config["JwtSettings:Issuer"],
        Audience = config["JwtSettings:Audience"],
        SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
    };
    var token = tokenHandler.CreateToken(tokenDescriptor);
    var refreshToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));

    user.RefreshToken = refreshToken;
    user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
    await db.SaveChangesAsync();

    return Results.Ok(new AuthResponse { Token = tokenHandler.WriteToken(token), RefreshToken = refreshToken, Email = user.Email });
});

app.MapPost("/api/auth/logout", async (HttpContext context, AppDbContext db) =>
{
    var userId = int.Parse(context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
    var user = await db.Users.FindAsync(userId);
    if (user != null)
    {
        user.RefreshToken = null;
        user.RefreshTokenExpiryTime = null;
        await db.SaveChangesAsync();
    }
    return Results.Ok();
}).RequireAuthorization();

// Patient Endpoints
app.MapGet("/api/patients", async (AppDbContext db) =>
{
    var patients = await db.Patients
        .Select(p => new PatientDto 
        { 
            Id = p.Id, 
            Name = p.Name, 
            BirthDate = p.BirthDate, 
            Gender = p.Gender, 
            ContactNumber = p.ContactNumber, 
            Address = p.Address 
        })
        .OrderByDescending(p => p.Id)
        .ToListAsync();
    return Results.Ok(patients);
}).RequireAuthorization();

app.MapGet("/api/patients/{id}", async (int id, AppDbContext db) =>
{
    var patient = await db.Patients.FindAsync(id);
    return patient == null ? Results.NotFound() : Results.Ok(new PatientDto 
    { 
        Id = patient.Id, 
        Name = patient.Name, 
        BirthDate = patient.BirthDate, 
        Gender = patient.Gender, 
        ContactNumber = patient.ContactNumber, 
        Address = patient.Address 
    });
}).RequireAuthorization();

app.MapPost("/api/patients", async (PatientDto patientDto, AppDbContext db) =>
{
    var patient = new Patient
    {
        Name = patientDto.Name,
        BirthDate = patientDto.BirthDate,
        Gender = patientDto.Gender,
        ContactNumber = patientDto.ContactNumber,
        Address = patientDto.Address,
        CreatedAt = DateTime.UtcNow
    };
    db.Patients.Add(patient);
    await db.SaveChangesAsync();
    return Results.Created($"/api/patients/{patient.Id}", new PatientDto 
    { 
        Id = patient.Id, 
        Name = patient.Name, 
        BirthDate = patient.BirthDate, 
        Gender = patient.Gender, 
        ContactNumber = patient.ContactNumber, 
        Address = patient.Address 
    });
}).RequireAuthorization();

app.MapPut("/api/patients/{id}", async (int id, PatientDto patientDto, AppDbContext db) =>
{
    var patient = await db.Patients.FindAsync(id);
    if (patient == null) return Results.NotFound();
    
    patient.Name = patientDto.Name;
    patient.BirthDate = patientDto.BirthDate;
    patient.Gender = patientDto.Gender;
    patient.ContactNumber = patientDto.ContactNumber;
    patient.Address = patientDto.Address;
    await db.SaveChangesAsync();
    return Results.Ok(patientDto);
}).RequireAuthorization();

app.MapDelete("/api/patients/{id}", async (int id, AppDbContext db) =>
{
    var patient = await db.Patients.FindAsync(id);
    if (patient == null) return Results.NotFound();
    db.Patients.Remove(patient);
    await db.SaveChangesAsync();
    return Results.NoContent();
}).RequireAuthorization();

app.Run();

// ==================== MODELS ====================

public class Patient
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTime BirthDate { get; set; }
    public string Gender { get; set; } = string.Empty;
    public string ContactNumber { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class User
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiryTime { get; set; }
}

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }
    public DbSet<Patient> Patients { get; set; }
    public DbSet<User> Users { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>().HasData(new User
        {
            Id = 1,
            Email = "admin@clinic.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123")
        });
    }
}

public class LoginDto { public string Email { get; set; } = string.Empty; public string Password { get; set; } = string.Empty; }
public class AuthResponse { public string Token { get; set; } = string.Empty; public string RefreshToken { get; set; } = string.Empty; public string Email { get; set; } = string.Empty; }
public class PatientDto { public int Id { get; set; } public string Name { get; set; } = string.Empty; public DateTime BirthDate { get; set; } public string Gender { get; set; } = string.Empty; public string ContactNumber { get; set; } = string.Empty; public string Address { get; set; } = string.Empty; }