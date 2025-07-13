package com.lipiprint.backend.controller;

import com.lipiprint.backend.entity.ServiceOption;
import com.lipiprint.backend.repository.ServiceOptionRepository;
import com.lipiprint.backend.entity.ServiceCombination;
import com.lipiprint.backend.entity.DiscountRule;
import com.lipiprint.backend.repository.ServiceCombinationRepository;
import com.lipiprint.backend.repository.DiscountRuleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/services")
public class ServiceOptionController {
    @Autowired
    private ServiceOptionRepository serviceOptionRepository;

    // Get all services (admin)
    @GetMapping("")
    @PreAuthorize("hasRole('ADMIN')")
    public List<ServiceOption> getAll() {
        return serviceOptionRepository.findAll();
    }

    // Get only active services (user)
    @GetMapping("/active")
    public List<ServiceOption> getActive() {
        return serviceOptionRepository.findByActiveTrue();
    }

    // Add a new service (admin)
    @PostMapping("")
    @PreAuthorize("hasRole('ADMIN')")
    public ServiceOption create(@RequestBody ServiceOption option) {
        return serviceOptionRepository.save(option);
    }

    // Update a service (admin)
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ServiceOption> update(@PathVariable Long id, @RequestBody ServiceOption option) {
        return serviceOptionRepository.findById(id)
            .map(existing -> {
                existing.setName(option.getName());
                existing.setDisplayName(option.getDisplayName());
                existing.setActive(option.isActive());
                existing.setPrice(option.getPrice());
                return ResponseEntity.ok(serviceOptionRepository.save(existing));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    // Delete a service (admin)
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (serviceOptionRepository.existsById(id)) {
            serviceOptionRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
} 