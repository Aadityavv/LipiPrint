package com.lipiprint.backend.repository;

import com.lipiprint.backend.entity.ServiceCombination;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface ServiceCombinationRepository extends JpaRepository<ServiceCombination, Long> {
    Optional<ServiceCombination> findByColorAndPaperSizeAndPaperQualityAndPrintOption(String color, String paperSize, String paperQuality, String printOption);
} 