using System.Text.Json;
using LabService.Models;
using LabService.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Distributed;

namespace LabService.Controllers;

[ApiController]
[Route("api/labs")]
public class LabsController : ControllerBase
{
    private readonly MongoDbService _mongoDb;
    private readonly KafkaProducerService _kafkaProducer;
    private readonly IDistributedCache _cache;
    private readonly ILogger<LabsController> _logger;

    private static readonly DistributedCacheEntryOptions CacheOptions = new()
    {
        AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10)
    };

    public LabsController(
        MongoDbService mongoDb,
        KafkaProducerService kafkaProducer,
        IDistributedCache cache,
        ILogger<LabsController> logger)
    {
        _mongoDb = mongoDb;
        _kafkaProducer = kafkaProducer;
        _cache = cache;
        _logger = logger;
    }

    /// <summary>
    /// GET /api/labs — List all lab results.
    /// Optional query: ?customerId=123
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<LabResult>>> GetAll(
        [FromQuery] long? customerId)
    {
        if (customerId.HasValue)
        {
            var customerResults = await _mongoDb.GetByCustomerIdAsync(customerId.Value);
            return Ok(customerResults);
        }

        return Ok(await _mongoDb.GetAllAsync());
    }

    /// <summary>
    /// GET /api/labs/{id} — Get a single lab result by ID. Cached in Redis.
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<LabResult>> GetById(string id)
    {
        // Check cache first
        var cacheKey = $"lab:{id}";
        var cached = await _cache.GetStringAsync(cacheKey);
        if (cached != null)
        {
            _logger.LogDebug("Cache hit for lab result: {Id}", id);
            return Ok(JsonSerializer.Deserialize<LabResult>(cached));
        }

        // Cache miss — fetch from MongoDB
        var result = await _mongoDb.GetByIdAsync(id);
        if (result == null)
            return NotFound(new { error = $"Lab result not found: {id}" });

        // Store in cache
        await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(result), CacheOptions);
        _logger.LogDebug("Cache miss for lab result: {Id}, cached now", id);

        return Ok(result);
    }

    /// <summary>
    /// POST /api/labs — Create a new lab result. Publishes CREATED event to Kafka.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<LabResult>> Create(
        [FromBody] CreateLabResultRequest request)
    {
        var labResult = new LabResult
        {
            Title = request.Title,
            Description = request.Description,
            CustomerId = request.CustomerId,
            Status = "pending"
        };

        var created = await _mongoDb.CreateAsync(labResult);

        // Publish Kafka event
        await _kafkaProducer.PublishAsync(new LabEvent
        {
            EventType = "CREATED",
            LabResultId = created.Id,
            Title = created.Title,
            CustomerId = created.CustomerId
        });

        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    /// <summary>
    /// PUT /api/labs/{id} — Update an existing lab result. Publishes UPDATED event.
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<LabResult>> Update(
        string id,
        [FromBody] LabResult updates)
    {
        var updated = await _mongoDb.UpdateAsync(id, updates);
        if (updated == null)
            return NotFound(new { error = $"Lab result not found: {id}" });

        // Invalidate cache
        await _cache.RemoveAsync($"lab:{id}");

        // Publish Kafka event
        await _kafkaProducer.PublishAsync(new LabEvent
        {
            EventType = "UPDATED",
            LabResultId = updated.Id,
            Title = updated.Title,
            CustomerId = updated.CustomerId
        });

        return Ok(updated);
    }

    /// <summary>
    /// DELETE /api/labs/{id} — Delete a lab result. Publishes DELETED event.
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(string id)
    {
        var deleted = await _mongoDb.DeleteAsync(id);
        if (!deleted)
            return NotFound(new { error = $"Lab result not found: {id}" });

        // Invalidate cache
        await _cache.RemoveAsync($"lab:{id}");

        // Publish Kafka event
        await _kafkaProducer.PublishAsync(new LabEvent
        {
            EventType = "DELETED",
            LabResultId = id
        });

        return NoContent();
    }
}
