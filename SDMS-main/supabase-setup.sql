-- ============================================================
-- SDMS-V3 Database Setup Script
-- Copy and paste this into Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS TABLE (Admin Accounts)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(50) DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- COURSES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_code VARCHAR(20) UNIQUE NOT NULL,
  course_name VARCHAR(100) NOT NULL
);

-- Seed courses
INSERT INTO courses (course_code, course_name) VALUES
  ('IT', 'Information Technology'),
  ('IBM', 'International Business Management'),
  ('TEP', 'Teacher Education Program')
ON CONFLICT (course_code) DO NOTHING;

-- ============================================================
-- STUDENTS TABLE
-- ============================================================
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

-- ============================================================
-- COMPLAINTS TABLE
-- ============================================================
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

-- ============================================================
-- VIOLATION SLIPS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS violation_slips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  violation TEXT NOT NULL,
  violation_count INTEGER DEFAULT 1,
  shb_article_section VARCHAR(100),
  sanction TEXT,
  date_of_violation DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- COMMUNITY SERVICE TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS community_service (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  hours_required INTEGER NOT NULL DEFAULT 0,
  hours_rendered INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(50) DEFAULT 'Partially Done',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- GOOD MORAL ISSUANCE TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS good_moral_issuance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  contact_number VARCHAR(20),
  email VARCHAR(255),
  program VARCHAR(100),
  purpose TEXT,
  date_requested TIMESTAMPTZ,
  date_processed TIMESTAMPTZ DEFAULT NOW(),
  processed_by VARCHAR(255),
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CERTIFICATES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  issued_date TIMESTAMPTZ DEFAULT NOW(),
  issued_by VARCHAR(255),
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);