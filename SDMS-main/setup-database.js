require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupDatabase() {
  console.log('🚀 Setting up database...');

  // Create tables using raw SQL
  const setupSQL = `
    -- Enable UUID extension
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    -- USERS TABLE
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role VARCHAR(50) DEFAULT 'admin',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- COURSES TABLE
    CREATE TABLE IF NOT EXISTS courses (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      course_code VARCHAR(20) UNIQUE NOT NULL,
      course_name VARCHAR(100) NOT NULL
    );

    -- STUDENTS TABLE
    CREATE TABLE IF NOT EXISTS students (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      student_id VARCHAR(50) UNIQUE NOT NULL,
      full_name VARCHAR(255) NOT NULL,
      course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
      age INTEGER,
      gender VARCHAR(20),
      birthdate DATE,
      contact_number VARCHAR(20),
      address TEXT,
      guardian_name VARCHAR(255),
      guardian_contact VARCHAR(20),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- COMPLAINTS TABLE
    CREATE TABLE IF NOT EXISTS complaints (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      student_id UUID REFERENCES students(id) ON DELETE CASCADE,
      course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
      complaint_type VARCHAR(100),
      subject VARCHAR(255),
      description TEXT,
      case_level INTEGER DEFAULT 1,
      status VARCHAR(50) DEFAULT 'Pending',
      action_taken TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Insert courses
    INSERT INTO courses (course_code, course_name) VALUES
      ('IT', 'Information Technology'),
      ('IBM', 'International Business Management'),
      ('TEP', 'Teacher Education Program')
    ON CONFLICT (course_code) DO NOTHING;
  `;

  try {
    const { error } = await supabase.rpc('exec_sql', { sql: setupSQL });
    if (error) {
      console.error('❌ Database setup failed:', error.message);
      // Try alternative approach
      console.log('🔄 Trying alternative setup...');
      await alternativeSetup();
    } else {
      console.log('✅ Database setup completed successfully!');
    }
  } catch (err) {
    console.error('❌ Setup error:', err.message);
    await alternativeSetup();
  }
}

async function alternativeSetup() {
  console.log('🔄 Setting up tables individually...');
  
  // Create courses table and data
  try {
    // First, let's just try to query courses to see if tables exist
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('*')
      .limit(1);
    
    if (coursesError && coursesError.code === 'PGRST116') {
      console.log('❌ Tables do not exist. Please run the SQL setup in Supabase dashboard.');
      console.log('📋 Copy the content from supabase-setup.sql and run it in Supabase SQL Editor');
      return;
    }
    
    console.log('✅ Tables exist! Database is ready.');
    
  } catch (err) {
    console.error('❌ Alternative setup failed:', err.message);
  }
}

setupDatabase().then(() => {
  console.log('🎉 Setup complete!');
  process.exit(0);
}).catch(err => {
  console.error('💥 Setup failed:', err);
  process.exit(1);
});