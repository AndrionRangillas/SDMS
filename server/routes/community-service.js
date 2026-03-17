const express = require('express');
const router = express.Router();
const supabase = require('../supabase');
const authMiddleware = require('../middleware/auth');

// GET /api/community-service
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { search = '', page = 1, limit = 10 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        let query = supabase
            .from('community_service')
            .select('*, students(student_id, full_name, courses(course_code, course_name)), violation_slips(violation, sanction, status)', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + parseInt(limit) - 1);

        if (search) {
            const { data: stData } = await supabase
                .from('students')
                .select('id')
                .or(`full_name.ilike.%${search}%,student_id.ilike.%${search}%`);
            const matchedIds = stData?.map(s => s.id) || [];

            const { data: violData } = await supabase
                .from('violation_slips')
                .select('id')
                .ilike('violation', `%${search}%`);
            const violIds = violData?.map(v => v.id) || [];

            let orConditions = [
                `remarks.ilike.%${search}%`,
                `verified_by.ilike.%${search}%`,
                `status.ilike.%${search}%`
            ];
            
            if (matchedIds.length > 0) orConditions.push(`student_id.in.(${matchedIds.join(',')})`);
            if (violIds.length > 0) orConditions.push(`violation_id.in.(${violIds.join(',')})`);

            query = query.or(orConditions.join(','));
        }

        const { data, error, count } = await query;

        if (error) return res.status(400).json({ error: error.message });
        res.json({ data, count, page: parseInt(page), limit: parseInt(limit) });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/community-service
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { student_id, violation_id, hours_required, hours_rendered, date_started, date_completed, verified_by, remarks } = req.body;
        if (!student_id || hours_required === undefined) {
            return res.status(400).json({ error: 'Student and hours_required are required' });
        }

        const rendered = parseInt(hours_rendered) || 0;
        const required = parseInt(hours_required);
        const status = rendered >= required ? 'Completed' : 'Partially Done';

        const { data, error } = await supabase
            .from('community_service')
            .insert({ 
                student_id, 
                violation_id: violation_id || null,
                hours_required: required, 
                hours_rendered: rendered, 
                status,
                date_started,
                date_completed,
                verified_by,
                remarks
            })
            .select('*, students(student_id, full_name, courses(course_code, course_name)), violation_slips(violation)')
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
        const { hours_rendered, hours_required, date_started, date_completed, verified_by, remarks } = req.body;

        // Get existing record for hours_required if not provided and to check violation link
        const { data: existing } = await supabase
            .from('community_service')
            .select('hours_required, violation_id, status')
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
                date_started,
                date_completed,
                verified_by,
                remarks,
                updated_at: new Date().toISOString()
            })
            .eq('id', req.params.id)
            .select('*, students(student_id, full_name, courses(course_code, course_name)), violation_slips(violation)')
            .single();

        if (error) return res.status(400).json({ error: error.message });

        // Rule 3: Auto-update linked violation slip if CS becomes Completed
        if (status === 'Completed' && existing?.status !== 'Completed' && existing?.violation_id) {
            await supabase
                .from('violation_slips')
                .update({ status: 'Completed' })
                .eq('id', existing.violation_id);
        }

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
