package com.spendwise.backend.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "monthly_budgets")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MonthlyBudget {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String monthKey;
    private Double totalBudget;
    private Double food;
    private Double transport;
    private Double shopping;
    private Double bills;
    private Double entertainment;
    private Double other;
    private Long userId; // Must be the last field
}
