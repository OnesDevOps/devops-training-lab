package com.devopslab.customerservice.service;

import com.devopslab.customerservice.model.Customer;
import com.devopslab.customerservice.model.CustomerEvent;
import com.devopslab.customerservice.repository.CustomerRepository;
import com.devopslab.customerservice.kafka.CustomerEventProducer;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class CustomerService {

    private static final Logger log = LoggerFactory.getLogger(CustomerService.class);

    private final CustomerRepository repository;
    private final CustomerEventProducer eventProducer;

    public CustomerService(CustomerRepository repository, CustomerEventProducer eventProducer) {
        this.repository = repository;
        this.eventProducer = eventProducer;
    }

    /**
     * Get all customers (not cached — list can change frequently).
     */
    @Transactional(readOnly = true)
    public List<Customer> findAll() {
        log.info("Fetching all customers from database");
        return repository.findAll();
    }

    /**
     * Get a single customer by ID — cached in Redis.
     */
    @Transactional(readOnly = true)
    @Cacheable(value = "customers", key = "#id")
    public Optional<Customer> findById(Long id) {
        log.info("Fetching customer {} from database (cache miss)", id);
        return repository.findById(id);
    }

    /**
     * Search customers by name.
     */
    @Transactional(readOnly = true)
    public List<Customer> searchByName(String name) {
        return repository.findByNameContainingIgnoreCase(name);
    }

    /**
     * Create a new customer — publishes CREATED event to Kafka.
     */
    @CachePut(value = "customers", key = "#result.id")
    public Customer create(Customer customer) {
        if (repository.existsByEmail(customer.getEmail())) {
            throw new IllegalArgumentException("Email already exists: " + customer.getEmail());
        }

        Customer saved = repository.save(customer);
        log.info("Created customer: id={}, name={}", saved.getId(), saved.getName());

        eventProducer.sendEvent(CustomerEvent.created(saved));
        return saved;
    }

    /**
     * Update an existing customer — publishes UPDATED event to Kafka.
     */
    @CachePut(value = "customers", key = "#id")
    public Customer update(Long id, Customer updates) {
        Customer existing = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found: " + id));

        existing.setName(updates.getName());
        existing.setEmail(updates.getEmail());
        existing.setPhone(updates.getPhone());
        existing.setAddress(updates.getAddress());

        Customer saved = repository.save(existing);
        log.info("Updated customer: id={}", saved.getId());

        eventProducer.sendEvent(CustomerEvent.updated(saved));
        return saved;
    }

    /**
     * Delete a customer — publishes DELETED event to Kafka.
     */
    @CacheEvict(value = "customers", key = "#id")
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new RuntimeException("Customer not found: " + id);
        }

        repository.deleteById(id);
        log.info("Deleted customer: id={}", id);

        eventProducer.sendEvent(CustomerEvent.deleted(id));
    }
}
