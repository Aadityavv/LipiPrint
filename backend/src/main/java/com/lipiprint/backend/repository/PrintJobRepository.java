package com.lipiprint.backend.repository;

import com.lipiprint.backend.entity.PrintJob;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PrintJobRepository extends JpaRepository<PrintJob, Long> {
    List<PrintJob> findByUserId(Long userId);
    List<PrintJob> findByOrderId(Long orderId);
    List<PrintJob> findByFileId(Long fileId);
    @Query("SELECT pj FROM PrintJob pj JOIN FETCH pj.file WHERE pj.id = :id")
    PrintJob findByIdWithFile(@Param("id") Long id);
} 