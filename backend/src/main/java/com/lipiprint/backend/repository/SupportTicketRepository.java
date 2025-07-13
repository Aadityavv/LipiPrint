package com.lipiprint.backend.repository;

import com.lipiprint.backend.entity.SupportTicket;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SupportTicketRepository extends JpaRepository<SupportTicket, Long> {
} 