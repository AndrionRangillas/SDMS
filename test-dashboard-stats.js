require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testDashboardStats() {
  console.log('🧪 Testing Dashboard Stats API');
  console.log('==============================\n');

  try {
    // Test individual queries
    console.log('1️⃣ Testing individual gender queries...');
    
    const { count: totalStudents } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true });
    
    const { count: maleStudents } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('gender', 'Male');
    
    const { count: femaleStudents } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('gender', 'Female');

    console.log('Total Students:', totalStudents);
    console.log('Male Students:', maleStudents);
    console.log('Female Students:', femaleStudents);

    // Test actual student data
    console.log('\n2️⃣ Testing actual student data...');
    
    const { data: allStudents } = await supabase
      .from('students')
      .select('student_id, full_name, gender');

    console.log('All students:');
    allStudents.forEach(student => {
      console.log(`  ${student.student_id}: ${student.full_name} - ${student.gender || 'No gender'}`);
    });

    // Count manually
    const manualMaleCount = allStudents.filter(s => s.gender === 'Male').length;
    const manualFemaleCount = allStudents.filter(s => s.gender === 'Female').length;
    
    console.log('\n3️⃣ Manual count verification:');
    console.log('Manual Male Count:', manualMaleCount);
    console.log('Manual Female Count:', manualFemaleCount);

    // Test the full stats query like the API does
    console.log('\n4️⃣ Testing full stats query...');
    
    const [
      { count: apiTotalStudents },
      { count: apiMaleStudents },
      { count: apiFemaleStudents }
    ] = await Promise.all([
      supabase.from('students').select('*', { count: 'exact', head: true }),
      supabase.from('students').select('*', { count: 'exact', head: true }).eq('gender', 'Male'),
      supabase.from('students').select('*', { count: 'exact', head: true }).eq('gender', 'Female')
    ]);

    const result = {
      totalStudents: apiTotalStudents || 0,
      maleStudents: apiMaleStudents || 0,
      femaleStudents: apiFemaleStudents || 0
    };

    console.log('API Result:', result);

  } catch (err) {
    console.error('❌ Test failed:', err.message);
  }
}

testDashboardStats();