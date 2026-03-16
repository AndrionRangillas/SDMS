require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function seed() {
  console.log('🌱 Starting seed...');

  // Seed courses
  const courses = [
    { course_code: 'IT', course_name: 'Information Technology' },
    { course_code: 'IBM', course_name: 'International Business Management' },
    { course_code: 'TEP', course_name: 'Teacher Education Program' }
  ];

  for (const course of courses) {
    const { error } = await supabase
      .from('courses')
      .upsert(course, { onConflict: 'course_code' });
    if (error) console.error('Course seed error:', error.message);
    else console.log(`✅ Course seeded: ${course.course_code}`);
  }

  // Seed admin user
  const adminEmail = 'adonisonahon@gmail.com';
  const adminPassword = 'onahon123';
  const hash = await bcrypt.hash(adminPassword, 12);

  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', adminEmail)
    .single();

  if (existing) {
    const { error } = await supabase
      .from('users')
      .update({ password_hash: hash })
      .eq('email', adminEmail);
    if (error) console.error('Admin update error:', error.message);
    else console.log('✅ Admin account updated');
  } else {
    const { error } = await supabase
      .from('users')
      .insert({ email: adminEmail, password_hash: hash, role: 'admin' });
    if (error) console.error('Admin insert error:', error.message);
    else console.log('✅ Admin account created');
  }

  console.log('\n🎉 Seed complete!');
  console.log('📧 Email:    adonisonahon@gmail.com');
  console.log('🔑 Password: onahon123');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
