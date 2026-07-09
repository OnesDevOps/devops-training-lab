using LabService.Services;

var builder = WebApplication.CreateBuilder(args);

// --- MongoDB ---
builder.Services.AddSingleton<MongoDbService>();

// --- Redis Cache ---
builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = builder.Configuration.GetValue<string>("Redis:Configuration")
                            ?? "localhost:6379";
    options.InstanceName = "lab-service:";
});

// --- Kafka ---
builder.Services.AddSingleton<KafkaProducerService>();
builder.Services.AddHostedService<KafkaConsumerService>();

// --- API ---
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "Lab Service API", Version = "v1" });
});

// --- CORS ---
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
    });
});

// --- Health Checks ---
builder.Services.AddHealthChecks()
    .AddMongoDb(
        builder.Configuration.GetConnectionString("MongoDB")
            ?? "mongodb://localhost:27017",
        name: "mongodb")
    .AddRedis(
        builder.Configuration.GetValue<string>("Redis:Configuration")
            ?? "localhost:6379",
        name: "redis");

var app = builder.Build();

// --- Middleware ---
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();
app.MapControllers();
app.MapHealthChecks("/healthz");

app.Run();
