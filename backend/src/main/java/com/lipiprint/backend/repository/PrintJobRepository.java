package com.lipiprint.backend.repository;

import com.lipiprint.backend.entity.PrintJob;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PrintJobRepository extends JpaRepository<PrintJob, Long> {
    List<PrintJob> findByUserId(Long userId);
    List<PrintJob> findByOrderId(Long orderId);
} 