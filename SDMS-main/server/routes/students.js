const express = require('express');
const router = express.Router();
const supabase = require('../supabase');
const authMiddleware = require('../middleware/auth');

// GET /api/students
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { search = '', page = 1, limit = 10 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        let query = supabase
            .from('students')
            .select('*, courses(course_code, course_name)', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + parseInt(limit) - 1);

        if (search) {
            query = query.or(`full_name.ilike.%${search}%,student_id.ilike.%${search}%`);
        }

        const { data, error, count } = await query;
        if (error) return res.status(400).json({ error: error.message });

        res.json({ data, count, page: parseInt(page), limit: parseInt(limit) });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/students/:id/records — combined student info + complaints + community service
router.get('/:id/records', authMiddleware, async (req, res) => {
    try {
        const sid = req.params.id;

        const [studentRes, complaintsRes, csRes] = await Promise.all([
            supabase
                .from('students')
                .select('*, courses(course_code, course_name)')
                .eq('id', sid)
                .single(),
            supabase
                .from('complaints')
                .select('id, complaint_type, subject, description, created_at, status, case_level, action_taken')
                .eq('student_id', sid)
                .order('created_at', { ascending: false }),
            supabase
                .from('community_service')
                .select('id, hours_required, hours_rendered, status, created_at')
                .eq('student_id', sid)
                .order('created_at', { ascending: false })
        ]);

        if (studentRes.error) return res.status(404).json({ error: 'Student not found' });

        res.json({
            student: studentRes.data,
            complaints: complaintsRes.data || [],
            communityService: csRes.data || []
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/students/:id
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('students')
            .select('*, courses(course_code, course_name)')
            .eq('id', req.params.id)
            .single();
        if (error) return res.status(404).json({ error: 'Student not found' });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/students
router.post('/', authMiddleware, async (req, res) => {
    try {
        const {
            student_id, full_name, course_id, age, gender,
            birthdate, contact_number, address, guardian_name, guardian_contact
        } = req.body;

        if (!student_id || !full_name) {
            return res.status(400).json({ error: 'Student ID and full name are required' });
        }

        const { data, error } = await supabase
            .from('students')
            .insert({
                student_id, full_name, course_id, age: age ? parseInt(age) : null,
                gender, birthdate, contact_number, address, guardian_name, guardian_contact
            })
            .select('*, courses(course_code, course_name)')
            .single();

        if (error) return res.status(400).json({ error: error.message });
        res.status(201).json(data);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// PUT /api/students/:id
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const {
            student_id, full_name, course_id, age, gender,
            birthdate, contact_number, address, guardian_name, guardian_contact
        } = req.body;

        const { data, error } = await supabase
            .from('students')
            .update({
                student_id, full_name, course_id, age: age ? parseInt(age) : null,
                gender, birthdate, contact_number, address, guardian_name, guardian_contact
            })
            .eq('id', req.params.id)
            .select('*, courses(course_code, course_name)')
            .single();

        if (error) return res.status(400).json({ error: error.message });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// DELETE /api/students/:id
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const { error } = await supabase
            .from('students')
            .delete()
            .eq('id', req.params.id);
        if (error) return res.status(400).json({ error: error.message });
        res.json({ message: 'Student deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
