using MongoDB.Driver;
using LabService.Models;

namespace LabService.Services;

/// <summary>
/// MongoDB data access service.
/// Provides CRUD operations for LabResult documents.
/// </summary>
public class MongoDbService
{
    private readonly IMongoCollection<LabResult> _labResults;
    private readonly ILogger<MongoDbService> _logger;

    public MongoDbService(IConfiguration config, ILogger<MongoDbService> logger)
    {
        _logger = logger;

        var connectionString = config.GetConnectionString("MongoDB")
            ?? throw new ArgumentNullException("MongoDB connection string is required");
        var databaseName = config.GetValue<string>("MongoDB:DatabaseName") ?? "labdb";

        var client = new MongoClient(connectionString);
        var database = client.GetDatabase(databaseName);
        _labResults = database.GetCollection<LabResult>("lab_results");

        // Create indexes
        var indexKeys = Builders<LabResult>.IndexKeys
            .Ascending(r => r.CustomerId)
            .Descending(r => r.CreatedAt);
        _labResults.Indexes.CreateOne(new CreateIndexModel<LabResult>(indexKeys));

        _logger.LogInformation("Connected to MongoDB: {Database}", databaseName);
    }

    public async Task<List<LabResult>> GetAllAsync() =>
        await _labResults.Find(_ => true)
            .SortByDescending(r => r.CreatedAt)
            .ToListAsync();

    public async Task<LabResult?> GetByIdAsync(string id) =>
        await _labResults.Find(r => r.Id == id).FirstOrDefaultAsync();

    public async Task<List<LabResult>> GetByCustomerIdAsync(long customerId) =>
        await _labResults.Find(r => r.CustomerId == customerId)
            .SortByDescending(r => r.CreatedAt)
            .ToListAsync();

    public async Task<LabResult> CreateAsync(LabResult labResult)
    {
        labResult.CreatedAt = DateTime.UtcNow;
        labResult.UpdatedAt = DateTime.UtcNow;
        await _labResults.InsertOneAsync(labResult);
        _logger.LogInformation("Created lab result: {Id}, title={Title}", labResult.Id, labResult.Title);
        return labResult;
    }

    public async Task<LabResult?> UpdateAsync(string id, LabResult updates)
    {
        updates.UpdatedAt = DateTime.UtcNow;
        var filter = Builders<LabResult>.Filter.Eq(r => r.Id, id);
        var update = Builders<LabResult>.Update
            .Set(r => r.Title, updates.Title)
            .Set(r => r.Description, updates.Description)
            .Set(r => r.Status, updates.Status)
            .Set(r => r.Results, updates.Results)
            .Set(r => r.UpdatedAt, updates.UpdatedAt);

        var options = new FindOneAndUpdateOptions<LabResult>
        {
            ReturnDocument = ReturnDocument.After
        };

        var result = await _labResults.FindOneAndUpdateAsync(filter, update, options);
        if (result != null)
            _logger.LogInformation("Updated lab result: {Id}", id);
        return result;
    }

    public async Task<bool> DeleteAsync(string id)
    {
        var result = await _labResults.DeleteOneAsync(r => r.Id == id);
        if (result.DeletedCount > 0)
            _logger.LogInformation("Deleted lab result: {Id}", id);
        return result.DeletedCount > 0;
    }
}
