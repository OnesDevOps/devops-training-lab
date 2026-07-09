using Confluent.Kafka;

namespace LabService.Services;

/// <summary>
/// Background service that consumes customer events from the 'customer-events' topic.
/// Demonstrates cross-domain event-driven communication.
/// </summary>
public class KafkaConsumerService : BackgroundService
{
    private readonly ILogger<KafkaConsumerService> _logger;
    private readonly ConsumerConfig _consumerConfig;
    private readonly string _topicName;

    public KafkaConsumerService(IConfiguration config, ILogger<KafkaConsumerService> logger)
    {
        _logger = logger;
        _topicName = config.GetValue<string>("Kafka:ConsumerTopic") ?? "customer-events";

        _consumerConfig = new ConsumerConfig
        {
            BootstrapServers = config.GetValue<string>("Kafka:BootstrapServers") ?? "localhost:9092",
            GroupId = config.GetValue<string>("Kafka:ConsumerGroupId") ?? "lab-service-group",
            AutoOffsetReset = AutoOffsetReset.Earliest,
            EnableAutoCommit = true
        };
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Yield to allow startup to complete
        await Task.Yield();

        _logger.LogInformation("Starting Kafka consumer for topic: {Topic}", _topicName);

        using var consumer = new ConsumerBuilder<string, string>(_consumerConfig).Build();
        consumer.Subscribe(_topicName);

        try
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    var result = consumer.Consume(stoppingToken);

                    _logger.LogInformation(
                        "Received customer event: key={Key}, partition={Partition}, offset={Offset}, value={Value}",
                        result.Message.Key,
                        result.Partition.Value,
                        result.Offset.Value,
                        result.Message.Value);

                    // TODO: Deserialize and process the customer event.
                    // Example: When a customer is deleted, you might want to
                    // archive or flag all their lab results.
                    //
                    // var customerEvent = JsonSerializer.Deserialize<CustomerEvent>(result.Message.Value);
                    // await ProcessCustomerEvent(customerEvent);
                }
                catch (ConsumeException ex)
                {
                    _logger.LogError(ex, "Error consuming message");
                }
            }
        }
        catch (OperationCanceledException)
        {
            _logger.LogInformation("Kafka consumer stopped");
        }
        finally
        {
            consumer.Close();
        }
    }
}
