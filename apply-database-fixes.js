const supabase = require('./server/supabase');

async function applyDatabaseFixes() {
    console.log('Applying database fixes...');
    
    try {
        // Add missing status column to violation_slips
        console.log('Adding status column to violation_slips...');
        const { error: statusError } = await supabase.rpc('exec_sql', {
            sql: `
                DO $$ 
                BEGIN
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'violation_slips' AND column_name = 'status') THEN
                        ALTER TABLE violation_slips ADD COLUMN status VARCHAR(50) DEFAULT 'Pending';
                        UPDATE violation_slips SET status = 'Pending' WHERE status IS NULL;
                    END IF;
                END $$;
            `
        });
        
        if (statusError) {
            console.log('Status column might already exist or using direct SQL...');
        } else {
            console.log('✅ Status column added to violation_slips');
        }
        
        // Add missing violation_id column to community_service
        console.log('Adding violation_id column to community_service...');
        const { error: violationIdError } = await supabase.rpc('exec_sql', {
            sql: `
                DO $$ 
                BEGIN
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'community_service' AND column_name = 'violation_id') THEN
                        ALTER TABLE community_service ADD COLUMN violation_id UUID REFERENCES violation_slips(id) ON DELETE SET NULL;
                    END IF;
                END $$;
            `
        });
        
        if (violationIdError) {
            console.log('Violation_id column might already exist or using direct SQL...');
        } else {
            console.log('✅ Violation_id column added to community_service');
        }
        
        // Test the fixes
        console.log('\nTesting fixes...');
        
        // Test violation_slips query
        const { data: vsData, error: vsError } = await supabase
            .from('violation_slips')
            .select('*')
            .limit(1);
            
        if (vsError) {
            console.error('❌ Violation slips test failed:', vsError.message);
        } else {
            console.log('✅ Violation slips query works');
            if (vsData.length > 0) {
                console.log('Columns:', Object.keys(vsData[0]));
            }
        }
        
        // Test community_service query
        const { data: csData, error: csError } = await supabase
            .from('community_service')
            .select('*')
            .limit(1);
            
        if (csError) {
            console.error('❌ Community service test failed:', csError.message);
        } else {
            console.log('✅ Community service query works');
            if (csData.length > 0) {
                console.log('Columns:', Object.keys(csData[0]));
            }
        }
        
    } catch (err) {
        console.error('❌ Database fix failed:', err.message);
        console.log('\n📝 Manual SQL to run in Supabase:');
        console.log(`
-- Add status column to violation_slips if it doesn't exist
ALTER TABLE violation_slips ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Pending';
UPDATE violation_slips SET status = 'Pending' WHERE status IS NULL;

-- Add violation_id column to community_service if it doesn't exist  
ALTER TABLE community_service ADD COLUMN IF NOT EXISTS violation_id UUID REFERENCES violation_slips(id) ON DELETE SET NULL;

-- Add other missing columns to community_service
ALTER TABLE community_service ADD COLUMN IF NOT EXISTS date_started DATE;
ALTER TABLE community_service ADD COLUMN IF NOT EXISTS date_completed DATE;
ALTER TABLE community_service ADD COLUMN IF NOT EXISTS verified_by VARCHAR(255);
ALTER TABLE community_service ADD COLUMN IF NOT EXISTS remarks TEXT;
        `);
    }
}

applyDatabaseFixes();