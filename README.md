# SpendWise Finance Dashboard

A full-stack personal finance tracker with daily category-wise additive expense logging, monthly/daily budget compensation, interactive analytics charts, user accounts, and hybrid AI burn-rate insights powered by Google Gemini (`gemini-2.5-flash`).

## Project Structure

```text
mini project/
├── SpendWise Finance Dashboard/   # Next.js (App Router) + Tailwind CSS frontend (port 3000)
├── spendwise-backend/             # Spring Boot 4.1.2 + Spring Data JPA + Gemini AI (port 8080)
└── README.md
```

## Prerequisites

Before running the project locally, make sure you have:
- **Node.js** (v18+ / v20+) and **npm**
- **Java JDK 21** (`javac -version` should report `21.x.x`)
- **PostgreSQL** installed and running on `localhost:5432` with a database named `spendwise`
- A **Google Gemini API key** from [Google AI Studio](https://aistudio.google.com/)

## 1. Database & Gemini API Key Setup

1. Create a database named `spendwise` in PostgreSQL (via **pgAdmin 4** or `psql`).
2. Open `spendwise-backend/src/main/resources/application.properties` and configure your PostgreSQL credentials and Gemini API key:

```properties
spring.application.name=spendwise-backend

spring.datasource.url=jdbc:postgresql://localhost:5432/spendwise
spring.datasource.username=postgres
spring.datasource.password=YOUR_POSTGRES_PASSWORD

spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false

# Paste your Gemini API key here (or pass GEMINI_API_KEY as an environment variable)
gemini.api.key=YOUR_GEMINI_API_KEY
```

> **Tip:** Avoid committing real API keys or production passwords to Git. You can also set `GEMINI_API_KEY` in your terminal before starting the backend.

## 2. Run the Spring Boot Backend (Port `8080`)

Open a terminal in `spendwise-backend` and run:

```powershell
./mvnw spring-boot:run
```

Wait until you see `Started SpendwiseBackendApplication` running on `http://localhost:8080`.

## 3. Run the Next.js Frontend (Port `3000`)

Open a second terminal in `SpendWise Finance Dashboard` and run:

```powershell
npm install
npm run dev
```

Open **`http://localhost:3000`** in your browser.

## How to Use

1. **Sign Up / Sign In:** Create an account on the boot screen to store your profile, budgets, and expenses in PostgreSQL.
2. **Log Daily Expenses:** Enter amounts under **Spend by Category** and click **Save & Calculate**. Entries accumulate for that day/month, reset the draft inputs to `0`, and refresh charts and Gemini AI insights.
3. **Switch Dates:** Use **Today**, **Yesterday**, or the **Calendar** picker (future dates are shown disabled).
4. **Transactions & Budgets:** Filter or delete saved entries under **Transactions**, and switch between **Monthly** and **Daily** compensated limits under **Budgets**.