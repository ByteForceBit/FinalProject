const express = require('express');
const router = express.Router();
const supabase = require('../config/supabaseClient');

// Get user profile
router.get('/profile', async (req, res) => {
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

    res.json({
      id: user.id,
      email: user.email,
      created_at: user.created_at
    });

  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

module.exports = router;
