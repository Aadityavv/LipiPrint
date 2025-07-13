package com.lipiprint.backend.controller;

import com.lipiprint.backend.dto.HelpCenterArticleDTO;
import com.lipiprint.backend.dto.SupportTicketDTO;
import com.lipiprint.backend.entity.HelpCenterArticle;
import com.lipiprint.backend.entity.SupportTicket;
import com.lipiprint.backend.entity.User;
import com.lipiprint.backend.service.HelpCenterService;
import com.lipiprint.backend.service.SupportTicketService;
import com.lipiprint.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/helpcenter")
public class HelpCenterController {
    @Autowired
    private HelpCenterService helpCenterService;
    @Autowired
    private SupportTicketService supportTicketService;
    @Autowired
    private UserService userService;

    @GetMapping("/articles")
    public ResponseEntity<List<HelpCenterArticleDTO>> listArticles() {
        List<HelpCenterArticleDTO> articles = helpCenterService.findAll().stream()
                .map(a -> new HelpCenterArticleDTO(a.getId(), a.getTitle(), a.getContent(), a.getCreatedAt(), a.getUpdatedAt()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(articles);
    }

    @GetMapping("/tickets")
    public ResponseEntity<List<SupportTicketDTO>> listTickets(Authentication authentication) {
        User user = userService.findByPhone(authentication.getName()).orElseThrow();
        List<SupportTicketDTO> tickets = supportTicketService.findAll().stream()
                .filter(t -> t.getUser().getId().equals(user.getId()))
                .map(t -> new SupportTicketDTO(t.getId(), null, t.getSubject(), t.getDescription(), t.getStatus().name(), t.getCreatedAt(), t.getUpdatedAt()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(tickets);
    }

    @PostMapping("/tickets")
    public ResponseEntity<SupportTicketDTO> createTicket(@RequestBody SupportTicket ticket, Authentication authentication) {
        User user = userService.findByPhone(authentication.getName()).orElseThrow();
        ticket.setUser(user);
        SupportTicket saved = supportTicketService.save(ticket);
        SupportTicketDTO dto = new SupportTicketDTO(saved.getId(), null, saved.getSubject(), saved.getDescription(), saved.getStatus().name(), saved.getCreatedAt(), saved.getUpdatedAt());
        return ResponseEntity.ok(dto);
    }
} 