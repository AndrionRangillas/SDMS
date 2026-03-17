const express = require('express');
const router = express.Router();
const supabase = require('../supabase');
const authMiddleware = require('../middleware/auth');

// GET /api/history
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { status, course, start, end, search, page = 1, limit = 10 } = req.query;
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

        if (status) query = query.eq('status', status);
        if (start) query = query.gte('created_at', new Date(start).toISOString());
        if (end) query = query.lte('created_at', new Date(end + 'T23:59:59').toISOString());

        if (search) {
            const { data: stData } = await supabase
                .from('students')
                .select('id')
                .or(`full_name.ilike.%${search}%,student_id.ilike.%${search}%`);
            
            const matchedIds = stData?.map(s => s.id) || [];
            
            if (matchedIds.length > 0) {
                query = query.or(`subject.ilike.%${search}%,complaint_type.ilike.%${search}%,student_id.in.(${matchedIds.join(',')})`);
            } else {
                query = query.or(`subject.ilike.%${search}%,complaint_type.ilike.%${search}%`);
            }
        }

        const { data, error, count } = await query;
        if (error) return res.status(400).json({ error: error.message });

        // Filter by course in JS (since course is in joined table)
        let filtered = data;
        if (course) {
            filtered = data.filter(c => c.courses?.course_code === course);
        }

        res.json({ data: filtered, count, page: parseInt(page), limit: parseInt(limit) });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
