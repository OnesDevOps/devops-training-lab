using System.Text.Json;
using Confluent.Kafka;
using LabService.Models;

namespace LabService.Services;

/// <summary>
/// Kafka producer — publishes lab events to the 'lab-events' topic.
/// The Customer Service (Java) consumes these events.
/// </summary>
public class KafkaProducerService : IDisposable
{
    private readonly IProducer<string, string> _producer;
    private readonly string _topicName;
    private readonly ILogger<KafkaProducerService> _logger;

    public KafkaProducerService(IConfiguration config, ILogger<KafkaProducerService> logger)
    {
        _logger = logger;
        _topicName = config.GetValue<string>("Kafka:ProducerTopic") ?? "lab-events";

        var producerConfig = new ProducerConfig
        {
            BootstrapServers = config.GetValue<string>("Kafka:BootstrapServers") ?? "localhost:9092",
            Acks = Acks.All,
            MessageTimeoutMs = 5000
        };

        _producer = new ProducerBuilder<string, string>(producerConfig).Build();
    }

    public async Task PublishAsync(LabEvent labEvent)
    {
        try
        {
            var key = labEvent.LabResultId ?? "system";
            var value = JsonSerializer.Serialize(labEvent);

            var result = await _producer.ProduceAsync(_topicName,
                new Message<string, string> { Key = key, Value = value });

            _logger.LogInformation(
                "Published lab event: type={EventType}, labId={LabId}, partition={Partition}, offset={Offset}",
                labEvent.EventType, labEvent.LabResultId,
                result.Partition.Value, result.Offset.Value);
        }
        catch (ProduceException<string, string> ex)
        {
            _logger.LogError(ex,
                "Failed to publish lab event: type={EventType}, labId={LabId}",
                labEvent.EventType, labEvent.LabResultId);
        }
    }

    public void Dispose() => _producer?.Dispose();
}
