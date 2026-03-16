const express = require('express');
const router = express.Router();
const supabase = require('../supabase');
const authMiddleware = require('../middleware/auth');

// GET /api/violations
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { search = '', page = 1, limit = 10 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        const { data, error, count } = await supabase
            .from('violation_slips')
            .select('*, students(student_id, full_name, courses(course_code))', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + parseInt(limit) - 1);

        if (error) return res.status(400).json({ error: error.message });
        res.json({ data, count, page: parseInt(page), limit: parseInt(limit) });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/violations
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { student_id, violation, shb_article_section, sanction, date_of_violation } = req.body;
        if (!student_id || !violation) {
            return res.status(400).json({ error: 'Student and violation are required' });
        }

        // Count existing violations for this student
        const { count: existing } = await supabase
            .from('violation_slips')
            .select('*', { count: 'exact', head: true })
            .eq('student_id', student_id);

        const { data, error } = await supabase
            .from('violation_slips')
            .insert({
                student_id, violation,
                violation_count: (existing || 0) + 1,
                shb_article_section, sanction,
                date_of_violation: date_of_violation || new Date().toISOString().split('T')[0]
            })
            .select('*, students(student_id, full_name, courses(course_code))')
            .single();

        if (error) return res.status(400).json({ error: error.message });
        res.status(201).json(data);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// PUT /api/violations/:id
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { violation, shb_article_section, sanction, date_of_violation } = req.body;
        const { data, error } = await supabase
            .from('violation_slips')
            .update({ violation, shb_article_section, sanction, date_of_violation })
            .eq('id', req.params.id)
            .select('*, students(student_id, full_name, courses(course_code))')
            .single();

        if (error) return res.status(400).json({ error: error.message });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// DELETE /api/violations/:id
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const { error } = await supabase
            .from('violation_slips')
            .delete()
            .eq('id', req.params.id);
        if (error) return res.status(400).json({ error: error.message });
        res.json({ message: 'Violation slip deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
