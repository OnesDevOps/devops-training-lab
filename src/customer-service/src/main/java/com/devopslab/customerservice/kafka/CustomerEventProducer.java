package com.devopslab.customerservice.kafka;

import com.devopslab.customerservice.model.CustomerEvent;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Component;

import java.util.concurrent.CompletableFuture;

/**
 * Publishes customer domain events to the 'customer-events' Kafka topic.
 * The Lab Service consumes these events for cross-domain synchronization.
 */
@Component
public class CustomerEventProducer {

    private static final Logger log = LoggerFactory.getLogger(CustomerEventProducer.class);

    private final KafkaTemplate<String, CustomerEvent> kafkaTemplate;

    @Value("${app.kafka.topic.customer-events}")
    private String topicName;

    public CustomerEventProducer(KafkaTemplate<String, CustomerEvent> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void sendEvent(CustomerEvent event) {
        String key = event.customerId() != null
                ? event.customerId().toString()
                : "system";

        CompletableFuture<SendResult<String, CustomerEvent>> future =
                kafkaTemplate.send(topicName, key, event);

        future.whenComplete((result, ex) -> {
            if (ex != null) {
                log.error("Failed to publish event: type={}, customerId={}, error={}",
                        event.eventType(), event.customerId(), ex.getMessage());
            } else {
                log.info("Published event: type={}, customerId={}, partition={}, offset={}",
                        event.eventType(), event.customerId(),
                        result.getRecordMetadata().partition(),
                        result.getRecordMetadata().offset());
            }
        });
    }
}
