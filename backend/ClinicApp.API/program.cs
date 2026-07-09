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

if (builder.Environment.IsDevelopment())
{
    builder.Configuration.AddUserSecrets<Program>();
}

var secret = builder.Configuration["JwtSettings:Secret"];
if (string.IsNullOrEmpty(secret))
{
    throw new InvalidOperationException(
        "JWT Secret is not configured. Set it using:\n" +
        "  dotnet user-secrets set \"JwtSettings:Secret\" \"YourSecretKey\"\n" +
        "  or set environment variable JwtSettings__Secret");
}

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
var key = Encoding.ASCII.GetBytes(secret);
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

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
}

// Middleware
app.UseSwagger();
app.UseSwaggerUI();
app.UseHttpsRedirection();
app.UseCors("AllowNextJS");
app.UseAuthentication();
app.UseAuthorization();

// ==================== API ENDPOINTS ====================

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

    // Hash the refresh token before storing
    user.RefreshTokenHash = BCrypt.Net.BCrypt.HashPassword(refreshToken);
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
        user.RefreshTokenHash = null;
        user.RefreshTokenExpiryTime = null;
        await db.SaveChangesAsync();
    }
    return Results.Ok();
}).RequireAuthorization();

app.MapPost("/api/auth/refresh", async (RefreshDto request, AppDbContext db, IConfiguration config) =>
{
    var users = await db.Users.ToListAsync();
    var user = users.FirstOrDefault(u => u.RefreshTokenHash != null && BCrypt.Net.BCrypt.Verify(request.RefreshToken, u.RefreshTokenHash));

    if (user == null || user.RefreshTokenExpiryTime == null || user.RefreshTokenExpiryTime < DateTime.UtcNow)
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
    var newToken = tokenHandler.CreateToken(tokenDescriptor);
    var newRefreshToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));

    user.RefreshTokenHash = BCrypt.Net.BCrypt.HashPassword(newRefreshToken);
    user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
    await db.SaveChangesAsync();

    return Results.Ok(new AuthResponse
    {
        Token = tokenHandler.WriteToken(newToken),
        RefreshToken = newRefreshToken,
        Email = user.Email
    });
});

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
    if (string.IsNullOrWhiteSpace(patientDto.Name) || patientDto.Name.Length < 2)
        return Results.BadRequest(new { error = "Name is required and must be at least 2 characters" });
    
    if (patientDto.BirthDate == default || patientDto.BirthDate > DateTime.UtcNow)
        return Results.BadRequest(new { error = "Valid birth date is required" });
    
    if (!new[] { "Male", "Female", "Other" }.Contains(patientDto.Gender))
        return Results.BadRequest(new { error = "Gender must be Male, Female, or Other" });
    
    if (string.IsNullOrWhiteSpace(patientDto.ContactNumber) || patientDto.ContactNumber.Length < 10)
        return Results.BadRequest(new { error = "Valid contact number is required (minimum 10 digits)" });
    
    if (string.IsNullOrWhiteSpace(patientDto.Address) || patientDto.Address.Length < 5)
        return Results.BadRequest(new { error = "Address is required and must be at least 5 characters" });

    var patient = new Patient
    {
        Name = patientDto.Name.Trim(),
        BirthDate = patientDto.BirthDate,
        Gender = patientDto.Gender,
        ContactNumber = patientDto.ContactNumber.Trim(),
        Address = patientDto.Address.Trim(),
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
    
    if (string.IsNullOrWhiteSpace(patientDto.Name) || patientDto.Name.Length < 2)
        return Results.BadRequest(new { error = "Name is required and must be at least 2 characters" });
    
    if (patientDto.BirthDate == default || patientDto.BirthDate > DateTime.UtcNow)
        return Results.BadRequest(new { error = "Valid birth date is required" });
    
    if (!new[] { "Male", "Female", "Other" }.Contains(patientDto.Gender))
        return Results.BadRequest(new { error = "Gender must be Male, Female, or Other" });
    
    if (string.IsNullOrWhiteSpace(patientDto.ContactNumber) || patientDto.ContactNumber.Length < 10)
        return Results.BadRequest(new { error = "Valid contact number is required (minimum 10 digits)" });
    
    if (string.IsNullOrWhiteSpace(patientDto.Address) || patientDto.Address.Length < 5)
        return Results.BadRequest(new { error = "Address is required and must be at least 5 characters" });

    patient.Name = patientDto.Name.Trim();
    patient.BirthDate = patientDto.BirthDate;
    patient.Gender = patientDto.Gender;
    patient.ContactNumber = patientDto.ContactNumber.Trim();
    patient.Address = patientDto.Address.Trim();
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
    public string? RefreshTokenHash { get; set; }
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
            PasswordHash = "$2b$11$n1sHT.ktV4Z/JwO5zfANIOsIj/kXCGm2QNt1xrGmyZCYoIgrXQUBK"
        });
    }
}

public class LoginDto { public string Email { get; set; } = string.Empty; public string Password { get; set; } = string.Empty; }
public class RefreshDto { public string Token { get; set; } = string.Empty; public string RefreshToken { get; set; } = string.Empty; }
public class AuthResponse { public string Token { get; set; } = string.Empty; public string RefreshToken { get; set; } = string.Empty; public string Email { get; set; } = string.Empty; }

public class PatientDto 
{ 
    public int Id { get; set; } 
    
    [Required(ErrorMessage = "Name is required")]
    [StringLength(100, MinimumLength = 2, ErrorMessage = "Name must be between 2 and 100 characters")]
    public string Name { get; set; } = string.Empty; 
    
    [Required(ErrorMessage = "Birth date is required")]
    public DateTime BirthDate { get; set; } 
    
    [Required(ErrorMessage = "Gender is required")]
    [RegularExpression("^(Male|Female|Other)$", ErrorMessage = "Gender must be Male, Female, or Other")]
    public string Gender { get; set; } = string.Empty; 
    
    [Required(ErrorMessage = "Contact number is required")]
    [Phone(ErrorMessage = "Invalid phone number format")]
    public string ContactNumber { get; set; } = string.Empty; 
    
    [Required(ErrorMessage = "Address is required")]
    [StringLength(200, MinimumLength = 5, ErrorMessage = "Address must be between 5 and 200 characters")]
    public string Address { get; set; } = string.Empty; 
}