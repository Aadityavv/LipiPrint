package com.lipiprint.backend.controller;

import com.lipiprint.backend.dto.PrintJobDTO;
import com.lipiprint.backend.entity.PrintJob;
import com.lipiprint.backend.entity.User;
import com.lipiprint.backend.service.PrintJobService;
import com.lipiprint.backend.service.UserService;
import com.lipiprint.backend.service.PricingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.stream.Collectors;
import java.math.BigDecimal;
import java.util.Map;
import java.util.HashSet;
import java.util.Set;
import java.util.HashMap;
import com.lipiprint.backend.repository.BindingOptionRepository;
import com.lipiprint.backend.repository.DiscountRuleRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/print-jobs")
public class PrintJobController {
    private static final Logger logger = LoggerFactory.getLogger(PrintJobController.class);
    @Autowired
    private PrintJobService printJobService;
    @Autowired
    private UserService userService;
    @Autowired
    private PricingService pricingService;
    @Autowired
    private BindingOptionRepository bindingOptionRepository;
    @Autowired
    private DiscountRuleRepository discountRuleRepository;

    @PostMapping("")
    public ResponseEntity<PrintJobDTO> createPrintJob(@RequestBody PrintJob printJob, Authentication authentication) {
        try {
            logger.info("[PrintJobController] Incoming print job payload: {}", printJob);
            User user = userService.findByPhone(authentication.getName()).orElseThrow();
            printJob.setUser(user);
            PrintJob saved = printJobService.save(printJob);
            PrintJobDTO dto = new PrintJobDTO(saved.getId(), null, null, saved.getStatus().name(), saved.getOptions(), saved.getCreatedAt(), saved.getUpdatedAt());
            logger.info("[PrintJobController] Created print job DTO: {}", dto);
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            logger.error("[PrintJobController] Error creating print job: ", e);
            return ResponseEntity.status(500).body(null);
        }
    }

