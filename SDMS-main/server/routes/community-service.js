const express = require('express');
const router = express.Router();
const supabase = require('../supabase');
const authMiddleware = require('../middleware/auth');

// GET /api/community-service
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { search = '', page = 1, limit = 10 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        const { data, error, count } = await supabase
            .from('community_service')
            .select('*, students(student_id, full_name, courses(course_code, course_name))', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + parseInt(limit) - 1);

        if (error) return res.status(400).json({ error: error.message });
        res.json({ data, count, page: parseInt(page), limit: parseInt(limit) });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/community-service
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { student_id, hours_required, hours_rendered } = req.body;
        if (!student_id || hours_required === undefined) {
            return res.status(400).json({ error: 'Student and hours_required are required' });
        }

        const rendered = parseInt(hours_rendered) || 0;
        const required = parseInt(hours_required);
        const status = rendered >= required ? 'Completed' : 'Partially Done';

        const { data, error } = await supabase
            .from('community_service')
            .insert({ student_id, hours_required: required, hours_rendered: rendered, status })
            .select('*, students(student_id, full_name, courses(course_code, course_name))')
            .single();

        if (error) return res.status(400).json({ error: error.message });
        res.status(201).json(data);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// PUT /api/community-service/:id
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { hours_rendered, hours_required } = req.body;

        // Get existing record for hours_required if not provided
        const { data: existing } = await supabase
            .from('community_service')
            .select('hours_required')
            .eq('id', req.params.id)
            .single();

        const required = parseInt(hours_required) || existing?.hours_required || 0;
        const rendered = parseInt(hours_rendered) || 0;
        const status = rendered >= required ? 'Completed' : 'Partially Done';

        const { data, error } = await supabase
            .from('community_service')
            .update({
                hours_rendered: rendered,
                hours_required: required,
                status,
                updated_at: new Date().toISOString()
            })
            .eq('id', req.params.id)
            .select('*, students(student_id, full_name, courses(course_code, course_name))')
            .single();

        if (error) return res.status(400).json({ error: error.message });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// DELETE /api/community-service/:id
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const { error } = await supabase
            .from('community_service')
            .delete()
            .eq('id', req.params.id);
        if (error) return res.status(400).json({ error: error.message });
        res.json({ message: 'Record deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
