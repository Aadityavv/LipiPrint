package com.lipiprint.backend.controller;

import com.lipiprint.backend.dto.OrderDTO;
import com.lipiprint.backend.entity.Order;
import com.lipiprint.backend.entity.User;
import com.lipiprint.backend.entity.UserAddress;
import com.lipiprint.backend.service.OrderService;
import com.lipiprint.backend.service.UserService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.json.JSONObject;
import com.razorpay.RazorpayException;
import com.lipiprint.backend.dto.UserDTO;
import java.time.LocalDateTime;
import com.lipiprint.backend.dto.FileDTO;
import com.lipiprint.backend.dto.PrintJobDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.lipiprint.backend.entity.PrintJob;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.core.io.ByteArrayResource;
import java.io.ByteArrayOutputStream;
import org.springframework.security.core.GrantedAuthority;
import com.lipiprint.backend.service.PricingService;
import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import com.lipiprint.backend.repository.FileRepository;
import jakarta.validation.Valid;
import com.lipiprint.backend.dto.MessageResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import com.lipiprint.backend.dto.OrderListDTO;
import org.springframework.core.io.ClassPathResource;
import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/api/orders")
public class OrderController {
    private static final Logger logger = LoggerFactory.getLogger(OrderController.class);
    
    private OrderService orderService;
    private UserService userService;
    private PricingService pricingService;
    private FileRepository fileRepository;
    
    @Autowired
    public OrderController(OrderService orderService, UserService userService, 
                          PricingService pricingService, FileRepository fileRepository) {
        this.orderService = orderService;
        this.userService = userService;
        this.pricingService = pricingService;
        this.fileRepository = fileRepository;
    }

