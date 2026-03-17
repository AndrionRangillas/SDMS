const express = require('express');
const router = express.Router();
const supabase = require('../supabase');
const authMiddleware = require('../middleware/auth');

// GET /api/violations
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { search = '', page = 1, limit = 10 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        let query = supabase
            .from('violation_slips')
            .select(`
                *,
                students(student_id, full_name, courses(course_code))
            `, { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + parseInt(limit) - 1);

        if (search) {
            const { data: stData } = await supabase
                .from('students')
                .select('id')
                .or(`full_name.ilike.%${search}%,student_id.ilike.%${search}%`);
            const matchedIds = stData?.map(s => s.id) || [];

            let orConditions = [
                `violation.ilike.%${search}%`,
                `shb_article_section.ilike.%${search}%`,
                `sanction.ilike.%${search}%`,
                `status.ilike.%${search}%`
            ];
            
            if (matchedIds.length > 0) {
                orConditions.push(`student_id.in.(${matchedIds.join(',')})`);
            }

            query = query.or(orConditions.join(','));
        }

        const { data, error, count } = await query;

        if (error) return res.status(400).json({ error: error.message });

        // Manually fetch community service records for each violation
        if (data && data.length > 0) {
            for (let violation of data) {
                const { data: csData } = await supabase
                    .from('community_service')
                    .select('*')
                    .eq('student_id', violation.student_id);
                violation.community_service = csData || [];
            }
        }

        res.json({ data, count, page: parseInt(page), limit: parseInt(limit) });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/violations
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { student_id, violation, shb_article_section, sanction, date_of_violation, status = 'Pending' } = req.body;
        if (!student_id || !violation) {
            return res.status(400).json({ error: 'Student and violation are required' });
        }

        // Count existing violations for this student
        const { count: existing } = await supabase
            .from('violation_slips')
            .select('*', { count: 'exact', head: true })
            .eq('student_id', student_id);

        const { data: insertedViol, error } = await supabase
            .from('violation_slips')
            .insert({
                student_id, violation,
                violation_count: (existing || 0) + 1,
                shb_article_section, sanction,
                status: status || 'Pending',
                date_of_violation: date_of_violation || new Date().toISOString().split('T')[0]
            })
            .select(`
                *,
                students(student_id, full_name, courses(course_code))
            `)
            .single();

        if (error) return res.status(400).json({ error: error.message });

        // Auto-create Community Service record if sanction includes "Community Service"
        if (sanction && sanction.toLowerCase().includes('community service')) {
            // Try to extract hours from string like "8 hours community service"
            const match = sanction.match(/(\d+)\s*hour/i);
            const hoursRequired = match ? parseInt(match[1]) : 0;
            
            await supabase.from('community_service').insert({
                student_id,
                hours_required: hoursRequired,
                status: 'Partially Done'
            });
            
            // Fetch community service records for this student
            const { data: csData } = await supabase
                .from('community_service')
                .select('*')
                .eq('student_id', student_id);
                
            const result = { ...insertedViol, community_service: csData || [] };
            return res.status(201).json(result);
        }

        res.status(201).json(insertedViol);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// PUT /api/violations/:id
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { violation, shb_article_section, sanction, date_of_violation, status } = req.body;
        
        let updateData = { violation, shb_article_section, sanction, date_of_violation };
        if (status) updateData.status = status;

        const { data, error } = await supabase
            .from('violation_slips')
            .update(updateData)
            .eq('id', req.params.id)
            .select(`
                *,
                students(student_id, full_name, courses(course_code))
            `)
            .single();

        if (error) return res.status(400).json({ error: error.message });

        // Manually fetch community service records for this student
        const { data: csData } = await supabase
            .from('community_service')
            .select('*')
            .eq('student_id', data.student_id);
        
        const result = { ...data, community_service: csData || [] };
        res.json(result);
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
