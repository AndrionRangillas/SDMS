require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testStudentsAPI() {
  console.log('🧪 Testing Students API with Course Join');
  console.log('========================================\n');

  try {
    // Test the updated query with course join
    console.log('1️⃣ Testing students query with course join...');
    
    const { data: students, error } = await supabase
      .from('students')
      .select(`
        *,
        courses (
          id,
          course_code,
          course_name
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Query error:', error.message);
      return;
    }

    console.log(`✅ Found ${students.length} students`);
    
    students.forEach(student => {
      console.log(`\n📋 Student: ${student.full_name} (${student.student_id})`);
      if (student.courses) {
        console.log(`   Course: ${student.courses.course_code} — ${student.courses.course_name}`);
        console.log(`   Course ID: ${student.courses.id}`);
      } else if (student.course_id) {
        console.log(`   Course ID: ${student.course_id} (No course data found)`);
      } else {
        console.log('   Course: Not assigned');
      }
    });

    // Test creating a new student with course
    console.log('\n2️⃣ Testing student creation with course assignment...');
    
    const { data: courses } = await supabase
      .from('courses')
      .select('*')
      .limit(1);

    if (courses && courses.length > 0) {
      const testStudent = {
        student_id: 'API-TEST-' + Date.now(),
        full_name: 'API Test Student',
        course_id: courses[0].id,
        gender: 'Male',
        age: 20
      };

      const { data: newStudent, error: createError } = await supabase
        .from('students')
        .insert(testStudent)
        .select(`
          *,
          courses (
            id,
            course_code,
            course_name
          )
        `)
        .single();

      if (createError) {
        console.error('❌ Create error:', createError.message);
      } else {
        console.log('✅ Student created successfully:');
        console.log(`   Name: ${newStudent.full_name}`);
        console.log(`   ID: ${newStudent.student_id}`);
        if (newStudent.courses) {
          console.log(`   Course: ${newStudent.courses.course_code} — ${newStudent.courses.course_name}`);
        }

        // Clean up
        await supabase.from('students').delete().eq('id', newStudent.id);
        console.log('✅ Test student cleaned up');
      }
    }

  } catch (err) {
    console.error('❌ Test failed:', err.message);
  }
}

testStudentsAPI();