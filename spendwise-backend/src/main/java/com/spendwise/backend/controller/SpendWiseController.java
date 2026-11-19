package com.spendwise.backend.controller;

import com.spendwise.backend.model.ExpenseEntry;
import com.spendwise.backend.model.MonthlyBudget;
import com.spendwise.backend.repository.BudgetRepository;
import com.spendwise.backend.repository.ExpenseRepository;
import com.spendwise.backend.service.AiInsightService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/spendwise")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class SpendWiseController {

    private final ExpenseRepository expenseRepo;
    private final BudgetRepository budgetRepo;
    private final AiInsightService aiService;

    @GetMapping("/dashboard")
    public Map<String, Object> getDashboard(@RequestParam Long userId) {
        List<ExpenseEntry> entries = expenseRepo.findByUserIdOrderByDateDesc(userId);
        List<MonthlyBudget> budgets = budgetRepo.findByUserId(userId);

        if (budgets.isEmpty()) {
            MonthlyBudget defaultBudget = budgetRepo.save(
                new MonthlyBudget(null, "2026-11", 75000.0, 18000.0, 8500.0, 15000.0, 20000.0, 8000.0, 5500.0, userId)
            );
            budgets = List.of(defaultBudget);
        }

        return Map.of("entries", entries, "budgets", budgets);
    }

    @PostMapping("/expenses/day")
    public Map<String, Object> saveDayExpenses(@RequestBody Map<String, Object> payload) {
        Long userId = ((Number) payload.get("userId")).longValue();
        String date = (String) payload.get("date");
        Map<String, Number> categories = (Map<String, Number>) payload.get("categories");

        // Append new entries instead of deleting previous ones from the same day
        for (var entry : categories.entrySet()) {
            double amount = entry.getValue().doubleValue();
            if (amount > 0) {
                expenseRepo.save(new ExpenseEntry(null, date, entry.getKey(), amount, userId));
            }
        }

        // Recalculate totals across all saved entries for this user
        List<ExpenseEntry> allEntries = expenseRepo.findByUserIdOrderByDateDesc(userId);

        Map<String, Double> todayMap = new HashMap<>();
        double todayTotal = 0.0;
        for (ExpenseEntry e : allEntries) {
            if (e.getDate().equals(date)) {
                todayMap.merge(e.getCategory(), e.getAmount(), Double::sum);
                todayTotal += e.getAmount();
            }
        }

        String monthKey = date.substring(0, 7);
        double monthlyTotal = allEntries.stream()
            .filter(e -> e.getDate().startsWith(monthKey))
            .mapToDouble(ExpenseEntry::getAmount)
            .sum();

        int dayOfMonth = Math.max(1, LocalDate.parse(date).getDayOfMonth());
        int daysInMonth = LocalDate.parse(date).lengthOfMonth();
        double projectedMonthEnd = (monthlyTotal / dayOfMonth) * daysInMonth;

        double monthlyBudget = budgetRepo.findByUserIdAndMonthKey(userId, monthKey)
            .map(MonthlyBudget::getTotalBudget)
            .orElse(75000.0);

        Map<String, Object> aiInsights = aiService.generateInsights(
            todayTotal, monthlyTotal, monthlyBudget, projectedMonthEnd, todayMap
        );

        return Map.of(
            "entries", allEntries,
            "todayTotal", todayTotal,
            "monthlyTotal", monthlyTotal,
            "projectedMonthEnd", projectedMonthEnd,
            "aiInsights", aiInsights
        );
    }

    @DeleteMapping("/expenses/{id}")
    public void deleteExpense(@PathVariable Long id) {
        expenseRepo.deleteById(id);
    }

    @PutMapping("/budgets/{monthKey}")
    public MonthlyBudget updateBudget(
            @PathVariable String monthKey,
            @RequestParam Long userId,
            @RequestBody MonthlyBudget updated
    ) {
        MonthlyBudget budget = budgetRepo.findByUserIdAndMonthKey(userId, monthKey)
            .orElse(new MonthlyBudget());
        budget.setUserId(userId);
        budget.setMonthKey(monthKey);
        budget.setTotalBudget(updated.getTotalBudget());
        budget.setFood(updated.getFood());
        budget.setTransport(updated.getTransport());
        budget.setShopping(updated.getShopping());
        budget.setBills(updated.getBills());
        budget.setEntertainment(updated.getEntertainment());
        budget.setOther(updated.getOther());
        return budgetRepo.save(budget);
    }
}
