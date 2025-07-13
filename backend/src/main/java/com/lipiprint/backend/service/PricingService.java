package com.lipiprint.backend.service;

import com.lipiprint.backend.entity.ServiceCombination;
import com.lipiprint.backend.entity.DiscountRule;
import com.lipiprint.backend.entity.BindingOption;
import com.lipiprint.backend.entity.Order;
import com.lipiprint.backend.repository.ServiceCombinationRepository;
import com.lipiprint.backend.repository.DiscountRuleRepository;
import com.lipiprint.backend.repository.BindingOptionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.util.StringUtils;

@Service
public class PricingService {
    @Autowired
    private ServiceCombinationRepository serviceCombinationRepository;
    @Autowired
    private DiscountRuleRepository discountRuleRepository;
    @Autowired
    private BindingOptionRepository bindingOptionRepository;

    public BigDecimal calculatePrintCost(String color, String paperSize, String paperQuality, String printOption, int numPages) {
        System.out.println("Looking for price: color=" + color + ", paperSize=" + paperSize + ", paperQuality=" + paperQuality + ", printOption=" + printOption);
        ServiceCombination combo = serviceCombinationRepository.findByColorAndPaperSizeAndPaperQualityAndPrintOption(
            color, paperSize, paperQuality, printOption
        ).orElseThrow(() -> new RuntimeException("No price found for selected options"));
        BigDecimal pricePerPage = combo.getCostPerPage();
        // Find best discount (if any)
        List<DiscountRule> discounts = discountRuleRepository.findByColorAndPaperSizeAndPaperQualityAndPrintOptionAndMinPagesLessThanEqualOrderByMinPagesDesc(
            color, paperSize, paperQuality, printOption, numPages
        );
        System.out.println("Discounts found: " + discounts.size());
        if (!discounts.isEmpty()) {
            System.out.println("Applying discount: " + discounts.get(0).getAmountOff());
            pricePerPage = pricePerPage.subtract(discounts.get(0).getAmountOff());
        }
        return pricePerPage.multiply(BigDecimal.valueOf(numPages));
    }

    public BigDecimal calculateBindingCost(String type, int numPages) {
        BindingOption binding = bindingOptionRepository.findByType(type)
            .orElseThrow(() -> new RuntimeException("No binding option found"));
        BigDecimal perPage = binding.getPerPagePrice();
        BigDecimal min = binding.getMinPrice();
        BigDecimal total = perPage.multiply(BigDecimal.valueOf(numPages));
        return total.max(min);
    }

    public List<ServiceCombination> findCombinations(String color, String paperSize, String paperQuality, String printOption) {
        // Fetch all and filter in memory (for simplicity; can optimize with custom query)
        List<ServiceCombination> all = serviceCombinationRepository.findAll();
        return all.stream().filter(c ->
            (color == null || color.isEmpty() || color.equals(c.getColor())) &&
            (paperSize == null || paperSize.isEmpty() || paperSize.equals(c.getPaperSize())) &&
            (paperQuality == null || paperQuality.isEmpty() || paperQuality.equals(c.getPaperQuality())) &&
            (printOption == null || printOption.isEmpty() || printOption.equals(c.getPrintOption()))
        ).toList();
    }

    public List<ServiceCombination> findAllCombinations() {
        return serviceCombinationRepository.findAll();
    }

    // Dummy implementation for order price calculation
    public double calculatePrice(Order order) {
        // TODO: Implement real pricing logic based on order's printJobs, options, etc.
        return 100.0;
    }
} 