    @GetMapping("")
    public ResponseEntity<List<PrintJobDTO>> listPrintJobs() {
        List<PrintJobDTO> jobs = printJobService.findAll().stream()
                .map(j -> new PrintJobDTO(j.getId(), null, null, j.getStatus().name(), j.getOptions(), j.getCreatedAt(), j.getUpdatedAt()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(jobs);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PrintJobDTO> getPrintJob(@PathVariable Long id) {
        PrintJob job = printJobService.findById(id).orElseThrow();
        PrintJobDTO dto = new PrintJobDTO(job.getId(), null, null, job.getStatus().name(), job.getOptions(), job.getCreatedAt(), job.getUpdatedAt());
        return ResponseEntity.ok(dto);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<PrintJobDTO> updatePrintJobStatus(@PathVariable Long id, @RequestParam String status) {
        PrintJob job = printJobService.findById(id).orElseThrow();
        job.setStatus(PrintJob.Status.valueOf(status));
        PrintJob updated = printJobService.save(job);
        PrintJobDTO dto = new PrintJobDTO(updated.getId(), null, null, updated.getStatus().name(), updated.getOptions(), updated.getCreatedAt(), updated.getUpdatedAt());
        return ResponseEntity.ok(dto);
    }

    @PostMapping("/calculate-cost")
    public ResponseEntity<Map<String, Object>> calculateCost(@RequestBody Map<String, Object> payload) {
        logger.info("[PrintJobController] calculateCost called with payload: {}", payload);
        // Support both old and new payloads
        Object filesObj = payload.get("files");
        if (filesObj instanceof List filesList && !filesList.isEmpty()) {
            // New: per-file pricing
            List<Map<String, Object>> files = (List<Map<String, Object>>) filesObj;
            List<PrintJob> printJobs = new java.util.ArrayList<>();
            for (Map<String, Object> file : files) {
                PrintJob pj = new PrintJob();
                // Simulate a File entity with pages
                com.lipiprint.backend.entity.File f = new com.lipiprint.backend.entity.File();
                f.setPages(file.get("numPages") != null ? ((Number) file.get("numPages")).intValue() : 1);
                pj.setFile(f);
                // Store options as JSON
                try {
                    com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                    java.util.Map<String, Object> opts = new java.util.HashMap<>();
                    if (file.get("color") != null) opts.put("color", file.get("color"));
                    if (file.get("paper") != null) opts.put("paper", file.get("paper"));
                    if (file.get("quality") != null) opts.put("quality", file.get("quality"));
                    if (file.get("side") != null) opts.put("side", file.get("side"));
                    if (file.get("binding") != null) opts.put("binding", file.get("binding"));
                    pj.setOptions(mapper.writeValueAsString(opts));
                } catch (Exception e) {
                    pj.setOptions(null);
                }
                printJobs.add(pj);
            }
            PricingService.PriceSummary summary = pricingService.calculatePriceSummaryForPrintJobs(printJobs);
            Map<String, Object> result = new java.util.HashMap<>();
            result.put("subtotal", summary.subtotal); // before discount
            result.put("discount", summary.discount);
            result.put("discountedSubtotal", summary.discountedSubtotal); // after discount, before GST
            result.put("gst", summary.gst);
            result.put("grandTotal", summary.grandTotal);
            result.put("breakdown", summary.breakdown);
            // Optionally, add breakdown per file
            return ResponseEntity.ok(result);
        } else {
            // Old: single job
            String color = (String) payload.get("color");
            String paperSize = (String) payload.get("paperSize");
            String paperQuality = (String) payload.get("paperQuality");
            String printOption = (String) payload.get("printOption");
            int numPages = ((Number) payload.get("numPages")).intValue();
            String bindingType = (String) payload.get("bindingType");
            int bindingPages = payload.get("bindingPages") != null ? ((Number) payload.get("bindingPages")).intValue() : numPages;
            try {
                java.math.BigDecimal printCost = pricingService.calculatePrintCost(color, paperSize, paperQuality, printOption, numPages);
                java.math.BigDecimal bindingCost = bindingType != null ? pricingService.calculateBindingCost(bindingType, bindingPages) : java.math.BigDecimal.ZERO;
                Map<String, Object> result = new java.util.HashMap<>();
                result.put("printCost", printCost);
                result.put("bindingCost", bindingCost);
                result.put("totalCost", printCost.add(bindingCost));
                logger.info("[PrintJobController] Cost calculation result: {}", result);
                return ResponseEntity.ok(result);
            } catch (RuntimeException e) {
                logger.error("[PrintJobController] Error in calculateCost: {}", e.getMessage(), e);
                return ResponseEntity.status(400).body(Map.of("error", -1, "message", e.getMessage()));
            }
        }
    }

    @PostMapping("/available-options")
    public ResponseEntity<Map<String, Object>> getAvailableOptions(@RequestBody Map<String, Object> payload) {
        logger.info("[PrintJobController] getAvailableOptions called with payload: {}", payload);
        // Accepts any subset of: color, paperSize, paperQuality, printOption
        String color = (String) payload.get("color");
        String paperSize = (String) payload.get("paperSize");
        String paperQuality = (String) payload.get("paperQuality");
        String printOption = (String) payload.get("printOption");

        // Query all matching combinations
        List<com.lipiprint.backend.entity.ServiceCombination> combos = pricingService.findCombinations(color, paperSize, paperQuality, printOption);

        // Collect available values for each field
        Set<String> colors = new HashSet<>();
        Set<String> paperSizes = new HashSet<>();
        Set<String> paperQualities = new HashSet<>();
        Set<String> printOptions = new HashSet<>();
        for (var c : combos) {
            colors.add(c.getColor());
            paperSizes.add(c.getPaperSize());
            paperQualities.add(c.getPaperQuality());
            printOptions.add(c.getPrintOption());
        }
        Map<String, Object> result = new HashMap<>();
        result.put("color", colors);
        result.put("paperSize", paperSizes);
        result.put("paperQuality", paperQualities);
        result.put("printOption", printOptions);
        logger.info("[PrintJobController] Available options result: {}", result);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/combinations")
    public ResponseEntity<List<com.lipiprint.backend.entity.ServiceCombination>> getCombinations() {
        return ResponseEntity.ok(pricingService.findAllCombinations());
    }

    @GetMapping("/binding-options")
    public ResponseEntity<List<com.lipiprint.backend.entity.BindingOption>> getBindingOptions() {
        return ResponseEntity.ok(bindingOptionRepository.findAll());
    }

    @GetMapping("/discount-rules")
    public ResponseEntity<List<com.lipiprint.backend.entity.DiscountRule>> getDiscountRules() {
        return ResponseEntity.ok(discountRuleRepository.findAll());
    }
} 