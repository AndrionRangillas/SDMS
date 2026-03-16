require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testAPIDirectly() {
  console.log('🧪 Testing API Directly');
  console.log('======================\n');

  try {
    // Simulate the exact same query the API should be doing
    console.log('1️⃣ Testing the exact API queries...');
    
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

    const result = {
      totalStudents: totalStudents || 0,
      totalComplaints: totalComplaints || 0,
      pendingCases: pendingCases || 0,
      approvedCases: approvedCases || 0,
      resolvedCases: resolvedCases || 0,
      maleStudents: maleStudents || 0,
      femaleStudents: femaleStudents || 0
    };

    console.log('✅ API Result (what the server should return):');
    console.log(JSON.stringify(result, null, 2));

    // Also check the actual student data to verify gender values
    console.log('\n2️⃣ Checking actual student gender data...');
    const { data: students } = await supabase
      .from('students')
      .select('student_id, full_name, gender');

    console.log('Students in database:');
    students.forEach(student => {
      console.log(`  ${student.student_id}: ${student.full_name} - Gender: "${student.gender}"`);
    });

    // Check for any gender value issues
    const genderCounts = {};
    students.forEach(student => {
      const gender = student.gender || 'null';
      genderCounts[gender] = (genderCounts[gender] || 0) + 1;
    });

    console.log('\n3️⃣ Gender distribution:');
    Object.entries(genderCounts).forEach(([gender, count]) => {
      console.log(`  ${gender}: ${count}`);
    });

  } catch (err) {
    console.error('❌ Test failed:', err.message);
  }
}

testAPIDirectly();