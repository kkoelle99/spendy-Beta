import React, { useState, useEffect, useCallback } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import styles from "../styles/BudgetOverview.module.css";
import ExpenseTracker from "./ExpenseTracker";
import SummaryCards from "./SummaryCards";

const API_URL =
  process.env.REACT_APP_API_URL || "https://spendy-beta.onrender.com/api";

function BudgetOverview() {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();

  const [budgetData, setBudgetData] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchBudgetData = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const token = await getAccessTokenSilently({
        audience: "https://spendy-api",
      });

      const response = await fetch(`${API_URL}/api/budget`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.status === 404) {
        setError("No budget found for your account.");
        setBudgetData(null);
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch budget data");
      }

      const data = await response.json();
      setBudgetData(data);
      setError("");
    } catch (err) {
      setError(err.message);
      setBudgetData(null);
    }
  }, [getAccessTokenSilently, isAuthenticated]);

  const fetchExpenses = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const token = await getAccessTokenSilently({
        audience: "https://spendy-api",
      });

      const response = await fetch(`${API_URL}/api/expenses`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch expenses");
      }

      const data = await response.json();
      if (Array.isArray(data)) {
        const cleanedData = data.map((exp) => ({
          ...exp,
          amount:
            typeof exp.amount === "string"
              ? parseFloat(exp.amount)
              : exp.amount,
        }));
        setExpenses(cleanedData);
        setError("");
      } else {
        setError("Unexpected expenses API response format.");
      }
    } catch (err) {
      setError(err.message);
      setExpenses([]);
    }
  }, [getAccessTokenSilently, isAuthenticated]);

  const refreshAllData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchBudgetData(), fetchExpenses()]);
    setLoading(false);
  }, [fetchBudgetData, fetchExpenses]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshAllData();
    }
  }, [refreshAllData, isAuthenticated]);

  if (!isAuthenticated) {
    return <p>Please log in to view your budget overview.</p>;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Budget Overview</h1>

      {loading ? (
        <p>Loading your data...</p>
      ) : error ? (
        <p style={{ color: "red" }}>{error}</p>
      ) : (
        <>
          <SummaryCards expenses={expenses} budgetData={budgetData} />
          <ExpenseTracker
            budgetData={budgetData}
            refreshBudget={refreshAllData}
          />
        </>
      )}
    </div>
  );
}

export default BudgetOverview;
