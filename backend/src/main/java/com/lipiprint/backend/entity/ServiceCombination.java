package com.lipiprint.backend.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "service_combinations")
public class ServiceCombination {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String color;
    private String paperSize;
    private String paperQuality;
    private String printOption;
    private BigDecimal costPerPage;

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
    public String getPaperSize() { return paperSize; }
    public void setPaperSize(String paperSize) { this.paperSize = paperSize; }
    public String getPaperQuality() { return paperQuality; }
    public void setPaperQuality(String paperQuality) { this.paperQuality = paperQuality; }
    public String getPrintOption() { return printOption; }
    public void setPrintOption(String printOption) { this.printOption = printOption; }
    public BigDecimal getCostPerPage() { return costPerPage; }
    public void setCostPerPage(BigDecimal costPerPage) { this.costPerPage = costPerPage; }
} 