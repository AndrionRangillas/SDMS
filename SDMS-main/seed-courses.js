require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function seedCourses() {
  console.log('🌱 Seeding courses...');

  const courses = [
    { course_code: 'IT', course_name: 'Information Technology' },
    { course_code: 'IBM', course_name: 'International Business Management' },
    { course_code: 'TEP', course_name: 'Teacher Education Program' }
  ];

  try {
    // First, check if courses already exist
    const { data: existing, error: selectError } = await supabase
      .from('courses')
      .select('*');

    if (selectError) {
      console.error('❌ Error checking existing courses:', selectError.message);
      return;
    }

    console.log('📋 Existing courses:', existing);

    // Insert courses if they don't exist
    for (const course of courses) {
      const existingCourse = existing.find(c => c.course_code === course.course_code);
      
      if (!existingCourse) {
        const { data, error } = await supabase
          .from('courses')
          .insert(course)
          .select()
          .single();

        if (error) {
          console.error(`❌ Error inserting ${course.course_code}:`, error.message);
        } else {
          console.log(`✅ Inserted course: ${course.course_code} - ${course.course_name}`);
        }
      } else {
        console.log(`✅ Course already exists: ${course.course_code} - ${course.course_name}`);
      }
    }

    // Final check - list all courses
    const { data: finalCourses, error: finalError } = await supabase
      .from('courses')
      .select('*')
      .order('course_code');

    if (finalError) {
      console.error('❌ Error fetching final courses:', finalError.message);
    } else {
      console.log('\n🎉 Final courses in database:');
      finalCourses.forEach(course => {
        console.log(`   ${course.course_code} - ${course.course_name} (ID: ${course.id})`);
      });
    }

  } catch (err) {
    console.error('💥 Seed failed:', err.message);
  }
}

seedCourses().then(() => {
  console.log('\n🎉 Course seeding complete!');
  process.exit(0);
}).catch(err => {
  console.error('💥 Seed failed:', err);
  process.exit(1);
});