    @PostMapping("")
    public ResponseEntity<?> createOrder(@Valid @RequestBody OrderDTO orderDTO, Authentication authentication) {
        logger.info("========================================");
        logger.info("ORDER CREATION STARTING");
        logger.info("OrderDTO: {}", orderDTO);
        logger.info("========================================");
        
        try {
            User user = userService.findByPhone(authentication.getName()).orElseThrow();
            logger.info("✅ User validated: {} (ID: {})", user.getName(), user.getId());
            
            if (orderDTO.getPrintJobs() == null || orderDTO.getPrintJobs().isEmpty()) {
                return ResponseEntity.badRequest().body(new MessageResponse("At least one print job is required."));
            }
            if (orderDTO.getDeliveryType() == null || orderDTO.getDeliveryType().isBlank()) {
                return ResponseEntity.badRequest().body(new MessageResponse("Delivery type is required."));
            }

            UserAddress deliveryAddress = null;
            String deliveryAddressDisplay = orderDTO.getDeliveryAddress();
            
            if ("DELIVERY".equals(orderDTO.getDeliveryType())) {
                Map<String, Object> addressData = extractAddressData(orderDTO);
                
                if (addressData != null) {
                    deliveryAddress = new UserAddress();
                    deliveryAddress.setLine1((String) addressData.get("line1"));
                    deliveryAddress.setLine2((String) addressData.get("line2"));
                    deliveryAddress.setPincode((String) addressData.get("pincode"));
                    deliveryAddress.setCity((String) addressData.get("city"));
                    deliveryAddress.setState((String) addressData.get("state"));
                    deliveryAddress.setPhone((String) addressData.get("phone"));
                    deliveryAddress.setAddressType("delivery");
                    
                    logger.info("✅ Using structured address data:");
                    logger.info("   Line1: '{}'", deliveryAddress.getLine1());
                    logger.info("   Line2: '{}'", deliveryAddress.getLine2());
                    logger.info("   Pincode: '{}'", deliveryAddress.getPincode());
                    logger.info("   City: '{}'", deliveryAddress.getCity());
                    logger.info("   State: '{}'", deliveryAddress.getState());
                    logger.info("   Phone: '{}'", deliveryAddress.getPhone());
                    
                    if (deliveryAddress.getPincode() == null || 
                        deliveryAddress.getPincode().trim().isEmpty() || 
                        !deliveryAddress.getPincode().matches("\\d{6}")) {
                        logger.error("❌ Invalid pincode: '{}'", deliveryAddress.getPincode());
                        return ResponseEntity.badRequest().body(
                            new MessageResponse("Invalid delivery pincode: " + deliveryAddress.getPincode()));
                    }
                    
                } else if (deliveryAddressDisplay != null && !deliveryAddressDisplay.trim().isEmpty()) {
                    logger.warn("⚠️ No structured address data, parsing from display string: '{}'", deliveryAddressDisplay);
                    deliveryAddress = parseAddressFromString(deliveryAddressDisplay);
                } else {
                    return ResponseEntity.badRequest().body(new MessageResponse("Delivery address is required for delivery orders."));
                }
                
                if (deliveryAddress.getPincode() == null || deliveryAddress.getPincode().equals("000000")) {
                    logger.error("❌ No valid pincode found in address data");
                    return ResponseEntity.badRequest().body(new MessageResponse("Valid delivery pincode is required."));
                }
            }

            Order order = new Order();
            order.setUser(user);
            order.setDeliveryType(Order.DeliveryType.valueOf(orderDTO.getDeliveryType().toUpperCase()));
            order.setDeliveryAddress(deliveryAddressDisplay);
            order.setStatus(Order.Status.PENDING);
            order.setTotalAmount(orderDTO.getTotalAmount());

            if (orderDTO.getPrintJobs() != null) {
                var printJobs = new java.util.ArrayList<com.lipiprint.backend.entity.PrintJob>();
                for (var pjDTO : orderDTO.getPrintJobs()) {
                    var pj = new com.lipiprint.backend.entity.PrintJob();
                    if (pjDTO.getFile() == null || pjDTO.getFile().getId() == null) {
                        return ResponseEntity.badRequest().body(new MessageResponse("Each print job must have a file with a valid ID."));
                    }
                    var file = fileRepository.findById(pjDTO.getFile().getId()).orElse(null);
                    if (file == null) {
                        return ResponseEntity.badRequest().body(new MessageResponse("File not found for print job."));
                    }
                    pj.setFile(file);
                    pj.setUser(user);
                    pj.setStatus(com.lipiprint.backend.entity.PrintJob.Status.QUEUED);
                    pj.setOptions(pjDTO.getOptions());
                    pj.setOrder(order);

                    try {
                        ObjectMapper mapper = new ObjectMapper();
                        java.util.Map<String, Object> opts = pj.getOptions() != null ?
                                mapper.convertValue(mapper.readTree(pj.getOptions()), new TypeReference<Map<String, Object>>() {})
                                : new java.util.HashMap<>();

                        String color = (String) opts.getOrDefault("color", null);
                        String paper = (String) opts.getOrDefault("paper", null);
                        String quality = (String) opts.getOrDefault("quality", null);
                        String side = (String) opts.getOrDefault("side", null);
                        String binding = (String) opts.getOrDefault("binding", null);
                        int pages = file.getPages() != null ? file.getPages() : 1;

                        java.math.BigDecimal printCost = pricingService.calculatePrintCost(color, paper, quality, side, pages);
                        java.math.BigDecimal bindingCost = (binding != null && !binding.isBlank()) ?
                                pricingService.calculateBindingCost(binding, pages) : java.math.BigDecimal.ZERO;
                        double price = printCost.add(bindingCost).doubleValue();
                        pj.setPrice(price);
                    } catch (Exception e) {
                        logger.error("Error calculating price for print job during order creation: {}", e.getMessage());
                        pj.setPrice(0.0);
                    }

                    printJobs.add(pj);
                }
                order.setPrintJobs(printJobs);
            }

            if (order.getPrintJobs() != null && !order.getPrintJobs().isEmpty()) {
                PricingService.PriceSummary summary = pricingService.calculatePriceSummaryForPrintJobs(order.getPrintJobs());
                double delivery = order.getDeliveryType() != null && order.getDeliveryType() == Order.DeliveryType.PICKUP ? 0.0 : 30.0;
                
                order.setSubtotal(summary.subtotal);
                order.setDiscount(summary.discount);
                order.setDiscountedSubtotal(summary.discountedSubtotal);
                order.setGst(summary.gst);
                order.setDelivery(delivery);
                order.setGrandTotal(summary.grandTotal + delivery);
                order.setTotalAmount(order.getGrandTotal());
                order.setBreakdown(summary.breakdown);
            }

            String razorpayOrderId = orderDTO.getRazorpayOrderId();
            String razorpayPaymentId = orderDTO.getRazorpayPaymentId();
            Order saved = orderService.save(order, razorpayOrderId, razorpayPaymentId);
            saved = orderService.findById(saved.getId()).orElse(saved);
            
            logger.info("✅ Order saved with ID: {}", saved.getId());

            OrderDTO dto = convertToDTO(saved);
            
            logger.info("✅ Order creation completed successfully - Order ID: {}", saved.getId());
            logger.info("========================================");
            
            return ResponseEntity.ok(dto);
            
        } catch (Exception e) {
            logger.error("❌ Order creation failed: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(new MessageResponse("Failed to create order: " + e.getMessage()));
        }
    }

    private Map<String, Object> extractAddressData(OrderDTO orderDTO) {
        try {
            Map<String, Object> addressData = orderDTO.getStructuredDeliveryAddress();
            if (addressData != null && addressData.containsKey("pincode") && addressData.containsKey("line1")) {
                logger.info("✅ Found structured address data in DTO: {}", addressData);
                return addressData;
            }
            
            logger.info("⚠️ No structured address data found in DTO");
            return null;
            
        } catch (Exception e) {
            logger.warn("⚠️ Failed to extract structured address data: {}", e.getMessage());
            return null;
        }
    }

    private UserAddress parseAddressFromString(String addressString) {
        UserAddress address = new UserAddress();
        
        if (addressString != null && !addressString.trim().isEmpty()) {
            String[] parts = addressString.split(",");
            
            if (parts.length >= 2) {
                address.setLine1(parts[0].trim());
                address.setLine2(parts[1].trim());
                
                String lastPart = parts[parts.length - 1].trim();
                String pincode = extractPincode(lastPart);
                address.setPincode(pincode);
                
                address.setCity(extractCity(addressString));
                address.setState(extractState(addressString));
            }
        }
        
        if (address.getPincode() == null || address.getPincode().isEmpty()) {
            address.setPincode("000000");
        }
        if (address.getCity() == null || address.getCity().isEmpty()) {
            address.setCity("Unknown");
        }
        if (address.getState() == null || address.getState().isEmpty()) {
            address.setState("Unknown");
        }
        
        address.setAddressType("delivery");
        
        logger.info("📍 Parsed address from string:");
        logger.info("   Original: '{}'", addressString);
        logger.info("   Line1: '{}'", address.getLine1());
        logger.info("   Line2: '{}'", address.getLine2());
        logger.info("   Pincode: '{}'", address.getPincode());
        logger.info("   City: '{}'", address.getCity());
        logger.info("   State: '{}'", address.getState());
        
        return address;
    }

    private String extractPincode(String text) {
        if (text == null || text.trim().isEmpty()) {
            return "000000";
        }
        
        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("\\b(\\d{6})\\b");
        java.util.regex.Matcher matcher = pattern.matcher(text);
        
        if (matcher.find()) {
            return matcher.group(1);
        }
        
        return "000000";
    }

    private String extractCity(String addressLine) {
        if (addressLine == null || addressLine.trim().isEmpty()) {
            return "Unknown";
        }
        
        String[] parts = addressLine.split(",");
        for (String part : parts) {
            String trimmed = part.trim();
            if (!trimmed.isEmpty() && 
                !trimmed.matches("\\d+") && 
                !trimmed.toLowerCase().contains("near") &&
                !trimmed.toLowerCase().contains("opposite") &&
                trimmed.length() > 2) {
                return trimmed;
            }
        }
        
        return "Unknown";
    }

    private String extractState(String addressLine) {
        if (addressLine == null || addressLine.trim().isEmpty()) {
            return "Unknown";
        }
        
        String addressLower = addressLine.toLowerCase();
        
        if (addressLower.contains("uttarakhand") || addressLower.contains("uk")) {
            return "Uttarakhand";
        } else if (addressLower.contains("uttar pradesh") || addressLower.contains("up")) {
            return "Uttar Pradesh";
        } else if (addressLower.contains("delhi")) {
            return "Delhi";
        } else if (addressLower.contains("haryana")) {
            return "Haryana";
        } else if (addressLower.contains("punjab")) {
            return "Punjab";
        } else if (addressLower.contains("rajasthan")) {
            return "Rajasthan";
        } else if (addressLower.contains("himachal pradesh") || addressLower.contains("hp")) {
            return "Himachal Pradesh";
        }
        
        return "Uttar Pradesh";
    }

    private OrderDTO convertToDTO(Order order) {
        User u = order.getUser();
        List<PrintJob> printJobs = order.getPrintJobs();
        
        UserDTO userDTO = u == null ? null : new UserDTO(
            u.getId(), u.getName(), u.getPhone(), u.getEmail(), 
            u.getRole() != null ? u.getRole().name() : null, 
            u.isBlocked(), u.isCanEdit(), u.getCreatedAt(), u.getUpdatedAt(), false);

        List<PrintJobDTO> printJobDTOs = null;
        if (printJobs != null) {
            printJobDTOs = printJobs.stream().map(pj -> {
                FileDTO fileDTO = new FileDTO(
                    pj.getFile().getId(), pj.getFile().getFilename(), 
                    pj.getFile().getOriginalFilename(), pj.getFile().getContentType(), 
                    pj.getFile().getSize(), pj.getFile().getUrl(), null, 
                    pj.getFile().getCreatedAt(), pj.getFile().getUpdatedAt(), 
                    pj.getFile().getPages());
                
                return new PrintJobDTO(
                    pj.getId(), fileDTO, null, 
                    pj.getStatus() != null ? pj.getStatus().name() : null, 
                    pj.getOptions(), pj.getCreatedAt(), pj.getUpdatedAt());
            }).collect(Collectors.toList());
        }

        OrderDTO orderDTO = new OrderDTO(
            order.getId(),
            userDTO,
            printJobDTOs,
            order.getStatus() != null ? order.getStatus().name() : null,
            order.getTotalAmount(),
            order.getCreatedAt(),
            order.getUpdatedAt(),
            order.getDeliveryType() != null ? order.getDeliveryType().name() : null,
            order.getDeliveryAddress(),
            order.getRazorpayOrderId(),
            order.getRazorpayPaymentId(),
            order.getOrderNote(),
            order.getSubtotal(),
            order.getDiscount(),
            order.getDiscountedSubtotal(),
            order.getGst(),
            order.getDelivery(),
            order.getGrandTotal(),
            order.getBreakdown()
        );
        
        // ✅ ADD: Map shipping fields
        orderDTO.setAwbNumber(order.getAwbNumber());
        orderDTO.setCourierName(order.getCourierName());
        orderDTO.setTrackingUrl(order.getTrackingUrl());
        orderDTO.setExpectedDeliveryDate(order.getExpectedDeliveryDate());
        orderDTO.setShipmentId(order.getShipmentId());
        orderDTO.setCourierId(order.getCourierId());
        orderDTO.setShippingCreated(order.getShippingCreated());
        
        // Set admin tracking information
        if (order.getPrintedByAdmin() != null) {
            orderDTO.setPrintedByAdminName(order.getPrintedByAdmin().getName());
        }
        if (order.getProcessedByAdmin() != null) {
            orderDTO.setProcessedByAdminName(order.getProcessedByAdmin().getName());
        }
        if (order.getCompletedByAdmin() != null) {
            orderDTO.setCompletedByAdminName(order.getCompletedByAdmin().getName());
        }
        orderDTO.setPrintedAt(order.getPrintedAt());
        orderDTO.setProcessedAt(order.getProcessedAt());
        orderDTO.setCompletedAt(order.getCompletedAt());
        
        return orderDTO;
    }

    @GetMapping("")
    public ResponseEntity<?> listOrders(
        Authentication authentication,
        @RequestParam(required = false) String status,
        @RequestParam(required = false, defaultValue = "0") int page,
        @RequestParam(required = false, defaultValue = "20") int limit
    ) {
        logger.info("[OrderController] listOrders called: page={}, limit={}, status={}", page, limit, status);
        long startTime = System.currentTimeMillis();
        try {
            User user = userService.findByPhone(authentication.getName()).orElseThrow();
            boolean isAdmin = authentication.getAuthorities().stream().map(GrantedAuthority::getAuthority).anyMatch(a -> a.equals("ROLE_ADMIN"));
            Pageable pageable = PageRequest.of(page, limit);
            Page<OrderListDTO> dtoPage;
            if (isAdmin && status == null) {
                logger.info("[OrderController] Admin order list fetch (lightweight DTO)");
                dtoPage = orderService.findAllListPaged(pageable);
            } else if (!isAdmin && status == null) {
                logger.info("[OrderController] User order list fetch (lightweight DTO)");
                dtoPage = orderService.findAllListByUserPaged(user, pageable);
            } else if (isAdmin) {
                dtoPage = orderService.findAllListByStatusPaged(status, pageable);
            } else {
                dtoPage = orderService.findAllListByUserAndStatusPaged(user, status, pageable);
            }
            logger.info("[OrderController] Order list fetched: {} orders, totalElements={}, totalPages={}, time={}ms", dtoPage.getNumberOfElements(), dtoPage.getTotalElements(), dtoPage.getTotalPages(), (System.currentTimeMillis() - startTime));
            return ResponseEntity.ok(java.util.Map.of(
                "content", dtoPage.getContent(),
                "totalElements", dtoPage.getTotalElements(),
                "totalPages", dtoPage.getTotalPages(),
                "page", dtoPage.getNumber(),
                "size", dtoPage.getSize()
            ));
        } catch (Exception e) {
            logger.error("[OrderController] Exception in listOrders: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(java.util.Collections.emptyList());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getOrder(@PathVariable Long id) {
        return orderService.findById(id)
            .<ResponseEntity<?>>map(order -> {
                if (order.getPrintJobs() != null && !order.getPrintJobs().isEmpty()) {
                    PricingService.PriceSummary summary = pricingService.calculatePriceSummaryForPrintJobs(order.getPrintJobs());
                    order.setBreakdown(summary.breakdown);
                }
                OrderDTO dto = convertToDTO(order);
                return ResponseEntity.ok(dto);
            })
            .orElseGet(() -> ResponseEntity.status(404).body(Map.of("error", "Order not found")));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateOrderStatus(@PathVariable Long id, @RequestParam String status, Authentication authentication) {
        try {
            Order order = orderService.findById(id).orElseThrow();
            User currentUser = userService.findByPhone(authentication.getName()).orElseThrow();
            Order.Status newStatus;
            try {
                newStatus = Order.Status.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid status value: " + status));
            }
            
            // Track admin actions
            LocalDateTime now = LocalDateTime.now();
            if (newStatus == Order.Status.PROCESSING) {
                order.setProcessedByAdmin(currentUser);
                order.setProcessedAt(now);
            } else if (newStatus == Order.Status.COMPLETED) {
                order.setCompletedByAdmin(currentUser);
                order.setCompletedAt(now);
            }
            
            // Use the service method which handles shipment creation properly
            orderService.updateOrderStatus(id, newStatus);
            Order updated = orderService.findById(id).orElse(order);
            OrderDTO dto = convertToDTO(updated);
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            logger.error("[OrderController] Error updating order status: ", e);
            return ResponseEntity.status(500).body(Map.of("error", "Failed to update order status: " + e.getMessage()));
        }
    }

    @PostMapping("/{id}/print")
    public ResponseEntity<?> markAsPrinted(@PathVariable Long id, Authentication authentication) {
        try {
            Order order = orderService.findById(id).orElseThrow();
            User currentUser = userService.findByPhone(authentication.getName()).orElseThrow();
            
            // Track admin who printed
            order.setPrintedByAdmin(currentUser);
            order.setPrintedAt(LocalDateTime.now());
            
            // If not already processing, set to processing
            if (order.getStatus() == Order.Status.PENDING) {
                order.setStatus(Order.Status.PROCESSING);
                order.setProcessedByAdmin(currentUser);
                order.setProcessedAt(LocalDateTime.now());
            }
            
            orderService.save(order, null);
            return ResponseEntity.ok(new MessageResponse("Order marked as printed successfully"));
        } catch (Exception e) {
            logger.error("[OrderController] Error marking order as printed: ", e);
            return ResponseEntity.status(500).body(Map.of("error", "Failed to mark order as printed: " + e.getMessage()));
        }
    }

    @PostMapping("/create-razorpay-order")
    public ResponseEntity<?> createRazorpayOrder(@RequestBody Map<String, Object> payload, Authentication authentication) {
        logger.info("[OrderController] createRazorpayOrder called with payload: {}", payload);
        try {
            int amount = (int) payload.getOrDefault("amount", 0);
            String currency = (String) payload.getOrDefault("currency", "INR");
            String receipt = (String) payload.getOrDefault("receipt", "receipt#1");
            Long userId = null;
            if (authentication != null) {
                User user = userService.findByPhone(authentication.getName()).orElse(null);
                if (user != null) userId = user.getId();
            }
            JSONObject order = orderService.createRazorpayOrder(amount, currency, receipt, userId);
            logger.info("[OrderController] Razorpay order created: {}", order);
            return ResponseEntity.ok(order.toMap());
        } catch (RazorpayException e) {
            logger.error("[OrderController] RazorpayException: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/validate")
    public ResponseEntity<?> validateOrder(@RequestBody Order order, Authentication authentication) {
        logger.info("[OrderController] validateOrder called with payload: {}", order);
        try {
            User user = userService.findByPhone(authentication.getName()).orElseThrow();
            order.setUser(user);
            if (order.getPrintJobs() == null || order.getPrintJobs().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("valid", false, "error", "No print jobs attached to order."));
            }
            for (var pj : order.getPrintJobs()) {
                if (pj.getFile() == null || pj.getFile().getId() == null) {
                    return ResponseEntity.badRequest().body(Map.of("valid", false, "error", "A print job is missing its file."));
                }
                var file = fileRepository.findById(pj.getFile().getId()).orElse(null);
                if (file == null) {
                    return ResponseEntity.badRequest().body(Map.of("valid", false, "error", "File not found for print job."));
                }
                pj.setFile(file);
                if (pj.getOptions() == null || pj.getOptions().isBlank()) {
                    return ResponseEntity.badRequest().body(Map.of("valid", false, "error", "A print job is missing its printing specifications."));
                }
            }
            double price = pricingService.calculatePrice(order);
            logger.info("[OrderController] Order validation result: valid={}, price={}", true, price);
            return ResponseEntity.ok(Map.of("valid", true, "price", price));
        } catch (Exception e) {
            logger.error("[OrderController] Error validating order: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("valid", false, "error", e.getMessage()));
        }
    }

    @GetMapping("/{id}/invoice")
    public ResponseEntity<OrderDTO> getInvoiceData(@PathVariable Long id, Authentication authentication) {
        try {
            Order order = orderService.findById(id).orElseThrow(() -> 
                new RuntimeException("Order not found with id: " + id));
            
            User currentUser = null;
            boolean isAdmin = false;
            if (authentication != null) {
                currentUser = userService.findByPhone(authentication.getName()).orElse(null);
                logger.info("[INVOICE] Current user: {} (id: {}), authorities: {}", 
                    currentUser != null ? currentUser.getEmail() : null, 
                    currentUser != null ? currentUser.getId() : null, 
                    authentication.getAuthorities());
                isAdmin = authentication.getAuthorities().stream()
                    .map(a -> a.getAuthority())
                    .anyMatch(a -> a.equals("ROLE_ADMIN"));
            }
            
            if (!isAdmin && (currentUser == null || order.getUser() == null || !order.getUser().getId().equals(currentUser.getId()))) {
                logger.warn("[INVOICE] Access denied for user: {} (id: {})", 
                    currentUser != null ? currentUser.getEmail() : null, 
                    currentUser != null ? currentUser.getId() : null);
                return ResponseEntity.status(403).body(null);
            }
            
            // Convert order to DTO and return as JSON
            OrderDTO orderDTO = convertToDTO(order);
            logger.info("[INVOICE] Returning invoice data for order: {}", id);
            
            return ResponseEntity.ok(orderDTO);
                
        } catch (Exception e) {
            logger.error("[INVOICE] Error getting invoice data for order {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(500).body(null);
        }
    }

    // OLD PDF GENERATION METHOD - REMOVED
    // Frontend now handles PDF generation
    /*
    private byte[] generateInvoicePdfHtml(Order order) {
        try {
            if (order == null) {
                throw new IllegalArgumentException("Order cannot be null");
            }
            
            logger.info("[PDF] Starting invoice generation for order: {}", order.getId());
            
            ClassPathResource resource;
            try {
                resource = new ClassPathResource("invoice-template.html");
                if (!resource.exists()) {
                    logger.error("[PDF] Invoice template file not found");
                    throw new RuntimeException("Invoice template file not found");
                }
                logger.info("[PDF] Template file found, size: {} bytes", resource.contentLength());
            } catch (Exception e) {
                logger.error("[PDF] Error loading invoice template: {}", e.getMessage(), e);
                throw new RuntimeException("Error loading invoice template", e);
            }
            
            byte[] templateBytes;
            try {
                templateBytes = resource.getInputStream().readAllBytes();
                logger.info("[PDF] Template loaded successfully, {} bytes", templateBytes.length);
            } catch (Exception e) {
                logger.error("[PDF] Error reading template file: {}", e.getMessage(), e);
                throw new RuntimeException("Error reading template file", e);
            }
            
            String html = new String(templateBytes, StandardCharsets.UTF_8);
            
            html = html.replace("${customerName}", order.getUser() != null && order.getUser().getName() != null ? 
                order.getUser().getName() : "-");
            html = html.replace("${customerEmail}", order.getUser() != null && order.getUser().getEmail() != null ? 
                order.getUser().getEmail() : "-");
            html = html.replace("${customerPhone}", order.getUser() != null && order.getUser().getPhone() != null ? 
                order.getUser().getPhone() : "-");
            html = html.replace("${customerAddress}", order.getDeliveryAddress() != null ? 
                order.getDeliveryAddress() : "-");
            html = html.replace("${orderId}", String.valueOf(order.getId()));
            html = html.replace("${orderDate}", order.getCreatedAt() != null ? 
                order.getCreatedAt().toLocalDate().toString() : "-");
            html = html.replace("${orderStatus}", order.getStatus() != null ? 
                order.getStatus().name() : "-");
            html = html.replace("${deliveryType}", order.getDeliveryType() != null ? 
                order.getDeliveryType().name() : "-");
            html = html.replace("${customerGSTIN}", order.getUser() != null && order.getUser().getGstin() != null ? 
                order.getUser().getGstin() : "-");

            StringBuilder orderItemsBlock = new StringBuilder();
            if (order.getPrintJobs() != null) {
                for (var pj : order.getPrintJobs()) {
                    try {
                        var file = pj.getFile();
                        if (file == null) continue;
                        
                        String fileName = file.getOriginalFilename() != null ? 
                            file.getOriginalFilename() : file.getFilename();
                        int pages = file.getPages() != null ? file.getPages() : 1;
                        
                        String printOptions = "";
                        if (pj.getOptions() != null) {
                            try {
                                ObjectMapper mapper = new ObjectMapper();
                                java.util.Map<String, Object> opts = mapper.convertValue(
                                    mapper.readTree(pj.getOptions()), new TypeReference<Map<String, Object>>() {});
                                printOptions = opts.entrySet().stream()
                                    .map(e -> "<b>" + escapeHtml(e.getKey().replace("_", " ")) + ":</b> " + 
                                        escapeHtml(String.valueOf(e.getValue())))
                                    .reduce((a, b) -> a + "<br>" + b).orElse("");
                            } catch (Exception e) {
                                logger.warn("[PDF] Error parsing print options: {}", e.getMessage());
                                printOptions = "Error parsing options";
                            }
                        }
                        
                        double price = pj.getPrice() != null ? pj.getPrice() : 0.0;
                        
                        orderItemsBlock.append("<tr>")
                            .append("<td style='padding:8px 6px;'>").append(escapeHtml(fileName)).append("</td>")
                            .append("<td style='padding:8px 6px;'>").append(printOptions).append("</td>")
                            .append("<td style='padding:8px 6px;'>").append(pages).append("</td>")
                            .append("<td style='padding:8px 6px;'>INR ").append(String.format("%.2f", price)).append("</td>")
                            .append("</tr>");
                    } catch (Exception e) {
                        logger.error("[PDF] Error processing print job: {}", e.getMessage(), e);
                    }
                }
            }
            html = html.replace("${orderItemsBlock}", orderItemsBlock.toString());

            String orderNoteBlock = "";
            if (order.getOrderNote() != null && !order.getOrderNote().isBlank()) {
                orderNoteBlock = "<div class='order-note-block'><b>Order Note:</b> " + 
                    escapeHtml(order.getOrderNote()) + "</div>";
            }
            html = html.replace("${orderNoteBlock}", orderNoteBlock);
            
            double subtotal = order.getSubtotal() != null ? order.getSubtotal() : 0.0;
            double discount = order.getDiscount() != null ? order.getDiscount() : 0.0;
            double gst = order.getGst() != null ? order.getGst() : 0.0;
            double delivery = order.getDelivery() != null ? order.getDelivery() : 0.0;
            double grandTotal = order.getGrandTotal() != null ? order.getGrandTotal() : 0.0;
            
            html = html.replace("${subtotal}", String.format("%.2f", subtotal));
            html = html.replace("${discount}", String.format("%.2f", discount));
            html = html.replace("${gst}", String.format("%.2f", gst));
            html = html.replace("${delivery}", String.format("%.2f", delivery));
            html = html.replace("${grandTotal}", String.format("%.2f", grandTotal));
            
            try {
                logger.info("[PDF] Starting PDF rendering...");
                ByteArrayOutputStream baos = new ByteArrayOutputStream();
                PdfRendererBuilder builder = new PdfRendererBuilder();
                builder.withHtmlContent(html, null);
                builder.toStream(baos);
                builder.run();
                byte[] pdfBytes = baos.toByteArray();
                logger.info("[PDF] PDF generated successfully, {} bytes", pdfBytes.length);
                return pdfBytes;
            } catch (Exception e) {
                logger.error("[PDF] Error rendering HTML to PDF: {}", e.getMessage(), e);
                logger.error("[PDF] HTML content length: {}", html.length());
                logger.error("[PDF] Order details - ID: {}, User: {}, PrintJobs: {}", 
                    order.getId(), 
                    order.getUser() != null ? order.getUser().getId() : "null",
                    order.getPrintJobs() != null ? order.getPrintJobs().size() : "null");
                throw new RuntimeException("Error rendering PDF: " + e.getMessage(), e);
            }
        } catch (Exception e) {
            logger.error("[PDF] Exception during HTML PDF generation: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to generate invoice PDF: " + e.getMessage(), e);
        }
    }
    */

    private String escapeHtml(String s) {
        return s == null ? "" : s.replace("&", "&amp;")
                                 .replace("<", "&lt;")
                                 .replace(">", "&gt;")
                                 .replace("\"", "&quot;")
                                 .replace("'", "&#39;");
    }
}