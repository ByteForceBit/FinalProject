// backend/src/routes/expenses.js
const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Middleware to authenticate user
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const { data: { user }, error } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid authentication token' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' });
  }
};

// Get dashboard statistics
router.get('/dashboard', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const currentYear = new Date().getFullYear();

    // Total Expenses YTD
    const { data: totalExpenses, error: totalError } = await supabase
      .from('expenses')
      .select('total_amount_numeric')
      .eq('user_id', userId)
      .gte('date', `${currentYear}-01-01`)
      .lte('date', `${currentYear}-12-31`);

    if (totalError) throw totalError;

    // Total GST Claimed
    const { data: gstExpenses, error: gstError } = await supabase
      .from('expenses')
      .select('gst_amount_numeric')
      .eq('user_id', userId)
      .gte('date', `${currentYear}-01-01`)
      .lte('date', `${currentYear}-12-31`);

    if (gstError) throw gstError;

    // Total Other Taxes Paid
    const { data: otherTaxes, error: taxError } = await supabase
      .from('expenses')
      .select('other_tax_amount_numeric')
      .eq('user_id', userId)
      .gte('date', `${currentYear}-01-01`)
      .lte('date', `${currentYear}-12-31`);

    if (taxError) throw taxError;

    // Risk Score Average
    const { data: riskScores, error: riskError } = await supabase
      .from('expenses')
      .select('leakage_risk_score')
      .eq('user_id', userId)
      .gte('date', `${currentYear}-01-01`)
      .lte('date', `${currentYear}-12-31`);

    if (riskError) throw riskError;

    // Top 5 Leakage Categories
    const { data: leakageCategories, error: categoryError } = await supabase
      .from('expenses')
      .select('category, total_amount_numeric, leakage_risk_score')
      .eq('user_id', userId)
      .gte('leakage_risk_score', 7)
      .gte('date', `${currentYear}-01-01`)
      .lte('date', `${currentYear}-12-31`);

    if (categoryError) throw categoryError;

    // Calculate statistics
    const totalExpensesYTD = totalExpenses.reduce((sum, exp) => sum + exp.total_amount_numeric, 0);
    const totalGSTClaimed = gstExpenses.reduce((sum, exp) => sum + exp.gst_amount_numeric, 0);
    const totalOtherTaxes = otherTaxes.reduce((sum, exp) => sum + exp.other_tax_amount_numeric, 0);
    const riskScoreAvg = riskScores.length > 0 
      ? riskScores.reduce((sum, exp) => sum + exp.leakage_risk_score, 0) / riskScores.length 
      : 0;

    // Calculate top leakage categories
    const categoryTotals = {};
    leakageCategories.forEach(exp => {
      if (!categoryTotals[exp.category]) {
        categoryTotals[exp.category] = 0;
      }
      categoryTotals[exp.category] += exp.total_amount_numeric;
    });

    const topLeakageCategories = Object.entries(categoryTotals)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([category, amount]) => ({ category, amount }));

    res.json({
      totalExpensesYTD,
      totalGSTClaimed,
      totalOtherTaxes,
      riskScoreAverage: parseFloat(riskScoreAvg.toFixed(2)),
      topLeakageCategories
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Get flagged transactions (leakage_risk_score >= 7)
router.get('/flagged', authenticateUser, async (req, res) => {
  try {
    const { data: expenses, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', req.user.id)
      .gte('leakage_risk_score', 7)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch flagged transactions' });
  }
});

// Get all expenses
router.get('/', authenticateUser, async (req, res) => {
  try {
    const { data: expenses, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', req.user.id)
      .order('date', { ascending: false });

    if (error) throw error;

    // Note: The frontend expects 'expenses' key if this is an array of expenses
    res.json({ expenses }); 
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// ----------------------------------------
// --- NEW ROUTE: DELETE EXPENSE BY ID ---
// ----------------------------------------
// backend/src/routes/expenses.js
// ... (Your imports and authenticateUser middleware)
// ...

// DELETE expense by ID
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Perform the delete operation, ensuring the user owns the expense
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)
      .eq('user_id', userId); // Crucial security check

    if (error) throw error;

    if (error && error.code === 'PGRST116') { // Not found error code
        return res.status(404).json({ error: 'Expense not found or unauthorized' });
    }

    res.status(204).send(); // 204 No Content is standard for successful deletion

  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

// ... (Your GET /dashboard, GET /flagged, and GET / routes)
// ...

module.exports = router;
