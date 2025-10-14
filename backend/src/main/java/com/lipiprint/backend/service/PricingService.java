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

    // Add a method to calculate price summary including GST
    public static class BreakdownItem {
        public String description;
        public int quantity;
        public String hsn;
        public double rate;
        public double amount;
        public double discount;
        public double total;
        public String printOptions;
        public BreakdownItem(String description, int quantity, String hsn, double rate, double amount, double discount, double total, String printOptions) {
            this.description = description;
            this.quantity = quantity;
            this.hsn = hsn;
            this.rate = rate;
            this.amount = amount;
            this.discount = discount;
            this.total = total;
            this.printOptions = printOptions;
        }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public int getQuantity() { return quantity; }
        public void setQuantity(int quantity) { this.quantity = quantity; }
        public String getHsn() { return hsn; }
        public void setHsn(String hsn) { this.hsn = hsn; }
        public double getRate() { return rate; }
        public void setRate(double rate) { this.rate = rate; }
        public double getAmount() { return amount; }
        public void setAmount(double amount) { this.amount = amount; }
        public double getDiscount() { return discount; }
        public void setDiscount(double discount) { this.discount = discount; }
        public double getTotal() { return total; }
        public void setTotal(double total) { this.total = total; }
        public String getPrintOptions() { return printOptions; }
        public void setPrintOptions(String printOptions) { this.printOptions = printOptions; }
    }

    public static class PriceSummary {
        public double subtotal; // before discount
        public double discount;
        public double discountedSubtotal; // after discount, before GST
        public double gst;
        public double cgst;
        public double sgst;
        public double igst;
        public double grandTotal;
        public java.util.List<BreakdownItem> breakdown;
        public PriceSummary(double subtotal, double discount, double discountedSubtotal, double gst, double cgst, double sgst, double igst, double grandTotal, java.util.List<BreakdownItem> breakdown) {
            this.subtotal = subtotal;
            this.discount = discount;
            this.discountedSubtotal = discountedSubtotal;
            this.gst = gst;
            this.cgst = cgst;
            this.sgst = sgst;
            this.igst = igst;
            this.grandTotal = grandTotal;
            this.breakdown = breakdown;
        }
    }

    public PriceSummary calculatePriceSummaryForPrintJobs(List<PrintJob> printJobs) {
        return calculatePriceSummaryForPrintJobs(printJobs, null);
    }
    
    public PriceSummary calculatePriceSummaryForPrintJobs(List<PrintJob> printJobs, String pincode) {
        double subtotal = 0.0;
        double discountPercent = 0.0;
        int totalPages = 0;
        String color = null, paper = null, quality = null, side = null;
        java.util.List<BreakdownItem> breakdown = new java.util.ArrayList<>();
        
        // Check if pincode is from Uttar Pradesh
        boolean isUttarPradesh = isUttarPradeshPincode(pincode);

        // Group print jobs by print options
        java.util.Map<String, java.util.List<PrintJob>> groups = new java.util.LinkedHashMap<>();
        java.util.Map<String, String> groupOptionsStr = new java.util.HashMap<>();
        for (var pj : printJobs) {
            if (pj.getFile() == null) continue;
            Integer numPages = pj.getFile().getPages();
            if (numPages == null || numPages == 0) continue;
            if (pj.getOptions() == null || pj.getOptions().isBlank()) continue;
            try {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                java.util.Map<String, Object> opts = mapper.readValue(pj.getOptions(), java.util.Map.class);
                color = (String) opts.getOrDefault("color", null);
                paper = (String) opts.getOrDefault("paper", null);
                quality = (String) opts.getOrDefault("quality", null);
                side = (String) opts.getOrDefault("side", null);
                String binding = (String) opts.getOrDefault("binding", null);
                // Build group key
                String groupKey = (color + "," + paper + "," + quality + "," + side + "," + (binding != null ? binding : "")).toLowerCase();
                // Build print options string
                StringBuilder printOptionsStr = new StringBuilder();
                if (color != null) printOptionsStr.append("<b>Color:</b> ").append(color).append("<br>");
                if (paper != null) printOptionsStr.append("<b>Paper:</b> ").append(paper).append("<br>");
                if (quality != null) printOptionsStr.append("<b>Quality:</b> ").append(quality).append("<br>");
                if (side != null) printOptionsStr.append("<b>Side:</b> ").append(side).append("<br>");
                if (binding != null) printOptionsStr.append("<b>Binding:</b> ").append(binding).append("<br>");
                groups.computeIfAbsent(groupKey, k -> new java.util.ArrayList<>()).add(pj);
                groupOptionsStr.put(groupKey, printOptionsStr.toString());
            } catch (Exception e) {
                continue;
            }
        }

        // For each group, calculate totals
        for (var entry : groups.entrySet()) {
            java.util.List<PrintJob> groupJobs = entry.getValue();
            if (groupJobs.isEmpty()) continue;
            PrintJob first = groupJobs.get(0);
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            java.util.Map<String, Object> opts;
            try { opts = mapper.readValue(first.getOptions(), java.util.Map.class); } catch (Exception e) { opts = new java.util.HashMap<>(); }
            color = (String) opts.getOrDefault("color", null);
            paper = (String) opts.getOrDefault("paper", null);
            quality = (String) opts.getOrDefault("quality", null);
            side = (String) opts.getOrDefault("side", null);
            String binding = (String) opts.getOrDefault("binding", null);
            ServiceCombination combo = serviceCombinationRepository.findByColorAndPaperSizeAndPaperQualityAndPrintOption(
                color, paper, quality, side
            ).orElseThrow(() -> new RuntimeException("No price found for selected options"));
            double basePricePerPage = combo.getCostPerPage().doubleValue();
            int groupPages = 0;
            java.util.List<String> fileNames = new java.util.ArrayList<>();
            double groupPrintCost = 0.0;
            double groupBindingCost = 0.0;
            for (var pj : groupJobs) {
                int numPages = pj.getFile().getPages();
                groupPages += numPages;
                fileNames.add(pj.getFile().getOriginalFilename() != null ? pj.getFile().getOriginalFilename() : pj.getFile().getFilename());
                groupPrintCost += basePricePerPage * numPages;
                if (binding != null && !binding.isBlank()) {
                    BindingOption bindingOpt = bindingOptionRepository.findByType(binding).orElse(null);
                    if (bindingOpt != null) {
                        double perPage = bindingOpt.getPerPagePrice().doubleValue();
                        double min = bindingOpt.getMinPrice().doubleValue();
                        groupBindingCost += Math.max(perPage * numPages, min);
                    }
                }
            }
            double amount = groupPrintCost + groupBindingCost;
            subtotal += amount;
            totalPages += groupPages;
            String description = fileNames.size() > 1 ? ("Multiple files: " + String.join(", ", fileNames)) : fileNames.get(0);
            breakdown.add(new BreakdownItem(
                description,
                groupPages,
                "4911",
                basePricePerPage,
                amount,
                0.0, // will fill later if per-group discount
                amount, // will fill later if per-group discount
                groupOptionsStr.get(entry.getKey())
            ));
        }

        // Find best discount for the whole order (by options and totalPages)
        List<DiscountRule> discounts = discountRuleRepository.findByColorAndPaperSizeAndPaperQualityAndPrintOptionAndMinPagesLessThanEqualOrderByMinPagesDesc(
            color, paper, quality, side, totalPages
        );
        if (!discounts.isEmpty()) {
            discountPercent = discounts.get(0).getAmountOff().doubleValue();
        }
        subtotal = Math.round(subtotal * 100.0) / 100.0;
        double discount = Math.round((subtotal * discountPercent) * 100.0) / 100.0;
        double discountedSubtotal = subtotal - discount;
        
        // Calculate GST based on location
        double cgst = 0.0;
        double sgst = 0.0;
        double igst = 0.0;
        double gst = 0.0;
        
        if (isUttarPradesh) {
            // Within Uttar Pradesh: CGST 9% + SGST 9%
            cgst = Math.round(discountedSubtotal * 0.09 * 100.0) / 100.0;
            sgst = Math.round(discountedSubtotal * 0.09 * 100.0) / 100.0;
            gst = cgst + sgst;
        } else {
            // Outside Uttar Pradesh: IGST 18%
            igst = Math.round(discountedSubtotal * 0.18 * 100.0) / 100.0;
            gst = igst;
        }
        
        // Calculate grand total with rounding logic
        double rawGrandTotal = discountedSubtotal + gst;
        double grandTotal = customRound(rawGrandTotal);
        
        // Distribute discount proportionally to each group
        if (discount > 0 && subtotal > 0) {
            for (BreakdownItem item : breakdown) {
                double prop = item.amount / subtotal;
                item.discount = Math.round(discount * prop * 100.0) / 100.0;
                item.total = Math.round((item.amount - item.discount) * 100.0) / 100.0;
            }
        } else {
            for (BreakdownItem item : breakdown) {
                item.discount = 0.0;
                item.total = item.amount;
            }
        }
        logger.info("[PricingService] Final Calculation: subtotal(before discount)={}, discountPercent={}, discountAmount={}, discountedSubtotal(after discount)={}, gst={}, cgst={}, sgst={}, igst={}, grandTotal={}", 
            subtotal, discountPercent, discount, discountedSubtotal, gst, cgst, sgst, igst, grandTotal);
        return new PriceSummary(subtotal, discount, discountedSubtotal, gst, cgst, sgst, igst, grandTotal, breakdown);
    }
    
    // Helper method to check if pincode is from Uttar Pradesh
    private boolean isUttarPradeshPincode(String pincode) {
        if (pincode == null || pincode.trim().isEmpty()) {
            return false;
        }
        String cleaned = pincode.trim();
        // Uttar Pradesh pincodes start with: 20xxxx to 28xxxx
        if (cleaned.length() == 6 && cleaned.matches("\\d{6}")) {
            int prefix = Integer.parseInt(cleaned.substring(0, 2));
            return prefix >= 20 && prefix <= 28;
        }
        return false;
    }
    
    // Custom rounding: > 0.50 round up, <= 0.49 round down
    private double customRound(double value) {
        double integerPart = Math.floor(value);
        double decimalPart = value - integerPart;
        
        if (decimalPart > 0.50) {
            // Round up
            return Math.ceil(value);
        } else {
            // Round down
            return integerPart;
        }
    }
} 