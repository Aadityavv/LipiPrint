package com.lipiprint.backend.service;

import com.lipiprint.backend.entity.ServiceCombination;
import com.lipiprint.backend.entity.DiscountRule;
import com.lipiprint.backend.entity.BindingOption;
import com.lipiprint.backend.entity.Order;
import com.lipiprint.backend.entity.PrintJob;
import com.lipiprint.backend.repository.ServiceCombinationRepository;
import com.lipiprint.backend.repository.DiscountRuleRepository;
import com.lipiprint.backend.repository.BindingOptionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.util.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class PricingService {
    private static final Logger logger = LoggerFactory.getLogger(PricingService.class);
    @Autowired
    private ServiceCombinationRepository serviceCombinationRepository;
    @Autowired
    private DiscountRuleRepository discountRuleRepository;
    @Autowired
    private BindingOptionRepository bindingOptionRepository;

    public BigDecimal calculatePrintCost(String color, String paperSize, String paperQuality, String printOption, int numPages) {
        logger.info("[PricingService] calculatePrintCost called with color={}, paperSize={}, paperQuality={}, printOption={}, numPages={}", color, paperSize, paperQuality, printOption, numPages);
        ServiceCombination combo = serviceCombinationRepository.findByColorAndPaperSizeAndPaperQualityAndPrintOption(
            color, paperSize, paperQuality, printOption
        ).orElseThrow(() -> new RuntimeException("No price found for selected options"));
        logger.info("[PricingService] ServiceCombination found: {}", combo);
        BigDecimal pricePerPage = combo.getCostPerPage();
        // Find best discount (if any)
        List<DiscountRule> discounts = discountRuleRepository.findByColorAndPaperSizeAndPaperQualityAndPrintOptionAndMinPagesLessThanEqualOrderByMinPagesDesc(
            color, paperSize, paperQuality, printOption, numPages
        );
        logger.info("[PricingService] Discounts found: {}", discounts.size());
        if (!discounts.isEmpty()) {
            logger.info("[PricingService] Applying discount: {}", discounts.get(0).getAmountOff());
            pricePerPage = pricePerPage.subtract(discounts.get(0).getAmountOff());
        }
        BigDecimal total = pricePerPage.multiply(BigDecimal.valueOf(numPages));
        logger.info("[PricingService] Total print cost: {}", total);
        return total;
    }

    public BigDecimal calculateBindingCost(String type, int numPages) {
        logger.info("[PricingService] calculateBindingCost called with type={}, numPages={}", type, numPages);
        BindingOption binding = bindingOptionRepository.findByType(type)
            .orElseThrow(() -> new RuntimeException("No binding option found"));
        logger.info("[PricingService] BindingOption found: {}", binding);
        BigDecimal perPage = binding.getPerPagePrice();
        BigDecimal min = binding.getMinPrice();
        BigDecimal total = perPage.multiply(BigDecimal.valueOf(numPages));
        BigDecimal result = total.max(min);
        logger.info("[PricingService] Binding cost calculated: {}", result);
        return result;
    }

    public List<ServiceCombination> findCombinations(String color, String paperSize, String paperQuality, String printOption) {
        logger.info("[PricingService] findCombinations called with color={}, paperSize={}, paperQuality={}, printOption={}", color, paperSize, paperQuality, printOption);
        // Fetch all and filter in memory (for simplicity; can optimize with custom query)
        List<ServiceCombination> all = serviceCombinationRepository.findAll();
        List<ServiceCombination> filtered = all.stream().filter(c ->
            (color == null || color.isEmpty() || color.equals(c.getColor())) &&
            (paperSize == null || paperSize.isEmpty() || paperSize.equals(c.getPaperSize())) &&
            (paperQuality == null || paperQuality.isEmpty() || paperQuality.equals(c.getPaperQuality())) &&
            (printOption == null || printOption.isEmpty() || printOption.equals(c.getPrintOption()))
        ).toList();
        logger.info("[PricingService] Combinations found: {}", filtered.size());
        return filtered;
    }

    public List<ServiceCombination> findAllCombinations() {
        logger.info("[PricingService] findAllCombinations called");
        return serviceCombinationRepository.findAll();
    }

    // Dummy implementation for order price calculation
    public double calculatePrice(Order order) {
        logger.info("[PricingService] calculatePrice called for order: {}", order);
        if (order == null || order.getPrintJobs() == null || order.getPrintJobs().isEmpty()) {
            logger.warn("[PricingService] Order or print jobs are null/empty");
            return 0.0;
        }
        double total = 0.0;
        for (var pj : order.getPrintJobs()) {
            if (pj.getFile() == null) {
                logger.warn("[PricingService] Skipping print job: file is null (pj id: {})", pj.getId());
                continue;
            }
            if (pj.getFile().getId() == null) {
                logger.warn("[PricingService] Skipping print job: file id is null (pj id: {})", pj.getId());
                continue;
            }
            Integer numPages = pj.getFile().getPages();
            logger.info("[PricingService] PrintJob id: {}, file id: {}, file pages: {}", pj.getId(), pj.getFile().getId(), numPages);
            if (numPages == null || numPages == 0) {
                logger.warn("[PricingService] Skipping print job: file pages is null or 0 (file id: {})", pj.getFile().getId());
                continue;
            }
            if (pj.getOptions() == null || pj.getOptions().isBlank()) {
                logger.warn("[PricingService] Skipping print job: options is null or blank (pj id: {})", pj.getId());
                continue;
            }
            logger.info("[PricingService] PrintJob options string: {}", pj.getOptions());
            try {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                java.util.Map<String, Object> opts = mapper.readValue(pj.getOptions(), java.util.Map.class);
                String color = (String) opts.getOrDefault("color", null);
                String paper = (String) opts.getOrDefault("paper", null);
                String quality = (String) opts.getOrDefault("quality", null);
                String side = (String) opts.getOrDefault("side", null);
                String binding = (String) opts.getOrDefault("binding", null);
                logger.info("[PricingService] PrintJob parsed options: color={}, paper={}, quality={}, side={}, binding={}, numPages={}", color, paper, quality, side, binding, numPages);
                java.math.BigDecimal printCost = calculatePrintCost(color, paper, quality, side, numPages);
                java.math.BigDecimal bindingCost = (binding != null && !binding.isBlank()) ? calculateBindingCost(binding, numPages) : java.math.BigDecimal.ZERO;
                logger.info("[PricingService] Print cost: {}, Binding cost: {}", printCost, bindingCost);
                total += printCost.add(bindingCost).doubleValue();
            } catch (Exception e) {
                logger.error("[PricingService] Error parsing print job options or calculating cost: {} (pj id: {})", e.getMessage(), pj.getId(), e);
                continue;
            }
        }
        logger.info("[PricingService] Total order price: {}", total);
        return total;
    }

    // Add a method to calculate total price for a list of print jobs (files with options)
    public double calculateTotalPriceForPrintJobs(List<PrintJob> printJobs) {
        logger.info("[PricingService] calculateTotalPriceForPrintJobs called");
        if (printJobs == null || printJobs.isEmpty()) {
            logger.warn("[PricingService] printJobs is null/empty");
            return 0.0;
        }
        double total = 0.0;
        for (var pj : printJobs) {
            if (pj.getFile() == null) continue;
            Integer numPages = pj.getFile().getPages();
            if (numPages == null || numPages == 0) continue;
            if (pj.getOptions() == null || pj.getOptions().isBlank()) continue;
            try {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                java.util.Map<String, Object> opts = mapper.readValue(pj.getOptions(), java.util.Map.class);
                String color = (String) opts.getOrDefault("color", null);
                String paper = (String) opts.getOrDefault("paper", null);
                String quality = (String) opts.getOrDefault("quality", null);
                String side = (String) opts.getOrDefault("side", null);
                String binding = (String) opts.getOrDefault("binding", null);
                java.math.BigDecimal printCost = calculatePrintCost(color, paper, quality, side, numPages);
                java.math.BigDecimal bindingCost = (binding != null && !binding.isBlank()) ? calculateBindingCost(binding, numPages) : java.math.BigDecimal.ZERO;
                total += printCost.add(bindingCost).doubleValue();
            } catch (Exception e) {
                logger.error("[PricingService] Error parsing print job options or calculating cost: {} (pj id: {})", e.getMessage(), pj.getId(), e);
                continue;
            }
        }
        logger.info("[PricingService] Total price for print jobs: {}", total);
        return total;
    }
} 