package com.spendwise.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Service
public class AiInsightService {

    @Value("${gemini.api.key:}")
    private String apiKey;

    private final RestClient restClient = RestClient.create();

    public Map<String, Object> generateInsights(
            double todayTotal,
            double monthlyTotal,
            double monthlyBudget,
            double projectedMonthEnd,
            Map<String, Double> todayByCategory
    ) {
        if (apiKey == null || apiKey.isBlank()) {
            return Map.of(
                "summary", String.format("Projected month-end spend is ₹%.0f against your ₹%.0f budget.", projectedMonthEnd, monthlyBudget),
                "score", projectedMonthEnd <= monthlyBudget ? 88 : 72,
                "status", projectedMonthEnd <= monthlyBudget ? "On track" : "Needs attention",
                "anomalies", List.of("Add gemini.api.key in application.properties to enable live AI analysis.")
            );
        }

        String prompt = String.format("""
            You are SpendWise AI, a concise personal finance analyst.
            Here are the user's verified numbers in Indian Rupees (₹):
            - Today's Total: ₹%.2f
            - Today's Spend by Category: %s
            - Monthly Total So Far: ₹%.2f
            - Monthly Budget: ₹%.2f
            - Projected Month-End Spend: ₹%.2f

            Return ONLY a JSON object with these exact keys:
            - "summary": 1-sentence burn-rate projection comparing projected spend vs budget.
            - "score": integer from 0 to 100 rating financial health.
            - "status": short label ("On track", "Watch closely", or "Needs attention").
            - "anomalies": array of 2 to 3 short, specific bullet points highlighting top categories or actionable savings tips.
            """, todayTotal, todayByCategory, monthlyTotal, monthlyBudget, projectedMonthEnd);

        Map<String, Object> body = Map.of(
            "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt)))),
            "generationConfig", Map.of("responseMimeType", "application/json")
        );

        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + apiKey;

        try {
            Map<?, ?> response = restClient.post()
                .uri(url)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .body(Map.class);

            var candidates = (List<?>) response.get("candidates");
            var content = (Map<?, ?>) ((Map<?, ?>) candidates.get(0)).get("content");
            var parts = (List<?>) content.get("parts");
            String jsonText = (String) ((Map<?, ?>) parts.get(0)).get("text");

            return new tools.jackson.databind.ObjectMapper().readValue(jsonText, Map.class);
        } catch (Exception e) {
            return Map.of(
                "summary", "Unable to reach AI service right now, but your expenses are saved.",
                "score", 80,
                "status", "Saved",
                "anomalies", List.of("Check your Gemini API key or internet connection.")
            );
        }
    }
}
