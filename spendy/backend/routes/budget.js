const express = require("express");
const router = express.Router();
const Budget = require("../models/Budget");
const Expense = require("../models/Expense");

// =============================
// GET /api/budget - Fetch budget for logged-in user
// =============================
router.get("/", async (req, res) => {
  try {
    if (!req.user || !req.user.sub) {
      return res
        .status(401)
        .json({ message: "Unauthorized: No user info in token" });
    }

    const userId = req.user.sub;
    const budget = await Budget.findOne({ userId });

    if (!budget) {
      return res.status(404).json({ message: "No budget found." });
    }

    res.json(budget);
  } catch (err) {
    console.error("Error fetching budget:", err);
    res.status(500).json({ message: "Server error fetching budget" });
  }
});

// =============================
// POST /api/budget - Create or update total budget
// =============================
router.post("/", async (req, res) => {
  try {
    if (!req.user || !req.user.sub) {
      return res
        .status(401)
        .json({ message: "Unauthorized: No user info in token" });
    }

    const userId = req.user.sub;
    const { amount } = req.body;

    if (typeof amount !== "number" || isNaN(amount)) {
      return res.status(400).json({ message: "Invalid budget amount" });
    }

    let budget = await Budget.findOne({ userId });

    // Calculate total expenses
    const expensesTotalAgg = await Expense.aggregate([
      { $match: { userId } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const totalExpenses = expensesTotalAgg[0]?.total || 0;

    if (budget) {
      budget.totalBudget = amount;
    } else {
      budget = new Budget({ userId, totalBudget: amount });
    }

    budget.expenses = totalExpenses;
    budget.remaining = amount - totalExpenses;

    await budget.save();

    res.json(budget);
  } catch (err) {
    console.error("Error saving budget:", err);
    res.status(500).json({ message: "Server error saving budget" });
  }
});

// =============================
// POST /api/budget/goals - Set category goals
// =============================
router.post("/goals", async (req, res) => {
  try {
    if (!req.user || !req.user.sub) {
      return res
        .status(401)
        .json({ message: "Unauthorized: No user info in token" });
    }

    const userId = req.user.sub;
    const { categoryGoals } = req.body;

    if (!categoryGoals || typeof categoryGoals !== "object") {
      return res.status(400).json({ message: "Invalid category goals" });
    }

    let budget = await Budget.findOne({ userId });

    if (!budget) {
      budget = new Budget({
        userId,
        totalBudget: 0,
        expenses: 0,
        remaining: 0,
      });
    }

    budget.categoryGoals = categoryGoals;
    await budget.save();

    res.json({ categoryGoals: budget.categoryGoals });
  } catch (err) {
    console.error("Error saving category goals:", err);
    res.status(500).json({ message: "Server error saving category goals" });
  }
});

module.exports = router;
