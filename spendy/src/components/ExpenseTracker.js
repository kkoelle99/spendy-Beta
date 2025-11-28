import React, { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import SummaryCards from "./SummaryCards";
import styles from "../styles/ExpenseTracker.module.css";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#AA336A",
  "#9933FF",
  "#FF33AA",
];

function getExpensesByCategory(expenses) {
  const categorySums = {};
  expenses.forEach(({ category, amount }) => {
    if (!category) return;
    if (!categorySums[category]) categorySums[category] = 0;
    categorySums[category] += amount;
  });
  return Object.entries(categorySums).map(([name, value]) => ({ name, value }));
}

function ExpenseTracker({ budgetData, refreshBudget }) {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();
  const [expenses, setExpenses] = useState([]);
  const [editingExpense, setEditingExpense] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [newExpense, setNewExpense] = useState({
    description: "",
    amount: "",
    category: "",
    date: "",
  });
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const budgetGoals = budgetData?.budgetGoals || {};
  const categories = Object.keys(budgetGoals);

  useEffect(() => {
    if (!isAuthenticated) return;

    async function fetchExpenses() {
      setLoading(true);
      try {
        const token = await getAccessTokenSilently({
          audience: "https://spendy-api",
          scope: "read:expenses write:budget",
        });

        const res = await fetch(`${process.env.REACT_APP_API_URL}/expenses`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data = await res.json();
        if (Array.isArray(data)) {
          setExpenses(
            data.map((e) => ({
              ...e,
              amount:
                typeof e.amount === "string" ? parseFloat(e.amount) : e.amount,
            }))
          );
          setError("");
        } else setError("Unexpected expenses API response format.");
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchExpenses();
  }, [isAuthenticated, getAccessTokenSilently]);

  const filteredExpenses = expenses.filter((exp) => {
    const date = new Date(exp.date);
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    return (!start || date >= start) && (!end || date <= end);
  });

  const totalsByCategory = filteredExpenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
    return acc;
  }, {});

  const percentByCategory = categories.reduce((acc, cat) => {
    const spent = totalsByCategory[cat] || 0;
    const goal = budgetGoals[cat] || 0;
    acc[cat] = goal > 0 ? (spent / goal) * 100 : 0;
    return acc;
  }, {});

  function handleBudgetGoalChange(category, value) {
    if (value === "" || value < 0) return;
    budgetData.budgetGoals[category] = Number(value);
    if (refreshBudget) refreshBudget();
  }

  async function handleAddExpense(e) {
    e.preventDefault();
    const parsedAmount = parseFloat(newExpense.amount);
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      setError("Please enter a valid amount.");
      return;
    }

    if (
      (totalsByCategory[newExpense.category] || 0) + parsedAmount >
      (budgetGoals[newExpense.category] || 0)
    ) {
      alert(
        `⚠️ Warning: Adding this expense exceeds your ${newExpense.category} budget!`
      );
    }

    try {
      const token = await getAccessTokenSilently({
        audience: "https://spendy-api",
        scope: "write:budget",
      });
      const res = await fetch(`${process.env.REACT_APP_API_URL}/expenses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...newExpense, amount: parsedAmount }),
      });

      if (!res.ok) throw new Error("Failed to add expense");
      const added = await res.json();
      setExpenses((prev) => [...prev, added]);
      setNewExpense({ description: "", amount: "", category: "", date: "" });
      setError("");
      if (refreshBudget) await refreshBudget();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSaveEdit(expense) {
    const parsedAmount = parseFloat(expense.amount);
    if (isNaN(parsedAmount) || parsedAmount < 0)
      return setError("Please enter a valid amount.");

    try {
      const token = await getAccessTokenSilently({
        audience: "https://spendy-api",
      });
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/expenses/${expense._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ ...expense, amount: parsedAmount }),
        }
      );

      if (!res.ok) throw new Error("Failed to update expense");
      const updated = await res.json();
      setExpenses((prev) =>
        prev.map((exp) => (exp._id === updated._id ? updated : exp))
      );
      setEditingExpense(null);
      setError("");
      if (refreshBudget) await refreshBudget();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDeleteExpense(id) {
    if (!window.confirm("Are you sure you want to delete this expense?"))
      return;
    try {
      const token = await getAccessTokenSilently({
        audience: "https://spendy-api",
      });
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/expenses/${id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Failed to delete expense");
      setExpenses((prev) => prev.filter((exp) => exp._id !== id));
      setEditingExpense(null);
      setError("");
      if (refreshBudget) await refreshBudget();
    } catch (err) {
      setError(err.message);
    }
  }

  const handleExportCSV = () => {
    if (filteredExpenses.length === 0)
      return setError("No expenses to export.");
    const csvHeader = ["Description", "Amount", "Category", "Date"];
    const csvRows = filteredExpenses.map((e) => [
      e.description,
      e.amount,
      e.category,
      new Date(e.date).toLocaleDateString(),
    ]);
    const bom = "\ufeff";
    const csvContent =
      bom +
      [csvHeader, ...csvRows]
        .map((row) =>
          row.map((item) => `"${String(item).replace(/"/g, '""')}"`).join(",")
        )
        .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "expenses.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const data = getExpensesByCategory(filteredExpenses);

  return (
    <div className={styles.container}>
      <h2>Expense Tracker</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}

      {loading ? (
        <p>Loading expenses...</p>
      ) : (
        <>
          {/* Add Expense Form */}
          <form onSubmit={handleAddExpense} className={styles.form}>
            <input
              type="text"
              placeholder="Description"
              value={newExpense.description}
              onChange={(e) =>
                setNewExpense({ ...newExpense, description: e.target.value })
              }
              required
            />
            <input
              type="number"
              placeholder="Amount"
              value={newExpense.amount}
              onChange={(e) =>
                setNewExpense({ ...newExpense, amount: e.target.value })
              }
              required
              min="0"
              step="0.01"
            />
            <select
              value={newExpense.category}
              onChange={(e) =>
                setNewExpense({ ...newExpense, category: e.target.value })
              }
              required
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={newExpense.date}
              onChange={(e) =>
                setNewExpense({ ...newExpense, date: e.target.value })
              }
              required
            />
            <button type="submit">Add Expense</button>
          </form>

          {/* Date Filter & Export */}
          <div className={styles.dateFilters}>
            <label>
              Start Date:
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </label>
            <label>
              End Date:
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </label>
            <button onClick={handleExportCSV}>Export CSV</button>
          </div>

          {/* Budget Goals */}
          <div className={styles.budgetGoalsContainer}>
            <h3>Budget Goals by Category</h3>
            {categories.map((cat, idx) => {
              const spent = totalsByCategory[cat] || 0;
              const goal = budgetGoals[cat] || 0;
              const percent = percentByCategory[cat];
              const progressColor = COLORS[idx % COLORS.length];

              return (
                <div key={cat} className={styles.budgetGoalRow}>
                  <label>{cat} Goal:</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={goal}
                    onChange={(e) =>
                      handleBudgetGoalChange(cat, e.target.value)
                    }
                  />
                  <div className={styles.progressBarWrapper}>
                    <div
                      className={styles.progressBar}
                      style={{
                        width: `${Math.min(percent, 100)}%`,
                        backgroundColor: progressColor,
                        transition: "width 0.5s ease-in-out",
                      }}
                      title={`${percent.toFixed(1)}% used`}
                    />
                  </div>
                  <span>
                    ${spent.toFixed(2)} / ${goal} {percent > 100 && "⚠️"}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Edit Expense Form */}
          {editingExpense && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveEdit(editingExpense);
              }}
            >
              <input
                type="text"
                value={editingExpense.description}
                onChange={(e) =>
                  setEditingExpense({
                    ...editingExpense,
                    description: e.target.value,
                  })
                }
              />
              <input
                type="number"
                value={editingExpense.amount}
                onChange={(e) =>
                  setEditingExpense({
                    ...editingExpense,
                    amount: e.target.value,
                  })
                }
              />
              <select
                value={editingExpense.category}
                onChange={(e) =>
                  setEditingExpense({
                    ...editingExpense,
                    category: e.target.value,
                  })
                }
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={editingExpense.date}
                onChange={(e) =>
                  setEditingExpense({ ...editingExpense, date: e.target.value })
                }
              />
              <button type="submit">Save</button>
              <button onClick={() => setEditingExpense(null)}>Cancel</button>
            </form>
          )}

          {/* Expenses Table */}
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Description</th>
                <th>Amount</th>
                <th>Category</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map((exp) => (
                <tr key={exp._id}>
                  <td>{exp.description}</td>
                  <td>${exp.amount.toFixed(2)}</td>
                  <td>{exp.category}</td>
                  <td>{new Date(exp.date).toLocaleDateString()}</td>
                  <td>
                    <button onClick={() => setEditingExpense(exp)}>Edit</button>
                    <button onClick={() => handleDeleteExpense(exp._id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* SummaryCards */}
          <SummaryCards expenses={filteredExpenses} budgetData={budgetData} />

          {/* Pie Chart */}
          <h3>Expenses by Category</h3>
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  dataKey="value"
                  data={data}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {data.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p>No expenses to display in chart.</p>
          )}
        </>
      )}
    </div>
  );
}

export default ExpenseTracker;
