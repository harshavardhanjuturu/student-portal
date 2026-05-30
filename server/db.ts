import pg from 'pg';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const { Pool } = pg;

// Check if PostgreSQL variables are defined
const hasPostgresConfig = !!(
  process.env.PGHOST &&
  process.env.PGUSER &&
  process.env.PGPASSWORD &&
  process.env.PGDATABASE
);

let pool: pg.Pool | null = null;
let isPostgresActive = false;

// Attempt to connect to PostgreSQL if configured
if (hasPostgresConfig) {
  try {
    pool = new Pool({
      host: process.env.PGHOST,
      port: Number(process.env.PGPORT) || 5432,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      database: process.env.PGDATABASE,
      connectionTimeoutMillis: 5000,
    });
    isPostgresActive = true;
    console.log('🔌 PostgreSQL database adapter initialized.');
  } catch (err) {
    console.warn('⚠️ Standard PostgreSQL connection initialization failed. Falling back to local state engine.', err);
    isPostgresActive = false;
  }
} else {
  console.log('🛡️ PostgreSQL not configured in environment. Seamless fallback JSON state engine active.');
}

// Ensure the local database file exists for the fallback engine
const LOCAL_DB_PATH = path.join(process.cwd(), 'db-local.json');

// Interface representation for local JSON storage
interface LocalDatabase {
  users: any[];
  courses: any[];
  enrollments: any[];
  fees?: any[];
  activity_logs?: any[];
  notifications?: any[];
  exams?: any[];
  marks?: any[];
  assignments?: any[];
  submissions?: any[];
  attendance?: any[];
  fee_structures?: any[];
}

// Seed helper hashes
const SAMPLE_ADMIN_HASH = bcrypt.hashSync('admin123', 10);
const SAMPLE_FACULTY_HASH = bcrypt.hashSync('faculty123', 10);
const SAMPLE_STUDENT_HASH = bcrypt.hashSync('student123', 10);

// Default initial seed data matching schema.sql
const DEFAULT_DATABASE: LocalDatabase = {
  users: [
    {
      id: 'admin-uuid-1',
      email: 'admin@portal.com',
      password_hash: SAMPLE_ADMIN_HASH,
      name: 'System Administrator',
      role: 'ADMIN',
      registration_number: 'ADM2026001',
      department: 'Administration',
      phone: '+1234567890',
      created_at: new Date().toISOString()
    },
    {
      id: 'faculty-uuid-1',
      email: 'dr.smith@portal.com',
      password_hash: SAMPLE_FACULTY_HASH,
      name: 'Dr. Sarah Smith',
      role: 'FACULTY',
      registration_number: 'FAC2026001',
      department: 'Computer Science',
      phone: '+1234567891',
      created_at: new Date().toISOString()
    },
    {
      id: 'faculty-uuid-2',
      email: 'prof.jones@portal.com',
      password_hash: SAMPLE_FACULTY_HASH,
      name: 'Prof. David Jones',
      role: 'FACULTY',
      registration_number: 'FAC2026002',
      department: 'Electrical Engineering',
      phone: '+1234567892',
      created_at: new Date().toISOString()
    },
    {
      id: 'student-uuid-1',
      email: 'alice@portal.com',
      password_hash: SAMPLE_STUDENT_HASH,
      name: 'Alice Cooper',
      role: 'STUDENT',
      registration_number: 'STU2026001',
      department: 'Computer Science',
      phone: '+1234567893',
      created_at: new Date().toISOString()
    },
    {
      id: 'student-uuid-2',
      email: 'bob@portal.com',
      password_hash: SAMPLE_STUDENT_HASH,
      name: 'Bob Johnson',
      role: 'STUDENT',
      registration_number: 'STU2026002',
      department: 'Computer Science',
      phone: '+1234567894',
      created_at: new Date().toISOString()
    },
    {
      id: 'student-uuid-3',
      email: 'charlie@portal.com',
      password_hash: SAMPLE_STUDENT_HASH,
      name: 'Charlie Brown',
      role: 'STUDENT',
      registration_number: 'STU2026003',
      department: 'Electrical Engineering',
      phone: '+1234567895',
      created_at: new Date().toISOString()
    }
  ],
  courses: [
    {
      id: 'course-uuid-1',
      code: 'CS101',
      name: 'Introduction to Computer Science',
      description: 'Fundamental concepts of programming, algorithms, and data structures.',
      credits: 4,
      department: 'Computer Science',
      faculty_id: 'faculty-uuid-1'
    },
    {
      id: 'course-uuid-2',
      code: 'CS301',
      name: 'Database Systems',
      description: 'Relational database model, SQL, normalization, transactions, and indexing.',
      credits: 3,
      department: 'Computer Science',
      faculty_id: 'faculty-uuid-1'
    },
    {
      id: 'course-uuid-3',
      code: 'EE110',
      name: 'Basic Circuit Theory',
      description: 'Analysis of resistive circuits, nodal and mesh analysis, and network theorems.',
      credits: 4,
      department: 'Electrical Engineering',
      faculty_id: 'faculty-uuid-2'
    },
    {
      id: 'course-uuid-4',
      code: 'EE410',
      name: 'Digital Signal Processing',
      description: 'Discrete-time signals and systems, Z-transform, DFT, and filter design.',
      credits: 3,
      department: 'Electrical Engineering',
      faculty_id: 'faculty-uuid-2'
    }
  ],
  enrollments: [
    {
      id: 'enroll-uuid-1',
      student_id: 'student-uuid-1',
      course_id: 'course-uuid-1',
      grade: 'A',
      attendance_percentage: 95.00,
      created_at: new Date().toISOString()
    },
    {
      id: 'enroll-uuid-2',
      student_id: 'student-uuid-1',
      course_id: 'course-uuid-2',
      grade: 'B+',
      attendance_percentage: 88.50,
      created_at: new Date().toISOString()
    },
    {
      id: 'enroll-uuid-3',
      student_id: 'student-uuid-2',
      course_id: 'course-uuid-1',
      grade: 'Pending',
      attendance_percentage: 92.00,
      created_at: new Date().toISOString()
    },
    {
      id: 'enroll-uuid-4',
      student_id: 'student-uuid-3',
      course_id: 'course-uuid-3',
      grade: 'A',
      attendance_percentage: 98.00,
      created_at: new Date().toISOString()
    },
    {
      id: 'enroll-uuid-5',
      student_id: 'student-uuid-3',
      course_id: 'course-uuid-4',
      grade: 'Pending',
      attendance_percentage: 78.20,
      created_at: new Date().toISOString()
    }
  ],
  fees: [
    {
      id: 'fee-uuid-1',
      student_id: 'student-uuid-1',
      title: 'Spring Semester 2026 CSE Tuition',
      amount: 4500.00,
      due_date: '2026-02-15',
      status: 'PAID',
      amount_paid: 4500.00,
      paid_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    },
    {
      id: 'fee-uuid-2',
      student_id: 'student-uuid-2',
      title: 'Spring Semester 2026 CSE Tuition',
      amount: 4500.00,
      due_date: '2026-02-15',
      status: 'PAID',
      amount_paid: 4500.00,
      paid_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    },
    {
      id: 'fee-uuid-3',
      student_id: 'student-uuid-3',
      title: 'Spring Semester 2026 EEE Tuition & Lab Fee',
      amount: 4750.00,
      due_date: '2026-02-15',
      status: 'UNPAID',
      amount_paid: 0.00,
      paid_at: null,
      created_at: new Date().toISOString()
    }
  ],
  activity_logs: [
    {
      id: 'log-uuid-1',
      user_id: 'admin-uuid-1',
      action: 'USER_REGISTERED',
      entity: 'USERS',
      entity_id: 'student-uuid-3',
      details: 'Newly added student Charlie Brown',
      ip_address: '192.168.1.10',
      created_at: new Date().toISOString()
    },
    {
      id: 'log-uuid-2',
      user_id: 'faculty-uuid-1',
      action: 'CURRICULUM_ADDED',
      entity: 'COURSES',
      entity_id: 'course-uuid-1',
      details: 'Assigned syllabus outline for CS101 Computer Science',
      ip_address: '195.42.10.88',
      created_at: new Date().toISOString()
    }
  ],
  exams: [
    {
      id: 'exam-uuid-1',
      course_id: 'course-uuid-1',
      title: 'CS101 Midterm Examination',
      type: 'MIDTERM',
      max_marks: 100,
      created_at: new Date().toISOString()
    },
    {
      id: 'exam-uuid-2',
      course_id: 'course-uuid-2',
      title: 'CS301 Quiz 1',
      type: 'QUIZ',
      max_marks: 50,
      created_at: new Date().toISOString()
    }
  ],
  marks: [
    {
      id: 'mark-uuid-1',
      exam_id: 'exam-uuid-1',
      student_id: 'student-uuid-1',
      obtained_marks: 92.00,
      grade_point: 9.50,
      remarks: 'Outstanding analytical response.',
      created_at: new Date().toISOString()
    },
    {
      id: 'mark-uuid-2',
      exam_id: 'exam-uuid-1',
      student_id: 'student-uuid-2',
      obtained_marks: 78.50,
      grade_point: 8.00,
      remarks: 'Solid understanding of fundamental structures.',
      created_at: new Date().toISOString()
    }
  ],
  assignments: [
    {
      id: 'assign-uuid-1',
      course_id: 'course-uuid-1',
      title: 'Homework #1: Algorithm Design',
      description: 'Design pseudocode and flowcharts for sorting and searching arrays.',
      max_score: 100,
      due_date: '2026-06-25T23:59:00Z',
      created_at: new Date().toISOString()
    },
    {
      id: 'assign-uuid-2',
      course_id: 'course-uuid-2',
      title: 'Homework #2: Schema Normalization',
      description: 'Complete 3NF translation exercises for a given corporate database schema.',
      max_score: 100,
      due_date: '2026-06-28T23:59:00Z',
      created_at: new Date().toISOString()
    }
  ],
  submissions: [
    {
      id: 'sub-uuid-1',
      assignment_id: 'assign-uuid-1',
      student_id: 'student-uuid-1',
      submission_text: 'Submission doc explaining bubble sort and optimal quicksort solutions.',
      file_url: 'https://storage.portal.net/submissions/CS101_HW1_alice.pdf',
      score: 90.00,
      feedback: 'Excellent work, very clean layout.',
      graded_by: 'faculty-uuid-1',
      graded_at: new Date().toISOString(),
      submitted_at: new Date().toISOString()
    }
  ],
  attendance: [
    {
      id: 'att-uuid-1',
      enrollment_id: 'enroll-uuid-1',
      date: '2026-05-10',
      status: 'PRESENT',
      remarks: 'On-time entrance'
    },
    {
      id: 'att-uuid-2',
      enrollment_id: 'enroll-uuid-1',
      date: '2026-05-11',
      status: 'PRESENT',
      remarks: 'Attentive, active participant'
    },
    {
      id: 'att-uuid-3',
      enrollment_id: 'enroll-uuid-1',
      date: '2026-05-12',
      status: 'ABSENT',
      remarks: 'Excused medical checkup'
    },
    {
      id: 'att-uuid-4',
      enrollment_id: 'enroll-uuid-2',
      date: '2026-05-10',
      status: 'PRESENT',
      remarks: 'Arrived mid-lecture'
    }
  ],
  fee_structures: [
    {
      id: 'struct-uuid-1',
      name: 'Standard Undergraduate Tuition Fee',
      description: 'Standard full-time undergraduate tuition billing package for academic year 2026/2027.',
      amount: 4500.00,
      category: 'TUITION',
      created_at: '2026-05-01T12:00:00Z'
    },
    {
      id: 'struct-uuid-2',
      name: 'Hostel and Mess Charges',
      description: 'On-campus dorm accommodation and unlimited meal board catalog billing.',
      amount: 1550.00,
      category: 'HOSTEL',
      created_at: '2026-05-01T12:00:00Z'
    },
    {
      id: 'struct-uuid-3',
      name: 'General Semester Assessment and Exams Fee',
      description: 'Laboratory fees, sports access, internal quizzes and final examinations entry permissions.',
      amount: 250.00,
      category: 'EXAM',
      created_at: '2026-05-01T12:00:00Z'
    }
  ]
};

