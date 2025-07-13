package com.lipiprint.backend.repository;

import com.lipiprint.backend.entity.DiscountRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DiscountRuleRepository extends JpaRepository<DiscountRule, Long> {
    List<DiscountRule> findByColorAndPaperSizeAndPaperQualityAndPrintOptionAndMinPagesLessThanEqualOrderByMinPagesDesc(
        String color, String paperSize, String paperQuality, String printOption, Integer numPages);
} 