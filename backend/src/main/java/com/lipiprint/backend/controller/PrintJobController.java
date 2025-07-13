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
        // Support both old and new payloads
        Object filesObj = payload.get("files");
        if (filesObj instanceof List filesList && !filesList.isEmpty()) {
            // New: per-file pricing
            List<Map<String, Object>> files = (List<Map<String, Object>>) filesObj;
            List<Map<String, Object>> breakdown = new java.util.ArrayList<>();
            java.math.BigDecimal total = java.math.BigDecimal.ZERO;
            for (Map<String, Object> file : files) {
                String color = (String) file.get("color");
                String paperSize = (String) file.get("paperSize");
                String paperQuality = (String) file.get("paperQuality");
                String printOption = (String) file.get("printOption");
                int numPages = ((Number) file.get("numPages")).intValue();
                String bindingType = (String) file.get("bindingType");
                int bindingPages = file.get("bindingPages") != null ? ((Number) file.get("bindingPages")).intValue() : numPages;
                java.math.BigDecimal printCost = pricingService.calculatePrintCost(color, paperSize, paperQuality, printOption, numPages);
                java.math.BigDecimal bindingCost = bindingType != null ? pricingService.calculateBindingCost(bindingType, bindingPages) : java.math.BigDecimal.ZERO;
                java.math.BigDecimal fileTotal = printCost.add(bindingCost);
                total = total.add(fileTotal);
                Map<String, Object> fileResult = new java.util.HashMap<>();
                fileResult.put("fileName", file.get("fileName"));
                fileResult.put("printCost", printCost);
                fileResult.put("bindingCost", bindingCost);
                fileResult.put("totalCost", fileTotal);
                fileResult.put("numPages", numPages);
                breakdown.add(fileResult);
            }
            Map<String, Object> result = new java.util.HashMap<>();
            result.put("breakdown", breakdown);
            result.put("totalCost", total);
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
                return ResponseEntity.ok(result);
            } catch (RuntimeException e) {
                return ResponseEntity.status(400).body(Map.of("error", -1, "message", e.getMessage()));
            }
        }
    }

    @PostMapping("/available-options")
    public ResponseEntity<Map<String, Object>> getAvailableOptions(@RequestBody Map<String, Object> payload) {
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
} 