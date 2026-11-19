package com.spendwise.backend.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "expense_entries")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExpenseEntry {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String date;
    private String category;
    private Double amount;
    private Long userId; // Must be the last field
}