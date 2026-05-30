/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'ADMIN' | 'FACULTY' | 'STUDENT';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  registrationNumber?: string; // e.g. STU2026001, FAC2026001
  department?: string;
  phone?: string;
  createdAt: string;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  description: string;
  credits: number;
  department: string;
  facultyId?: string; // Assigned faculty member
  facultyName?: string; // Display helper
}

export interface Enrollment {
  id: string;
  studentId: string;
  studentName?: string;
  studentRegistrationNumber?: string;
  courseId: string;
  courseName?: string;
  courseCode?: string;
  credits?: number;
  grade?: string; // e.g., 'A', 'B+', 'C', or 'Pending'
  attendancePercentage?: number; // 0 - 100
}

export interface GradeUpdateRequest {
  enrollmentId: string;
  grade: string;
}

export interface AttendanceUpdateRequest {
  enrollmentId: string;
  attendancePercentage: number;
}

export interface SystemStats {
  totalStudents: number;
  totalFaculty: number;
  totalCourses: number;
  totalEnrollments: number;
  averageAttendance: number;
  gradeDistribution: { grade: string; count: number }[];
}
