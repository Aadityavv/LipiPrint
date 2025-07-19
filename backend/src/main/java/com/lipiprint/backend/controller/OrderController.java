package com.lipiprint.backend.controller;
import java.io.IOException;
import java.util.Optional;
import com.lipiprint.backend.dto.OrderDTO;
import com.lipiprint.backend.entity.Order;
import com.lipiprint.backend.entity.User;
import com.lipiprint.backend.service.OrderService;
import com.lipiprint.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.stream.Collectors;
import org.json.JSONObject;
import com.razorpay.RazorpayException;
import java.util.Map;
import com.lipiprint.backend.dto.UserDTO;
import com.lipiprint.backend.dto.FileDTO;
import com.lipiprint.backend.dto.PrintJobDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.lipiprint.backend.entity.PrintJob;
import com.lipiprint.backend.entity.File;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.core.io.ByteArrayResource;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import java.io.ByteArrayOutputStream;
import org.springframework.security.core.GrantedAuthority;
import com.lipiprint.backend.service.PrintJobService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lipiprint.backend.service.PricingService;
import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import java.nio.file.Files;
import java.nio.file.Paths;
import com.lipiprint.backend.repository.FileRepository;
import jakarta.validation.Valid;
import com.lipiprint.backend.dto.MessageResponse;
import com.fasterxml.jackson.core.type.TypeReference;

@RestController
@RequestMapping("/api/orders")
public class OrderController {
    private static final Logger logger = LoggerFactory.getLogger(OrderController.class);
    @Autowired
    private OrderService orderService;
    @Autowired
    private UserService userService;
    @Autowired
    private PrintJobService printJobService;
    @Autowired
    private PricingService pricingService;
    @Autowired
    private FileRepository fileRepository;

