require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixDatabase() {
  console.log('🔧 Database Fix Tool');
  console.log('===================\n');

  try {
    // 1. First, ensure courses exist
    console.log('1️⃣ Checking and seeding courses...');
    
    const courses = [
      { course_code: 'IT', course_name: 'Information Technology' },
      { course_code: 'IBM', course_name: 'International Business Management' },
      { course_code: 'TEP', course_name: 'Teacher Education Program' }
    ];

    for (const course of courses) {
      const { data: existing } = await supabase
        .from('courses')
        .select('id')
        .eq('course_code', course.course_code)
        .single();

      if (!existing) {
        const { error } = await supabase
          .from('courses')
          .insert(course);
        
        if (error) {
          console.error(`❌ Error inserting course ${course.course_code}:`, error.message);
        } else {
          console.log(`✅ Course inserted: ${course.course_code}`);
        }
      } else {
        console.log(`✅ Course exists: ${course.course_code}`);
      }
    }

    // 2. Get all course IDs for reference
    const { data: allCourses } = await supabase
      .from('courses')
      .select('id, course_code, course_name');

    console.log('\n📋 Available courses:');
    allCourses.forEach(course => {
      console.log(`   ${course.course_code}: ${course.course_name} (ID: ${course.id})`);
    });

    // 3. Check for students with invalid course_id
    console.log('\n2️⃣ Checking for students with invalid course references...');
    
    const { data: studentsWithInvalidCourse } = await supabase
      .from('students')
      .select('id, student_id, full_name, course_id')
      .not('course_id', 'is', null);

    if (studentsWithInvalidCourse && studentsWithInvalidCourse.length > 0) {
      console.log(`Found ${studentsWithInvalidCourse.length} students with course references`);
      
      // Validate each student's course_id
      for (const student of studentsWithInvalidCourse) {
        const courseExists = allCourses.some(course => course.id === student.course_id);
        
        if (!courseExists) {
          console.log(`❌ Student ${student.student_id} has invalid course_id: ${student.course_id}`);
          
          // Set course_id to null for invalid references
          const { error } = await supabase
            .from('students')
            .update({ course_id: null })
            .eq('id', student.id);
            
          if (error) {
            console.error(`❌ Error fixing student ${student.student_id}:`, error.message);
          } else {
            console.log(`✅ Fixed student ${student.student_id} - set course_id to null`);
          }
        }
      }
    } else {
      console.log('✅ No students with invalid course references found');
    }

    // 4. Show summary
    console.log('\n3️⃣ Database summary:');
    
    const { data: courseCount } = await supabase
      .from('courses')
      .select('id', { count: 'exact' });
    
    const { data: studentCount } = await supabase
      .from('students')
      .select('id', { count: 'exact' });

    console.log(`📚 Total courses: ${courseCount?.length || 0}`);
    console.log(`👥 Total students: ${studentCount?.length || 0}`);

    console.log('\n🎉 Database fix complete!');
    console.log('\nNow you can:');
    console.log('- Add students and assign them to valid courses');
    console.log('- Use course IDs from the list above when creating students');
    
  } catch (err) {
    console.error('❌ Database fix failed:', err.message);
  }
}

fixDatabase();