import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db.js';

// ES Module configurations
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_portal_key_2026_jwt_token!';

app.use(express.json());

// Helper to generate registration numbers
function generateRegistrationNumber(role: string): string {
  const prefix = role === 'ADMIN' ? 'ADM' : role === 'FACULTY' ? 'FAC' : 'STU';
  const year = '2026';
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}${year}${random}`;
}

// Authentication Middlewares & Guards
interface AuthenticatedRequest extends express.Request {
  user?: {
    id: string;
    email: string;
    role: 'ADMIN' | 'FACULTY' | 'STUDENT';
    name: string;
  };
}

const authenticateJWT = (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1]; // Bearer <token>
    if (!token) {
      res.status(401).json({ message: 'Authentication token missing.' });
      return;
    }
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        res.status(403).json({ message: 'Token is invalid or expired.' });
        return;
      }
      req.user = decoded as AuthenticatedRequest['user'];
      next();
    });
  } else {
    res.status(401).json({ message: 'Authorization header is required.' });
  }
};

const requireRole = (roles: ('ADMIN' | 'FACULTY' | 'STUDENT')[]) => {
  return (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized. Please login.' });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ message: `Forbidden. Requires one of these roles: ${roles.join(', ')}` });
      return;
    }
    next();
  };
};

// ==========================================
// 1. PUBLIC AUTHENTICATION APIs
// ==========================================

// Register Route
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, role, department, phone } = req.body;

    if (!email || !password || !name) {
      res.status(400).json({ message: 'Email, password, and name are required.' });
      return;
    }

    const assignedRole = (role && ['STUDENT', 'FACULTY'].includes(role.toUpperCase())) 
      ? role.toUpperCase() 
      : 'STUDENT';

    // Verify user doesn't already exist
    const existingUser = await db.users.findByEmail(email);
    if (existingUser) {
      res.status(400).json({ message: 'An account with this email already exists.' });
      return;
    }

    // Hash the password with bcryptjs
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const id = `${assignedRole.toLowerCase()}-uuid-${Math.random().toString(36).substr(2, 9)}`;
    const registration_number = generateRegistrationNumber(assignedRole);

    const newUser = await db.users.create({
      id,
      email,
      password_hash,
      name,
      role: assignedRole,
      registration_number,
      department: department || 'General Studies',
      phone: phone || ''
    });

    res.status(201).json({
      message: 'Registration successful!',
      user: newUser
    });
  } catch (error: any) {
    console.error('Registration failure:', error);
    res.status(500).json({ message: 'Internal server error during registration.', error: error.message });
  }
});

// Login Route
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required.' });
      return;
    }

    const user = await db.users.findByEmail(email);
    if (!user) {
      res.status(401).json({ message: 'Invalid email or password.' });
      return;
    }

    // Verify password hash
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      res.status(401).json({ message: 'Invalid email or password.' });
      return;
    }

    // Generate JWT token (expiring in 24 hours)
    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });

    res.status(200).json({
      message: 'Login successful!',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        registrationNumber: user.registration_number,
        department: user.department,
        phone: user.phone
      }
    });
  } catch (error: any) {
    console.error('Login failure:', error);
    res.status(500).json({ message: 'Internal server error during login.', error: error.message });
  }
});

// Verify Me / Get Current User Profiles
app.get('/api/auth/me', authenticateJWT, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    const profile = await db.users.findById(req.user.id);
    if (!profile) {
      res.status(404).json({ message: 'User profile not found.' });
      return;
    }
    res.status(200).json({ user: profile });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
// 2. ADMIN PORTAL SERVICES (Role Gaurd: ADMIN)
// ==========================================

// Get Dashboard Analytics
app.get('/api/admin/stats', authenticateJWT, requireRole(['ADMIN']), async (req, res) => {
  try {
    const stats = await db.getSystemStats();
    res.status(200).json({ stats });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get Admin Attendance Analytics & Reports
app.get('/api/admin/attendance/stats', authenticateJWT, requireRole(['ADMIN']), async (req, res) => {
  try {
    const stats = await db.attendance.getAttendanceStats();
    res.status(200).json({ stats });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get Academic Examinations Report
app.get('/api/admin/exams/report', authenticateJWT, requireRole(['ADMIN']), async (req, res) => {
  try {
    let exams: any[] = [];
    let marks: any[] = [];

    if (process.env.PGHOST && (db as any).pool) {
      const examsRes = await (db as any).pool.query(
        `SELECT e.*, c.name as course_name, c.code as course_code 
         FROM exams e 
         JOIN courses c ON e.course_id = c.id 
         ORDER BY e.created_at DESC`
      );
      const marksRes = await (db as any).pool.query(
        `SELECT m.*, e.title as exam_title, e.max_marks, e.type as exam_type, u.name as student_name, u.registration_number as student_registration_number, c.name as course_name, c.code as course_code 
         FROM marks m 
         JOIN exams e ON m.exam_id = e.id 
         JOIN users u ON m.student_id = u.id 
         JOIN courses c ON e.course_id = c.id
         ORDER BY m.created_at DESC`
      );
      // Convert Postgres outputs to clean object lists
      exams = examsRes.rows.map((r: any) => ({
        id: r.id,
        courseId: r.course_id,
        title: r.title,
        type: r.type,
        maxMarks: Number(r.max_marks),
        isPublished: !!r.is_published,
        createdAt: r.created_at,
        courseName: r.course_name,
        courseCode: r.course_code
      }));
      marks = marksRes.rows.map((r: any) => ({
        id: r.id,
        examId: r.exam_id,
        studentId: r.student_id,
        obtainedMarks: Number(r.obtained_marks),
        gradePoint: Number(r.grade_point),
        remarks: r.remarks,
        createdAt: r.created_at,
        examTitle: r.exam_title,
        examType: r.exam_type,
        maxMarks: Number(r.max_marks),
         studentName: r.student_name,
         studentRegistrationNumber: r.student_registration_number,
         courseName: r.course_name,
         courseCode: r.course_code
      }));
    } else {
      const local = (db as any).readLocalDb();
      if (!local.exams) local.exams = [];
      if (!local.marks) local.marks = [];
      if (!local.courses) local.courses = [];
      if (!local.users) local.users = [];

      exams = local.exams.map((e: any) => {
        const course = local.courses.find((c: any) => c.id === e.course_id);
        return {
          id: e.id,
          courseId: e.course_id,
          title: e.title,
          type: e.type,
          maxMarks: Number(e.max_marks),
          isPublished: !!e.is_published,
          createdAt: e.created_at,
          courseName: course ? course.name : 'Unknown Course',
          courseCode: course ? course.code : ''
        };
      });

      marks = local.marks.map((m: any) => {
        const exam = local.exams.find((ex: any) => ex.id === m.exam_id);
        const student = local.users.find((u: any) => u.id === m.student_id);
        const course = exam ? local.courses.find((c: any) => c.id === exam.course_id) : null;
        return {
          id: m.id,
          examId: m.exam_id,
          studentId: m.student_id,
          obtainedMarks: Number(m.obtained_marks),
          gradePoint: Number(m.grade_point),
          remarks: m.remarks,
          createdAt: m.created_at,
          examTitle: exam ? exam.title : 'Exam',
          examType: exam ? exam.type : 'QUIZ',
          maxMarks: exam ? Number(exam.max_marks) : 100,
          studentName: student ? student.name : 'Unknown Student',
          studentRegistrationNumber: student ? student.registration_number : '',
          courseName: course ? course.name : 'Unknown Course',
          courseCode: course ? course.code : ''
        };
      });
    }

    const totalExams = exams.length;
    const publishedExams = exams.filter((e: any) => e.isPublished).length;
    const totalMarksEntered = marks.length;
    
    let sumScorePercent = 0;
    marks.forEach((m: any) => {
      sumScorePercent += (m.obtainedMarks / m.maxMarks) * 100;
    });
    const averageScorePercent = totalMarksEntered > 0 ? (sumScorePercent / totalMarksEntered) : 0;

    // Exam-wise performance stats
    const examWise = exams.map((ex: any) => {
      const examMarks = marks.filter((m: any) => m.examId === ex.id);
      const totalGraded = examMarks.length;
      let obtainedSum = 0;
      let maxObtained = 0;
      let passCount = 0;

      examMarks.forEach((m: any) => {
        obtainedSum += m.obtainedMarks;
        if (m.obtainedMarks > maxObtained) maxObtained = m.obtainedMarks;
        if (m.obtainedMarks >= (ex.maxMarks * 0.5)) passCount++; // 50% pass threshold
      });

      return {
        id: ex.id,
        title: ex.title,
        type: ex.type,
        maxMarks: ex.maxMarks,
        isPublished: ex.isPublished,
        courseCode: ex.courseCode,
        courseName: ex.courseName,
        totalGraded,
        averageObtained: totalGraded > 0 ? Number((obtainedSum / totalGraded).toFixed(1)) : 0,
        averagePercent: totalGraded > 0 ? Number(((obtainedSum / (ex.maxMarks * totalGraded)) * 100).toFixed(1)) : 0,
        maxObtained,
        passRate: totalGraded > 0 ? Number(((passCount / totalGraded) * 100).toFixed(1)) : 0
      };
    });

    // Course-wise performance stats
    const coursesMap: Record<string, { courseName: string, courseCode: string, sumPercents: number, passCount: number, gradedCount: number }> = {};
    marks.forEach((m: any) => {
      const key = m.courseCode || 'OTHER';
      if (!coursesMap[key]) {
        coursesMap[key] = {
          courseName: m.courseName || 'Other',
          courseCode: m.courseCode || 'OTHER',
          sumPercents: 0,
          passCount: 0,
          gradedCount: 0
        };
      }
      coursesMap[key].gradedCount++;
      coursesMap[key].sumPercents += (m.obtainedMarks / m.maxMarks) * 100;
      if (m.obtainedMarks >= (m.maxMarks * 0.5)) {
        coursesMap[key].passCount++;
      }
    });

    const courseWise = Object.values(coursesMap).map((c: any) => ({
      courseName: c.courseName,
      courseCode: c.courseCode,
      gradedCount: c.gradedCount,
      averagePercent: c.gradedCount > 0 ? Number((c.sumPercents / c.gradedCount).toFixed(1)) : 0,
      passRate: c.gradedCount > 0 ? Number(((c.passCount / c.gradedCount) * 100).toFixed(1)) : 0
    }));

    // Top performers (obtained score percent)
    const topPerformers = [...marks]
      .map((m: any) => ({
        studentName: m.studentName,
        studentRegistrationNumber: m.studentRegistrationNumber,
        examTitle: m.examTitle,
        examType: m.examType,
        courseCode: m.courseCode,
        maxMarks: m.maxMarks,
        obtainedMarks: m.obtainedMarks,
        percentage: Number(((m.obtainedMarks / m.maxMarks) * 100).toFixed(1))
      }))
      .sort((a,b) => b.percentage - a.percentage)
      .slice(0, 10);

    // Flagged Deficit/Needy List (percentage < 50%)
    const flaggedDeficits = [...marks]
      .filter((m: any) => (m.obtainedMarks / m.maxMarks) < 0.5)
      .map((m: any) => ({
        studentName: m.studentName,
        studentRegistrationNumber: m.studentRegistrationNumber,
        examTitle: m.examTitle,
        courseCode: m.courseCode,
        maxMarks: m.maxMarks,
        obtainedMarks: m.obtainedMarks,
        percentage: Number(((m.obtainedMarks / m.maxMarks) * 100).toFixed(1)),
        remarks: m.remarks
      }))
      .sort((a,b) => a.percentage - b.percentage);

    res.status(200).json({
      stats: {
        overallStats: {
          totalExams,
          publishedExams,
          totalMarksEntered,
          averageScorePercent: Number(averageScorePercent.toFixed(1))
        },
        examWise,
        courseWise,
        topPerformers,
        flaggedDeficits
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// List Users by Role
app.get('/api/admin/users/:role', authenticateJWT, requireRole(['ADMIN']), async (req, res) => {
  try {
    const roleCapitalized = req.params.role.toUpperCase();
    if (!['STUDENT', 'FACULTY', 'ADMIN'].includes(roleCapitalized)) {
      res.status(400).json({ message: 'Invalid role request parameter.' });
      return;
    }
    const users = await db.users.findAllByRole(roleCapitalized);
    res.status(200).json({ users });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Create User (Student/Faculty) directly by Admin
app.post('/api/admin/users', authenticateJWT, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { email, password, name, role, department, phone } = req.body;
    if (!email || !password || !name || !role) {
      res.status(400).json({ message: 'Email, password, name, and role are required.' });
      return;
    }

    const assignedRole = role.toUpperCase();
    if (!['STUDENT', 'FACULTY', 'ADMIN'].includes(assignedRole)) {
      res.status(400).json({ message: 'Invalid role.' });
      return;
    }

    const exists = await db.users.findByEmail(email);
    if (exists) {
      res.status(400).json({ message: 'User with this email already exists.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    const id = `${assignedRole.toLowerCase()}-uuid-${Math.random().toString(36).substr(2, 9)}`;
    const regNum = generateRegistrationNumber(assignedRole);

    const newUser = await db.users.create({
      id,
      email,
      password_hash,
      name,
      role: assignedRole,
      registration_number: regNum,
      department: department || '',
      phone: phone || ''
    });

    // Log creation
    await db.activityLogs.create({
      id: `log-uuid-${Math.random().toString(36).substr(2, 9)}`,
      userId: (req as any).user?.id || null,
      action: 'USER_REGISTERED',
      entity: 'USERS',
      entityId: newUser.id,
      details: `Admin registered new ${assignedRole}: ${name} (${email})`
    });

    res.status(201).json({ message: 'User created successfully.', user: newUser });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Delete User
app.delete('/api/admin/users/:id', authenticateJWT, requireRole(['ADMIN']), async (req, res) => {
  try {
    await db.users.delete(req.params.id);

    // Log user deletion
    await db.activityLogs.create({
      id: `log-uuid-${Math.random().toString(36).substr(2, 9)}`,
      userId: (req as any).user?.id || null,
      action: 'USER_DELETED',
      entity: 'USERS',
      entityId: req.params.id,
      details: `Admin deleted user profile ID: ${req.params.id}`
    });

    res.status(200).json({ message: 'User and all active enrollments deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Update User (Edit Student or Faculty info)
app.put('/api/admin/users/:id', authenticateJWT, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const { email, name, password, department, phone } = req.body;

    const existingUser = await db.users.findById(id);
    if (!existingUser) {
      res.status(404).json({ message: 'User profile not found.' });
      return;
    }

    const updates: any = {};
    if (email !== undefined) {
      if (email !== existingUser.email) {
        const emailExists = await db.users.findByEmail(email);
        if (emailExists) {
          res.status(400).json({ message: 'User with this email already exists.' });
          return;
        }
      }
      updates.email = email;
    }
    if (name !== undefined) updates.name = name;
    if (department !== undefined) updates.department = department || '';
    if (phone !== undefined) updates.phone = phone || '';

    if (password !== undefined && password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      updates.password_hash = await bcrypt.hash(password, salt);
    }

    const updated = await db.users.update(id, updates);

    // Log update
    await db.activityLogs.create({
      id: `log-uuid-${Math.random().toString(36).substr(2, 9)}`,
      userId: (req as any).user?.id || null,
      action: 'USER_UPDATED',
      entity: 'USERS',
      entityId: id,
      details: `Admin modified profile details of ${existingUser.name} (${existingUser.email})`
    });

    res.status(200).json({ message: 'User updated successfully.', user: updated });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Fetch detailed student profiles with all metadata enrollments & fee balances
app.get('/api/admin/students/:id', authenticateJWT, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const userProfile = await db.users.findById(id);
    if (!userProfile) {
      res.status(404).json({ message: 'Student profile not found.' });
      return;
    }
    
    // Validate role is STUDENT
    if (userProfile.role !== 'STUDENT') {
      res.status(400).json({ message: 'Requested user is not registered as a Student.' });
      return;
    }

    // Load actual course registry enrollments
    const enrollments = await db.enrollments.findByStudent(id);

    // Load actual billing fees
    const allFees = await db.fees.findAll();
    const studentFees = allFees.filter((f: any) => f.studentId === id);

    res.status(200).json({
      student: userProfile,
      enrollments,
      fees: studentFees
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Fetch detailed faculty profiles with assigned subjects/classes
app.get('/api/admin/faculty/:id', authenticateJWT, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const facultyData = await (db as any).faculty.findById(id);
    if (!facultyData) {
      res.status(404).json({ message: 'Faculty profile not found.' });
      return;
    }
    res.status(200).json(facultyData);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Assign subjects/courses to a faculty member
app.put('/api/admin/faculty/:id/courses', authenticateJWT, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const { courseIds } = req.body;
    if (!Array.isArray(courseIds)) {
      res.status(400).json({ message: 'courseIds must be an array of course identifiers.' });
      return;
    }

    const facultyUser = await db.users.findById(id);
    if (!facultyUser || facultyUser.role !== 'FACULTY') {
      res.status(404).json({ message: 'Faculty member profile not found.' });
      return;
    }

    await (db as any).faculty.assignCourses(id, courseIds);

    // Log the assignment
    await db.activityLogs.create({
      id: `log-uuid-${Math.random().toString(36).substr(2, 9)}`,
      userId: (req as any).user?.id || null,
      action: 'FACULTY_ASSIGNMENT_UPDATED',
      entity: 'USERS',
      entityId: id,
      details: `Admin assigned ${courseIds.length} course(s) to Faculty Coach: ${facultyUser.name}`
    });

    res.status(200).json({ message: 'Faculty subjects and classes updated successfully.' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Fetch all Courses
app.get('/api/admin/courses', authenticateJWT, requireRole(['ADMIN']), async (req, res) => {
  try {
    const courses = await db.courses.findAll();
    res.status(200).json({ courses });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Create Course
app.post('/api/admin/courses', authenticateJWT, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { code, name, description, credits, department, faculty_id } = req.body;
    if (!code || !name || !credits || !department) {
      res.status(400).json({ message: 'Code, name, credits, and department are required.' });
      return;
    }

    const codeUpper = code.toUpperCase();
    const id = `course-uuid-${Math.random().toString(36).substr(2, 9)}`;

    const newCourse = await db.courses.create({
      id,
      code: codeUpper,
      name,
      description: description || '',
      credits: Number(credits),
      department,
      faculty_id: faculty_id || undefined
    });

    // Log course creation
    await db.activityLogs.create({
      id: `log-uuid-${Math.random().toString(36).substr(2, 9)}`,
      userId: (req as any).user?.id || null,
      action: 'COURSE_CREATED',
      entity: 'COURSES',
      entityId: id,
      details: `Admin created subject: [${codeUpper}] ${name}`
    });

    res.status(201).json({ message: 'Course created successfully.', course: newCourse });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// Update Course
app.put('/api/admin/courses/:id', authenticateJWT, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { name, description, credits, department, faculty_id } = req.body;
    if (!name || !credits || !department) {
      res.status(400).json({ message: 'Name, credits, and department are required.' });
      return;
    }

    const updated = await db.courses.update(req.params.id, {
      name,
      description: description || '',
      credits: Number(credits),
      department,
      faculty_id: faculty_id || undefined
    });

    // Log course update
    await db.activityLogs.create({
      id: `log-uuid-${Math.random().toString(36).substr(2, 9)}`,
      userId: (req as any).user?.id || null,
      action: 'COURSE_UPDATED',
      entity: 'COURSES',
      entityId: req.params.id,
      details: `Admin updated course syllabus/particulars: ${name}`
    });

    res.status(200).json({ message: 'Course updated successfully.', course: updated });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// Delete Course
app.delete('/api/admin/courses/:id', authenticateJWT, requireRole(['ADMIN']), async (req, res) => {
  try {
    await db.courses.delete(req.params.id);

    // Log course deletion
    await db.activityLogs.create({
      id: `log-uuid-${Math.random().toString(36).substr(2, 9)}`,
      userId: (req as any).user?.id || null,
      action: 'COURSE_DELETED',
      entity: 'COURSES',
      entityId: req.params.id,
      details: `Admin deleted subject catalog ID: ${req.params.id}`
    });

    res.status(200).json({ message: 'Course deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Fetch Enrollments (All of them)
app.get('/api/admin/enrollments', authenticateJWT, requireRole(['ADMIN']), async (req, res) => {
  try {
    const enrollments = await db.enrollments.findAll();
    res.status(200).json({ enrollments });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Admin-forced Course Enrollment
app.post('/api/admin/enrollments', authenticateJWT, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { student_id, course_id } = req.body;
    if (!student_id || !course_id) {
      res.status(400).json({ message: 'Student and course details are required.' });
      return;
    }

    const id = `enroll-uuid-${Math.random().toString(36).substr(2, 9)}`;
    const enrollment = await db.enrollments.create({ id, student_id, course_id });

    // Log enrollment
    await db.activityLogs.create({
      id: `log-uuid-${Math.random().toString(36).substr(2, 9)}`,
      userId: (req as any).user?.id || null,
      action: 'ENROLLMENT_ALLOCATED',
      entity: 'ENROLLMENTS',
      entityId: id,
      details: `Admin mapped Allocation roll registry (Student ID: ${student_id}, Course ID: ${course_id})`
    });

    res.status(201).json({ message: 'Student enrolled successfully.', enrollment });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// Admin deletes Enrollment
app.delete('/api/admin/enrollments/:id', authenticateJWT, requireRole(['ADMIN']), async (req, res) => {
  try {
    await db.enrollments.delete(req.params.id);
    
    // Log deletion
    await db.activityLogs.create({
      id: `log-uuid-${Math.random().toString(36).substr(2, 9)}`,
      userId: (req as any).user?.id || null,
      action: 'ENROLLMENT_REVOKED',
      entity: 'ENROLLMENTS',
      entityId: req.params.id,
      details: `Admin removed enrollment ID ${req.params.id}`
    });

    res.status(200).json({ message: 'Student unenrolled successfully.' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Fetch all Fee records
app.get('/api/admin/fees', authenticateJWT, requireRole(['ADMIN']), async (req, res) => {
  try {
    const fees = await db.fees.findAll();
    res.status(200).json({ fees });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Fetch all Fee Structures
app.get('/api/admin/fee-structures', authenticateJWT, requireRole(['ADMIN']), async (req, res) => {
  try {
    const structures = await (db as any).feeStructures.findAll();
    res.status(200).json({ structures });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Create a Fee Structure Template
app.post('/api/admin/fee-structures', authenticateJWT, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { name, description, amount, category } = req.body;
    if (!name || amount === undefined || !category) {
      res.status(400).json({ message: 'Name, category, and amount are required.' });
      return;
    }

    const id = `struct-uuid-${Math.random().toString(36).substr(2, 9)}`;
    const structure = await (db as any).feeStructures.create({
      id,
      name,
      description: description || '',
      amount: Number(amount),
      category
    });

    res.status(201).json({ message: 'Fee structure created successfully.', structure });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Delete a Fee Structure
app.delete('/api/admin/fee-structures/:id', authenticateJWT, requireRole(['ADMIN']), async (req, res) => {
  try {
    await (db as any).feeStructures.delete(req.params.id);
    res.status(200).json({ message: 'Fee structure template deleted.' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Bulk Create Fee Bills
app.post('/api/admin/fees/bulk', authenticateJWT, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { student_ids, title, amount, due_date } = req.body;
    if (!student_ids || !Array.isArray(student_ids) || student_ids.length === 0 || !title || amount === undefined || !due_date) {
      res.status(400).json({ message: 'Student IDs array, title, amount, and due date are required.' });
      return;
    }

    for (const studentId of student_ids) {
      const id = `fee-uuid-${Math.random().toString(36).substr(2, 9)}`;
      await db.fees.create({
        id,
        studentId,
        title,
        amount: Number(amount),
        dueDate: due_date
      });
    }

    // Log bulk billing action
    await db.activityLogs.create({
      id: `log-uuid-${Math.random().toString(36).substr(2, 9)}`,
      userId: (req as any).user?.id || null,
      action: 'FEE_BULK_INVOICED',
      entity: 'FEES',
      entityId: null,
      details: `Bulk issued fee "${title}" for amount $${amount} to ${student_ids.length} students.`
    });

    res.status(201).json({ message: `Successfully issued ${student_ids.length} fee invoices.` });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Create a Fee Bill
app.post('/api/admin/fees', authenticateJWT, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { student_id, title, amount, due_date } = req.body;
    if (!student_id || !title || amount === undefined || !due_date) {
      res.status(400).json({ message: 'Student, description, amount, and due date are required.' });
      return;
    }

    const id = `fee-uuid-${Math.random().toString(36).substr(2, 9)}`;
    const fee = await db.fees.create({
      id,
      studentId: student_id,
      title,
      amount: Number(amount),
      dueDate: due_date
    });

    // Log fee creation
    await db.activityLogs.create({
      id: `log-uuid-${Math.random().toString(36).substr(2, 9)}`,
      userId: (req as any).user?.id || null,
      action: 'FEE_INVOICED',
      entity: 'FEES',
      entityId: id,
      details: `Invoiced bill "${title}" for amount $${amount}`
    });

    res.status(201).json({ message: 'Fee invoice issued successfully.', fee });
  } catch (error: any) {
    res.status(550).json({ message: error.message });
  }
});

// Update/Record Payment details for a Fee record
app.put('/api/admin/fees/:id', authenticateJWT, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { amount_paid, status } = req.body;
    if (amount_paid === undefined || !status) {
      res.status(400).json({ message: 'Amount paid and status are required parameters.' });
      return;
    }

    const fee = await db.fees.recordPayment(req.params.id, Number(amount_paid), status);

    // Log fee payment updates
    await db.activityLogs.create({
      id: `log-uuid-${Math.random().toString(36).substr(2, 9)}`,
      userId: (req as any).user?.id || null,
      action: 'FEE_PAYMENT_METRICS_UPDATE',
      entity: 'FEES',
      entityId: req.params.id,
      details: `Updated invoice Status to ${status}, Paid Amount to $${amount_paid}`
    });

    res.status(200).json({ message: 'Fee status updated successfully.', fee });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Fetch Security Audit Logs
app.get('/api/admin/logs', authenticateJWT, requireRole(['ADMIN']), async (req, res) => {
  try {
    const logs = await db.activityLogs.findAll();
    res.status(200).json({ logs });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});


// ==========================================
// 3. FACULTY PORTAL SERVICES (Role Gaurd: FACULTY)
// ==========================================

// Get Assigned Classes
app.get('/api/faculty/courses', authenticateJWT, requireRole(['FACULTY']), async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    const courses = await db.courses.findByFaculty(req.user.id);
    res.status(200).json({ courses });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get Enrolled Students for their Classes
app.get('/api/faculty/enrollments', authenticateJWT, requireRole(['FACULTY']), async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    const enrollments = await db.enrollments.findByFaculty(req.user.id);
    res.status(200).json({ enrollments });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Update Grade
app.put('/api/faculty/enrollments/:id/grade', authenticateJWT, requireRole(['FACULTY']), async (req, res) => {
  try {
    const { grade } = req.body;
    if (!grade) {
      res.status(400).json({ message: 'Grade value is required.' });
      return;
    }
    const updated = await db.enrollments.updateGrade(req.params.id, grade);
    res.status(200).json({ message: 'Grade updated successfully.', enrollment: updated });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// Update Attendance Percentage
app.put('/api/faculty/enrollments/:id/attendance', authenticateJWT, requireRole(['FACULTY']), async (req, res) => {
  try {
    const { attendancePercentage } = req.body;
    if (attendancePercentage === undefined || isNaN(attendancePercentage)) {
      res.status(400).json({ message: 'Attendance percentage is required.' });
      return;
    }
    const num = Number(attendancePercentage);
    if (num < 0 || num > 100) {
      res.status(400).json({ message: 'Attendance rate must be between 0 and 100.' });
      return;
    }
    const updated = await db.enrollments.updateAttendance(req.params.id, num);
    res.status(200).json({ message: 'Attendance updated successfully.', enrollment: updated });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// Granular attendance endpoints
// Get granular attendance records for a course
app.get('/api/faculty/courses/:courseId/attendance', authenticateJWT, requireRole(['FACULTY']), async (req, res) => {
  try {
    const { date } = req.query;
    const records = await db.attendance.findByCourse(req.params.courseId, date as string);
    res.status(200).json({ records });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Bulk upsert granular attendance records for a course on a date
app.post('/api/faculty/attendance', authenticateJWT, requireRole(['FACULTY']), async (req, res) => {
  try {
    const { courseId, date, records } = req.body;
    if (!courseId || !date || !records || !Array.isArray(records)) {
      res.status(400).json({ message: 'courseId, date, and records array are required.' });
      return;
    }
    const savedRecords = [];
    for (const record of records) {
      const { enrollmentId, status, remarks } = record;
      if (!enrollmentId || !status) continue;
      
      const recordId = `att-${enrollmentId}-${date}`;
      const saved = await db.attendance.saveRecord({
        id: recordId,
        enrollmentId,
        date,
        status,
        remarks: remarks || ''
      });
      savedRecords.push(saved);
    }
    res.status(200).json({ message: 'Attendance sheets synced successfully.', records: savedRecords });
  } catch (error: any) {
    res.status(550).json({ message: error.message });
  }
});


// --- Assignments ---
// Get assignments for a course
app.get('/api/faculty/courses/:courseId/assignments', authenticateJWT, requireRole(['FACULTY']), async (req, res) => {
  try {
    const assignments = await (db as any).assignments.findByCourse(req.params.courseId);
    res.status(200).json({ assignments });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Create assignment for a course
app.post('/api/faculty/courses/:courseId/assignments', authenticateJWT, requireRole(['FACULTY']), async (req, res) => {
  try {
    const { title, description, maxScore, dueDate, materialUrl } = req.body;
    if (!title || !maxScore || !dueDate) {
      res.status(400).json({ message: 'Title, max score, and due date are required.' });
      return;
    }
    const id = `assign-uuid-${Math.random().toString(36).substr(2, 9)}`;
    const newAssignment = await (db as any).assignments.create({
      id,
      courseId: req.params.courseId,
      title,
      description: description || '',
      maxScore: Number(maxScore),
      dueDate,
      materialUrl: materialUrl || ''
    });

    // Notify enrolled students
    const students = await db.enrollments.findByCourse(req.params.courseId);
    for (const student of students) {
      await (db as any).notifications.create({
        id: `notif-uuid-${Math.random().toString(36).substr(2, 9)}`,
        userId: student.studentId,
        title: `New Assignment under ${student.courseCode}`,
        message: `An assignment "${title}" has been published with deadline ${new Date(dueDate).toLocaleDateString()}. Max points: ${maxScore}.`,
        type: 'ASSIGNMENT'
      });
    }

    // Log action
    await db.activityLogs.create({
      id: `log-uuid-${Math.random().toString(36).substr(2, 9)}`,
      userId: (req as any).user?.id || null,
      action: 'ASSIGNMENT_CREATED',
      entity: 'ASSIGNMENTS',
      entityId: id,
      details: `Faculty created assignment "${title}" for course: ${req.params.courseId}`
    });

    res.status(201).json({ message: 'Assignment published successfully.', assignment: newAssignment });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// --- Submissions ---
// Get submissions for an assignment
app.get('/api/faculty/assignments/:assignmentId/submissions', authenticateJWT, requireRole(['FACULTY']), async (req, res) => {
  try {
    const submissions = await (db as any).submissions.findByAssignment(req.params.assignmentId);
    res.status(200).json({ submissions });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Grade a submission
app.put('/api/faculty/submissions/:submissionId/grade', authenticateJWT, requireRole(['FACULTY']), async (req, res) => {
  try {
    const { score, feedback } = req.body;
    if (score === undefined || isNaN(score)) {
      res.status(400).json({ message: 'Valid grading score is required.' });
      return;
    }
    const graderId = (req as any).user?.id;
    if (!graderId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    const updated = await (db as any).submissions.saveGrade(req.params.submissionId, Number(score), feedback || '', graderId);
    if (!updated) {
      res.status(404).json({ message: 'Submission record not found.' });
      return;
    }

    // Notify student
    await (db as any).notifications.create({
      id: `notif-uuid-${Math.random().toString(36).substr(2, 9)}`,
      userId: updated.studentId,
      title: `Assignment Graded`,
      message: `Your assignment submission has been assessed. Earned Score: ${score}. Feedback: ${feedback || 'None'}`,
      type: 'GRADE'
    });

    res.status(200).json({ message: 'Submission graded successfully.', submission: updated });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// --- Exams & Marks Entry ---
// Get exams for a course
app.get('/api/faculty/courses/:courseId/exams', authenticateJWT, requireRole(['FACULTY']), async (req, res) => {
  try {
    const exams = await (db as any).exams.findByCourse(req.params.courseId);
    res.status(200).json({ exams });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new exam
app.post('/api/faculty/courses/:courseId/exams', authenticateJWT, requireRole(['FACULTY']), async (req, res) => {
  try {
    const { title, type, maxMarks } = req.body;
    if (!title || !type || !maxMarks) {
      res.status(400).json({ message: 'Title, type, and max marks are required.' });
      return;
    }
    const id = `exam-uuid-${Math.random().toString(36).substr(2, 9)}`;
    const newExam = await (db as any).exams.create({
      id,
      courseId: req.params.courseId,
      title,
      type,
      maxMarks: Number(maxMarks)
    });

    // Log action
    await db.activityLogs.create({
      id: `log-uuid-${Math.random().toString(36).substr(2, 9)}`,
      userId: (req as any).user?.id || null,
      action: 'EXAM_CREATED',
      entity: 'EXAMS',
      entityId: id,
      details: `Faculty created exam "${title}" (${type}) for course: ${req.params.courseId}`
    });

    res.status(201).json({ message: 'Exam event logged successfully.', exam: newExam });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get marks for an exam
app.get('/api/faculty/exams/:examId/marks', authenticateJWT, requireRole(['FACULTY']), async (req, res) => {
  try {
    const marks = await (db as any).marks.findByExam(req.params.examId);
    res.status(200).json({ marks });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Submit/save marks for an exam student
app.post('/api/faculty/exams/:examId/marks', authenticateJWT, requireRole(['FACULTY']), async (req, res) => {
  try {
    const { studentId, obtainedMarks, gradePoint, remarks } = req.body;
    if (!studentId || obtainedMarks === undefined || isNaN(obtainedMarks)) {
      res.status(400).json({ message: 'Student ID and obtained marks are required.' });
      return;
    }
    const id = `mark-uuid-${Math.random().toString(36).substr(2, 9)}`;
    const saved = await (db as any).marks.saveMark({
      id,
      examId: req.params.examId,
      studentId,
      obtainedMarks: Number(obtainedMarks),
      gradePoint: gradePoint ? Number(gradePoint) : 0,
      remarks: remarks || ''
    });

    // Send notification
    await (db as any).notifications.create({
      id: `notif-uuid-${Math.random().toString(36).substr(2, 9)}`,
      userId: studentId,
      title: `Academic Exam Marks Entered`,
      message: `Your score for exam has been saved. Obtained marks: ${obtainedMarks}. Remarks: ${remarks || 'None'}`,
      type: 'EXAM'
    });

    res.status(200).json({ message: 'Mark recorded successfully.', mark: saved });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Update an existing exam
app.put('/api/faculty/exams/:examId', authenticateJWT, requireRole(['FACULTY']), async (req, res) => {
  try {
    const { title, type, maxMarks } = req.body;
    if (!title || !type || !maxMarks) {
      res.status(400).json({ message: 'Title, type, and max marks are required.' });
      return;
    }
    const updated = await (db as any).exams.update(req.params.examId, {
      title,
      type,
      maxMarks: Number(maxMarks)
    });
    res.status(200).json({ message: 'Exam details updated successfully.', exam: updated });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Publish Exam Results and trigger notifications for all enrolled students
app.post('/api/faculty/exams/:examId/publish', authenticateJWT, requireRole(['FACULTY']), async (req, res) => {
  try {
    const exam = await (db as any).exams.publish(req.params.examId);
    if (!exam) {
      res.status(404).json({ message: 'Exam not found.' });
      return;
    }
    
    // Get all students enrolled in this course to send notifications
    const courseEnrollments = await db.enrollments.findByCourse(exam.courseId);
    for (const e of courseEnrollments) {
      await (db as any).notifications.create({
        id: `notif-uuid-${Math.random().toString(36).substr(2, 9)}`,
        userId: e.studentId,
        title: `Exam Results Published: ${exam.title}`,
        message: `The score sheets for ${exam.type} examination of course (${exam.courseId}) have been officially published. Check your grades now!`,
        type: 'EXAM'
      });
    }

    res.status(200).json({ message: 'Exam results published successfully and notifications sent.', exam });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// --- Course Announcements Broadcasting ---
app.post('/api/faculty/courses/:courseId/announce', authenticateJWT, requireRole(['FACULTY']), async (req, res) => {
  try {
    const { title, message } = req.body;
    if (!title || !message) {
      res.status(400).json({ message: 'Title and message are required.' });
      return;
    }

    const students = await db.enrollments.findByCourse(req.params.courseId);
    for (const student of students) {
      await (db as any).notifications.create({
        id: `notif-uuid-${Math.random().toString(36).substr(2, 9)}`,
        userId: student.studentId,
        title: `[Announcement] ${title}`,
        message: message,
        type: 'SYSTEM'
      });
    }

    res.status(200).json({ message: 'Announcements broadcasted to enrolled students.' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});


// ==========================================
// 4. STUDENT PORTAL SERVICES (Role Gaurd: STUDENT)
// ==========================================

// View student assignments with submission statuses
app.get('/api/student/assignments', authenticateJWT, requireRole(['STUDENT']), async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    const assignments = await (db as any).assignments.findByStudent(req.user.id);
    res.status(200).json({ assignments });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Student submits an assignment
app.post('/api/student/assignments/:assignmentId/submit', authenticateJWT, requireRole(['STUDENT']), async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    const { submissionText, fileUrl } = req.body;
    if (!submissionText && !fileUrl) {
      res.status(400).json({ message: 'Please provide either a submission text or a file/sheet attachment.' });
      return;
    }

    const assignmentId = req.params.assignmentId;
    const studentId = req.user.id;

    // Check course enrollment & assignment validity
    const assignments = await (db as any).assignments.findByStudent(studentId);
    const assign = assignments.find((a: any) => a.id === assignmentId);

    if (!assign) {
      res.status(404).json({ message: 'Assignment not found or you are not enrolled in this course.' });
      return;
    }

    const isLate = new Date() > new Date(assign.dueDate);
    const id = `sub-uuid-${Math.random().toString(36).substr(2, 9)}`;

    const submission = await (db as any).submissions.saveSubmission({
      id,
      assignmentId,
      studentId,
      submissionText: submissionText || '',
      fileUrl: fileUrl || ''
    });

    // Log the event
    await db.activityLogs.create({
      id: `log-uuid-${Math.random().toString(36).substr(2, 9)}`,
      userId: studentId,
      action: 'ASSIGNMENT_SUBMITTED',
      entity: 'SUBMISSIONS',
      entityId: id,
      details: `Student submitted assignment: "${assign.title}"${isLate ? ' (Late submission)' : ''}`
    });

    res.status(200).json({ message: 'Assignment coursework submitted successfully.', submission });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// View enrolled classes, grades, and attendances
app.get('/api/student/courses', authenticateJWT, requireRole(['STUDENT']), async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    const enrollments = await db.enrollments.findByStudent(req.user.id);
    res.status(200).json({ enrollments });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// View granular student attendance reports
app.get('/api/student/attendance', authenticateJWT, requireRole(['STUDENT']), async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    const attendance = await db.attendance.findByStudent(req.user.id);
    res.status(200).json({ attendance });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// View student's published exam marks and grades
app.get('/api/student/exams/marks', authenticateJWT, requireRole(['STUDENT']), async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    const marks = await (db as any).marks.findByStudent(req.user.id);
    res.status(200).json({ marks });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// View all available courses to register
app.get('/api/student/available-courses', authenticateJWT, requireRole(['STUDENT']), async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    // Get all courses
    const allCourses = await db.courses.findAll();
    // Get student's enrolled courses to filter out
    const myEnrollments = await db.enrollments.findByStudent(req.user.id);
    const myCourseIds = myEnrollments.map(e => e.courseId || e.course_id);

    // Provide only un-enrolled courses matching student's department or similar, but let them choose any
    const available = allCourses.filter(c => !myCourseIds.includes(c.id));
    res.status(200).json({ courses: available });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Course registration (Enroll yourself)
app.post('/api/student/enroll', authenticateJWT, requireRole(['STUDENT']), async (req: AuthenticatedRequest, res) => {
  try {
    const { course_id } = req.body;
    if (!req.user || !course_id) {
      res.status(400).json({ message: 'Course ID selection is required.' });
      return;
    }

    const id = `enroll-uuid-${Math.random().toString(36).substr(2, 9)}`;
    const enrollment = await db.enrollments.create({
      id,
      student_id: req.user.id,
      course_id
    });

    res.status(201).json({ message: 'Enrolled in course successfully!', enrollment });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// View student personal billing invoices & ledger
app.get('/api/student/fees', authenticateJWT, requireRole(['STUDENT']), async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    const allFees = await db.fees.findAll();
    const studentFees = allFees.filter((f: any) => f.studentId === req.user!.id);
    res.status(200).json({ fees: studentFees });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Simulates student paying outstanding fee invoice
app.post('/api/student/fees/:id/pay', authenticateJWT, requireRole(['STUDENT']), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    // Find the fee first
    const allFees = await db.fees.findAll();
    const fee = allFees.find((f: any) => f.id === id && f.studentId === req.user!.id);
    if (!fee) {
      res.status(404).json({ message: 'Fee record not found or unauthorized.' });
      return;
    }
    
    const updated = await db.fees.recordPayment(id, Number(fee.amount), 'PAID');
    
    // Log active payment transaction
    await db.activityLogs.create({
      id: `log-uuid-${Math.random().toString(36).substr(2, 9)}`,
      userId: req.user.id,
      action: 'FEE_PAYMENT_SUBMITTED',
      entity: 'FEES',
      entityId: id,
      details: `Student ${req.user.name} completed payment of $${fee.amount} for: ${fee.title}`
    });

    res.status(200).json({ message: 'Payment simulated successfully!', fee: updated });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// Admin Broadcast Notice or Target Specific Student Notification
app.post('/api/admin/notifications', authenticateJWT, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { title, message, userId, type } = req.body;
    if (!title || !message) {
      res.status(400).json({ message: 'Title and message are required.' });
      return;
    }

    const id = `notif-uuid-${Math.random().toString(36).substr(2, 9)}`;
    const notificationType = type || 'SYSTEM'; // 'SYSTEM', 'GRADE', 'ATTENDANCE', 'FEE', 'ASSIGNMENT', 'EXAM'

    // If userId represents global broadcast (e.g. 'all' or empty/null)
    const targetUserId = (userId === 'all' || !userId) ? null : userId;

    await (db as any).notifications.create({
      id,
      userId: targetUserId,
      title,
      message: message,
      type: notificationType
    });

    // Log the action
    await (db as any).activityLogs.create({
      id: `log-uuid-${Math.random().toString(36).substr(2, 9)}`,
      userId: (req as any).user?.id || null,
      action: 'ADMIN_NOTICE_BROADCAST',
      entity: 'NOTIFICATIONS',
      entityId: id,
      details: `Admin created notification notice: "${title}" for target: ${targetUserId || 'ALL STUDENTS'}`
    });

    res.status(201).json({ message: 'Notice sent successfully.' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Admin and Faculty list all announcements/notifications
app.get('/api/admin/notifications', authenticateJWT, requireRole(['ADMIN', 'FACULTY']), async (req, res) => {
  try {
    const notifications = await (db as any).notifications.findAll();
    res.status(200).json({ notifications });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Faculty Send Notice to Course or Specific Student
app.post('/api/faculty/notifications', authenticateJWT, requireRole(['FACULTY']), async (req, res) => {
  try {
    const { title, message, courseId, userId, type } = req.body;
    if (!title || !message) {
      res.status(400).json({ message: 'Title and message are required.' });
      return;
    }

    const notificationType = type || 'SYSTEM';

    if (courseId) {
      // Find all students in course and broadcast
      const students = await db.enrollments.findByCourse(courseId);
      for (const student of students) {
        await (db as any).notifications.create({
          id: `notif-uuid-${Math.random().toString(36).substr(2, 9)}`,
          userId: student.studentId,
          title: `[Course Announcement] ${title}`,
          message: message,
          type: notificationType
        });
      }

      await (db as any).activityLogs.create({
        id: `log-uuid-${Math.random().toString(36).substr(2, 9)}`,
        userId: (req as any).user?.id || null,
        action: 'FACULTY_COURSE_NOTICE',
        entity: 'NOTIFICATIONS',
        entityId: courseId,
        details: `Faculty created course announcement for course: ${courseId}`
      });

      res.status(201).json({ message: `Announcement broadcasted to course student cohort.` });
    } else if (userId) {
      // Target specific student
      const id = `notif-uuid-${Math.random().toString(36).substr(2, 9)}`;
      await (db as any).notifications.create({
        id,
        userId,
        title,
        message,
        type: notificationType
      });

      await (db as any).activityLogs.create({
        id: `log-uuid-${Math.random().toString(36).substr(2, 9)}`,
        userId: (req as any).user?.id || null,
        action: 'FACULTY_DIRECT_NOTICE',
        entity: 'NOTIFICATIONS',
        entityId: id,
        details: `Faculty sent direct notice to student ${userId}`
      });

      res.status(201).json({ message: 'Direct notice sent to student.' });
    } else {
      res.status(400).json({ message: 'Either Course ID or Student ID is required.' });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// View student customized & global campus notifications
app.get('/api/student/notifications', authenticateJWT, requireRole(['STUDENT']), async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    const notifications = await (db as any).notifications.findByStudent(req.user.id);
    res.status(200).json({ notifications });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Mark student notification as read
app.put('/api/student/notifications/:id/read', authenticateJWT, requireRole(['STUDENT']), async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    await (db as any).notifications.markAsRead(req.params.id);
    res.status(200).json({ message: 'Notification marked as read successfully.' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});


// ==========================================
// VITE AND STATIC CONTENT ROUTING MIDDLEWARE
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    // Mount Vite dev server middleware to let Vite compile files automatically on loading
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    // Production: serve built static files from the dist directory
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Student Portal server is online at http://localhost:${PORT}`);
  });
}

startServer();
