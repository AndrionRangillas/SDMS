const supabase = require('./server/supabase');

async function checkDatabaseStructure() {
    console.log('Checking database structure...');
    
    try {
        // Check if community_service table exists and its structure
        const { data: csData, error: csError } = await supabase
            .from('community_service')
            .select('*')
            .limit(1);
            
        if (csError) {
            console.error('❌ Community service table error:', csError.message);
        } else {
            console.log('✅ Community service table exists');
            if (csData.length > 0) {
                console.log('Sample community service record:', Object.keys(csData[0]));
            }
        }
        
        // Check if violation_slips table exists
        const { data: vsData, error: vsError } = await supabase
            .from('violation_slips')
            .select('*')
            .limit(1);
            
        if (vsError) {
            console.error('❌ Violation slips table error:', vsError.message);
        } else {
            console.log('✅ Violation slips table exists');
            if (vsData.length > 0) {
                console.log('Sample violation slip record:', Object.keys(vsData[0]));
            }
        }
        
        // Try a simple query without joins first
        const { data: simpleData, error: simpleError } = await supabase
            .from('violation_slips')
            .select('*')
            .limit(5);
            
        if (simpleError) {
            console.error('❌ Simple violation query failed:', simpleError.message);
        } else {
            console.log('✅ Simple violation query works, found', simpleData.length, 'records');
        }
        
    } catch (err) {
        console.error('❌ Database check failed:', err.message);
    }
}

checkDatabaseStructure();