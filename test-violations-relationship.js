const supabase = require('./server/supabase');

async function testViolationsRelationship() {
    console.log('Testing violations query without relationship...');
    
    try {
        // Test the query without the problematic relationship
        const { data, error } = await supabase
            .from('violation_slips')
            .select(`
                *,
                students(student_id, full_name, courses(course_code))
            `)
            .limit(5);
            
        if (error) {
            console.error('❌ Query failed:', error.message);
            return;
        }
        
        console.log('✅ Query successful!');
        console.log(`Found ${data.length} violation records`);
        
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
        
        // Check if any have community service records
        const withCommunityService = data.filter(v => v.community_service && v.community_service.length > 0);
        console.log(`${withCommunityService.length} violations have community service records`);
        
        if (data.length > 0) {
            console.log('\nSample record structure:');
            console.log(JSON.stringify(data[0], null, 2));
        }
        
    } catch (err) {
        console.error('❌ Test failed:', err.message);
    }
}

testViolationsRelationship();