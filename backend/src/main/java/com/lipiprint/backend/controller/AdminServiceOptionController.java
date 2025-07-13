package com.lipiprint.backend.controller;

import com.lipiprint.backend.entity.ServiceCombination;
import com.lipiprint.backend.entity.DiscountRule;
import com.lipiprint.backend.repository.ServiceCombinationRepository;
import com.lipiprint.backend.repository.DiscountRuleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminServiceOptionController {
    @Autowired
    private ServiceCombinationRepository serviceCombinationRepository;
    @Autowired
    private DiscountRuleRepository discountRuleRepository;

    // Service Combinations CRUD
    @GetMapping("/service-combinations")
    @PreAuthorize("hasRole('ADMIN')")
    public List<ServiceCombination> getAllCombinations() {
        return serviceCombinationRepository.findAll();
    }
    @PostMapping("/service-combinations")
    @PreAuthorize("hasRole('ADMIN')")
    public ServiceCombination createCombination(@RequestBody ServiceCombination combo) {
        return serviceCombinationRepository.save(combo);
    }
    @PutMapping("/service-combinations/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ServiceCombination updateCombination(@PathVariable Long id, @RequestBody ServiceCombination combo) {
        combo.setId(id);
        return serviceCombinationRepository.save(combo);
    }
    @DeleteMapping("/service-combinations/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteCombination(@PathVariable Long id) {
        serviceCombinationRepository.deleteById(id);
    }

    // Discount Rules CRUD
    @GetMapping("/discount-rules")
    @PreAuthorize("hasRole('ADMIN')")
    public List<DiscountRule> getAllDiscounts() {
        return discountRuleRepository.findAll();
    }
    @PostMapping("/discount-rules")
    @PreAuthorize("hasRole('ADMIN')")
    public DiscountRule createDiscount(@RequestBody DiscountRule rule) {
        return discountRuleRepository.save(rule);
    }
    @PutMapping("/discount-rules/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public DiscountRule updateDiscount(@PathVariable Long id, @RequestBody DiscountRule rule) {
        rule.setId(id);
        return discountRuleRepository.save(rule);
    }
    @DeleteMapping("/discount-rules/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteDiscount(@PathVariable Long id) {
        discountRuleRepository.deleteById(id);
    }
} 