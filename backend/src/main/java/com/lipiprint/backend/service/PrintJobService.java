package com.lipiprint.backend.service;

import com.lipiprint.backend.entity.PrintJob;
import com.lipiprint.backend.repository.PrintJobRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class PrintJobService {
    @Autowired
    private PrintJobRepository printJobRepository;

    public PrintJob save(PrintJob printJob) {
        return printJobRepository.save(printJob);
    }

    public Optional<PrintJob> findById(Long id) {
        return printJobRepository.findById(id);
    }

    public Optional<PrintJob> findByIdWithFile(Long id) {
        return Optional.ofNullable(printJobRepository.findByIdWithFile(id));
    }

    public List<PrintJob> findAll() {
        return printJobRepository.findAll();
    }

    public List<PrintJob> findByOrderId(Long orderId) {
        return printJobRepository.findByOrderId(orderId);
    }

    public List<PrintJob> findByFileId(Long fileId) {
        return printJobRepository.findByFileId(fileId);
    }
} 