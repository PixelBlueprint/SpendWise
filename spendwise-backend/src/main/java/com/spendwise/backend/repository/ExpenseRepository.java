package com.spendwise.backend.repository;

import com.spendwise.backend.model.ExpenseEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ExpenseRepository extends JpaRepository<ExpenseEntry, Long> {
    List<ExpenseEntry> findByUserIdOrderByDateDesc(Long userId);
    void deleteByUserIdAndDate(Long userId, String date);
}
