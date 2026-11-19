package com.spendwise.backend.repository;

import com.spendwise.backend.model.MonthlyBudget;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface BudgetRepository extends JpaRepository<MonthlyBudget, Long> {
    List<MonthlyBudget> findByUserId(Long userId);
    Optional<MonthlyBudget> findByUserIdAndMonthKey(Long userId, String monthKey);
}
