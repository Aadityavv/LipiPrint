package com.lipiprint.backend.repository;

import com.lipiprint.backend.entity.File;
import com.lipiprint.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FileRepository extends JpaRepository<File, Long> {
    List<File> findByUploadedBy(User user);
    List<File> findByDeletedFalse();
} 