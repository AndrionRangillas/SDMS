const express = require('express');
const router = express.Router();
const supabase = require('../supabase');
const authMiddleware = require('../middleware/auth');

// GET /api/courses
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('courses')
            .select('*')
            .order('course_code');
        if (error) return res.status(400).json({ error: error.message });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
