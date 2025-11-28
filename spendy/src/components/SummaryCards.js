import React from "react";
import styles from "../styles/SummaryCards.module.css";

function SummaryCards({ expenses = [], budgetData }) {
  if (!budgetData) return <p>No budget data available.</p>;

  const totalExpenses = expenses.reduce(
    (sum, exp) => sum + (exp.amount || 0),
    0
  );
  const remaining = budgetData.remaining;

  const categoryTotals = {};
  expenses.forEach(({ category, amount }) => {
    if (!category) return;
    categoryTotals[category] = (categoryTotals[category] || 0) + amount;
  });

  // Detect highest over-budget category
  let overBudgetCategory = null;
  let highestCategory = null;
  let highestAmount = 0;

  for (const [cat, amt] of Object.entries(categoryTotals)) {
    const goal = budgetData.budgetGoals?.[cat] || 0;
    if (goal > 0 && amt > goal && !overBudgetCategory) overBudgetCategory = cat;
    if (amt > highestAmount) {
      highestAmount = amt;
      highestCategory = cat;
    }
  }

  return (
    <div className={styles.summaryContainer}>
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
    </div>
  );
}

export default SummaryCards;
