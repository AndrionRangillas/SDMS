const express = require('express');
const router = express.Router();
const supabase = require('../supabase');
const authMiddleware = require('../middleware/auth');

// GET /api/dashboard/stats
router.get('/stats', authMiddleware, async (req, res) => {
    try {
        const [
            { count: totalStudents },
            { count: totalComplaints },
            { count: pendingCases },
            { count: approvedCases },
            { count: resolvedCases },
            { count: maleStudents },
            { count: femaleStudents }
        ] = await Promise.all([
            supabase.from('students').select('*', { count: 'exact', head: true }),
            supabase.from('complaints').select('*', { count: 'exact', head: true }),
            supabase.from('complaints').select('*', { count: 'exact', head: true }).eq('status', 'Pending'),
            supabase.from('complaints').select('*', { count: 'exact', head: true }).eq('status', 'Approved'),
            supabase.from('complaints').select('*', { count: 'exact', head: true }).eq('status', 'Resolved'),
            supabase.from('students').select('*', { count: 'exact', head: true }).eq('gender', 'Male'),
            supabase.from('students').select('*', { count: 'exact', head: true }).eq('gender', 'Female')
        ]);

        res.json({
            totalStudents: totalStudents || 0,
            totalComplaints: totalComplaints || 0,
            pendingCases: pendingCases || 0,
            approvedCases: approvedCases || 0,
            resolvedCases: resolvedCases || 0,
            maleStudents: maleStudents || 0,
            femaleStudents: femaleStudents || 0
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/dashboard/chart
router.get('/chart', authMiddleware, async (req, res) => {
    try {
        const { filter = 'month', start, end } = req.query;

        let startDate, endDate;
        const now = new Date();

        switch (filter) {
            case 'today':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
                endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();
                break;
            case 'week': {
                const day = now.getDay();
                const diffToMonday = day === 0 ? -6 : 1 - day;
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday).toISOString();
                endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday + 6, 23, 59, 59).toISOString();
                break;
            }
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
                break;
            case 'custom':
                startDate = start ? new Date(start).toISOString() : new Date(0).toISOString();
                endDate = end ? new Date(end + 'T23:59:59').toISOString() : new Date().toISOString();
                break;
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
                endDate = new Date().toISOString();
        }

        // Get complaints in date range with course info
        const { data, error } = await supabase
            .from('complaints')
            .select('course_id, courses(course_code)')
            .gte('created_at', startDate)
            .lte('created_at', endDate);

        if (error) return res.status(400).json({ error: error.message });

        // Group by course
        const grouped = { IT: 0, IBM: 0, TEP: 0 };
        (data || []).forEach(c => {
            const code = c.courses?.course_code;
            if (code && grouped.hasOwnProperty(code)) {
                grouped[code]++;
            }
        });

        res.json({
            labels: Object.keys(grouped),
            values: Object.values(grouped),
            filter,
            startDate,
            endDate
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
