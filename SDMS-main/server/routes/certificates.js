const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const supabase = require('../supabase');
const authMiddleware = require('../middleware/auth');

// Check eligibility for Good Moral Certificate
async function checkEligibility(studentId) {
    // 1. Check active complaints (Pending or Approved)
    const { count: activeComplaints } = await supabase
        .from('complaints')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', studentId)
        .in('status', ['Pending', 'Approved']);

    if (activeComplaints > 0) {
        return { eligible: false, reason: 'Student has active unresolved complaints.' };
    }

    // 2. Check pending community service
    const { count: pendingCS } = await supabase
        .from('community_service')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', studentId)
        .eq('status', 'Partially Done');

    if (pendingCS > 0) {
        return { eligible: false, reason: 'Student has incomplete community service obligations.' };
    }

    // 3. Check pending violation sanctions (no check needed if CS is done)
    return { eligible: true, reason: 'Student meets all eligibility requirements.' };
}

// GET /api/certificates/check/:student_id
router.get('/check/:student_id', authMiddleware, async (req, res) => {
    try {
        const result = await checkEligibility(req.params.student_id);
        const { data: student } = await supabase
            .from('students')
            .select('*, courses(course_code, course_name)')
            .eq('id', req.params.student_id)
            .single();

        res.json({ ...result, student });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/certificates/generate
router.post('/generate', authMiddleware, async (req, res) => {
    try {
        const { student_id } = req.body;
        if (!student_id) return res.status(400).json({ error: 'Student ID required' });

        // Check eligibility
        const eligibility = await checkEligibility(student_id);
        if (!eligibility.eligible) {
            return res.status(403).json({
                error: 'Student is NOT eligible for Good Moral Certificate',
                reason: eligibility.reason
            });
        }

        // Fetch student data
        const { data: student, error: stuErr } = await supabase
            .from('students')
            .select('*, courses(course_code, course_name)')
            .eq('id', student_id)
            .single();

        if (stuErr || !student) return res.status(404).json({ error: 'Student not found' });

        const issuedDate = new Date().toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        });

        // Save certificate record
        await supabase.from('certificates').insert({
            student_id,
            issued_date: new Date().toISOString(),
            issued_by: req.user.email
        });

        // Generate PDF
        const doc = new PDFDocument({ size: 'A4', margin: 80 });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="GoodMoral_${student.student_id}.pdf"`);
        doc.pipe(res);

        // Add NBSC Logo and text on the left
        try {
            // The correct path from server/routes/ to public/
            const logoPath = path.join(__dirname, '../../public/nbsclogo.png');
            console.log('Attempting to load logo from:', logoPath);
            
            if (fs.existsSync(logoPath)) {
                // Logo positioned on the left
                doc.image(logoPath, 80, 80, { width: 80, height: 80 });
                console.log('✅ Logo loaded successfully');
            } else {
                console.warn('❌ Logo file not found at:', logoPath);
                // Add a placeholder circle if logo is not found
                doc.circle(120, 120, 40).stroke();
            }
            
            // Add "NBSC" text below the logo
            doc.fontSize(16).font('Helvetica-Bold').text('NBSC', 80, 170, { width: 80, align: 'center' });
            
        } catch (logoError) {
            console.warn('Error loading logo:', logoError.message);
            // Add a placeholder circle if logo loading fails
            doc.circle(120, 120, 40).stroke();
            doc.fontSize(16).font('Helvetica-Bold').text('NBSC', 80, 170, { width: 80, align: 'center' });
        }

        // Header text on the right side (starting from x: 180)
        doc.fontSize(14).font('Helvetica').text('Republic of the Philippines', 180, 85, { align: 'center', width: 335 });
        doc.fontSize(16).font('Helvetica-Bold').text('NORTHERN BUKIDNON STATE COLLEGE', 180, 102, { align: 'center', width: 335 });
        doc.fontSize(11).font('Helvetica-Oblique').text('(Formerly Northern Bukidnon Community College) R.A.11284', 180, 120, { align: 'center', width: 335 });
        doc.fontSize(12).font('Helvetica').text('Manolo Fortich, 8703 Bukidnon', 180, 135, { align: 'center', width: 335 });
        doc.fontSize(10).font('Helvetica-Oblique').text('Creando futura, Transformationis vitae, Ductae a Deo', 180, 150, { align: 'center', width: 335 });
        
        // Horizontal line below header
        doc.moveTo(80, 190).lineTo(515, 190).stroke();
        
        // Department name below the line
        doc.fontSize(18).font('Helvetica-Bold').text('Student Discipline Office', 80, 210, { align: 'center', width: 435 });

        // Title - "CERTIFICATION" in red
        doc.fontSize(28).font('Helvetica-Bold').fillColor('red').text('CERTIFICATION', 80, 240, { align: 'center', width: 435 });
        
        // Reset color to black for the rest of the document
        doc.fillColor('black');
        doc.moveDown(3);

        // Body
        doc.fontSize(12).font('Helvetica').text('TO WHOM IT MAY CONCERN:', 80, 290, { align: 'left' });
        doc.moveDown(1);
        
        const bodyY = doc.y + 20;
        doc.fontSize(12).text(
            `This is to certify that `, 80, bodyY, { continued: true }
        );
        doc.font('Helvetica-Bold').text(student.full_name.toUpperCase(), { continued: true });
        doc.font('Helvetica').text(
            `, a student of this institution taking up `,
            { continued: true }
        );
        doc.font('Helvetica-Bold').text(
            student.courses
                ? `${student.courses.course_name} (${student.courses.course_code})`
                : 'N/A',
            { continued: true }
        );
        doc.font('Helvetica').text(
            `, is known to be of good moral character and has no pending disciplinary cases on record.`,
            { align: 'justify', width: 435 }
        );
        doc.moveDown(1);
        doc.text(
            'This certification is issued upon request of the above-named student for whatever legal purpose it may serve.',
            { align: 'justify', width: 435 }
        );
        doc.moveDown(2);

        // Date
        doc.text(`Issued on: ${issuedDate}`, { align: 'left' });
        doc.moveDown(3);

        // Signature
        doc.text('____________________________', { align: 'center' });
        doc.font('Helvetica-Bold').text('PREFECT OF STUDENT DISCIPLINE', { align: 'center' });
        doc.font('Helvetica').fontSize(10).text('Authorized Signatory', { align: 'center' });
        doc.moveDown(2);

        // Footer
        doc.moveTo(80, doc.y).lineTo(515, doc.y).stroke();
        doc.moveDown(0.5);
        doc.fontSize(9).text('Student Discipline Management System — SDMS-V3', { align: 'center', color: '#888' });

        doc.end();
    } catch (err) {
        console.error('Certificate generation error:', err);
        res.status(500).json({ error: 'Failed to generate certificate' });
    }
});

// GET /api/certificates/:student_id - history
router.get('/:student_id', authMiddleware, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('certificates')
            .select('*')
            .eq('student_id', req.params.student_id)
            .order('issued_date', { ascending: false });

        if (error) return res.status(400).json({ error: error.message });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
