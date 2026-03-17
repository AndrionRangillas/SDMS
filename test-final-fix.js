const supabase = require('./server/supabase');

async function testFinalFix() {
    console.log('Testing the final fix for violations...');
    
    try {
        // Test the exact query that the violations route uses
        const { search = '', page = 1, limit = 10 } = { page: 1, limit: 5 };
        const offset = (parseInt(page) - 1) * parseInt(limit);

        let query = supabase
            .from('violation_slips')
            .select(`
                *,
                students(student_id, full_name, courses(course_code))
            `, { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + parseInt(limit) - 1);

        const { data, error, count } = await query;

        if (error) {
            console.error('❌ Query failed:', error.message);
            return;
        }

        console.log('✅ Violations query successful!');
        console.log(`Found ${data.length} violations (total: ${count})`);

        // Manually fetch community service records for each violation (as the route does)
        if (data && data.length > 0) {
            for (let violation of data) {
                const { data: csData } = await supabase
                    .from('community_service')
                    .select('*')
                    .eq('student_id', violation.student_id);
                violation.community_service = csData || [];
            }
        }

        // Check results
        const withCommunityService = data.filter(v => v.community_service && v.community_service.length > 0);
        console.log(`${withCommunityService.length} violations have community service records`);

        console.log('\n✅ Fix verified! The violations endpoint should now work properly.');
        console.log('The frontend should be able to load violations without the relationship error.');

        if (data.length > 0) {
            console.log('\nSample violation structure:');
            const sample = { ...data[0] };
            // Truncate for readability
            if (sample.community_service) sample.community_service = `[${sample.community_service.length} records]`;
            console.log(JSON.stringify(sample, null, 2));
        }

    } catch (err) {
        console.error('❌ Test failed:', err.message);
    }
}

testFinalFix();