// Local db file handling
const readLocalDb = (): LocalDatabase => {
  try {
    if (fs.existsSync(LOCAL_DB_PATH)) {
      const content = fs.readFileSync(LOCAL_DB_PATH, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Failed to read local JSON database, resetting. Error:', err);
  }
  writeLocalDb(DEFAULT_DATABASE);
  return DEFAULT_DATABASE;
};

const writeLocalDb = (data: LocalDatabase): void => {
  try {
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write local JSON database:', err);
  }
};

// Initial verification and boot setup
const initDatabase = async () => {
  if (isPostgresActive && pool) {
    try {
      // Check if schema tables exist, if not run initialization scripts
      const client = await pool.connect();
      try {
        console.log('Checking database tables...');
        
        // Create base tables
        await client.query(`
          CREATE TABLE IF NOT EXISTS users (
            id VARCHAR(50) PRIMARY KEY,
            email VARCHAR(100) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            name VARCHAR(100) NOT NULL,
            role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'FACULTY', 'STUDENT')),
            registration_number VARCHAR(50) UNIQUE NOT NULL,
            department VARCHAR(100),
            phone VARCHAR(20),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS student_profiles (
            student_id VARCHAR(50) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
            batch VARCHAR(30) NOT NULL,
            guardian_name VARCHAR(100),
            guardian_phone VARCHAR(20),
            enrollment_status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (enrollment_status IN ('ACTIVE', 'SUSPENDED', 'ALUMNI', 'LEAVE_OF_ABSENCE')),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS faculty_profiles (
            faculty_id VARCHAR(50) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
            designation VARCHAR(100) NOT NULL,
            qualification VARCHAR(100) NOT NULL,
            office_room VARCHAR(50),
            joining_date DATE NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
          
          CREATE TABLE IF NOT EXISTS courses (
            id VARCHAR(50) PRIMARY KEY,
            code VARCHAR(20) UNIQUE NOT NULL,
            name VARCHAR(150) NOT NULL,
            description TEXT,
            credits INT NOT NULL CHECK (credits > 0 AND credits <= 8),
            department VARCHAR(100) NOT NULL,
            faculty_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL
          );
          
          CREATE TABLE IF NOT EXISTS enrollments (
            id VARCHAR(50) PRIMARY KEY,
            student_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            course_id VARCHAR(50) NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
            grade VARCHAR(10) DEFAULT 'Pending',
            attendance_percentage NUMERIC(5,2) DEFAULT 100.00 CHECK (attendance_percentage BETWEEN 0.00 AND 100.00),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE (student_id, course_id)
          );

          CREATE TABLE IF NOT EXISTS attendance (
            id VARCHAR(50) PRIMARY KEY,
            enrollment_id VARCHAR(50) NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
            date DATE NOT NULL,
            status VARCHAR(15) NOT NULL CHECK (status IN ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED')),
            remarks TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE (enrollment_id, date)
          );

          CREATE TABLE IF NOT EXISTS exams (
            id VARCHAR(50) PRIMARY KEY,
            course_id VARCHAR(50) NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
            title VARCHAR(100) NOT NULL,
            type VARCHAR(35) NOT NULL CHECK (type IN ('MIDTERM', 'FINAL', 'QUIZ', 'PRACTICAL')),
            max_marks INT NOT NULL CHECK (max_marks > 0),
            exam_date DATE,
            is_published BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );

          ALTER TABLE exams ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT FALSE;

          CREATE TABLE IF NOT EXISTS marks (
            id VARCHAR(50) PRIMARY KEY,
            exam_id VARCHAR(50) NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
            student_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            obtained_marks NUMERIC(5,2) NOT NULL CHECK (obtained_marks >= 0.00),
            grade_point NUMERIC(3,2) CHECK (grade_point BETWEEN 0.00 AND 10.00),
            remarks TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE (exam_id, student_id)
          );

          CREATE TABLE IF NOT EXISTS assignments (
            id VARCHAR(50) PRIMARY KEY,
            course_id VARCHAR(50) NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
            title VARCHAR(150) NOT NULL,
            description TEXT,
            max_score INT NOT NULL CHECK (max_score > 0),
            due_date TIMESTAMP WITH TIME ZONE NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );

          ALTER TABLE assignments ADD COLUMN IF NOT EXISTS material_url VARCHAR(255);

          CREATE TABLE IF NOT EXISTS submissions (
            id VARCHAR(50) PRIMARY KEY,
            assignment_id VARCHAR(50) NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
            student_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            submission_text TEXT,
            file_url VARCHAR(255),
            submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            score NUMERIC(5,2) CHECK (score >= 0.00),
            feedback TEXT,
            graded_by VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
            graded_at TIMESTAMP WITH TIME ZONE,
            UNIQUE (assignment_id, student_id)
          );

          CREATE TABLE IF NOT EXISTS fees (
            id VARCHAR(50) PRIMARY KEY,
            student_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            title VARCHAR(150) NOT NULL,
            amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0.00),
            due_date DATE NOT NULL,
            status VARCHAR(20) DEFAULT 'UNPAID' CHECK (status IN ('PAID', 'UNPAID', 'PARTIALLY_PAID', 'OVERDUE')),
            amount_paid NUMERIC(10,2) DEFAULT 0.00 CHECK (amount_paid >= 0.00),
            paid_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS notifications (
            id VARCHAR(50) PRIMARY KEY,
            user_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
            title VARCHAR(150) NOT NULL,
            message TEXT NOT NULL,
            type VARCHAR(30) DEFAULT 'SYSTEM' CHECK (type IN ('SYSTEM', 'GRADE', 'ATTENDANCE', 'FEE', 'ASSIGNMENT', 'EXAM')),
            is_read BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS activity_logs (
            id VARCHAR(50) PRIMARY KEY,
            user_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
            action VARCHAR(100) NOT NULL,
            entity VARCHAR(50) NOT NULL,
            entity_id VARCHAR(50),
            details TEXT,
            ip_address VARCHAR(45),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS fee_structures (
            id VARCHAR(50) PRIMARY KEY,
            name VARCHAR(150) NOT NULL,
            description TEXT,
            amount NUMERIC(10,2) NOT NULL,
            category VARCHAR(50) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
        `);
        console.log('✅ PostgreSQL database checked/created.');

        // Verify if admin user exists, if not seed it
        const checkAdmin = await client.query('SELECT * FROM users WHERE email = $1', ['admin@portal.com']);
        if (checkAdmin.rows.length === 0) {
          console.log('Seeding initial data to PostgreSQL...');
          // Admin
          await client.query(`
            INSERT INTO users (id, email, password_hash, name, role, registration_number, department, phone)
            VALUES ('admin-uuid-1', 'admin@portal.com', $1, 'System Administrator', 'ADMIN', 'ADM2026001', 'Administration', '+1234567890')
          `, [SAMPLE_ADMIN_HASH]);
          // Faculty
          await client.query(`
            INSERT INTO users (id, email, password_hash, name, role, registration_number, department, phone)
            VALUES 
            ('faculty-uuid-1', 'dr.smith@portal.com', $1, 'Dr. Sarah Smith', 'FACULTY', 'FAC2026001', 'Computer Science', '+1234567891'),
            ('faculty-uuid-2', 'prof.jones@portal.com', $1, 'Prof. David Jones', 'FACULTY', 'FAC2026002', 'Electrical Engineering', '+1234567892')
          `, [SAMPLE_FACULTY_HASH]);
          // Students
          await client.query(`
            INSERT INTO users (id, email, password_hash, name, role, registration_number, department, phone)
            VALUES 
            ('student-uuid-1', 'alice@portal.com', $1, 'Alice Cooper', 'STUDENT', 'STU2026001', 'Computer Science', '+1234567893'),
            ('student-uuid-2', 'bob@portal.com', $1, 'Bob Johnson', 'STUDENT', 'STU2026002', 'Computer Science', '+1234567894'),
            ('student-uuid-3', 'charlie@portal.com', $1, 'Charlie Brown', 'STUDENT', 'STU2026003', 'Electrical Engineering', '+1234567895')
          `, [SAMPLE_STUDENT_HASH]);

          // Student Profiles
          await client.query(`
            INSERT INTO student_profiles (student_id, batch, guardian_name, guardian_phone, enrollment_status)
            VALUES
            ('student-uuid-1', 'Sophomore CS', 'John Cooper', '+1444333222', 'ACTIVE'),
            ('student-uuid-2', 'Freshman CS', 'Martha Johnson', '+1444333223', 'ACTIVE'),
            ('student-uuid-3', 'Senior EE', 'Richard Brown', '+1444333224', 'ACTIVE')
          `);

          // Faculty Profiles
          await client.query(`
            INSERT INTO faculty_profiles (faculty_id, designation, qualification, office_room, joining_date)
            VALUES
            ('faculty-uuid-1', 'Associate Professor', 'Ph.D. in Computer Science', 'Tech Hall 401', '2019-08-15'),
            ('faculty-uuid-2', 'Professor & Dept Head', 'Ph.D. in Electrical Eng', 'Maxwell Labs 203', '2015-01-10')
          `);

          // Courses
          await client.query(`
            INSERT INTO courses (id, code, name, description, credits, department, faculty_id)
            VALUES 
            ('course-uuid-1', 'CS101', 'Introduction to Computer Science', 'Fundamental concepts of programming, algorithms, and data structures.', 4, 'Computer Science', 'faculty-uuid-1'),
            ('course-uuid-2', 'CS301', 'Database Systems', 'Relational database model, SQL, normalization, transactions, and indexing.', 3, 'Computer Science', 'faculty-uuid-1'),
            ('course-uuid-3', 'EE110', 'Basic Circuit Theory', 'Analysis of resistive circuits, nodal and mesh analysis, and network theorems.', 4, 'Electrical Engineering', 'faculty-uuid-2'),
            ('course-uuid-4', 'EE410', 'Digital Signal Processing', 'Discrete-time signals and systems, Z-transform, DFT, and filter design.', 3, 'Electrical Engineering', 'faculty-uuid-2')
          `);

          // Enrollments
          await client.query(`
            INSERT INTO enrollments (id, student_id, course_id, grade, attendance_percentage)
            VALUES 
            ('enroll-uuid-1', 'student-uuid-1', 'course-uuid-1', 'A', 95.00),
            ('enroll-uuid-2', 'student-uuid-1', 'course-uuid-2', 'B+', 88.50),
            ('enroll-uuid-3', 'student-uuid-2', 'course-uuid-1', 'Pending', 92.00),
            ('enroll-uuid-4', 'student-uuid-3', 'course-uuid-3', 'A', 98.00),
            ('enroll-uuid-5', 'student-uuid-3', 'course-uuid-4', 'Pending', 78.20)
          `);

          // Attendance
          await client.query(`
            INSERT INTO attendance (id, enrollment_id, date, status, remarks)
            VALUES
            ('att-uuid-1', 'enroll-uuid-1', '2026-05-10', 'PRESENT', 'On-time'),
            ('att-uuid-2', 'enroll-uuid-1', '2026-05-11', 'PRESENT', 'On-time'),
            ('att-uuid-3', 'enroll-uuid-1', '2026-05-12', 'ABSENT', 'Excused medical absence'),
            ('att-uuid-4', 'enroll-uuid-2', '2026-05-10', 'PRESENT', 'On-time'),
            ('att-uuid-5', 'enroll-uuid-3', '2026-05-10', 'PRESENT', 'Late - bus delayed'),
            ('att-uuid-6', 'enroll-uuid-4', '2026-05-10', 'PRESENT', 'On-time'),
            ('att-uuid-7', 'enroll-uuid-5', '2026-05-10', 'ABSENT', 'No show')
          `);

          // Exams
          await client.query(`
            INSERT INTO exams (id, course_id, title, type, max_marks, exam_date)
            VALUES
            ('exam-uuid-1', 'course-uuid-1', 'CS101 Midterm', 'MIDTERM', 100, '2026-04-15'),
            ('exam-uuid-2', 'course-uuid-1', 'CS101 Final Exam', 'FINAL', 100, '2026-05-25'),
            ('exam-uuid-3', 'course-uuid-3', 'EE110 Midterm Theory', 'MIDTERM', 50, '2026-04-18')
          `);

          // Marks
          await client.query(`
            INSERT INTO marks (id, exam_id, student_id, obtained_marks, grade_point, remarks)
            VALUES
            ('mark-uuid-1', 'exam-uuid-1', 'student-uuid-1', 92.00, 9.50, 'Outstanding analytical response.'),
            ('mark-uuid-2', 'exam-uuid-1', 'student-uuid-2', 78.50, 8.00, 'Solid understanding of loops.'),
            ('mark-uuid-3', 'exam-uuid-3', 'student-uuid-3', 47.00, 9.80, 'Excellent circuit diagram analysis.')
          `);

          // Assignments
          await client.query(`
            INSERT INTO assignments (id, course_id, title, description, max_score, due_date)
            VALUES
            ('assign-uuid-1', 'course-uuid-1', 'Homework #1: Algorithm Design', 'Design psuedocode flowcharts for sorting and searching arrays.', 100, '2026-03-20 23:59:00+00'),
            ('assign-uuid-2', 'course-uuid-2', 'Homework #2: Schema Normalization', 'Complete 3NF translation exercises for given corporate database.', 100, '2026-04-22 23:59:00+00')
          `);

          // Submissions
          await client.query(`
            INSERT INTO submissions (id, assignment_id, student_id, submission_text, file_url, score, feedback, graded_by, graded_at)
            VALUES
            ('sub-uuid-1', 'assign-uuid-1', 'student-uuid-1', 'Submission doc explaining bubble sort and bubble-opt solutions.', 'https://storage.portal.net/submissions/CS101_HW1_alice.pdf', 90.00, 'Clean pseudocode, very legible.', 'faculty-uuid-1', '2026-03-21 14:00:00+00'),
            ('sub-uuid-2', 'assign-uuid-2', 'student-uuid-1', '3NF schema diagrams including entity relations and key validations.', 'https://storage.portal.net/submissions/CS301_HW2_alice.pdf', 95.00, 'Perfect database keys structure mapped.', 'faculty-uuid-1', '2026-04-23 10:30:00+00')
          `);

          // Fees
          await client.query(`
            INSERT INTO fees (id, student_id, title, amount, due_date, status, amount_paid, paid_at)
            VALUES
            ('fee-uuid-1', 'student-uuid-1', 'Spring Semester 2026 CSE Tuition', 4500.00, '2026-02-15', 'PAID', 4500.00, '2026-02-14 09:12:00+00'),
            ('fee-uuid-2', 'student-uuid-2', 'Spring Semester 2026 CSE Tuition', 4500.00, '2026-02-15', 'PAID', 4500.00, '2026-02-15 16:34:00+00'),
            ('fee-uuid-3', 'student-uuid-3', 'Spring Semester 2026 EEE Tuition & Lab Fee', 4750.00, '2026-02-15', 'UNPAID', 0.00, NULL)
          `);

          // Notifications
          await client.query(`
            INSERT INTO notifications (id, user_id, title, message, type, is_read)
            VALUES
            ('notif-uuid-1', 'student-uuid-1', 'Midterm examination results published', 'Your marks for CS101 Midterm have been published. Score: 92/100.', 'GRADE', FALSE),
            ('notif-uuid-2', 'student-uuid-3', 'Outstanding Fees Bill Due', 'Please clear your spring tuition invoice by the grace period to avoid portal lockout.', 'FEE', FALSE),
            ('notif-uuid-3', NULL, 'Campus Maintenance Notice', 'Maxwell Lab Hall general electricity supply will remain partially suspended on Sunday for annual routine checkups.', 'SYSTEM', FALSE)
          `);

          // Activity Logs
          await client.query(`
            INSERT INTO activity_logs (id, user_id, action, entity, entity_id, details, ip_address)
            VALUES
            ('log-uuid-1', 'admin-uuid-1', 'USER_REGISTERED', 'USERS', 'student-uuid-3', 'Newly added student Charlie Brown', '192.168.1.10'),
            ('log-uuid-2', 'faculty-uuid-1', 'CURRICULUM_ADDED', 'COURSES', 'course-uuid-1', 'Assigned syllabus outline for CS101 Computer Science', '195.42.10.88'),
            ('log-uuid-3', 'student-uuid-1', 'ASSIGNMENT_SUBMITTED', 'SUBMISSIONS', 'sub-uuid-1', 'Completed HW1 Upload', '120.34.1.201')
          `);

          console.log('✅ PostgreSQL seed complete.');
        }
      } finally {
        client.release();
      }
    } catch (err) {
      console.warn('⚠️ Could not connect or query PostgreSQL during boot. Switching to dynamic local database engine.', err);
      isPostgresActive = false;
      readLocalDb(); // Ensure local db boot
    }
  } else {
    // Standard initialization for fallback engine
    readLocalDb();
  }
};

// Trigger boot sequence
initDatabase().catch(console.error);

function toCamel(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map(item => toCamel(item));
  }
  const newObj = { ...obj };
  for (const key of Object.keys(obj)) {
    if (key.includes('_')) {
      const camelKey = key.replace(/_([a-z0-9])/gi, (g) => g[1].toUpperCase());
      newObj[camelKey] = obj[key];
    }
  }
  return newObj;
}

// Clean Database API Wrappers handling fallback logic seamlessly
export const db = {
  // USER METHODS
  users: {
    async findByEmail(email: string) {
      if (isPostgresActive && pool) {
        const res = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        return toCamel(res.rows[0]) || null;
      } else {
        const local = readLocalDb();
        const user = local.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
        return toCamel(user);
      }
    },

    async findById(id: string) {
      if (isPostgresActive && pool) {
        const res = await pool.query('SELECT id, email, name, role, registration_number, department, phone, created_at FROM users WHERE id = $1', [id]);
        return toCamel(res.rows[0]) || null;
      } else {
        const local = readLocalDb();
        const u = local.users.find(u => u.id === id);
        if (!u) return null;
        const { password_hash, ...safeUser } = u;
        return toCamel(safeUser);
      }
    },

    async findAllByRole(role: string) {
      if (isPostgresActive && pool) {
        const res = await pool.query('SELECT id, email, name, role, registration_number, department, phone, created_at FROM users WHERE role = $1 ORDER BY name ASC', [role]);
        return toCamel(res.rows);
      } else {
        const local = readLocalDb();
        const list = local.users
          .filter(u => u.role === role)
          .map(({ password_hash, ...safe }) => safe)
          .sort((a, b) => a.name.localeCompare(b.name));
        return toCamel(list);
      }
    },

    async create(user: { id: string; email: string; password_hash: string; name: string; role: string; registration_number: string; department?: string; phone?: string }) {
      if (isPostgresActive && pool) {
        const res = await pool.query(
          `INSERT INTO users (id, email, password_hash, name, role, registration_number, department, phone) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, email, name, role, registration_number, department, phone`,
          [user.id, user.email, user.password_hash, user.name, user.role, user.registration_number, user.department || null, user.phone || null]
        );
        return toCamel(res.rows[0]);
      } else {
        const local = readLocalDb();
        const newUser = {
          ...user,
          created_at: new Date().toISOString()
        };
        local.users.push(newUser);
        writeLocalDb(local);
        const { password_hash, ...safe } = newUser;
        return toCamel(safe);
      }
    },

    async delete(id: string) {
      if (isPostgresActive && pool) {
        await pool.query('DELETE FROM users WHERE id = $1', [id]);
        return true;
      } else {
        const local = readLocalDb();
        local.users = local.users.filter(u => u.id !== id);
        local.enrollments = local.enrollments.filter(e => e.student_id !== id);
        // Deselect from courses
        local.courses = local.courses.map(c => c.faculty_id === id ? { ...c, faculty_id: null } : c);
        writeLocalDb(local);
        return true;
      }
    },

    async update(id: string, updates: { email?: string; password_hash?: string; name?: string; department?: string; phone?: string; registration_number?: string }) {
      if (isPostgresActive && pool) {
        const setClauses: string[] = [];
        const values: any[] = [];
        let index = 1;
        for (const [key, val] of Object.entries(updates)) {
          if (val !== undefined) {
            const columnName = key === 'registration_number' ? 'registration_number' : (key === 'password_hash' ? 'password_hash' : key);
            setClauses.push(`${columnName} = $${index}`);
            values.push(val);
            index++;
          }
        }
        if (setClauses.length === 0) return null;
        values.push(id);
        const query = `UPDATE users SET ${setClauses.join(', ')} WHERE id = $${index} RETURNING id, email, name, role, registration_number, department, phone`;
        const res = await pool.query(query, values);
        return toCamel(res.rows[0]);
      } else {
        const local = readLocalDb();
        const userIndex = local.users.findIndex(u => u.id === id);
        if (userIndex === -1) return null;
        
        const user = local.users[userIndex];
        const updatedUser = {
          ...user,
          ...updates
        };
        local.users[userIndex] = updatedUser;
        writeLocalDb(local);
        const { password_hash, ...safe } = updatedUser;
        return toCamel(safe);
      }
    }
  },

  // COURSE METHODS
  courses: {
    async findAll() {
      if (isPostgresActive && pool) {
        const res = await pool.query(`
          SELECT c.*, u.name as faculty_name 
          FROM courses c 
          LEFT JOIN users u ON c.faculty_id = u.id 
          ORDER BY c.code ASC
        `);
        return toCamel(res.rows);
      } else {
        const local = readLocalDb();
        const list = local.courses.map(c => {
          const fac = local.users.find(u => u.id === c.faculty_id);
          return {
            ...c,
            faculty_name: fac ? fac.name : 'Unassigned'
          };
        }).sort((a, b) => a.code.localeCompare(b.code));
        return toCamel(list);
      }
    },

    async findById(id: string) {
      if (isPostgresActive && pool) {
        const res = await pool.query(`
          SELECT c.*, u.name as faculty_name 
          FROM courses c 
          LEFT JOIN users u ON c.faculty_id = u.id 
          WHERE c.id = $1
        `, [id]);
        return toCamel(res.rows[0]) || null;
      } else {
        const local = readLocalDb();
        const c = local.courses.find(c => c.id === id);
        if (!c) return null;
        const fac = local.users.find(u => u.id === c.faculty_id);
        const result = {
          ...c,
          faculty_name: fac ? fac.name : 'Unassigned'
        };
        return toCamel(result);
      }
    },

    async findByFaculty(facultyId: string) {
      if (isPostgresActive && pool) {
        const res = await pool.query(`
          SELECT c.*, u.name as faculty_name 
          FROM courses c 
          LEFT JOIN users u ON c.faculty_id = u.id 
          WHERE c.faculty_id = $1
          ORDER BY c.code ASC
        `, [facultyId]);
        return toCamel(res.rows);
      } else {
        const local = readLocalDb();
        const list = local.courses
          .filter(c => c.faculty_id === facultyId)
          .map(c => {
            const fac = local.users.find(u => u.id === c.faculty_id);
            return {
              ...c,
              faculty_name: fac ? fac.name : 'Unassigned'
            };
          })
          .sort((a, b) => a.code.localeCompare(b.code));
        return toCamel(list);
      }
    },

    async create(course: { id: string; code: string; name: string; description: string; credits: number; department: string; faculty_id?: string }) {
      if (isPostgresActive && pool) {
        const res = await pool.query(
          `INSERT INTO courses (id, code, name, description, credits, department, faculty_id) 
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
          [course.id, course.code, course.name, course.description, course.credits, course.department, course.faculty_id || null]
        );
        return toCamel(res.rows[0]);
      } else {
        const local = readLocalDb();
        // Check uniqueness of code
        if (local.courses.some(c => c.code.toLowerCase() === course.code.toLowerCase())) {
          throw new Error('Course code must be unique');
        }
        const newCourse = {
          ...course,
          faculty_id: course.faculty_id || null
        };
        local.courses.push(newCourse);
        writeLocalDb(local);
        return toCamel(newCourse);
      }
    },

    async update(id: string, course: { name: string; description: string; credits: number; department: string; faculty_id?: string }) {
      if (isPostgresActive && pool) {
        const res = await pool.query(
          `UPDATE courses 
           SET name = $1, description = $2, credits = $3, department = $4, faculty_id = $5 
           WHERE id = $6 RETURNING *`,
          [course.name, course.description, course.credits, course.department, course.faculty_id || null, id]
        );
        return toCamel(res.rows[0]);
      } else {
        const local = readLocalDb();
        const index = local.courses.findIndex(c => c.id === id);
        if (index === -1) throw new Error('Course not found');
        local.courses[index] = {
          ...local.courses[index],
          name: course.name,
          description: course.description,
          credits: course.credits,
          department: course.department,
          faculty_id: course.faculty_id || null
        };
        writeLocalDb(local);
        return toCamel(local.courses[index]);
      }
    },

    async delete(id: string) {
      if (isPostgresActive && pool) {
        await pool.query('DELETE FROM courses WHERE id = $1', [id]);
        return true;
      } else {
        const local = readLocalDb();
        local.courses = local.courses.filter(c => c.id !== id);
        local.enrollments = local.enrollments.filter(e => e.course_id !== id);
        writeLocalDb(local);
        return true;
      }
    }
  },

  // ENROLLMENT METHODS
  enrollments: {
    async findAll() {
      if (isPostgresActive && pool) {
        const res = await pool.query(`
          SELECT e.*, 
                 u.name as student_name, u.registration_number as student_registration_number,
                 c.name as course_name, c.code as course_code, c.credits as credits
          FROM enrollments e
          JOIN users u ON e.student_id = u.id
          JOIN courses c ON e.course_id = c.id
          ORDER BY e.created_at DESC
        `);
        return toCamel(res.rows);
      } else {
        const local = readLocalDb();
        const list = local.enrollments.map(e => {
          const student = local.users.find(u => u.id === e.student_id);
          const course = local.courses.find(c => c.id === e.course_id);
          return {
            ...e,
            student_name: student ? student.name : 'Unknown Student',
            student_registration_number: student ? student.registration_number : '',
            course_name: course ? course.name : 'Unknown Course',
            course_code: course ? course.code : '',
            credits: course ? course.credits : 0
          };
        }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        return toCamel(list);
      }
    },

    async findByStudent(studentId: string) {
      if (isPostgresActive && pool) {
        const res = await pool.query(`
          SELECT e.*, 
                 u.name as student_name, u.registration_number as student_registration_number,
                 c.name as course_name, c.code as course_code, c.credits as credits,
                 f.name as faculty_name
          FROM enrollments e
          JOIN users u ON e.student_id = u.id
          JOIN courses c ON e.course_id = c.id
          LEFT JOIN users f ON c.faculty_id = f.id
          WHERE e.student_id = $1
          ORDER BY c.code ASC
        `, [studentId]);
        return toCamel(res.rows);
      } else {
        const local = readLocalDb();
        const list = local.enrollments
          .filter(e => e.student_id === studentId)
          .map(e => {
            const student = local.users.find(u => u.id === e.student_id);
            const course = local.courses.find(c => c.id === e.course_id);
            const faculty = course ? local.users.find(u => u.id === course.faculty_id) : null;
            return {
              ...e,
              student_name: student ? student.name : 'Unknown Student',
              student_registration_number: student ? student.registration_number : '',
              course_name: course ? course.name : 'Unknown Course',
              course_code: course ? course.code : '',
              credits: course ? course.credits : 0,
              faculty_name: faculty ? faculty.name : 'Unassigned'
            };
          }).sort((a, b) => (a.course_code || '').localeCompare(b.course_code || ''));
        return toCamel(list);
      }
    },

    async findByCourse(courseId: string) {
      if (isPostgresActive && pool) {
        const res = await pool.query(`
          SELECT e.*, 
                 u.name as student_name, u.registration_number as student_registration_number, u.department as student_department,
                 c.name as course_name, c.code as course_code
          FROM enrollments e
          JOIN users u ON e.student_id = u.id
          JOIN courses c ON e.course_id = c.id
          WHERE e.course_id = $1
          ORDER BY u.name ASC
        `, [courseId]);
        return toCamel(res.rows);
      } else {
        const local = readLocalDb();
        const list = local.enrollments
          .filter(e => e.course_id === courseId)
          .map(e => {
            const student = local.users.find(u => u.id === e.student_id);
            const course = local.courses.find(c => c.id === e.course_id);
            return {
              ...e,
              student_name: student ? student.name : 'Unknown Student',
              student_registration_number: student ? student.registration_number : '',
              student_department: student ? student.department : '',
              course_name: course ? course.name : 'Unknown Course',
              course_code: course ? course.code : ''
            };
          }).sort((a, b) => (a.student_name || '').localeCompare(b.student_name || ''));
        return toCamel(list);
      }
    },

    async findByFaculty(facultyId: string) {
      if (isPostgresActive && pool) {
        const res = await pool.query(`
          SELECT e.*, 
                 u.name as student_name, u.registration_number as student_registration_number,
                 c.name as course_name, c.code as course_code
          FROM enrollments e
          JOIN users u ON e.student_id = u.id
          JOIN courses c ON e.course_id = c.id
          WHERE c.faculty_id = $1
          ORDER BY c.code ASC, u.name ASC
        `, [facultyId]);
        return toCamel(res.rows);
      } else {
        const local = readLocalDb();
        const myCourseIds = local.courses.filter(c => c.faculty_id === facultyId).map(c => c.id);
        const list = local.enrollments
          .filter(e => myCourseIds.includes(e.course_id))
          .map(e => {
            const student = local.users.find(u => u.id === e.student_id);
            const course = local.courses.find(c => c.id === e.course_id);
            return {
              ...e,
              student_name: student ? student.name : 'Unknown Student',
              student_registration_number: student ? student.registration_number : '',
              course_name: course ? course.name : 'Unknown Course',
              course_code: course ? course.code : ''
            };
          }).sort((a, b) => (a.course_code || '').localeCompare(b.course_code || '') || (a.student_name || '').localeCompare(b.student_name || ''));
        return toCamel(list);
      }
    },

    async create(enrollment: { id: string; student_id: string; course_id: string }) {
      if (isPostgresActive && pool) {
        const res = await pool.query(
          `INSERT INTO enrollments (id, student_id, course_id) 
           VALUES ($1, $2, $3) RETURNING *`,
          [enrollment.id, enrollment.student_id, enrollment.course_id]
        );
        return toCamel(res.rows[0]);
      } else {
        const local = readLocalDb();
        // Check duplication
        if (local.enrollments.some(e => e.student_id === enrollment.student_id && e.course_id === enrollment.course_id)) {
          throw new Error('Student is already enrolled in this course');
        }
        const newEnrollment = {
          ...enrollment,
          grade: 'Pending',
          attendance_percentage: 100.0,
          created_at: new Date().toISOString()
        };
        local.enrollments.push(newEnrollment);
        writeLocalDb(local);
        return toCamel(newEnrollment);
      }
    },

    async updateGrade(id: string, grade: string) {
      if (isPostgresActive && pool) {
        const res = await pool.query(
          `UPDATE enrollments SET grade = $1 WHERE id = $2 RETURNING *`,
          [grade, id]
        );
        return toCamel(res.rows[0]);
      } else {
        const local = readLocalDb();
        const index = local.enrollments.findIndex(e => e.id === id);
        if (index === -1) throw new Error('Enrollment record not found');
        local.enrollments[index].grade = grade;
        writeLocalDb(local);
        return toCamel(local.enrollments[index]);
      }
    },

    async updateAttendance(id: string, attendance_percentage: number) {
      if (isPostgresActive && pool) {
        const res = await pool.query(
          `UPDATE enrollments SET attendance_percentage = $1 WHERE id = $2 RETURNING *`,
          [attendance_percentage, id]
        );
        return toCamel(res.rows[0]);
      } else {
        const local = readLocalDb();
        const index = local.enrollments.findIndex(e => e.id === id);
        if (index === -1) throw new Error('Enrollment record not found');
        local.enrollments[index].attendance_percentage = attendance_percentage;
        writeLocalDb(local);
        return toCamel(local.enrollments[index]);
      }
    },

    async delete(id: string) {
      if (isPostgresActive && pool) {
        await pool.query('DELETE FROM enrollments WHERE id = $1', [id]);
        return true;
      } else {
        const local = readLocalDb();
        local.enrollments = local.enrollments.filter(e => e.id !== id);
        writeLocalDb(local);
        return true;
      }
    }
  },

  fees: {
    async findAll() {
      if (isPostgresActive && pool) {
        const res = await pool.query(
          `SELECT f.*, u.name as student_name, u.registration_number as student_registration_number
           FROM fees f
           LEFT JOIN users u ON f.student_id = u.id
           ORDER BY f.created_at DESC`
        );
        return toCamel(res.rows);
      } else {
        const local = readLocalDb();
        if (!local.fees) local.fees = [];
        const result = local.fees.map(f => {
          const u = local.users.find(user => user.id === f.student_id);
          return {
            ...f,
            studentName: u ? u.name : 'Unknown Student',
            studentRegistrationNumber: u ? u.registration_number : ''
          };
        }).sort((a,b) => b.created_at.localeCompare(a.created_at));
        return toCamel(result);
      }
    },

    async create(fee: { id: string; studentId: string; title: string; amount: number; dueDate: string }) {
      if (isPostgresActive && pool) {
        const res = await pool.query(
          `INSERT INTO fees (id, student_id, title, amount, due_date, status, amount_paid)
           VALUES ($1, $2, $3, $4, $5, 'UNPAID', 0)
           RETURNING *`,
          [fee.id, fee.studentId, fee.title, fee.amount, fee.dueDate]
        );
        return toCamel(res.rows[0]);
      } else {
        const local = readLocalDb();
        if (!local.fees) local.fees = [];
        const newFee = {
          id: fee.id,
          student_id: fee.studentId,
          title: fee.title,
          amount: Number(fee.amount),
          due_date: fee.dueDate,
          status: 'UNPAID',
          amount_paid: 0,
          paid_at: null,
          created_at: new Date().toISOString()
        };
        local.fees.push(newFee);
        writeLocalDb(local);
        return toCamel(newFee);
      }
    },

    async recordPayment(id: string, amount: number, status: string) {
      if (isPostgresActive && pool) {
        const paidAt = status === 'PAID' ? new Date().toISOString() : null;
        const res = await pool.query(
          `UPDATE fees 
           SET status = $1, amount_paid = $2, paid_at = $3
           WHERE id = $4
           RETURNING *`,
          [status, amount, paidAt, id]
        );
        return toCamel(res.rows[0]);
      } else {
        const local = readLocalDb();
        if (!local.fees) local.fees = [];
        const idx = local.fees.findIndex(f => f.id === id);
        if (idx !== -1) {
          local.fees[idx].status = status;
          local.fees[idx].amount_paid = Number(amount);
          local.fees[idx].paid_at = status === 'PAID' ? new Date().toISOString() : null;
          writeLocalDb(local);
          return toCamel(local.fees[idx]);
        }
        throw new Error('Fee record not found');
      }
    }
  },

  feeStructures: {
    async findAll() {
      if (isPostgresActive && pool) {
        const res = await pool.query(
          `SELECT * FROM fee_structures ORDER BY created_at DESC`
        );
        return toCamel(res.rows);
      } else {
        const local = readLocalDb();
        if (!local.fee_structures) local.fee_structures = [];
        const result = local.fee_structures;
        return toCamel(result).sort((a: any, b: any) => b.createdAt.localeCompare(a.createdAt));
      }
    },

    async create(struct: { id: string; name: string; description: string; amount: number; category: string }) {
      if (isPostgresActive && pool) {
        const res = await pool.query(
          `INSERT INTO fee_structures (id, name, description, amount, category)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING *`,
          [struct.id, struct.name, struct.description, struct.amount, struct.category]
        );
        return toCamel(res.rows[0]);
      } else {
        const local = readLocalDb();
        if (!local.fee_structures) local.fee_structures = [];
        const newStruct = {
          id: struct.id,
          name: struct.name,
          description: struct.description || '',
          amount: Number(struct.amount),
          category: struct.category,
          created_at: new Date().toISOString()
        };
        local.fee_structures.push(newStruct);
        writeLocalDb(local);
        return toCamel(newStruct);
      }
    },

    async delete(id: string) {
      if (isPostgresActive && pool) {
        await pool.query('DELETE FROM fee_structures WHERE id = $1', [id]);
        return true;
      } else {
        const local = readLocalDb();
        if (!local.fee_structures) local.fee_structures = [];
        local.fee_structures = local.fee_structures.filter((s: any) => s.id !== id);
        writeLocalDb(local);
        return true;
      }
    }
  },

  faculty: {
    async findById(id: string) {
      if (isPostgresActive && pool) {
        const userRes = await pool.query('SELECT id, email, name, role, registration_number, department, phone, created_at FROM users WHERE id = $1', [id]);
        if (userRes.rows.length === 0) return null;
        const faculty = toCamel(userRes.rows[0]);

        const coursesRes = await pool.query(`
          SELECT c.*, COUNT(e.id) as student_count
          FROM courses c
          LEFT JOIN enrollments e ON c.id = e.course_id
          WHERE c.faculty_id = $1
          GROUP BY c.id
          ORDER BY c.code ASC
        `, [id]);

        return {
          faculty,
          courses: toCamel(coursesRes.rows)
        };
      } else {
        const local = readLocalDb();
        const f = local.users.find(u => u.id === id);
        if (!f) return null;
        const { password_hash, ...safeUser } = f;

        const assignedCourses = local.courses
          .filter(c => c.faculty_id === id)
          .map(c => {
            const studentCount = local.enrollments.filter(e => e.course_id === c.id).length;
            return {
              ...c,
              studentCount
            };
          })
          .sort((a, b) => a.code.localeCompare(b.code));

        return {
          faculty: toCamel(safeUser),
          courses: toCamel(assignedCourses)
        };
      }
    },

    async assignCourses(facultyId: string, courseIds: string[]) {
      if (isPostgresActive && pool) {
        if (courseIds.length === 0) {
          await pool.query('UPDATE courses SET faculty_id = NULL WHERE faculty_id = $1', [facultyId]);
        } else {
          const inPlaceholders = courseIds.map((_, i) => `$${i + 2}`).join(', ');
          await pool.query(`UPDATE courses SET faculty_id = NULL WHERE faculty_id = $1 AND id NOT IN (${inPlaceholders})`, [facultyId, ...courseIds]);
          const assignPlaceholders = courseIds.map((_, i) => `$${i + 2}`).join(', ');
          await pool.query(`UPDATE courses SET faculty_id = $1 WHERE id IN (${assignPlaceholders})`, [facultyId, ...courseIds]);
        }
        return true;
      } else {
        const local = readLocalDb();
        local.courses.forEach(c => {
          if (c.faculty_id === facultyId && !courseIds.includes(c.id)) {
            c.faculty_id = null;
          } else if (courseIds.includes(c.id)) {
            c.faculty_id = facultyId;
          }
        });
        writeLocalDb(local);
        return true;
      }
    }
  },

  notifications: {
    async findAll() {
      if (isPostgresActive && pool) {
        const res = await pool.query(
          `SELECT * FROM notifications 
           ORDER BY created_at DESC`
        );
        return toCamel(res.rows);
      } else {
        const local = readLocalDb();
        if (!local.notifications) local.notifications = [];
        const sorted = [...local.notifications].sort((a: any, b: any) => b.created_at.localeCompare(a.created_at));
        return toCamel(sorted);
      }
    },

    async findByStudent(userId: string) {
      if (isPostgresActive && pool) {
        const res = await pool.query(
          `SELECT * FROM notifications 
           WHERE user_id = $1 OR user_id IS NULL 
           ORDER BY created_at DESC`,
          [userId]
        );
        return toCamel(res.rows);
      } else {
        const local = readLocalDb();
        if (!local.notifications) local.notifications = [
          {
            id: 'notif-uuid-1',
            user_id: 'student-uuid-1',
            title: 'Midterm examination results published',
            message: 'Your marks for CS101 Midterm have been published. Score: 92/100.',
            type: 'GRADE',
            is_read: false,
            created_at: new Date().toISOString()
          },
          {
            id: 'notif-uuid-2',
            user_id: 'student-uuid-3',
            title: 'Outstanding Fees Bill Due',
            message: 'Please clear your spring tuition invoice by the grace period to avoid portal lockout.',
            type: 'FEE',
            is_read: false,
            created_at: new Date().toISOString()
          },
          {
            id: 'notif-uuid-3',
            user_id: null,
            title: 'Campus Maintenance Notice',
            message: 'Maxwell Lab Hall general electricity supply will remain partially suspended on Sunday for annual routine checkups.',
            type: 'SYSTEM',
            is_read: false,
            created_at: new Date().toISOString()
          }
        ];
        const filtered = local.notifications
          .filter(n => n.user_id === userId || n.user_id === null)
          .sort((a, b) => b.created_at.localeCompare(a.created_at));
        return toCamel(filtered);
      }
    },

    async markAsRead(id: string) {
      if (isPostgresActive && pool) {
        await pool.query('UPDATE notifications SET is_read = TRUE WHERE id = $1', [id]);
        return true;
      } else {
        const local = readLocalDb();
        if (!local.notifications) local.notifications = [];
        const idx = local.notifications.findIndex(n => n.id === id);
        if (idx !== -1) {
          local.notifications[idx].is_read = true;
          writeLocalDb(local);
        }
        return true;
      }
    },

    async create(notification: { id: string; userId: string | null; title: string; message: string; type: string }) {
      if (isPostgresActive && pool) {
        await pool.query(
          `INSERT INTO notifications (id, user_id, title, message, type)
           VALUES ($1, $2, $3, $4, $5)`,
          [notification.id, notification.userId, notification.title, notification.message, notification.type]
        );
        return true;
      } else {
        const local = readLocalDb();
        if (!local.notifications) local.notifications = [];
        const newNotif = {
          id: notification.id,
          user_id: notification.userId,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          is_read: false,
          created_at: new Date().toISOString()
        };
        local.notifications.push(newNotif);
        writeLocalDb(local);
        return true;
      }
    }
  },

  attendance: {
    async findByCourse(courseId: string, date?: string) {
      if (isPostgresActive && pool) {
        let query = `
          SELECT a.*, e.student_id, e.course_id, u.name as student_name, u.registration_number as student_registration_number
          FROM attendance a
          JOIN enrollments e ON a.enrollment_id = e.id
          JOIN users u ON e.student_id = u.id
          WHERE e.course_id = $1
        `;
        const params: any[] = [courseId];
        if (date) {
          query += ` AND a.date = $2`;
          params.push(date);
        }
        query += ` ORDER BY a.date DESC, u.name ASC`;
        const res = await pool.query(query, params);
        return toCamel(res.rows);
      } else {
        const local = readLocalDb();
        if (!local.attendance) local.attendance = [];
        const records = local.attendance.map(a => {
          const enrollment = local.enrollments.find(e => e.id === a.enrollment_id);
          if (!enrollment || enrollment.course_id !== courseId) return null;
          const user = local.users.find(u => u.id === enrollment.student_id);
          return {
            ...a,
            student_id: enrollment.student_id,
            course_id: enrollment.course_id,
            student_name: user ? user.name : 'Unknown Student',
            student_registration_number: user ? user.registration_number : ''
          };
        }).filter(Boolean);

        const filtered = date 
          ? records.filter(r => r && r.date === date)
          : records;

        filtered.sort((a, b) => {
          if (!a || !b) return 0;
          const dComp = new Date(b.date).getTime() - new Date(a.date).getTime();
          if (dComp !== 0) return dComp;
          return (a.student_name || '').localeCompare(b.student_name || '');
        });

        return toCamel(filtered);
      }
    },

    async findByStudent(studentId: string) {
      if (isPostgresActive && pool) {
        const res = await pool.query(
          `SELECT a.*, e.course_id, c.name as course_name, c.code as course_code
           FROM attendance a
           JOIN enrollments e ON a.enrollment_id = e.id
           JOIN courses c ON e.course_id = c.id
           WHERE e.student_id = $1
           ORDER BY a.date DESC`,
          [studentId]
        );
        return toCamel(res.rows);
      } else {
        const local = readLocalDb();
        if (!local.attendance) local.attendance = [];
        const filtered = local.attendance.map(a => {
          const enrollment = local.enrollments.find(e => e.id === a.enrollment_id);
          if (!enrollment || enrollment.student_id !== studentId) return null;
          const course = local.courses.find(c => c.id === enrollment.course_id);
          return {
            ...a,
            course_id: enrollment.course_id,
            course_name: course ? course.name : 'Unknown Course',
            course_code: course ? course.code : ''
          };
        }).filter(Boolean);
        filtered.sort((a, b) => {
          if (!a || !b) return 0;
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        });
        return toCamel(filtered);
      }
    },

    async saveRecord(att: { id: string; enrollmentId: string; date: string; status: string; remarks?: string }) {
      let dbRecord;
      if (isPostgresActive && pool) {
        const res = await pool.query(
          `INSERT INTO attendance (id, enrollment_id, date, status, remarks)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (enrollment_id, date)
           DO UPDATE SET status = EXCLUDED.status, remarks = EXCLUDED.remarks, created_at = CURRENT_TIMESTAMP
           RETURNING *`,
          [att.id, att.enrollmentId, att.date, att.status, att.remarks || '']
        );
        dbRecord = toCamel(res.rows[0]);
      } else {
        const local = readLocalDb();
        if (!local.attendance) local.attendance = [];
        const idx = local.attendance.findIndex(a => a.enrollment_id === att.enrollmentId && a.date === att.date);
        const newRecord = {
          id: att.id,
          enrollment_id: att.enrollmentId,
          date: att.date,
          status: att.status,
          remarks: att.remarks || '',
          created_at: new Date().toISOString()
        };
        if (idx !== -1) {
          local.attendance[idx] = newRecord;
        } else {
          local.attendance.push(newRecord);
        }
        writeLocalDb(local);
        dbRecord = toCamel(newRecord);
      }

      // Automatically recalculate overall attendance percentage for this enrollment ID
      try {
        if (isPostgresActive && pool) {
          // Calculate average from DB
          const countRes = await pool.query(
            `SELECT 
              COUNT(*) as total_classes,
              COUNT(*) FILTER (WHERE status = 'PRESENT' OR status = 'LATE' OR status = 'EXCUSED') as attended_classes
             FROM attendance
             WHERE enrollment_id = $1`,
            [att.enrollmentId]
          );
          if (countRes.rows.length > 0) {
            const total = Number(countRes.rows[0].total_classes || 0);
            const attended = Number(countRes.rows[0].attended_classes || 0);
            const calculatedPercentage = total > 0 ? Number(((attended / total) * 100).toFixed(2)) : 100.00;
            
            await pool.query(
              `UPDATE enrollments SET attendance_percentage = $1 WHERE id = $2`,
              [calculatedPercentage, att.enrollmentId]
            );
          }
        } else {
          const local = readLocalDb();
          const list = (local.attendance || []).filter(a => a.enrollment_id === att.enrollmentId);
          const total = list.length;
          const attended = list.filter(a => ['PRESENT', 'LATE', 'EXCUSED'].includes(a.status)).length;
          const calculatedPercentage = total > 0 ? Number(((attended / total) * 100).toFixed(2)) : 100.00;
          
          const index = local.enrollments.findIndex(e => e.id === att.enrollmentId);
          if (index !== -1) {
            local.enrollments[index].attendance_percentage = calculatedPercentage;
            writeLocalDb(local);
          }
        }
      } catch (err) {
        console.error('Error recalculating attendance percentage:', err);
      }

      return dbRecord;
    },

    async getAttendanceStats() {
      if (isPostgresActive && pool) {
        const totalClassesResult = await pool.query(`
          SELECT e.course_id, c.code as course_code, c.name as course_name, COUNT(DISTINCT a.date) as class_count 
          FROM attendance a 
          JOIN enrollments e ON a.enrollment_id = e.id 
          JOIN courses c ON e.course_id = c.id
          GROUP BY e.course_id, c.code, c.name
        `);
        const statusBreakdownResult = await pool.query(
          `SELECT status, COUNT(*) as count FROM attendance GROUP BY status`
        );
        const studentAggregateResult = await pool.query(`
          SELECT e.student_id, u.name as student_name, u.registration_number as student_registration_number,
                 c.name as course_name, c.code as course_code, e.id as enrollment_id,
                 COUNT(*) FILTER (WHERE a.status = 'PRESENT') as present_count,
                 COUNT(*) FILTER (WHERE a.status = 'ABSENT') as absent_count,
                 COUNT(*) FILTER (WHERE a.status = 'LATE') as late_count,
                 COUNT(*) FILTER (WHERE a.status = 'EXCUSED') as excused_count,
                 COUNT(*) as total_records
          FROM attendance a
          JOIN enrollments e ON a.enrollment_id = e.id
          JOIN users u ON e.student_id = u.id
          JOIN courses c ON e.course_id = c.id
          GROUP BY e.student_id, u.name, u.registration_number, c.name, c.code, e.id
        `);
        return {
          classCountByCourse: toCamel(totalClassesResult.rows),
          statusBreakdown: toCamel(statusBreakdownResult.rows),
          studentAggregates: toCamel(studentAggregateResult.rows)
        };
      } else {
        const local = readLocalDb();
        if (!local.attendance) local.attendance = [];

        // 1. classCountByCourse
        const courseDates: { [courseId: string]: Set<string> } = {};
        local.attendance.forEach(a => {
          const enroll = local.enrollments.find(e => e.id === a.enrollment_id);
          if (enroll) {
            if (!courseDates[enroll.course_id]) {
              courseDates[enroll.course_id] = new Set<string>();
            }
            courseDates[enroll.course_id].add(a.date);
          }
        });
        const classCountByCourse = Object.keys(courseDates).map(cid => {
          const c = local.courses.find(crs => crs.id === cid);
          return {
            courseId: cid,
            courseCode: c ? c.code : '',
            courseName: c ? c.name : 'Unknown',
            classCount: courseDates[cid].size
          };
        });

        // 2. statusBreakdown
        const statusCounts: { [status: string]: number } = { PRESENT: 0, ABSENT: 0, LATE: 0, EXCUSED: 0 };
        local.attendance.forEach(a => {
          const s = a.status || 'PRESENT';
          statusCounts[s] = (statusCounts[s] || 0) + 1;
        });
        const statusBreakdown = Object.keys(statusCounts).map(s => ({
          status: s,
          count: statusCounts[s]
        }));

        // 3. studentAggregates
        const aggMap: { [key: string]: any } = {};
        local.attendance.forEach(a => {
          const enroll = local.enrollments.find(e => e.id === a.enrollment_id);
          if (enroll) {
            const key = `${enroll.student_id}-${enroll.course_id}`;
            if (!aggMap[key]) {
              const u = local.users.find(user => user.id === enroll.student_id);
              const c = local.courses.find(crs => crs.id === enroll.course_id);
              aggMap[key] = {
                studentId: enroll.student_id,
                studentName: u ? u.name : 'Unknown Student',
                studentRegistrationNumber: u ? u.registration_number : '',
                courseName: c ? c.name : 'Unknown Course',
                courseCode: c ? c.code : '',
                enrollmentId: enroll.id,
                presentCount: 0,
                absentCount: 0,
                lateCount: 0,
                excusedCount: 0,
                totalRecords: 0
              };
            }
            const agg = aggMap[key];
            const s = a.status || 'PRESENT';
            if (s === 'PRESENT') agg.presentCount++;
            else if (s === 'ABSENT') agg.absentCount++;
            else if (s === 'LATE') agg.lateCount++;
            else if (s === 'EXCUSED') agg.excusedCount++;
            agg.totalRecords++;
          }
        });
        const studentAggregates = Object.values(aggMap);

        return {
          classCountByCourse,
          statusBreakdown,
          studentAggregates
        };
      }
    }
  },

  exams: {
    async findByCourse(courseId: string) {
      if (isPostgresActive && pool) {
        const res = await pool.query(
          `SELECT * FROM exams WHERE course_id = $1 ORDER BY created_at ASC`,
          [courseId]
        );
        return toCamel(res.rows);
      } else {
        const local = readLocalDb();
        if (!local.exams) local.exams = [];
        const filtered = local.exams.filter(e => e.course_id === courseId);
        return toCamel(filtered);
      }
    },

    async create(exam: { id: string; courseId: string; title: string; type: string; maxMarks: number }) {
      if (isPostgresActive && pool) {
        await pool.query(
          `INSERT INTO exams (id, course_id, title, type, max_marks, is_published)
           VALUES ($1, $2, $3, $4, $5, FALSE)`,
          [exam.id, exam.courseId, exam.title, exam.type, exam.maxMarks]
        );
        return { ...exam, isPublished: false };
      } else {
        const local = readLocalDb();
        if (!local.exams) local.exams = [];
        const newExam = {
          id: exam.id,
          course_id: exam.courseId,
          title: exam.title,
          type: exam.type,
          max_marks: Number(exam.maxMarks),
          is_published: false,
          created_at: new Date().toISOString()
        };
        local.exams.push(newExam);
        writeLocalDb(local);
        return toCamel(newExam);
      }
    },

    async update(examId: string, updates: { title: string; type: string; maxMarks: number }) {
      if (isPostgresActive && pool) {
        const res = await pool.query(
          `UPDATE exams 
           SET title = $1, type = $2, max_marks = $3 
           WHERE id = $4 RETURNING *`,
          [updates.title, updates.type, Number(updates.maxMarks), examId]
        );
        return toCamel(res.rows[0]);
      } else {
        const local = readLocalDb();
        if (!local.exams) local.exams = [];
        const idx = local.exams.findIndex(e => e.id === examId);
        if (idx !== -1) {
          local.exams[idx].title = updates.title;
          local.exams[idx].type = updates.type;
          local.exams[idx].max_marks = Number(updates.maxMarks);
          writeLocalDb(local);
          return toCamel(local.exams[idx]);
        }
        return null;
      }
    },

    async publish(examId: string) {
      if (isPostgresActive && pool) {
        const res = await pool.query(
          `UPDATE exams SET is_published = TRUE WHERE id = $1 RETURNING *`,
          [examId]
        );
        return toCamel(res.rows[0]);
      } else {
        const local = readLocalDb();
        if (!local.exams) local.exams = [];
        const idx = local.exams.findIndex(e => e.id === examId);
        if (idx !== -1) {
          local.exams[idx].is_published = true;
          writeLocalDb(local);
          return toCamel(local.exams[idx]);
        }
        return null;
      }
    }
  },

  marks: {
    async findByExam(examId: string) {
      if (isPostgresActive && pool) {
        const res = await pool.query(
          `SELECT m.*, u.name as student_name, u.registration_number as student_registration_number
           FROM marks m
           JOIN users u ON m.student_id = u.id
           WHERE m.exam_id = $1 ORDER BY u.name ASC`,
          [examId]
        );
        return toCamel(res.rows);
      } else {
        const local = readLocalDb();
        if (!local.marks) local.marks = [];
        const filtered = local.marks
          .filter(m => m.exam_id === examId)
          .map(m => {
            const u = local.users.find(user => user.id === m.student_id);
            return {
              ...m,
              student_name: u ? u.name : 'Unknown Student',
              student_registration_number: u ? u.registration_number : ''
            };
          }).sort((a, b) => a.student_name.localeCompare(b.student_name));
        return toCamel(filtered);
      }
    },

    async findByCourse(courseId: string) {
      if (isPostgresActive && pool) {
        const res = await pool.query(
          `SELECT m.*, e.title as exam_title, e.max_marks, u.name as student_name, u.registration_number as student_registration_number
           FROM marks m
           JOIN exams e ON m.exam_id = e.id
           JOIN users u ON m.student_id = u.id
           WHERE e.course_id = $1 ORDER BY e.created_at DESC, u.name ASC`,
          [courseId]
        );
        return toCamel(res.rows);
      } else {
        const local = readLocalDb();
        if (!local.marks) local.marks = [];
        if (!local.exams) local.exams = [];
        const myExamIds = local.exams.filter(ex => ex.course_id === courseId).map(ex => ex.id);
        const filtered = local.marks
          .filter(m => myExamIds.includes(m.exam_id))
          .map(m => {
            const exam = local.exams?.find(ex => ex.id === m.exam_id);
            const u = local.users.find(user => user.id === m.student_id);
            return {
              ...m,
              exam_title: exam ? exam.title : 'Exam',
              max_marks: exam ? exam.max_marks : 100,
              student_name: u ? u.name : 'Unknown Student',
              student_registration_number: u ? u.registration_number : ''
            };
          });
        return toCamel(filtered);
      }
    },

    async findByStudent(studentId: string) {
      if (isPostgresActive && pool) {
        const res = await pool.query(
          `SELECT m.*, e.title as exam_title, e.type as exam_type, e.max_marks, c.name as course_name, c.code as course_code
           FROM marks m
           JOIN exams e ON m.exam_id = e.id
           JOIN courses c ON e.course_id = c.id
           WHERE m.student_id = $1 AND e.is_published = TRUE
           ORDER BY e.created_at DESC`,
          [studentId]
        );
        return toCamel(res.rows);
      } else {
        const local = readLocalDb();
        if (!local.marks) local.marks = [];
        if (!local.exams) local.exams = [];
        if (!local.courses) local.courses = [];
        const filtered = local.marks
          .filter(m => m.student_id === studentId)
          .map(m => {
            const exam = local.exams.find(ex => ex.id === m.exam_id);
            if (!exam || !exam.is_published) return null;
            const course = local.courses.find(c => c.id === exam.course_id);
            return {
              ...m,
              exam_title: exam.title,
              exam_type: exam.type,
              max_marks: exam.max_marks,
              course_name: course ? course.name : 'Unknown Course',
              course_code: course ? course.code : ''
            };
          })
          .filter(Boolean);
        return toCamel(filtered);
      }
    },

    async saveMark(mark: { id: string; examId: string; studentId: string; obtainedMarks: number; gradePoint: number; remarks: string }) {
      if (isPostgresActive && pool) {
        await pool.query(
          `INSERT INTO marks (id, exam_id, student_id, obtained_marks, grade_point, remarks)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (exam_id, student_id)
           DO UPDATE SET obtained_marks = EXCLUDED.obtained_marks, 
                         grade_point = EXCLUDED.grade_point, 
                         remarks = EXCLUDED.remarks, 
                         created_at = CURRENT_TIMESTAMP`,
          [mark.id, mark.examId, mark.studentId, mark.obtainedMarks, mark.gradePoint, mark.remarks]
        );
        return mark;
      } else {
        const local = readLocalDb();
        if (!local.marks) local.marks = [];
        const idx = local.marks.findIndex(m => m.exam_id === mark.examId && m.student_id === mark.studentId);
        const newMark = {
          id: mark.id,
          exam_id: mark.examId,
          student_id: mark.studentId,
          obtained_marks: Number(mark.obtainedMarks),
          grade_point: Number(mark.gradePoint),
          remarks: mark.remarks,
          created_at: new Date().toISOString()
        };
        if (idx !== -1) {
          local.marks[idx] = newMark;
        } else {
          local.marks.push(newMark);
        }
        writeLocalDb(local);
        return toCamel(newMark);
      }
    }
  },

  assignments: {
    async findByCourse(courseId: string) {
      if (isPostgresActive && pool) {
        const res = await pool.query(
          `SELECT * FROM assignments WHERE course_id = $1 ORDER BY created_at DESC`,
          [courseId]
        );
        return toCamel(res.rows);
      } else {
        const local = readLocalDb();
        if (!local.assignments) local.assignments = [];
        const filtered = local.assignments.filter(a => a.course_id === courseId);
        return toCamel(filtered);
      }
    },

    async findByStudent(studentId: string) {
      if (isPostgresActive && pool) {
        const coursesRes = await pool.query(`
          SELECT course_id FROM enrollments WHERE student_id = $1
        `, [studentId]);
        const courseIds = coursesRes.rows.map((r: any) => r.course_id);
        if (courseIds.length === 0) return [];

        const res = await pool.query(`
          SELECT a.*, c.name as course_name, c.code as course_code,
                 s.id as submission_id, s.submission_text, s.file_url as submission_file_url, s.submitted_at, s.score, s.feedback
          FROM assignments a
          JOIN courses c ON a.course_id = c.id
          LEFT JOIN submissions s ON a.id = s.assignment_id AND s.student_id = $1
          WHERE a.course_id = ANY($2)
          ORDER BY a.due_date ASC
        `, [studentId, courseIds]);
        return toCamel(res.rows);
      } else {
        const local = readLocalDb();
        if (!local.assignments) local.assignments = [];
        if (!local.enrollments) local.enrollments = [];
        if (!local.submissions) local.submissions = [];

        const enrolledCourseIds = local.enrollments
          .filter(e => e.student_id === studentId)
          .map(e => e.course_id);

        if (enrolledCourseIds.length === 0) return [];

        const filtered = local.assignments
          .filter(a => enrolledCourseIds.includes(a.course_id))
          .map(a => {
            const course = local.courses.find(c => c.id === a.course_id);
            const sub = local.submissions.find(s => s.assignment_id === a.id && s.student_id === studentId);
            return {
              ...a,
              course_name: course ? course.name : 'Unknown Course',
              course_code: course ? course.code : '',
              submission_id: sub ? sub.id : null,
              submission_text: sub ? sub.submission_text : null,
              submission_file_url: sub ? sub.file_url : null,
              submitted_at: sub ? sub.submitted_at : null,
              score: sub ? sub.score : null,
              feedback: sub ? sub.feedback : null
            };
          });

        filtered.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
        return toCamel(filtered);
      }
    },

    async create(assign: { id: string; courseId: string; title: string; description: string; maxScore: number; dueDate: string; materialUrl?: string }) {
      if (isPostgresActive && pool) {
        await pool.query(
          `INSERT INTO assignments (id, course_id, title, description, max_score, due_date, material_url)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [assign.id, assign.courseId, assign.title, assign.description, assign.maxScore, assign.dueDate, assign.materialUrl || null]
        );
        return assign;
      } else {
        const local = readLocalDb();
        if (!local.assignments) local.assignments = [];
        const newAssign = {
          id: assign.id,
          course_id: assign.courseId,
          title: assign.title,
          description: assign.description,
          max_score: Number(assign.maxScore),
          due_date: assign.dueDate,
          material_url: assign.materialUrl || null,
          created_at: new Date().toISOString()
        };
        local.assignments.push(newAssign);
        writeLocalDb(local);
        return toCamel(newAssign);
      }
    }
  },

  submissions: {
    async findByAssignment(assignmentId: string) {
      if (isPostgresActive && pool) {
        const res = await pool.query(
          `SELECT s.*, u.name as student_name, u.registration_number as student_registration_number
           FROM submissions s
           JOIN users u ON s.student_id = u.id
           WHERE s.assignment_id = $1 ORDER BY u.name ASC`,
          [assignmentId]
        );
        return toCamel(res.rows);
      } else {
        const local = readLocalDb();
        if (!local.submissions) local.submissions = [];
        const filtered = local.submissions
          .filter(sub => sub.assignment_id === assignmentId)
          .map(sub => {
            const u = local.users.find(user => user.id === sub.student_id);
            return {
              ...sub,
              student_name: u ? u.name : 'Unknown Student',
              student_registration_number: u ? u.registration_number : ''
            };
          }).sort((a, b) => a.student_name.localeCompare(b.student_name));
        return toCamel(filtered);
      }
    },

    async findByCourse(courseId: string) {
      if (isPostgresActive && pool) {
        const res = await pool.query(
          `SELECT s.*, a.title as assignment_title, a.max_score, u.name as student_name, u.registration_number as student_registration_number
           FROM submissions s
           JOIN assignments a ON s.assignment_id = a.id
           JOIN users u ON s.student_id = u.id
           WHERE a.course_id = $1 ORDER BY a.created_at DESC, u.name ASC`,
          [courseId]
        );
        return toCamel(res.rows);
      } else {
        const local = readLocalDb();
        if (!local.submissions) local.submissions = [];
        if (!local.assignments) local.assignments = [];
        const myAssignIds = local.assignments.filter(a => a.course_id === courseId).map(a => a.id);
        const filtered = local.submissions
          .filter(sub => myAssignIds.includes(sub.assignment_id))
          .map(sub => {
            const assign = local.assignments?.find(a => a.id === sub.assignment_id);
            const u = local.users.find(user => user.id === sub.student_id);
            return {
              ...sub,
              assignment_title: assign ? assign.title : 'Assignment',
              max_score: assign ? assign.max_score : 100,
              student_name: u ? u.name : 'Unknown Student',
              student_registration_number: u ? u.registration_number : ''
            };
          }).sort((a, b) => (a.studentName || '').localeCompare(b.studentName || ''));
        return toCamel(filtered);
      }
    },

    async saveSubmission(sub: { id: string; assignmentId: string; studentId: string; submissionText: string; fileUrl: string }) {
      if (isPostgresActive && pool) {
        await pool.query(
          `INSERT INTO submissions (id, assignment_id, student_id, submission_text, file_url)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (assignment_id, student_id)
           DO UPDATE SET submission_text = EXCLUDED.submission_text, 
                         file_url = EXCLUDED.file_url, 
                         submitted_at = CURRENT_TIMESTAMP`,
          [sub.id, sub.assignmentId, sub.studentId, sub.submissionText, sub.fileUrl]
        );
        return sub;
      } else {
        const local = readLocalDb();
        if (!local.submissions) local.submissions = [];
        const idx = local.submissions.findIndex(s => s.assignment_id === sub.assignmentId && s.student_id === sub.studentId);
        const newSub = {
          id: sub.id,
          assignment_id: sub.assignmentId,
          student_id: sub.studentId,
          submission_text: sub.submissionText,
          file_url: sub.fileUrl,
          score: null,
          feedback: null,
          graded_by: null,
          graded_at: null,
          submitted_at: new Date().toISOString()
        };
        if (idx !== -1) {
          local.submissions[idx].submission_text = sub.submissionText;
          local.submissions[idx].file_url = sub.fileUrl;
          local.submissions[idx].submitted_at = new Date().toISOString();
        } else {
          local.submissions.push(newSub);
        }
        writeLocalDb(local);
        return toCamel(newSub);
      }
    },

    async saveGrade(id: string, score: number, feedback: string, gradedBy: string) {
      if (isPostgresActive && pool) {
        const res = await pool.query(
          `UPDATE submissions 
           SET score = $1, feedback = $2, graded_by = $3, graded_at = CURRENT_TIMESTAMP
           WHERE id = $4 RETURNING *`,
          [score, feedback, gradedBy, id]
        );
        return toCamel(res.rows[0]);
      } else {
        const local = readLocalDb();
        if (!local.submissions) local.submissions = [];
        const idx = local.submissions.findIndex(s => s.id === id);
        if (idx !== -1) {
          local.submissions[idx].score = Number(score);
          local.submissions[idx].feedback = feedback;
          local.submissions[idx].graded_by = gradedBy;
          local.submissions[idx].graded_at = new Date().toISOString();
          writeLocalDb(local);
          return toCamel(local.submissions[idx]);
        }
        return null;
      }
    }
  },

  activityLogs: {
    async findAll() {
      if (isPostgresActive && pool) {
        const res = await pool.query(
          `SELECT al.*, u.name as user_name, u.role as user_role
           FROM activity_logs al
           LEFT JOIN users u ON al.user_id = u.id
           ORDER BY al.created_at DESC LIMIT 50`
        );
        return toCamel(res.rows);
      } else {
        const local = readLocalDb();
        if (!local.activity_logs) local.activity_logs = [];
        const result = local.activity_logs.map(log => {
          const u = local.users.find(user => user.id === log.user_id);
          return {
            ...log,
            userName: u ? u.name : 'System',
            userRole: u ? u.role : 'SYSTEM'
          };
        }).sort((a,b) => b.created_at.localeCompare(a.created_at));
        return toCamel(result);
      }
    },

    async create(log: { id: string; userId: string | null; action: string; entity: string; entityId: string | null; details: string; ipAddress?: string }) {
      const logId = log.id;
      const ip = log.ipAddress || '127.0.0.1';
      if (isPostgresActive && pool) {
        try {
          await pool.query(
            `INSERT INTO activity_logs (id, user_id, action, entity, entity_id, details, ip_address)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [logId, log.userId, log.action, log.entity, log.entityId, log.details, ip]
          );
        } catch (err) {
          console.error('Failed to log activity', err);
        }
      } else {
        const local = readLocalDb();
        if (!local.activity_logs) local.activity_logs = [];
        local.activity_logs.push({
          id: logId,
          user_id: log.userId,
          action: log.action,
          entity: log.entity,
          entity_id: log.entityId,
          details: log.details,
          ip_address: ip,
          created_at: new Date().toISOString()
        });
        writeLocalDb(local);
      }
    }
  },

  // ANALYTICS / GENERAL METHODS
  async getSystemStats() {
    if (isPostgresActive && pool) {
      const uRes = await pool.query('SELECT role, count(*) FROM users GROUP BY role');
      const cRes = await pool.query('SELECT count(*) FROM courses');
      const eRes = await pool.query('SELECT count(*), AVG(attendance_percentage) FROM enrollments');
      const gRes = await pool.query('SELECT grade, count(*) FROM enrollments WHERE grade != \$1 GROUP BY grade', ['Pending']);
      const feeRes = await pool.query('SELECT COALESCE(SUM(amount), 0) as invoiced, COALESCE(SUM(amount_paid), 0) as paid, COUNT(*) FILTER (WHERE status = \'UNPAID\' OR status = \'OVERDUE\') as unpaid_count FROM fees');
      const logRes = await pool.query('SELECT al.*, u.name as user_name FROM activity_logs al LEFT JOIN users u ON al.user_id = u.id ORDER BY al.created_at DESC LIMIT 6');

      const roles = uRes.rows.reduce((acc: any, row: any) => {
        acc[row.role] = Number(row.count);
        return acc;
      }, { ADMIN: 0, FACULTY: 0, STUDENT: 0 });

      return {
        totalStudents: roles.STUDENT,
        totalFaculty: roles.FACULTY,
        totalCourses: Number(cRes.rows[0]?.count) || 0,
        totalEnrollments: Number(eRes.rows[0]?.count) || 0,
        averageAttendance: Number(Number(eRes.rows[0]?.avg || 0).toFixed(2)),
        gradeDistribution: gRes.rows.map((row: any) => ({
          grade: row.grade,
          count: Number(row.count)
        })),
        totalFeesInvoiced: Number(feeRes.rows[0]?.invoiced || 0),
        totalFeesCollected: Number(feeRes.rows[0]?.paid || 0),
        unpaidFeesCount: Number(feeRes.rows[0]?.unpaid_count || 0),
        recentActivityLogs: toCamel(logRes.rows)
      };
    } else {
      const local = readLocalDb();
      const students = local.users.filter(u => u.role === 'STUDENT').length;
      const faculty = local.users.filter(u => u.role === 'FACULTY').length;
      const courses = local.courses.length;
      const enrollments = local.enrollments.length;

      let totalAttendance = 0;
      local.enrollments.forEach(e => {
        totalAttendance += Number(e.attendance_percentage || 0);
      });
      const avgAttendance = enrollments > 0 ? Number((totalAttendance / enrollments).toFixed(2)) : 100.0;

      const distributionMap: { [key: string]: number } = {};
      local.enrollments.forEach(e => {
        if (e.grade && e.grade !== 'Pending') {
          distributionMap[e.grade] = (distributionMap[e.grade] || 0) + 1;
        }
      });

      const gradeDistribution = Object.keys(distributionMap).map(grade => ({
        grade,
        count: distributionMap[grade]
      })).sort((a, b) => a.grade.localeCompare(b.grade));

      // Local fees stats
      if (!local.fees) local.fees = [];
      if (!local.activity_logs) local.activity_logs = [];

      let invoicedFee = 0;
      let paidFee = 0;
      let unpaidCount = 0;
      local.fees.forEach(f => {
        invoicedFee += Number(f.amount || 0);
        paidFee += Number(f.amount_paid || 0);
        if (f.status === 'UNPAID' || f.status === 'OVERDUE') {
          unpaidCount++;
        }
      });

      const recentLogsList = local.activity_logs.map(log => {
        const u = local.users.find(user => user.id === log.user_id);
        return {
          ...log,
          userName: u ? u.name : 'System'
        };
      }).sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 6);

      return {
        totalStudents: students,
        totalFaculty: faculty,
        totalCourses: courses,
        totalEnrollments: enrollments,
        averageAttendance: avgAttendance,
        gradeDistribution,
        totalFeesInvoiced: invoicedFee,
        totalFeesCollected: paidFee,
        unpaidFeesCount: unpaidCount,
        recentActivityLogs: toCamel(recentLogsList)
      };
    }
  }
};
