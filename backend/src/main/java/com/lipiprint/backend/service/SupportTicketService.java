package com.lipiprint.backend.service;

import com.lipiprint.backend.entity.SupportTicket;
import com.lipiprint.backend.repository.SupportTicketRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class SupportTicketService {
    @Autowired
    private SupportTicketRepository ticketRepository;

    public SupportTicket save(SupportTicket ticket) {
        return ticketRepository.save(ticket);
    }

    public Optional<SupportTicket> findById(Long id) {
        return ticketRepository.findById(id);
    }

    public List<SupportTicket> findAll() {
        return ticketRepository.findAll();
    }
} 