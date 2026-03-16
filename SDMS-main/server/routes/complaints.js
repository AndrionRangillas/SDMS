const express = require('express');
const router = express.Router();
const supabase = require('../supabase');
const authMiddleware = require('../middleware/auth');

// Case level logic
function getCaseLevel(count) {
    if (count === 0) return { level: 1, label: 'Warning' };
    if (count === 1) return { level: 2, label: 'Community Service' };
    if (count === 2) return { level: 3, label: 'Suspension' };
    return { level: count + 1, label: 'Expulsion Review' };
}

// GET /api/complaints
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        let query = supabase
            .from('complaints')
            .select(`
        *,
        students(student_id, full_name),
        courses(course_code, course_name)
      `, { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + parseInt(limit) - 1);

        if (search) {
            query = query.ilike('subject', `%${search}%`);
        }

        const { data, error, count } = await query;
        if (error) return res.status(400).json({ error: error.message });
        res.json({ data, count, page: parseInt(page), limit: parseInt(limit) });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/complaints
router.post('/', authMiddleware, async (req, res) => {
    try {
        const {
            student_id, course_id, complaint_type,
            subject, description
        } = req.body;

        if (!student_id || !subject) {
            return res.status(400).json({ error: 'Student and subject are required' });
        }

        // Count existing complaints for this student to determine case level
        const { count: existing, error: countErr } = await supabase
            .from('complaints')
            .select('*', { count: 'exact', head: true })
            .eq('student_id', student_id);

        if (countErr) return res.status(400).json({ error: countErr.message });

        const { level, label } = getCaseLevel(existing || 0);

        const { data, error } = await supabase
            .from('complaints')
            .insert({
                student_id, course_id, complaint_type,
                subject, description,
                case_level: level,
                status: 'Pending',
                action_taken: label
            })
            .select(`
        *,
        students(student_id, full_name),
        courses(course_code, course_name)
      `)
            .single();

        if (error) return res.status(400).json({ error: error.message });
        res.status(201).json(data);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// PUT /api/complaints/:id
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { status, action_taken } = req.body;
        const { data, error } = await supabase
            .from('complaints')
            .update({ status, action_taken, updated_at: new Date().toISOString() })
            .eq('id', req.params.id)
            .select(`
        *,
        students(student_id, full_name),
        courses(course_code, course_name)
      `)
            .single();

        if (error) return res.status(400).json({ error: error.message });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
