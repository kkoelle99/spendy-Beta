const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const Budget = require('../models/Budget');

// GET: Fetch all expenses for logged-in user
router.get('/', async (req, res) => {
  console.log('Received token user info:', req.user);

  try {
    if (!req.user || !req.user.sub) {
      return res.status(401).json({ message: 'Unauthorized: No user info in token' });
    }
    
    const userId = req.user.sub;
    const expenses = await Expense.find({ userId });
    res.json(expenses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch expenses' });
  }
});

// POST: Add a new expense and update budget
router.post('/', async (req, res) => {
  console.log('User info:', req.user);

  try {
    if (!req.user || !req.user.sub) {
      return res.status(401).json({ message: 'Unauthorized: No user info in token' });
    }
    
    const userId = req.user.sub;
    const { description, amount, category, date } = req.body;

    const expense = new Expense({
      userId,
      description,
      amount: Number(amount),
      category,
      date: new Date(date),
    });

    const savedExpense = await expense.save();

    // Update budget after adding expense
    await recalculateBudget(userId);

    res.status(201).json(savedExpense);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to add expense' });
  }
});

// PUT: Update an existing expense and update budget
router.put('/:id', async (req, res) => {
  console.log('User info:', req.user);

  try {
    if (!req.user || !req.user.sub) {
      return res.status(401).json({ message: 'Unauthorized: No user info in token' });
    }
    
    const userId = req.user.sub;
    const expenseId = req.params.id;
    const { description, amount, category, date } = req.body;

    const expense = await Expense.findOne({ _id: expenseId, userId });
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found or unauthorized' });
    }

    expense.description = description;
    expense.amount = Number(amount);
    expense.category = category;
    expense.date = new Date(date);

    const updatedExpense = await expense.save();

    // Update budget after editing expense
    await recalculateBudget(userId);

    res.json(updatedExpense);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update expense' });
  }
});

// DELETE: Remove an expense and update budget
router.delete('/:id', async (req, res) => {
  console.log('User info:', req.user);

  try {
    if (!req.user || !req.user.sub) {
      return res.status(401).json({ message: 'Unauthorized: No user info in token' });
    }
    
    const userId = req.user.sub;
    const expenseId = req.params.id;

    const expense = await Expense.findOneAndDelete({ _id: expenseId, userId });
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found or unauthorized' });
    }

    // Update budget after deleting expense
    await recalculateBudget(userId);

    res.json({ message: 'Expense deleted and budget updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete expense' });
  }
});

// Helper: Recalculate budget expenses/remaining
async function recalculateBudget(userId) {
  const totalExpenses = (
    await Expense.aggregate([
      { $match: { userId } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ])
  )[0]?.total || 0;

  let budget = await Budget.findOne({ userId });

  if (!budget) {
    budget = new Budget({
      userId,
      totalBudget: 0,
      expenses: totalExpenses,
      remaining: -totalExpenses,
    });
  } else {
    budget.expenses = totalExpenses;
    budget.remaining = budget.totalBudget - totalExpenses;
  }

  await budget.save();
}

module.exports = router;
