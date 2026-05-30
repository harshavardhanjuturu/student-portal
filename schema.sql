-- ============================================================================
-- POSTGRESQL DATABASE SCHEMA: STUDENT PORTAL MANAGEMENT SYSTEM
-- ============================================================================
-- Designed for complete database normalization (1NF, 2NF, 3NF), strong referential
-- integrity, comprehensive constraints, cascading operations, indexed pipelines,
-- and efficient data queries.
-- ============================================================================

-- Enable UUID extension for cryptographic identifiers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. TABLE: USERS (Admin, Faculty, Student base account data)
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY, -- Supports custom identifiers or UUID strings
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'FACULTY', 'STUDENT')),
    registration_number VARCHAR(50) UNIQUE NOT NULL,
    department VARCHAR(100),
    phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 2. TABLE: STUDENT_PROFILES (Normalized entity for detailed student metadata)
-- ============================================================================
CREATE TABLE IF NOT EXISTS student_profiles (
    student_id VARCHAR(50) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    batch VARCHAR(30) NOT NULL, -- e.g., "Batch 2026", "Sophomore"
    guardian_name VARCHAR(100),
    guardian_phone VARCHAR(20),
    enrollment_status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (enrollment_status IN ('ACTIVE', 'SUSPENDED', 'ALUMNI', 'LEAVE_OF_ABSENCE')),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 3. TABLE: FACULTY_PROFILES (Normalized entity for detailed academic faculty metadata)
-- ============================================================================
CREATE TABLE IF NOT EXISTS faculty_profiles (
    faculty_id VARCHAR(50) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    designation VARCHAR(100) NOT NULL, -- e.g., "Assistant Professor", "Dean"
    qualification VARCHAR(100) NOT NULL, -- e.g., "Ph.D. in Computer Science"
    office_room VARCHAR(50),
    joining_date DATE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 4. TABLE: COURSES (Catalog of scheduled subjects)
-- ============================================================================
CREATE TABLE IF NOT EXISTS courses (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    credits INT NOT NULL CHECK (credits > 0 AND credits <= 8),
    department VARCHAR(100) NOT NULL,
    faculty_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================================
-- 5. TABLE: ENROLLMENTS (Join table connecting students to enrolled courses)
-- ============================================================================
CREATE TABLE IF NOT EXISTS enrollments (
    id VARCHAR(50) PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id VARCHAR(50) NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    grade VARCHAR(10) DEFAULT 'Pending',
    attendance_percentage NUMERIC(5,2) DEFAULT 100.00 CHECK (attendance_percentage BETWEEN 0.00 AND 100.00),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (student_id, course_id)
);

-- ============================================================================
-- 6. TABLE: ATTENDANCE (Periodical physical class occurrence tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS attendance (
    id VARCHAR(50) PRIMARY KEY,
    enrollment_id VARCHAR(50) NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status VARCHAR(15) NOT NULL CHECK (status IN ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED')),
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (enrollment_id, date)
);

-- ============================================================================
-- 7. TABLE: EXAMS (Formal assessments for courses)
-- ============================================================================
CREATE TABLE IF NOT EXISTS exams (
    id VARCHAR(50) PRIMARY KEY,
    course_id VARCHAR(50) NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL, -- e.g., "Midterm Exam", "Finals Q3"
    type VARCHAR(35) NOT NULL CHECK (type IN ('MIDTERM', 'FINAL', 'QUIZ', 'PRACTICAL')),
    max_marks INT NOT NULL CHECK (max_marks > 0),
    exam_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 8. TABLE: MARKS (Raw grade points accumulated by student in specific exams)
-- ============================================================================
CREATE TABLE IF NOT EXISTS marks (
    id VARCHAR(50) PRIMARY KEY,
    exam_id VARCHAR(50) NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    student_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    obtained_marks NUMERIC(5,2) NOT NULL CHECK (obtained_marks >= 0.00),
    grade_point NUMERIC(3,2) CHECK (grade_point BETWEEN 0.00 AND 10.00), -- GPA point calculation
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (exam_id, student_id),
    CONSTRAINT chk_obtained_marks CHECK (obtained_marks <= (SELECT max_marks FROM exams WHERE id = exam_id) OR obtained_marks IS NOT NULL) -- Note: constraint logic
);

-- ============================================================================
-- 9. TABLE: ASSIGNMENTS (Course task requests posted by faculty)
-- ============================================================================
CREATE TABLE IF NOT EXISTS assignments (
    id VARCHAR(50) PRIMARY KEY,
    course_id VARCHAR(50) NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    max_score INT NOT NULL CHECK (max_score > 0),
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 10. TABLE: SUBMISSIONS (Student homework uploads and scores)
-- ============================================================================
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

-- ============================================================================
-- 11. TABLE: FEES (Financial transactions, tuition, and term payments)
-- ============================================================================
CREATE TABLE IF NOT EXISTS fees (
    id VARCHAR(50) PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL, -- e.g., "Spring Semester 2026 Tuition"
    amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0.00),
    due_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'UNPAID' CHECK (status IN ('PAID', 'UNPAID', 'PARTIALLY_PAID', 'OVERDUE')),
    amount_paid NUMERIC(10,2) DEFAULT 0.00 CHECK (amount_paid >= 0.00),
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_paid_bounds CHECK (amount_paid <= amount)
);

-- ============================================================================
-- 12. TABLE: NOTIFICATIONS (Role-based and user targeted push updates)
-- ============================================================================
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE, -- Null implies broadcast
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(30) DEFAULT 'SYSTEM' CHECK (type IN ('SYSTEM', 'GRADE', 'ATTENDANCE', 'FEE', 'ASSIGNMENT', 'EXAM')),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 13. TABLE: ACTIVITY_LOGS (Security forensic audit logs of user portal actions)
-- ============================================================================
CREATE TABLE IF NOT EXISTS activity_logs (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL, -- e.g., "USER_LOGIN", "COURSE_POST", "GRADE_SUBMIT"
    entity VARCHAR(50) NOT NULL, -- e.g., "USERS", "COURSES", "MARKS", "FEE"
    entity_id VARCHAR(50),
    details TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES: OPTIMIZATION AND SEARCH PERFORMANCE TUNING
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_reg_num ON users(registration_number);
CREATE INDEX IF NOT EXISTS idx_student_profiles_status ON student_profiles(enrollment_status);
CREATE INDEX IF NOT EXISTS idx_courses_faculty ON courses(faculty_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_attendance_enrollment ON attendance(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_exams_course ON exams(course_id);
CREATE INDEX IF NOT EXISTS idx_marks_exam ON marks(exam_id);
CREATE INDEX IF NOT EXISTS idx_marks_student ON marks(student_id);
CREATE INDEX IF NOT EXISTS idx_assignments_course ON assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student ON submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_fees_student ON fees(student_id);
CREATE INDEX IF NOT EXISTS idx_fees_status ON fees(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at);

-- ============================================================================
-- SEED INITIAL MOCK DATA
-- ============================================================================

-- Base Users (Default hashes: 'admin123', 'faculty123', 'student123')
INSERT INTO users (id, email, password_hash, name, role, registration_number, department, phone)
VALUES 
('admin-uuid-1', 'admin@portal.com', '$2a$10$wNqH.U6Nf7oSk0Sg240z.OFvYm/2yqZ/OQv3771gE.e00Z7.q.m.G', 'System Administrator', 'ADMIN', 'ADM2026001', 'Administration', '+1234567890'),
('faculty-uuid-1', 'dr.smith@portal.com', '$2a$10$pLwpxoN6qZve8E.L/kFvOus87gX3Zp2Kz.Teqb1wL9i.aZtqM9G6m', 'Dr. Sarah Smith', 'FACULTY', 'FAC2026001', 'Computer Science', '+1234567891'),
('faculty-uuid-2', 'prof.jones@portal.com', '$2a$10$pLwpxoN6qZve8E.L/kFvOus87gX3Zp2Kz.Teqb1wL9i.aZtqM9G6m', 'Prof. David Jones', 'FACULTY', 'FAC2026002', 'Electrical Engineering', '+1234567892'),
('student-uuid-1', 'alice@portal.com', '$2a$10$rNl4vQhN7vSk0Lp241z.OFuYm/2yqZ/OQv3761gE.e01Z8.q.m.H', 'Alice Cooper', 'STUDENT', 'STU2026001', 'Computer Science', '+1234567893'),
('student-uuid-2', 'bob@portal.com', '$2a$10$rNl4vQhN7vSk0Lp241z.OFuYm/2yqZ/OQv3761gE.e01Z8.q.m.H', 'Bob Johnson', 'STUDENT', 'STU2026002', 'Computer Science', '+1234567894'),
('student-uuid-3', 'charlie@portal.com', '$2a$10$rNl4vQhN7vSk0Lp241z.OFuYm/2yqZ/OQv3761gE.e01Z8.q.m.H', 'Charlie Brown', 'STUDENT', 'STU2026003', 'Electrical Engineering', '+1234567895')
ON CONFLICT (email) DO NOTHING;

-- Student Profiles
INSERT INTO student_profiles (student_id, batch, guardian_name, guardian_phone, enrollment_status)
VALUES
('student-uuid-1', 'Sophomore CS', 'John Cooper', '+1444333222', 'ACTIVE'),
('student-uuid-2', 'Freshman CS', 'Martha Johnson', '+1444333223', 'ACTIVE'),
('student-uuid-3', 'Senior EE', 'Richard Brown', '+1444333224', 'ACTIVE')
ON CONFLICT (student_id) DO NOTHING;

-- Faculty Profiles
INSERT INTO faculty_profiles (faculty_id, designation, qualification, office_room, joining_date)
VALUES
('faculty-uuid-1', 'Associate Professor', 'Ph.D. in Computer Science', 'Tech Hall 401', '2019-08-15'),
('faculty-uuid-2', 'Professor & Dept Head', 'Ph.D. in Electrical Eng', 'Maxwell Labs 203', '2015-01-10')
ON CONFLICT (faculty_id) DO NOTHING;

-- Courses Catalog
INSERT INTO courses (id, code, name, description, credits, department, faculty_id)
VALUES 
('course-uuid-1', 'CS101', 'Introduction to Computer Science', 'Fundamental concepts of programming, algorithms, and data structures.', 4, 'Computer Science', 'faculty-uuid-1'),
('course-uuid-2', 'CS301', 'Database Systems', 'Relational database model, SQL, normalization, transactions, and indexing.', 3, 'Computer Science', 'faculty-uuid-1'),
('course-uuid-3', 'EE110', 'Basic Circuit Theory', 'Analysis of resistive circuits, nodal and mesh analysis, and network theorems.', 4, 'Electrical Engineering', 'faculty-uuid-2'),
('course-uuid-4', 'EE410', 'Digital Signal Processing', 'Discrete-time signals and systems, Z-transform, DFT, and filter design.', 3, 'Electrical Engineering', 'faculty-uuid-2')
ON CONFLICT (code) DO NOTHING;

-- Enrollments
INSERT INTO enrollments (id, student_id, course_id, grade, attendance_percentage)
VALUES 
('enroll-uuid-1', 'student-uuid-1', 'course-uuid-1', 'A', 95.00),
('enroll-uuid-2', 'student-uuid-1', 'course-uuid-2', 'B+', 88.50),
('enroll-uuid-3', 'student-uuid-2', 'course-uuid-1', 'Pending', 92.00),
('enroll-uuid-4', 'student-uuid-3', 'course-uuid-3', 'A', 98.00),
('enroll-uuid-5', 'student-uuid-3', 'course-uuid-4', 'Pending', 78.20)
ON CONFLICT (student_id, course_id) DO NOTHING;

-- Attendance
INSERT INTO attendance (id, enrollment_id, date, status, remarks)
VALUES
('att-uuid-1', 'enroll-uuid-1', '2026-05-10', 'PRESENT', 'On-time'),
('att-uuid-2', 'enroll-uuid-1', '2026-05-11', 'PRESENT', 'On-time'),
('att-uuid-3', 'enroll-uuid-1', '2026-05-12', 'ABSENT', 'Excused medical absence'),
('att-uuid-4', 'enroll-uuid-2', '2026-05-10', 'PRESENT', 'On-time'),
('att-uuid-5', 'enroll-uuid-3', '2026-05-10', 'PRESENT', 'Late - bus delayed'),
('att-uuid-6', 'enroll-uuid-4', '2026-05-10', 'PRESENT', 'On-time'),
('att-uuid-7', 'enroll-uuid-5', '2026-05-10', 'ABSENT', 'No show')
ON CONFLICT (enrollment_id, date) DO NOTHING;

-- Exams
INSERT INTO exams (id, course_id, title, type, max_marks, exam_date)
VALUES
('exam-uuid-1', 'course-uuid-1', 'CS101 Midterm', 'MIDTERM', 100, '2026-04-15'),
('exam-uuid-2', 'course-uuid-1', 'CS101 Final Exam', 'FINAL', 100, '2026-05-25'),
('exam-uuid-3', 'course-uuid-3', 'EE110 Midterm Theory', 'MIDTERM', 50, '2026-04-18')
ON CONFLICT (id) DO NOTHING;

-- Marks
INSERT INTO marks (id, exam_id, student_id, obtained_marks, grade_point, remarks)
VALUES
('mark-uuid-1', 'exam-uuid-1', 'student-uuid-1', 92.00, 9.50, 'Outstanding analytical response.'),
('mark-uuid-2', 'exam-uuid-1', 'student-uuid-2', 78.50, 8.00, 'Solid understanding of loops.'),
('mark-uuid-3', 'exam-uuid-3', 'student-uuid-3', 47.00, 9.80, 'Excellent circuit diagram analysis.')
ON CONFLICT (exam_id, student_id) DO NOTHING;

-- Assignments
INSERT INTO assignments (id, course_id, title, description, max_score, due_date)
VALUES
('assign-uuid-1', 'course-uuid-1', 'Homework #1: Algorithm Design', 'Design psuedocode flowcharts for sorting and searching arrays.', 100, '2026-03-20 23:59:00+00'),
('assign-uuid-2', 'course-uuid-2', 'Homework #2: Schema Normalization', 'Complete 3NF translation exercises for given corporate database.', 100, '2026-04-22 23:59:00+00')
ON CONFLICT (id) DO NOTHING;

-- Submissions
INSERT INTO submissions (id, assignment_id, student_id, submission_text, file_url, score, feedback, graded_by, graded_at)
VALUES
('sub-uuid-1', 'assign-uuid-1', 'student-uuid-1', 'Submission doc explaining bubble sort and bubble-opt solutions.', 'https://storage.portal.net/submissions/CS101_HW1_alice.pdf', 90.00, 'Clean pseudocode, very legible.', 'faculty-uuid-1', '2026-03-21 14:00:00+00'),
('sub-uuid-2', 'assign-uuid-2', 'student-uuid-1', '3NF schema diagrams including entity relations and key validations.', 'https://storage.portal.net/submissions/CS301_HW2_alice.pdf', 95.00, 'Perfect database keys structure mapped.', 'faculty-uuid-1', '2026-04-23 10:30:00+00')
ON CONFLICT (assignment_id, student_id) DO NOTHING;

-- Fees Bills
INSERT INTO fees (id, student_id, title, amount, due_date, status, amount_paid, paid_at)
VALUES
('fee-uuid-1', 'student-uuid-1', 'Spring Semester 2026 CSE Tuition', 4500.00, '2026-02-15', 'PAID', 4500.00, '2026-02-14 09:12:00+00'),
('fee-uuid-2', 'student-uuid-2', 'Spring Semester 2026 CSE Tuition', 4500.00, '2026-02-15', 'PAID', 4500.00, '2026-02-15 16:34:00+00'),
('fee-uuid-3', 'student-uuid-3', 'Spring Semester 2026 EEE Tuition & Lab Fee', 4750.00, '2026-02-15', 'UNPAID', 0.00, NULL)
ON CONFLICT (id) DO NOTHING;

-- Notifications
INSERT INTO notifications (id, user_id, title, message, type, is_read)
VALUES
('notif-uuid-1', 'student-uuid-1', 'Midterm examination results published', 'Your marks for CS101 Midterm have been published. Score: 92/100.', 'GRADE', FALSE),
('notif-uuid-2', 'student-uuid-3', 'Outstanding Fees Bill Due', 'Please clear your spring tuition invoice by the grace period to avoid portal lockout.', 'FEE', FALSE),
('notif-uuid-3', NULL, 'Campus Maintenance Notice', 'Maxwell Lab Hall general electricity supply will remain partially suspended on Sunday for annual routine checkups.', 'SYSTEM', FALSE)
ON CONFLICT (id) DO NOTHING;

-- Activity Logs
INSERT INTO activity_logs (id, user_id, action, entity, entity_id, details, ip_address)
VALUES
('log-uuid-1', 'admin-uuid-1', 'USER_REGISTERED', 'USERS', 'student-uuid-3', 'Newly added student Charlie Brown', '192.168.1.10'),
('log-uuid-2', 'faculty-uuid-1', 'CURRICULUM_ADDED', 'COURSES', 'course-uuid-1', 'Assigned syllabus outline for CS101 Computer Science', '195.42.10.88'),
('log-uuid-3', 'student-uuid-1', 'ASSIGNMENT_SUBMITTED', 'SUBMISSIONS', 'sub-uuid-1', 'Completed HW1 Upload', '120.34.1.201')
ON CONFLICT (id) DO NOTHING;
