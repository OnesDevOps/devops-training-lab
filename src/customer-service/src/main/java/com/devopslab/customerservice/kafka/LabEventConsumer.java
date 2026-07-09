package com.devopslab.customerservice.kafka;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

/**
 * Consumes events from the 'lab-events' topic published by the Lab Service (.NET).
 * This demonstrates cross-domain event-driven communication.
 *
 * In a real application, you would deserialize the event and trigger
 * business logic (e.g., update customer records when a lab is assigned to them).
 */
@Component
public class LabEventConsumer {

    private static final Logger log = LoggerFactory.getLogger(LabEventConsumer.class);

    @KafkaListener(
        topics = "${app.kafka.topic.lab-events}",
        groupId = "customer-service-group"
    )
    public void handleLabEvent(String message) {
        log.info("Received lab event: {}", message);

        // TODO: Deserialize and process the lab event.
        // Example: When a lab result is created for a customer, you might
        // want to update the customer's last-activity timestamp or send
        // a notification.
        //
        // LabEvent event = objectMapper.readValue(message, LabEvent.class);
        // customerService.onLabEvent(event);
    }
}
