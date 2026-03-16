require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testCourses() {
  console.log('🧪 Testing Courses API');
  console.log('=====================\n');

  try {
    // Test direct database query
    console.log('1️⃣ Testing direct database query...');
    const { data: courses, error } = await supabase
      .from('courses')
      .select('*')
      .order('course_code');

    if (error) {
      console.error('❌ Database error:', error.message);
      return;
    }

    console.log('✅ Courses found:', courses.length);
    courses.forEach(course => {
      console.log(`   ${course.course_code}: ${course.course_name}`);
      console.log(`   ID: ${course.id}`);
      console.log('');
    });

    // Test if we can create a student with a valid course_id
    console.log('2️⃣ Testing student creation with valid course_id...');
    
    const testStudent = {
      student_id: 'TEST123',
      full_name: 'Test Student',
      course_id: courses[0].id // Use first course ID
    };

    console.log('Attempting to create student with course_id:', testStudent.course_id);

    const { data: newStudent, error: studentError } = await supabase
      .from('students')
      .insert(testStudent)
      .select('*')
      .single();

    if (studentError) {
      console.error('❌ Student creation error:', studentError.message);
    } else {
      console.log('✅ Test student created successfully:', newStudent.student_id);
      
      // Clean up - delete the test student
      await supabase.from('students').delete().eq('id', newStudent.id);
      console.log('✅ Test student cleaned up');
    }

  } catch (err) {
    console.error('❌ Test failed:', err.message);
  }
}

testCourses();