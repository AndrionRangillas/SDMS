const express = require('express');
const router = express.Router();
const supabase = require('../supabase');
const authMiddleware = require('../middleware/auth');

// GET /api/good-moral-issuance
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { page = 1, limit = 10, month, year, student_id, search = '' } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        let query = supabase
            .from('good_moral_issuance')
            .select('*, students!inner(student_id, full_name, courses(course_code))', { count: 'exact' });

        if (student_id) query = query.eq('student_id', student_id);

        if (search) {
            query = query.ilike('students.full_name', `%${search}%`);
        }

        if (year) {
            const y = parseInt(year);
            const m = month ? parseInt(month) : null;
            const start = new Date(y, m ? m - 1 : 0, 1).toISOString();
            const end = new Date(y, m ? m : 12, 0, 23, 59, 59, 999).toISOString();
            query = query.gte('date_processed', start).lte('date_processed', end);
        } else if (month) {
            const y = new Date().getFullYear();
            const m = parseInt(month);
            const start = new Date(y, m - 1, 1).toISOString();
            const end = new Date(y, m, 0, 23, 59, 59, 999).toISOString();
            query = query.gte('date_processed', start).lte('date_processed', end);
        }

        query = query.order('date_processed', { ascending: false }).range(offset, offset + parseInt(limit) - 1);

        const { data, error, count } = await query;
        if (error) return res.status(400).json({ error: error.message });

        res.json({ data, count, page: parseInt(page), limit: parseInt(limit) });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/good-moral-issuance
router.post('/', authMiddleware, async (req, res) => {
    try {
        const {
            student_id, contact_number, email, program, purpose,
            date_requested, processed_by, remarks
        } = req.body;

        if (!student_id) {
            return res.status(400).json({ error: 'Student is required' });
        }

        const { data, error } = await supabase
            .from('good_moral_issuance')
            .insert({
                student_id, contact_number, email, program, purpose,
                date_requested, processed_by: processed_by || req.user.email, remarks
            })
            .select('*, students(student_id, full_name, courses(course_code))')
            .single();

        if (error) return res.status(400).json({ error: error.message });
        res.status(201).json(data);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
