var builder = WebApplication.CreateBuilder(args);

// soporte para Controladores
builder.Services.AddControllers();

// para poder realizar peticiones de datos a Setlist.fm
builder.Services.AddHttpClient();

// onfiguramos CORS para permitir que tu frontend en JS pueda consumir esta API
builder.Services.AddCors(options =>
{
    options.AddPolicy("PermitirFrontend", policy =>
    {
        policy.AllowAnyOrigin()    // Permite que cualquier HTML/JS llame a la API
              .AllowAnyMethod()    // Permite GET, POST, etc.
              .AllowAnyHeader();   // Permite cualquier tipo de encabezado
    });
});

// Add services to the container.
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors("PermitirFrontend");
app.MapControllers();
app.Run();
