using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace LabService.Models;

/// <summary>
/// Lab result document — stored in MongoDB.
/// </summary>
public class LabResult
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    [BsonElement("title")]
    public required string Title { get; set; }

    [BsonElement("description")]
    public string? Description { get; set; }

    [BsonElement("customerId")]
    public long? CustomerId { get; set; }

    [BsonElement("status")]
    public string Status { get; set; } = "pending";  // pending, in_progress, completed, failed

    [BsonElement("results")]
    public Dictionary<string, object>? Results { get; set; }

    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [BsonElement("updatedAt")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// DTO for creating a new lab result.
/// </summary>
public class CreateLabResultRequest
{
    public required string Title { get; set; }
    public string? Description { get; set; }
    public long? CustomerId { get; set; }
}

/// <summary>
/// Event published to Kafka when lab results change.
/// </summary>
public class LabEvent
{
    public required string EventType { get; set; }  // CREATED, UPDATED, DELETED
    public string? LabResultId { get; set; }
    public string? Title { get; set; }
    public long? CustomerId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}
