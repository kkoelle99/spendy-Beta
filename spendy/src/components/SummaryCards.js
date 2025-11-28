import React from "react";
import styles from "../styles/SummaryCards.module.css";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#AA336A",
  "#9933FF",
  "#FF33AA",
];

function SummaryCards({ expenses = [], budgetData }) {
  if (!budgetData) return <p>No budget data available.</p>;

  // Totals
  const totalExpenses = expenses.reduce(
    (sum, exp) => sum + (exp.amount || 0),
    0
  );
  const remaining =
    budgetData.remaining || budgetData.totalBudget - totalExpenses;

  // Totals by category
  const categoryTotals = {};
  expenses.forEach(({ category, amount }) => {
    if (!category) return;
    categoryTotals[category] = (categoryTotals[category] || 0) + amount;
  });

  // Highest expense category
  let highestCategory = null;
  let highestAmount = 0;

  // First over-budget category
  let overBudgetCategory = null;

  const categories = Object.keys(budgetData.budgetGoals || {});

  categories.forEach((cat) => {
    const spent = categoryTotals[cat] || 0;
    const goal = budgetData.budgetGoals[cat] || 0;

    if (spent > highestAmount) {
      highestAmount = spent;
      highestCategory = cat;
    }

    if (goal > 0 && spent > goal && !overBudgetCategory) {
      overBudgetCategory = cat;
    }
  });

  return (
    <div className={styles.summaryContainer}>
      {/* Top summary cards */}
      <div className={styles.card}>
        <h3>Total Budget</h3>
        <p>${budgetData.totalBudget.toFixed(2)}</p>
      </div>

      <div className={styles.card}>
        <h3>Total Expenses</h3>
        <p>${totalExpenses.toFixed(2)}</p>
      </div>

      <div className={styles.card}>
        <h3>Remaining</h3>
        <p>${remaining.toFixed(2)}</p>
      </div>

      <div className={styles.card}>
        <h3>Highest Expense Category</h3>
        <p>{highestCategory || "N/A"}</p>
        <p>${highestAmount.toFixed(2)}</p>
      </div>

      <div className={styles.card}>
        <h3>Over Budget</h3>
        <p>{overBudgetCategory || "None"}</p>
      </div>

      {/* Category-specific cards */}
      {categories.map((cat, idx) => {
        const spent = categoryTotals[cat] || 0;
        const goal = budgetData.budgetGoals[cat] || 0;
        const percent = goal > 0 ? (spent / goal) * 100 : 0;
        const color = COLORS[idx % COLORS.length];

        return (
          <div key={cat} className={styles.card}>
            <h3>{cat}</h3>
            <div className={styles.progressBarWrapper}>
              <div
                className={styles.progressBar}
                style={{
                  width: `${Math.min(percent, 100)}%`,
                  backgroundColor: color,
                  transition: "width 0.5s ease-in-out",
                }}
                title={`${percent.toFixed(1)}% used`}
              />
            </div>
            <p>
              ${spent.toFixed(2)} / ${goal}{" "}
              {percent > 100 && <span>⚠️ Over budget</span>}
            </p>
          </div>
        );
      })}
    </div>
  );
}

export default SummaryCards;
