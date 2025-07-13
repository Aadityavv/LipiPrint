package com.lipiprint.backend.repository;

import com.lipiprint.backend.entity.BindingOption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface BindingOptionRepository extends JpaRepository<BindingOption, Long> {
    Optional<BindingOption> findByType(String type);
} 