import React, { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";

const categories = ["Food", "Utilities", "Rent", "Entertainment", "Other"];

const BudgetManager = () => {
  const { getAccessTokenSilently } = useAuth0();
  const [budget, setBudget] = useState(null);
  const [totalAmount, setTotalAmount] = useState("");
  const [categoryGoals, setCategoryGoals] = useState({});

  // Fetch budget and goals from backend
  useEffect(() => {
    const fetchBudget = async () => {
      try {
        const token = await getAccessTokenSilently();

        const res = await fetch(`${process.env.REACT_APP_API_URL}/api/budget`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.message || "Failed to fetch budget");
        }

        const data = await res.json();
        setBudget(data);
        setTotalAmount(data.totalBudget || "");
        // Initialize category goals with existing data or empty values
        const goals = data.categoryGoals || {};
        categories.forEach((cat) => {
          if (!goals[cat]) {
            goals[cat] = "";
          }
        });
        setCategoryGoals(goals);
      } catch (err) {
        console.error("Fetch budget error:", err.message);
        // Initialize empty category goals on error
        const emptyGoals = {};
        categories.forEach((cat) => {
          emptyGoals[cat] = "";
        });
        setCategoryGoals(emptyGoals);
      }
    };

    fetchBudget();
  }, [getAccessTokenSilently]);

  const handleTotalSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = await getAccessTokenSilently();

      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/budget`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount: Number(totalAmount) }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to set budget");
      }

      const data = await res.json();
      setBudget(data);
    } catch (err) {
      console.error("Set budget error:", err.message);
    }
  };

  const handleGoalChange = (category, value) => {
    if (value === "" || value < 0) return;
    setCategoryGoals((prev) => ({
      ...prev,
      [category]: Number(value),
    }));
  };

  const handleGoalsSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = await getAccessTokenSilently();

      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/budget/goals`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ categoryGoals }),
        }
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to save budget goals");
      }

      const data = await res.json();
      setBudget((prev) => ({ ...prev, categoryGoals: data.categoryGoals }));
    } catch (err) {
      console.error("Save budget goals error:", err.message);
    }
  };

  return (
    <div>
      <h2>Budget Manager</h2>

      {budget && (
        <div>
          <p>
            <strong>Total Budget:</strong> ${budget.totalBudget}
          </p>
          <p>
            <strong>Total Expenses:</strong> ${budget.expenses}
          </p>
          <p>
            <strong>Remaining:</strong> ${budget.remaining}
          </p>
        </div>
      )}

      <form onSubmit={handleTotalSubmit}>
        <input
          type="number"
          placeholder="Set Total Budget"
          value={totalAmount}
          onChange={(e) => setTotalAmount(e.target.value)}
          required
        />
        <button type="submit">Save Total Budget</button>
      </form>

      <h3>Set Budget Goals by Category</h3>
      <form onSubmit={handleGoalsSubmit}>
        {categories.map((cat) => (
          <div key={cat}>
            <label>{cat}:</label>
            <input
              type="number"
              min="0"
              value={categoryGoals[cat] || ""}
              onChange={(e) => handleGoalChange(cat, e.target.value)}
            />
          </div>
        ))}
        <button type="submit">Save Category Goals</button>
      </form>
    </div>
  );
};

export default BudgetManager;
