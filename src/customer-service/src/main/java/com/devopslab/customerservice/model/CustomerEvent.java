package com.devopslab.customerservice.model;

import java.time.LocalDateTime;

/**
 * DTO representing a customer event published to Kafka.
 */
public record CustomerEvent(
    String eventType,    // CREATED, UPDATED, DELETED
    Long customerId,
    String customerName,
    String customerEmail,
    LocalDateTime timestamp
) {
    public static CustomerEvent created(Customer customer) {
        return new CustomerEvent("CREATED", customer.getId(), customer.getName(),
                customer.getEmail(), LocalDateTime.now());
    }

    public static CustomerEvent updated(Customer customer) {
        return new CustomerEvent("UPDATED", customer.getId(), customer.getName(),
                customer.getEmail(), LocalDateTime.now());
    }

    public static CustomerEvent deleted(Long customerId) {
        return new CustomerEvent("DELETED", customerId, null, null, LocalDateTime.now());
    }
}