    @PostMapping("")
    public ResponseEntity<?> createOrder(@Valid @RequestBody OrderDTO orderDTO, Authentication authentication) {
        logger.info("[OrderController] createOrder called with payload: {}", orderDTO);
        try {
            // Validate user
            User user = userService.findByPhone(authentication.getName()).orElseThrow();
            if (orderDTO.getPrintJobs() == null || orderDTO.getPrintJobs().isEmpty()) {
                return ResponseEntity.badRequest().body(new MessageResponse("At least one print job is required."));
            }
            if (orderDTO.getDeliveryType() == null || orderDTO.getDeliveryType().isBlank()) {
                return ResponseEntity.badRequest().body(new MessageResponse("Delivery type is required."));
            }
            if (orderDTO.getDeliveryAddress() == null || orderDTO.getDeliveryAddress().isBlank()) {
                return ResponseEntity.badRequest().body(new MessageResponse("Delivery address is required."));
            }
            // Map DTO to entity
            Order order = new Order();
            order.setUser(user);
            order.setDeliveryType(orderDTO.getDeliveryType());
            order.setDeliveryAddress(orderDTO.getDeliveryAddress());
            order.setStatus(Order.Status.PENDING);
            order.setTotalAmount(orderDTO.getTotalAmount());
            // Map print jobs
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
                    printJobs.add(pj);
                }
                order.setPrintJobs(printJobs);
            }
            // Save order and link payment if razorpayOrderId is present
            String razorpayOrderId = orderDTO.getRazorpayOrderId();
            Order saved = orderService.save(order, razorpayOrderId);
            saved = orderService.findById(saved.getId()).orElse(saved);
            // Map to DTO for response
            User u = saved.getUser();
            var printJobs = saved.getPrintJobs();
            var fileDTOs = printJobs != null ? printJobs.stream().map(pj -> new FileDTO(pj.getFile().getId(), pj.getFile().getFilename(), pj.getFile().getOriginalFilename(), pj.getFile().getContentType(), pj.getFile().getSize(), pj.getFile().getUrl(), null, pj.getFile().getCreatedAt(), pj.getFile().getUpdatedAt(), pj.getFile().getPages())).toList() : null;
            var printJobDTOs = printJobs != null ? printJobs.stream().map(pj -> new PrintJobDTO(pj.getId(), new FileDTO(pj.getFile().getId(), pj.getFile().getFilename(), pj.getFile().getOriginalFilename(), pj.getFile().getContentType(), pj.getFile().getSize(), pj.getFile().getUrl(), null, pj.getFile().getCreatedAt(), pj.getFile().getUpdatedAt(), pj.getFile().getPages()), null, pj.getStatus() != null ? pj.getStatus().name() : null, pj.getOptions(), pj.getCreatedAt(), pj.getUpdatedAt())).toList() : null;
            UserDTO userDTO = u == null ? null : new UserDTO(u.getId(), u.getName(), u.getPhone(), u.getEmail(), u.getRole() != null ? u.getRole().name() : null, u.isBlocked(), u.getCreatedAt(), u.getUpdatedAt());
            OrderDTO dto = new OrderDTO(
                saved.getId(),
                userDTO,
                printJobDTOs,
                saved.getStatus() != null ? saved.getStatus().name() : null,
                saved.getTotalAmount(),
                saved.getCreatedAt(),
                saved.getUpdatedAt(),
                saved.getDeliveryType(),
                saved.getDeliveryAddress(),
                saved.getRazorpayOrderId(),
                parseBindingGroups(saved.getBindingGroups()),
                saved.getOrderNote()
            );
            logger.info("[OrderController] Created order DTO: {}", dto);
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            logger.error("[OrderController] Error creating order: ", e);
            return ResponseEntity.status(500).body(new MessageResponse("Failed to create order: " + e.getMessage()));
        }
    }

    @GetMapping("")
    public ResponseEntity<List<OrderDTO>> listOrders(
        Authentication authentication,
        @RequestParam(required = false) String status,
        @RequestParam(required = false) Integer limit
    ) {
        try {
            User user = userService.findByPhone(authentication.getName()).orElseThrow();
            boolean isAdmin = authentication.getAuthorities().stream().map(GrantedAuthority::getAuthority).anyMatch(a -> a.equals("ROLE_ADMIN"));
            List<Order> orderList;
            if (isAdmin) {
                if (status != null) {
                    orderList = orderService.findAllByStatus(status);
                } else {
                    orderList = orderService.findAll();
                }
            } else {
                orderList = orderService.findAll().stream()
                    .filter(o -> o.getUser() != null && o.getUser().getId().equals(user.getId()))
                    .toList();
            }
            // Sort by createdAt descending
            orderList = orderList.stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .toList();
            // Apply limit if present
            if (limit != null && limit > 0 && limit < orderList.size()) {
                orderList = orderList.subList(0, limit);
            }
            logger.info("[OrderController] listOrders: found {} orders", orderList.size());
            List<OrderDTO> orders = orderList.stream()
                .map(saved -> {
                    try {
                        User u = saved.getUser();
                        List<PrintJob> printJobs = saved.getPrintJobs();
                        // Always fetch the full PrintJob entity with file if present
                        if (printJobs != null) {
                            printJobs = printJobs.stream().map(pj -> printJobService.findByIdWithFile(pj.getId()).orElse(null)).collect(Collectors.toList());
                        }
                        List<File> files = printJobs != null ? printJobs.stream().map(PrintJob::getFile).collect(Collectors.toList()) : null;
                        UserDTO userDTO = u == null ? null : new UserDTO(u.getId(), u.getName(), u.getPhone(), u.getEmail(), u.getRole() != null ? u.getRole().name() : null, u.isBlocked(), u.getCreatedAt(), u.getUpdatedAt());
                        List<FileDTO> fileDTOs = files != null ? files.stream().map(f -> new FileDTO(f.getId(), f.getFilename(), f.getOriginalFilename(), f.getContentType(), f.getSize(), f.getUrl(), null, f.getCreatedAt(), f.getUpdatedAt(), f.getPages())).collect(Collectors.toList()) : null;
                        List<PrintJobDTO> printJobDTOs = printJobs != null ? printJobs.stream().map(pj -> {
                            User pjUser = pj.getUser();
                            UserDTO pjUserDTO = pjUser == null ? null : new UserDTO(pjUser.getId(), pjUser.getName(), pjUser.getPhone(), pjUser.getEmail(), pjUser.getRole() != null ? pjUser.getRole().name() : null, pjUser.isBlocked(), pjUser.getCreatedAt(), pjUser.getUpdatedAt());
                            return new PrintJobDTO(
                                pj.getId(),
                                new FileDTO(pj.getFile().getId(), pj.getFile().getFilename(), pj.getFile().getOriginalFilename(), pj.getFile().getContentType(), pj.getFile().getSize(), pj.getFile().getUrl(), null, pj.getFile().getCreatedAt(), pj.getFile().getUpdatedAt(), pj.getFile().getPages()),
                                pjUserDTO,
                                pj.getStatus() != null ? pj.getStatus().name() : null,
                                pj.getOptions(),
                                pj.getCreatedAt(),
                                pj.getUpdatedAt()
                            );
                        }).collect(Collectors.toList()) : null;
                        return new OrderDTO(
                            saved.getId(),
                            userDTO,
                            printJobDTOs,
                            saved.getStatus() != null ? saved.getStatus().name() : null,
                            saved.getTotalAmount(),
                            saved.getCreatedAt(),
                            saved.getUpdatedAt(),
                            saved.getDeliveryType(),
                            saved.getDeliveryAddress(),
                            saved.getRazorpayOrderId(),
                            parseBindingGroups(saved.getBindingGroups()),
                            saved.getOrderNote()
                        );
                    } catch (Exception e) {
                        logger.error("[OrderController] Error mapping order to DTO (order id: {}): {}", saved.getId(), e.getMessage(), e);
                        return null;
                    }
                })
                .filter(java.util.Objects::nonNull)
                .toList();
            logger.info("[OrderController] listOrders: returning {} OrderDTOs", orders.size());
            return ResponseEntity.ok(orders);
        } catch (Exception e) {
            logger.error("[OrderController] Exception in listOrders: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(java.util.Collections.emptyList());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getOrder(@PathVariable Long id) {
        return orderService.findById(id)
            .<ResponseEntity<?>>map(order -> {
                User u = order.getUser();
                List<PrintJob> printJobs = order.getPrintJobs();
                // Always fetch the full PrintJob entity with file if present
                if (printJobs != null) {
                    printJobs = printJobs.stream().map(pj -> printJobService.findByIdWithFile(pj.getId()).orElse(null)).collect(Collectors.toList());
                }
                List<File> files = printJobs != null ? printJobs.stream().map(PrintJob::getFile).collect(Collectors.toList()) : null;
                UserDTO userDTO = u == null ? null : new UserDTO(u.getId(), u.getName(), u.getPhone(), u.getEmail(), u.getRole() != null ? u.getRole().name() : null, u.isBlocked(), u.getCreatedAt(), u.getUpdatedAt());
                List<FileDTO> fileDTOs = files != null ? files.stream().map(f -> new FileDTO(f.getId(), f.getFilename(), f.getOriginalFilename(), f.getContentType(), f.getSize(), f.getUrl(), null, f.getCreatedAt(), f.getUpdatedAt(), f.getPages())).collect(Collectors.toList()) : null;
                List<PrintJobDTO> printJobDTOs = printJobs != null ? printJobs.stream().map(pj -> {
                    User pjUser = pj.getUser();
                    UserDTO pjUserDTO = pjUser == null ? null : new UserDTO(pjUser.getId(), pjUser.getName(), pjUser.getPhone(), pjUser.getEmail(), pjUser.getRole() != null ? pjUser.getRole().name() : null, pjUser.isBlocked(), pjUser.getCreatedAt(), pjUser.getUpdatedAt());
                    return new PrintJobDTO(pj.getId(), new FileDTO(pj.getFile().getId(), pj.getFile().getFilename(), pj.getFile().getOriginalFilename(), pj.getFile().getContentType(), pj.getFile().getSize(), pj.getFile().getUrl(), null, pj.getFile().getCreatedAt(), pj.getFile().getUpdatedAt(), pj.getFile().getPages()), pjUserDTO, pj.getStatus() != null ? pj.getStatus().name() : null, pj.getOptions(), pj.getCreatedAt(), pj.getUpdatedAt());
                }).collect(Collectors.toList()) : null;
                OrderDTO dto = new OrderDTO(
                    order.getId(),
                    userDTO,
                    printJobDTOs,
                    order.getStatus() != null ? order.getStatus().name() : null,
                    order.getTotalAmount(),
                    order.getCreatedAt(),
                    order.getUpdatedAt(),
                    order.getDeliveryType(),
                    order.getDeliveryAddress(),
                    order.getRazorpayOrderId(),
                    parseBindingGroups(order.getBindingGroups()),
                    order.getOrderNote()
                );
                return ResponseEntity.ok(dto);
            })
            .orElseGet(() -> ResponseEntity.status(404).body(Map.of("error", "Order not found")));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateOrderStatus(@PathVariable Long id, @RequestParam String status) {
        try {
            Order order = orderService.findById(id).orElseThrow();
            Order.Status newStatus;
            try {
                newStatus = Order.Status.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid status value: " + status));
            }
            order.setStatus(newStatus);
            Order updated = orderService.save(order, null);
            // Return updated order DTO
            User u = updated.getUser();
            List<PrintJob> printJobs = updated.getPrintJobs();
            // Always fetch the full PrintJob entity with file if present
            if (printJobs != null) {
                printJobs = printJobs.stream().map(pj -> printJobService.findByIdWithFile(pj.getId()).orElse(null)).collect(Collectors.toList());
            }
            List<File> files = printJobs != null ? printJobs.stream().map(PrintJob::getFile).collect(Collectors.toList()) : null;
            UserDTO userDTO = u == null ? null : new UserDTO(u.getId(), u.getName(), u.getPhone(), u.getEmail(), u.getRole() != null ? u.getRole().name() : null, u.isBlocked(), u.getCreatedAt(), u.getUpdatedAt());
            List<FileDTO> fileDTOs = files != null ? files.stream().map(f -> new FileDTO(f.getId(), f.getFilename(), f.getOriginalFilename(), f.getContentType(), f.getSize(), f.getUrl(), null, f.getCreatedAt(), f.getUpdatedAt(), f.getPages())).collect(Collectors.toList()) : null;
            List<PrintJobDTO> printJobDTOs = printJobs != null ? printJobs.stream().map(pj -> {
                User pjUser = pj.getUser();
                UserDTO pjUserDTO = pjUser == null ? null : new UserDTO(pjUser.getId(), pjUser.getName(), pjUser.getPhone(), pjUser.getEmail(), pjUser.getRole() != null ? pjUser.getRole().name() : null, pjUser.isBlocked(), pjUser.getCreatedAt(), pjUser.getUpdatedAt());
                return new PrintJobDTO(pj.getId(), new FileDTO(pj.getFile().getId(), pj.getFile().getFilename(), pj.getFile().getOriginalFilename(), pj.getFile().getContentType(), pj.getFile().getSize(), pj.getFile().getUrl(), null, pj.getFile().getCreatedAt(), pj.getFile().getUpdatedAt(), pj.getFile().getPages()), pjUserDTO, pj.getStatus() != null ? pj.getStatus().name() : null, pj.getOptions(), pj.getCreatedAt(), pj.getUpdatedAt());
            }).collect(Collectors.toList()) : null;
            OrderDTO dto = new OrderDTO(
                updated.getId(),
                userDTO,
                printJobDTOs,
                updated.getStatus() != null ? updated.getStatus().name() : null,
                updated.getTotalAmount(),
                updated.getCreatedAt(),
                updated.getUpdatedAt(),
                updated.getDeliveryType(),
                updated.getDeliveryAddress(),
                updated.getRazorpayOrderId(),
                parseBindingGroups(updated.getBindingGroups()),
                updated.getOrderNote()
            );
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            logger.error("[OrderController] Error updating order status: ", e);
            return ResponseEntity.status(500).body(Map.of("error", "Failed to update order status: " + e.getMessage()));
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
            // Basic validation: must have at least one print job and file
            if (order.getPrintJobs() == null || order.getPrintJobs().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("valid", false, "error", "No print jobs attached to order."));
            }
            for (var pj : order.getPrintJobs()) {
                if (pj.getFile() == null || pj.getFile().getId() == null) {
                    return ResponseEntity.badRequest().body(Map.of("valid", false, "error", "A print job is missing its file."));
                }
                // Fetch and set the full File entity (with pages)
                var file = fileRepository.findById(pj.getFile().getId()).orElse(null);
                if (file == null) {
                    return ResponseEntity.badRequest().body(Map.of("valid", false, "error", "File not found for print job."));
                }
                pj.setFile(file);
                if (pj.getOptions() == null || pj.getOptions().isBlank()) {
                    return ResponseEntity.badRequest().body(Map.of("valid", false, "error", "A print job is missing its printing specifications."));
                }
            }
            // Calculate price (implement your pricing logic here)
            double price = pricingService.calculatePrice(order);
            logger.info("[OrderController] Order validation result: valid={}, price={}", true, price);
            return ResponseEntity.ok(Map.of("valid", true, "price", price));
        } catch (Exception e) {
            logger.error("[OrderController] Error validating order: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("valid", false, "error", e.getMessage()));
        }
    }

    @GetMapping("/{id}/invoice")
    public ResponseEntity<ByteArrayResource> downloadInvoice(@PathVariable Long id, Authentication authentication) {
        // Allow both admin and the user who placed the order to access the invoice
        Order order = orderService.findById(id).orElseThrow();
        User currentUser = null;
        boolean isAdmin = false;
        if (authentication != null) {
            currentUser = userService.findByPhone(authentication.getName()).orElse(null);
            logger.info("[INVOICE] Current user: {} (id: {}), authorities: {}", currentUser != null ? currentUser.getEmail() : null, currentUser != null ? currentUser.getId() : null, authentication.getAuthorities());
            isAdmin = authentication.getAuthorities().stream().map(a -> a.getAuthority()).anyMatch(a -> a.equals("ROLE_ADMIN"));
        }
        if (!isAdmin && (currentUser == null || order.getUser() == null || !order.getUser().getId().equals(currentUser.getId()))) {
            logger.warn("[INVOICE] Access denied for user: {} (id: {})", currentUser != null ? currentUser.getEmail() : null, currentUser != null ? currentUser.getId() : null);
            return ResponseEntity.status(403).body(null);
        }
        byte[] pdfBytes = generateInvoicePdfHtml(order);
        ByteArrayResource resource = new ByteArrayResource(pdfBytes);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=invoice-" + order.getId() + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .contentLength(pdfBytes.length)
                .body(resource);
    }

    // New HTML-to-PDF method
    private byte[] generateInvoicePdfHtml(Order order) {
        try {
            String templatePath = "src/main/resources/invoice-template.html";
            String html = new String(Files.readAllBytes(Paths.get(templatePath)));
            // Replace placeholders with order data
            html = html.replace("${customerName}", order.getUser() != null ? order.getUser().getName() : "-");
            html = html.replace("${customerEmail}", order.getUser() != null ? order.getUser().getEmail() : "-");
            html = html.replace("${customerPhone}", order.getUser() != null ? order.getUser().getPhone() : "-");
            html = html.replace("${customerAddress}", order.getDeliveryAddress() != null ? order.getDeliveryAddress() : "-");
            html = html.replace("${orderId}", String.valueOf(order.getId()));
            html = html.replace("${orderDate}", order.getCreatedAt() != null ? order.getCreatedAt().toLocalDate().toString() : "-");
            html = html.replace("${orderStatus}", order.getStatus() != null ? order.getStatus().name() : "-");
            html = html.replace("${deliveryType}", order.getDeliveryType() != null ? order.getDeliveryType() : "-");

            // Group print jobs by bindingGroups if present, else by print options
            java.util.List<com.lipiprint.backend.entity.PrintJob> printJobs = order.getPrintJobs();
            java.util.List<java.util.List<Long>> bindingGroups = null;
            if (order.getBindingGroups() != null && !order.getBindingGroups().isBlank()) {
                try {
                    com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                    bindingGroups = mapper.readValue(order.getBindingGroups(), java.util.List.class);
                } catch (Exception e) { bindingGroups = null; }
            }
            java.util.List<GroupBlock> groups = new java.util.ArrayList<>();
            if (bindingGroups != null && !bindingGroups.isEmpty()) {
                for (int i = 0; i < bindingGroups.size(); i++) {
                    java.util.List<Long> groupFileIds = bindingGroups.get(i);
                    java.util.List<com.lipiprint.backend.entity.PrintJob> groupJobs = printJobs.stream().filter(pj -> pj.getFile() != null && groupFileIds.contains(pj.getFile().getId())).toList();
                    groups.add(new GroupBlock("Binding Group " + (i+1), groupJobs));
                }
            } else {
                // Fallback: group by print options
                java.util.Map<String, java.util.List<com.lipiprint.backend.entity.PrintJob>> seen = new java.util.LinkedHashMap<>();
                for (var pj : printJobs) {
                    String optionsKey = pj.getOptions() != null ? pj.getOptions() : "-";
                    seen.computeIfAbsent(optionsKey, k -> new java.util.ArrayList<>()).add(pj);
                }
                int idx = 1;
                for (var entry : seen.entrySet()) {
                    groups.add(new GroupBlock("Print Group " + (idx++), entry.getValue()));
                }
            }
            // Build HTML for printJobGroupsBlock
            StringBuilder printJobGroupsBlock = new StringBuilder();
            for (GroupBlock group : groups) {
                printJobGroupsBlock.append("<div class='group-block'>");
                printJobGroupsBlock.append("<div class='group-title'>").append(escapeHtml(group.label)).append("</div>");
                // Print options
                printJobGroupsBlock.append("<div class='options-list'>");
                java.util.Map<String, Object> specs = null;
                try {
                    if (!group.jobs.isEmpty() && group.jobs.get(0).getOptions() != null) {
                        com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                        specs = mapper.readValue(group.jobs.get(0).getOptions(), java.util.Map.class);
                    }
                } catch (Exception e) { specs = null; }
                if (specs != null) {
                    for (var entry : specs.entrySet()) {
                        String key = entry.getKey().replace("_", " ");
                        String value = String.valueOf(entry.getValue());
                        printJobGroupsBlock.append("<span><b>")
                            .append(escapeHtml(Character.toUpperCase(key.charAt(0)) + key.substring(1)))
                            .append(":</b> ")
                            .append(escapeHtml(value))
                            .append("</span>");
                    }
                }
                printJobGroupsBlock.append("</div>");
                // Files in group
                printJobGroupsBlock.append("<div class='files-list'>");
                for (var pj : group.jobs) {
                    var file = pj.getFile();
                    printJobGroupsBlock.append("<div class='file-row'>");
                    printJobGroupsBlock.append("<span class='file-name'>").append(escapeHtml(file != null ? file.getOriginalFilename() : "-")).append("</span> ");
                    printJobGroupsBlock.append("<span class='file-meta'>Pages: ").append(file != null && file.getPages() != null ? file.getPages() : "-").append("</span> ");
                    printJobGroupsBlock.append("<span class='file-meta'>Uploaded: ").append(file != null && file.getCreatedAt() != null ? file.getCreatedAt().toLocalDate().toString() : "-").append("</span>");
                    printJobGroupsBlock.append("</div>");
                }
                printJobGroupsBlock.append("</div>");
                printJobGroupsBlock.append("</div>");
            }
            html = html.replace("${printJobGroupsBlock}", printJobGroupsBlock.toString());
            // Order note
            String orderNoteBlock = "";
            if (order.getOrderNote() != null && !order.getOrderNote().isBlank()) {
                orderNoteBlock = "<div class='order-note-block'><b>Order Note:</b> " + escapeHtml(order.getOrderNote()) + "</div>";
            }
            html = html.replace("${orderNoteBlock}", orderNoteBlock);
            // Pricing (use order.getTotalAmount() if available)
            double gstRate = 0.18;
            double delivery = (order.getDeliveryType() != null && order.getDeliveryType().equalsIgnoreCase("PICKUP")) ? 0.0 : 50.0;
            double grandTotal = order.getTotalAmount() != null ? order.getTotalAmount() : 0.0;
            double subtotal = grandTotal / (1 + gstRate);
            double gst = grandTotal - subtotal;
            html = html.replace("${subtotal}", String.format("%.2f", subtotal));
            html = html.replace("${gst}", String.format("%.2f", gst));
            html = html.replace("${delivery}", String.format("%.2f", delivery));
            html = html.replace("${grandTotal}", String.format("%.2f", grandTotal));
            // Render HTML to PDF
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            PdfRendererBuilder builder = new PdfRendererBuilder();
            builder.withHtmlContent(html, null);
            builder.toStream(baos);
            builder.run();
            return baos.toByteArray();
        } catch (Exception e) {
            logger.error("[PDF] Exception during HTML PDF generation", e);
            throw new RuntimeException("Failed to generate invoice PDF (HTML)", e);
        }
    }

    // Helper class for grouping
    private static class GroupBlock {
        String label;
        java.util.List<com.lipiprint.backend.entity.PrintJob> jobs;
        GroupBlock(String label, java.util.List<com.lipiprint.backend.entity.PrintJob> jobs) {
            this.label = label;
            this.jobs = jobs;
        }
    }

    // Utility to escape HTML special characters
    private String escapeHtml(String s) {
        return s == null ? "" : s.replace("&", "&amp;")
                                 .replace("<", "&lt;")
                                 .replace(">", "&gt;")
                                 .replace("\"", "&quot;")
                                 .replace("'", "&#39;");
}

private void drawText(PDPageContentStream content, float x, float y, String text) throws IOException {
    content.beginText();
    content.setFont(PDType1Font.HELVETICA, 12);
    content.setNonStrokingColor(0, 0, 0);
    content.newLineAtOffset(x, y);
    content.showText(text);
    content.endText();
}

// Helper to parse bindingGroups JSON string to List<List<Long>>
private List<List<Long>> parseBindingGroups(String json) {
    if (json == null || json.isBlank()) return null;
    try {
        ObjectMapper mapper = new ObjectMapper();
        return mapper.readValue(json, new TypeReference<List<List<Long>>>() {});
    } catch (Exception e) { return null; }
}

} 