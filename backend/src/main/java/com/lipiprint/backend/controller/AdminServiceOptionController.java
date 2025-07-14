package com.lipiprint.backend.controller;

import com.lipiprint.backend.entity.ServiceCombination;
import com.lipiprint.backend.entity.DiscountRule;
import com.lipiprint.backend.entity.BindingOption;
import com.lipiprint.backend.repository.ServiceCombinationRepository;
import com.lipiprint.backend.repository.DiscountRuleRepository;
import com.lipiprint.backend.repository.BindingOptionRepository;
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
    @Autowired
    private BindingOptionRepository bindingOptionRepository;

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

    // Binding Options CRUD
    @PutMapping("/binding-options/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public BindingOption updateBindingOption(@PathVariable Long id, @RequestBody BindingOption option) {
        return bindingOptionRepository.findById(id)
            .map(existing -> {
                existing.setType(option.getType());
                existing.setPerPagePrice(option.getPerPagePrice());
                existing.setMinPrice(option.getMinPrice());
                return bindingOptionRepository.save(existing);
            })
            .orElseThrow();
    }
    @PostMapping("/binding-options")
    @PreAuthorize("hasRole('ADMIN')")
    public BindingOption createBindingOption(@RequestBody BindingOption option) {
        return bindingOptionRepository.save(option);
    }
    @DeleteMapping("/binding-options/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteBindingOption(@PathVariable Long id) {
        bindingOptionRepository.deleteById(id);
    }
} 