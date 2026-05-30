/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Users, BookOpen, UserCheck, BarChart3, Plus, Trash2, Edit, Save, X, Check,
  GraduationCap, Briefcase, PlusCircle, LayoutDashboard, UserPlus, FileSignature, 
  ShieldAlert, DollarSign, Activity, FileText, Terminal, Fingerprint, Calendar, Search, CreditCard,
  Eye, Filter, Bell
} from 'lucide-react';
import { User, Course, Enrollment, SystemStats } from '../types';

interface AdminDashboardProps {
  token: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ token }) => {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [faculty, setFaculty] = useState<User[]>([]);
  const [fees, setFees] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<any>(null);
  const [loadingAttendanceStats, setLoadingAttendanceStats] = useState<boolean>(false);
  const [academicReport, setAcademicReport] = useState<any>(null);
  const [loadingAcademicReport, setLoadingAcademicReport] = useState<boolean>(false);

  // Extended Navigation Tabs
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'courses' | 'enrollments' | 'fees' | 'logs' | 'attendance' | 'exams-report' | 'notices'>('overview');
  
  // Notices / Announcement System states
  const [notices, setNotices] = useState<any[]>([]);
  const [loadingNotices, setLoadingNotices] = useState(false);
  const [sendingNotice, setSendingNotice] = useState(false);
  const [noticeForm, setNoticeForm] = useState({
    title: '',
    message: '',
    userId: '', // 'all' or specific student user.id
    type: 'SYSTEM' // 'SYSTEM', 'FEE', 'EXAM'
  });
  
  // Filtering & search
  const [userRoleFilter, setUserRoleFilter] = useState<'STUDENT' | 'FACULTY'>('STUDENT');
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [feeSearchQuery, setFeeSearchQuery] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [studentDeptFilter, setStudentDeptFilter] = useState('');

  // Detailed faculty teaching registry & assignment states
  const [viewingFacultyId, setViewingFacultyId] = useState<string | null>(null);
  const [detailedFacultyData, setDetailedFacultyData] = useState<{ faculty: User; courses: any[] } | null>(null);
  const [loadingFacultyDetail, setLoadingFacultyDetail] = useState(false);
  const [assigningFacultyCourses, setAssigningFacultyCourses] = useState(false);
  const [selectedCourseIdsForFaculty, setSelectedCourseIdsForFaculty] = useState<string[]>([]);

  // Form states
  const [userForm, setUserForm] = useState({ email: '', name: '', password: '', role: 'STUDENT', department: '', phone: '' });
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingUserForm, setEditingUserForm] = useState({ email: '', name: '', password: '', department: '', phone: '' });

  // Detailed student lookups
  const [viewingStudentId, setViewingStudentId] = useState<string | null>(null);
  const [detailedStudentData, setDetailedStudentData] = useState<{ student: User; enrollments: any[]; fees: any[] } | null>(null);
  const [loadingStudentDetail, setLoadingStudentDetail] = useState(false);
  const [courseForm, setCourseForm] = useState({ code: '', name: '', description: '', credits: 3, department: '', facultyId: '' });
  const [enrollForm, setEnrollForm] = useState({ studentId: '', courseId: '' });
  const [feeForm, setFeeForm] = useState({ studentId: '', title: '', amount: '', dueDate: '' });
  const [paymentForm, setPaymentForm] = useState({ id: '', amountPaid: '', status: 'PAID' });

  // Fee management extensions
  const [feeStructures, setFeeStructures] = useState<any[]>([]);
  const [loadingStructures, setLoadingStructures] = useState(false);
  const [structForm, setStructForm] = useState({ name: '', description: '', amount: '', category: 'TUITION' });
  const [isBulkInvoicing, setIsBulkInvoicing] = useState(false);
  const [bulkForm, setBulkForm] = useState({ structId: '', customTitle: '', customAmount: '', dueDate: '', targetScope: 'ALL' });
  const [feeSubTab, setFeeSubTab] = useState<'ledger' | 'structures' | 'invoice'>('ledger');
  
  // Editing state
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [isRecordingPayment, setIsRecordingPayment] = useState<any | null>(null);

  // Course registrant modal states
  const [viewingRegistrantsCourseId, setViewingRegistrantsCourseId] = useState<string | null>(null);
  const [selectedCourseForModal, setSelectedCourseForModal] = useState<Course | null>(null);
  const [courseModalStudentId, setCourseModalStudentId] = useState<string>('');
  const [isEnrollingModalStudent, setIsEnrollingModalStudent] = useState(false);

  // Status & loading
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const triggerAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 4000);
  };

  // Data fetching
  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setStats(data.stats);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await fetch('/api/admin/courses', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setCourses(data.courses);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEnrollments = async () => {
    try {
      const res = await fetch('/api/admin/enrollments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setEnrollments(data.enrollments);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async (role: 'STUDENT' | 'FACULTY') => {
    try {
      const res = await fetch(`/api/admin/users/${role.toLowerCase()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        if (role === 'STUDENT') setStudents(data.users);
        if (role === 'FACULTY') setFaculty(data.users);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFees = async () => {
    try {
      const res = await fetch('/api/admin/fees', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setFees(data.fees);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFeeStructures = async () => {
    try {
      setLoadingStructures(true);
      const res = await fetch('/api/admin/fee-structures', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setFeeStructures(data.structures || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStructures(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/admin/logs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setLogs(data.logs);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAttendanceStats = async () => {
    try {
      setLoadingAttendanceStats(true);
      const res = await fetch('/api/admin/attendance/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setAttendanceStats(data.stats);
      }
    } catch (err) {
      console.error('Error loading aggregate attendance reports:', err);
    } finally {
      setLoadingAttendanceStats(false);
    }
  };

  const fetchAcademicReport = async () => {
    try {
      setLoadingAcademicReport(true);
      const res = await fetch('/api/admin/exams/report', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setAcademicReport(data.stats);
      }
    } catch (err) {
      console.error('Error loading aggregate academic report:', err);
    } finally {
      setLoadingAcademicReport(false);
    }
  };

  const fetchNotices = async () => {
    try {
      setLoadingNotices(true);
      const res = await fetch('/api/admin/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.notifications) {
        setNotices(data.notifications);
      }
    } catch (err) {
      console.error('Error fetching admin notices:', err);
    } finally {
      setLoadingNotices(false);
    }
  };

  const handleSendNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeForm.title.trim() || !noticeForm.message.trim()) {
      triggerAlert('error', 'Please fill in both title and message.');
      return;
    }

    try {
      setSendingNotice(true);
      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: noticeForm.title,
          message: noticeForm.message,
          userId: noticeForm.userId || 'all',
          type: noticeForm.type
        })
      });

      const data = await res.json();
      if (res.ok) {
        triggerAlert('success', data.message || 'Notice broadcasted successfully!');
        setNoticeForm({ title: '', message: '', userId: '', type: 'SYSTEM' });
        fetchNotices();
        fetchLogs();
      } else {
        triggerAlert('error', data.message || 'Failed to send notice.');
      }
    } catch (err: any) {
      triggerAlert('error', err.message || 'An error occurred while broadcasting.');
    } finally {
      setSendingNotice(false);
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchStats(),
      fetchCourses(),
      fetchEnrollments(),
      fetchUsers('STUDENT'),
      fetchUsers('FACULTY'),
      fetchFees(),
      fetchFeeStructures(),
      fetchLogs(),
      fetchAttendanceStats(),
      fetchAcademicReport(),
      fetchNotices()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    loadAllData();
  }, [token]);

  useEffect(() => {
    if (activeTab === 'attendance') {
      fetchAttendanceStats();
    }
    if (activeTab === 'exams-report') {
      fetchAcademicReport();
    }
    if (activeTab === 'notices') {
      fetchNotices();
    }
  }, [activeTab]);

  // User Actions
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validations
    if (userForm.name.trim().length < 3) {
      triggerAlert('error', 'Academic name must be at least 3 characters long.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userForm.email)) {
      triggerAlert('error', 'Please enter a valid email address.');
      return;
    }
    if (userForm.password.trim().length < 6) {
      triggerAlert('error', 'Password must be at least 6 characters long for security.');
      return;
    }

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...userForm,
          role: userRoleFilter
        })
      });
      const data = await res.json();
      if (res.ok) {
        triggerAlert('success', `Successfully created user profile for ${userForm.name}.`);
        setUserForm({ email: '', name: '', password: '', role: 'STUDENT', department: '', phone: '' });
        fetchUsers(userRoleFilter);
        fetchStats();
        fetchLogs();
      } else {
        triggerAlert('error', data.message || 'Failed to create user profile.');
      }
    } catch (err: any) {
      triggerAlert('error', err.toString());
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUserId) return;

    // Client-side validations
    if (editingUserForm.name.trim().length < 3) {
      triggerAlert('error', 'Academic name must be at least 3 characters long.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editingUserForm.email)) {
      triggerAlert('error', 'Please enter a valid email address.');
      return;
    }
    if (editingUserForm.password && editingUserForm.password.trim() !== '' && editingUserForm.password.trim().length < 6) {
      triggerAlert('error', 'Updated password must be at least 6 characters long.');
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${editingUserId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editingUserForm)
      });
      const data = await res.json();
      if (res.ok) {
        triggerAlert('success', `Successfully updated profile of ${editingUserForm.name}.`);
        setEditingUserId(null);
        fetchUsers(userRoleFilter);
        fetchStats();
        fetchLogs();
      } else {
        triggerAlert('error', data.message || 'Failed to save profile changes.');
      }
    } catch (err: any) {
      triggerAlert('error', err.toString());
    }
  };

  const handleViewStudentDetails = async (id: string) => {
    setViewingStudentId(id);
    setLoadingStudentDetail(true);
    setDetailedStudentData(null);
    try {
      const res = await fetch(`/api/admin/students/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setDetailedStudentData(data);
      } else {
        triggerAlert('error', data.message || 'Failed to retrieve academic registry snapshot.');
        setViewingStudentId(null);
      }
    } catch (err) {
      console.error(err);
      triggerAlert('error', 'Portal connection error while retrieving student academic record.');
      setViewingStudentId(null);
    } finally {
      setLoadingStudentDetail(false);
    }
  };

  const handleViewFacultyDetails = async (id: string) => {
    setViewingFacultyId(id);
    setLoadingFacultyDetail(true);
    setDetailedFacultyData(null);
    try {
      const res = await fetch(`/api/admin/faculty/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setDetailedFacultyData(data);
        setSelectedCourseIdsForFaculty(data.courses.map((c: any) => c.id));
      } else {
        triggerAlert('error', data.message || 'Failed to retrieve teaching registry snapshot.');
        setViewingFacultyId(null);
      }
    } catch (err) {
      console.error(err);
      triggerAlert('error', 'Portal connection error while retrieving faculty teaching record.');
      setViewingFacultyId(null);
    } finally {
      setLoadingFacultyDetail(false);
    }
  };

  const handleUpdateFacultyCourses = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewingFacultyId) return;
    setAssigningFacultyCourses(true);
    try {
      const res = await fetch(`/api/admin/faculty/${viewingFacultyId}/courses`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ courseIds: selectedCourseIdsForFaculty })
      });
      const data = await res.json();
      if (res.ok) {
        triggerAlert('success', 'Assigned subjects and classes updated successfully!');
        handleViewFacultyDetails(viewingFacultyId);
        fetchCourses();
        fetchLogs();
      } else {
        triggerAlert('error', data.message || 'Failed to update teaching assignments.');
      }
    } catch (err) {
      console.error(err);
      triggerAlert('error', 'Portal connection error.');
    } finally {
      setAssigningFacultyCourses(false);
    }
  };

  const handleDeleteUser = async (id: string, role: 'STUDENT' | 'FACULTY') => {
    if (!window.confirm('Are you absolutely sure you want to remove this profile? All associated class registrations will also be removed.')) return;
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        triggerAlert('success', 'User deleted successfully.');
        fetchUsers(role);
        fetchStats();
        fetchEnrollments();
        fetchCourses(); 
        fetchLogs();
      } else {
        const data = await res.json();
        triggerAlert('error', data.message || 'Operation failed.');
      }
    } catch (err: any) {
      triggerAlert('error', err.toString());
    }
  };

  // Course Actions
  const handleCourseCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isUpdating = !!editingCourseId;
      const url = isUpdating ? `/api/admin/courses/${editingCourseId}` : '/api/admin/courses';
      const method = isUpdating ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          code: courseForm.code,
          name: courseForm.name,
          description: courseForm.description,
          credits: Number(courseForm.credits),
          department: courseForm.department,
          faculty_id: courseForm.facultyId || null
        })
      });
      const data = await res.json();
      if (res.ok) {
        triggerAlert('success', isUpdating ? 'Course updated successfully' : 'Course created successfully');
        setCourseForm({ code: '', name: '', description: '', credits: 3, department: '', facultyId: '' });
        setEditingCourseId(null);
        fetchCourses();
        fetchStats();
        fetchLogs();
      } else {
        triggerAlert('error', data.message || 'Operation failed');
      }
    } catch (err: any) {
      triggerAlert('error', err.toString());
    }
  };

  const handleEditCourseClick = (c: Course) => {
    setEditingCourseId(c.id);
    setCourseForm({
      code: c.code,
      name: c.name,
      description: c.description || '',
      credits: c.credits,
      department: c.department,
      facultyId: c.facultyId || ''
    });
  };

  const handleDeleteCourse = async (id: string) => {
    if (!window.confirm('Delete this course permanently? All enrolled student transcripts for this course will be wiped.')) return;
    try {
      const res = await fetch(`/api/admin/courses/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        triggerAlert('success', 'Course destroyed.');
        fetchCourses();
        fetchStats();
        fetchEnrollments();
        fetchLogs();
      } else {
        const data = await res.json();
        triggerAlert('error', data.message || 'Could not remove course.');
      }
    } catch (err: any) {
      triggerAlert('error', err.toString());
    }
  };

  // Enrollment Actions
  const handleEnrollStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollForm.studentId || !enrollForm.courseId) {
      triggerAlert('error', 'Please select both student and course');
      return;
    }
    try {
      const res = await fetch('/api/admin/enrollments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          student_id: enrollForm.studentId,
          course_id: enrollForm.courseId
        })
      });
      const data = await res.json();
      if (res.ok) {
        triggerAlert('success', 'Student enrolled successfully');
        setEnrollForm({ studentId: '', courseId: '' });
        fetchEnrollments();
        fetchStats();
        fetchLogs();
      } else {
        triggerAlert('error', data.message || 'Enrollment allocation crashed');
      }
    } catch (err: any) {
      triggerAlert('error', err.toString());
    }
  };

  const handleEnrollStudentFromModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewingRegistrantsCourseId || !courseModalStudentId) {
      triggerAlert('error', 'Please select a student to enroll');
      return;
    }
    setIsEnrollingModalStudent(true);
    try {
      const res = await fetch('/api/admin/enrollments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          student_id: courseModalStudentId,
          course_id: viewingRegistrantsCourseId
        })
      });
      const data = await res.json();
      if (res.ok) {
        triggerAlert('success', 'Student enrolled successfully!');
        setCourseModalStudentId('');
        fetchEnrollments();
        fetchStats();
        fetchLogs();
      } else {
        triggerAlert('error', data.message || 'Failed to enroll student to this course.');
      }
    } catch (err: any) {
      triggerAlert('error', err.toString());
    } finally {
      setIsEnrollingModalStudent(false);
    }
  };

  const handleUnenrollStudent = async (id: string) => {
    if (!window.confirm('Unenroll this student? Their current grade and attendance for this course will be discarded.')) return;
    try {
      const res = await fetch(`/api/admin/enrollments/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        triggerAlert('success', 'Student unenrolled successfully.');
        fetchEnrollments();
        fetchStats();
        fetchLogs();
      }
    } catch (err: any) {
      triggerAlert('error', err.toString());
    }
  };

  // Fee Actions
  const handleCreateFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feeForm.studentId || !feeForm.title || !feeForm.amount || !feeForm.dueDate) {
      triggerAlert('error', 'All invoice fields are required');
      return;
    }
    try {
      const res = await fetch('/api/admin/fees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          student_id: feeForm.studentId,
          title: feeForm.title,
          amount: Number(feeForm.amount),
          due_date: feeForm.dueDate
        })
      });
      const data = await res.json();
      if (res.ok) {
        triggerAlert('success', 'Billing fee invoice issued.');
        setFeeForm({ studentId: '', title: '', amount: '', dueDate: '' });
        fetchFees();
        fetchStats();
        fetchLogs();
      } else {
        triggerAlert('error', data.message || 'Billing configuration error.');
      }
    } catch (err: any) {
      triggerAlert('error', err.toString());
    }
  };

  const handleCreateFeeStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!structForm.name || !structForm.amount || !structForm.category) {
      triggerAlert('error', 'Structure name, category, and amount are required.');
      return;
    }
    try {
      const res = await fetch('/api/admin/fee-structures', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: structForm.name,
          description: structForm.description,
          amount: Number(structForm.amount),
          category: structForm.category
        })
      });
      const data = await res.json();
      if (res.ok) {
        triggerAlert('success', `Fee structure template "${structForm.name}" created successfully.`);
        setStructForm({ name: '', description: '', amount: '', category: 'TUITION' });
        fetchFeeStructures();
        fetchLogs();
      } else {
        triggerAlert('error', data.message || 'Error configuring fee structures.');
      }
    } catch (err: any) {
      triggerAlert('error', err.toString());
    }
  };

  const handleDeleteFeeStructure = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this fee structure template?')) return;
    try {
      const res = await fetch(`/api/admin/fee-structures/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        triggerAlert('success', 'Fee structure template deleted successfully.');
        fetchFeeStructures();
        fetchLogs();
      } else {
        const data = await res.json();
        triggerAlert('error', data.message || 'Error deleting template.');
      }
    } catch (err: any) {
      triggerAlert('error', err.toString());
    }
  };

  const handleCreateBulkInvoices = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkForm.dueDate) {
      triggerAlert('error', 'Invoice deadline date is required.');
      return;
    }

    let targetStudents = students;
    if (bulkForm.targetScope !== 'ALL') {
      targetStudents = targetStudents.filter(u => (u.department || '').toLowerCase() === bulkForm.targetScope.toLowerCase());
    }

    if (targetStudents.length === 0) {
      triggerAlert('error', 'No active students found in the selected target scope.');
      return;
    }

    let title = bulkForm.customTitle;
    let amount = Number(bulkForm.customAmount);

    if (bulkForm.structId) {
      const parentTemplate = feeStructures.find(s => s.id === bulkForm.structId);
      if (parentTemplate) {
        if (!title) title = parentTemplate.name;
        if (!amount) amount = Number(parentTemplate.amount);
      }
    }

    if (!title || isNaN(amount) || amount <= 0) {
      triggerAlert('error', 'Valid bill title and non-zero amount are required.');
      return;
    }

    try {
      const studentIds = targetStudents.map(s => s.id);
      const res = await fetch('/api/admin/fees/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          student_ids: studentIds,
          title,
          amount,
          due_date: bulkForm.dueDate
        })
      });
      const data = await res.json();
      if (res.ok) {
        triggerAlert('success', `Bulk issued ${studentIds.length} invoices for "${title}" successfully.`);
        setBulkForm({ structId: '', customTitle: '', customAmount: '', dueDate: '', targetScope: 'ALL' });
        setIsBulkInvoicing(false);
        fetchFees();
        fetchStats();
        fetchLogs();
      } else {
        triggerAlert('error', data.message || 'Error issuing bulk billing.');
      }
    } catch (err: any) {
      triggerAlert('error', err.toString());
    }
  };

  const handleUpdatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentForm.id || paymentForm.amountPaid === '') {
      triggerAlert('error', 'Incomplete manual payment form.');
      return;
    }
    try {
      const res = await fetch(`/api/admin/fees/${paymentForm.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount_paid: Number(paymentForm.amountPaid),
          status: paymentForm.status
        })
      });
      const data = await res.json();
      if (res.ok) {
        triggerAlert('success', 'Tuition Ledger updated successfully.');
        setIsRecordingPayment(null);
        setPaymentForm({ id: '', amountPaid: '', status: 'PAID' });
        fetchFees();
        fetchStats();
        fetchLogs();
      } else {
        triggerAlert('error', data.message || 'Ledger entry failed.');
      }
    } catch (err: any) {
      triggerAlert('error', err.toString());
    }
  };

  const handleRecordPaymentClick = (f: any) => {
    setIsRecordingPayment(f);
    setPaymentForm({
      id: f.id,
      amountPaid: f.amountPaid !== undefined ? f.amountPaid.toString() : f.amountPaid,
      status: f.status
    });
  };

  // Searching logic
  const filteredLogs = logs.filter(log => {
    const q = logSearchQuery.toLowerCase();
    return (
      (log.action || '').toLowerCase().includes(q) ||
      (log.details || '').toLowerCase().includes(q) ||
      (log.entity || '').toLowerCase().includes(q) ||
      (log.userName || '').toLowerCase().includes(q)
    );
  });

  const filteredFees = fees.filter(f => {
    const q = feeSearchQuery.toLowerCase();
    return (
      (f.title || '').toLowerCase().includes(q) ||
      (f.studentName || '').toLowerCase().includes(q) ||
      (f.studentRegistrationNumber || '').toLowerCase().includes(q) ||
      (f.status || '').toLowerCase().includes(q)
    );
  });

  const filteredStudents = students.filter(s => {
    const q = studentSearch.toLowerCase();
    const matchesSearch = 
      (s.name || '').toLowerCase().includes(q) ||
      (s.registrationNumber || '').toLowerCase().includes(q) ||
      (s.email || '').toLowerCase().includes(q);
    const matchesDept = studentDeptFilter === '' || s.department === studentDeptFilter;
    return matchesSearch && matchesDept;
  });

  const filteredFaculty = faculty.filter(f => {
    const q = studentSearch.toLowerCase();
    return (
      (f.name || '').toLowerCase().includes(q) ||
      (f.registrationNumber || '').toLowerCase().includes(q) ||
      (f.email || '').toLowerCase().includes(q) ||
      (f.department || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10 text-slate-100 font-sans">
      
      {/* Alert toast notifications */}
      {alert && (
        <div id="admin-alert" className={`fixed bottom-6 right-6 p-4 rounded-xl shadow-lg border text-xs font-semibold backdrop-blur-xl transition-all duration-300 z-50 flex items-center gap-2 ${
          alert.type === 'success' 
            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' 
            : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
        }`}>
          {alert.type === 'success' ? <Check className="h-4.5 w-4.5 text-emerald-400" /> : <X className="h-4.5 w-4.5 text-rose-400" />}
          <span>{alert.message}</span>
        </div>
      )}

      {/* Main Responsive Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

        {/* 1. SIDEBAR NAVIGATION */}
        <aside className="lg:col-span-1">
          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-3xl p-5 sticky top-8 shadow-xl">
            {/* Header Identity */}
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
              <div className="p-2 bg-indigo-600/30 text-indigo-400 rounded-xl border border-indigo-500/20">
                <LayoutDashboard className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-white font-title leading-tight">Admin Services</h4>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5 uppercase tracking-widest">Operator Console</p>
              </div>
            </div>

            {/* Nav List */}
            <nav className="space-y-1.5">
              <button
                id="tab-overview"
                onClick={() => setActiveTab('overview')}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold font-title transition-all duration-150 text-left ${
                  activeTab === 'overview' 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/40' 
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <LayoutDashboard className="h-4 w-4" />
                Overview Dashboard
              </button>

              <button
                id="tab-users"
                onClick={() => setActiveTab('users')}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold font-title transition-all duration-150 text-left ${
                  activeTab === 'users' 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/40' 
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <UserPlus className="h-4 w-4" />
                Users Database
              </button>

              <button
                id="tab-courses"
                onClick={() => setActiveTab('courses')}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold font-title transition-all duration-150 text-left ${
                  activeTab === 'courses' 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/40' 
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <BookOpen className="h-4 w-4" />
                Course Catalog
              </button>

              <button
                id="tab-enrollments"
                onClick={() => setActiveTab('enrollments')}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold font-title transition-all duration-150 text-left ${
                  activeTab === 'enrollments' 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/40' 
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <FileSignature className="h-4 w-4" />
                Class Allocations
              </button>

              <button
                id="tab-fees"
                onClick={() => setActiveTab('fees')}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold font-title transition-all duration-150 text-left ${
                  activeTab === 'fees' 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/40' 
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <DollarSign className="h-4 w-4" />
                Financial Registry
              </button>

              <button
                id="tab-logs"
                onClick={() => setActiveTab('logs')}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold font-title transition-all duration-150 text-left ${
                  activeTab === 'logs' 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/40' 
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Terminal className="h-4 w-4" />
                Forensic Audit Logs
              </button>

              <button
                id="tab-attendance"
                onClick={() => setActiveTab('attendance')}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold font-title transition-all duration-150 text-left ${
                  activeTab === 'attendance' 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/40' 
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Activity className="h-4 w-4" />
                Attendance Statistics
              </button>

              <button
                id="tab-exams-report"
                onClick={() => setActiveTab('exams-report')}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold font-title transition-all duration-150 text-left ${
                  activeTab === 'exams-report' 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/40' 
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <GraduationCap className="h-4 w-4" />
                Academic Report Hub
              </button>

              <button
                id="tab-notices"
                onClick={() => setActiveTab('notices')}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold font-title transition-all duration-150 text-left ${
                  activeTab === 'notices' 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/40' 
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Bell className="h-4 w-4" />
                Broadcast Notices
              </button>
            </nav>

            {/* Diagnostic system summary status */}
            <div className="mt-8 pt-4 border-t border-white/5 text-[10px] font-mono text-slate-400 space-y-1 bg-slate-950/10 p-3 rounded-2xl">
              <div className="flex justify-between">
                <span>SYSTEM STATUS:</span>
                <span className="text-emerald-400 font-bold">ONLINE</span>
              </div>
              <div className="flex justify-between">
                <span>ACTIVE TRANSACTIONS:</span>
                <span className="text-slate-200">{logs.length}</span>
              </div>
            </div>
          </div>
        </aside>

        {/* 2. MAIN WORKSPACE CONTENT */}
        <div className="lg:col-span-3 min-w-0">
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-40 gap-3">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-400"></div>
              <span className="text-xs font-mono text-slate-400">Synchronizing database indices...</span>
            </div>
          ) : (
            <>
              {/* ======================= TAB: OVERVIEW ======================= */}
              {activeTab === 'overview' && (
                <div className="space-y-8 animate-fade-in">
                  
                  {/* Stats Card Bins */}
                  {stats && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
                      {/* 1. Students */}
                      <div className="backdrop-blur-md bg-white/5 p-4 rounded-2xl border border-white/10 shadow-lg hover:border-white/20 transition duration-150">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-title">Direct Students</span>
                            <h2 className="text-2xl font-extrabold font-title text-white mt-1">{stats.totalStudents}</h2>
                          </div>
                          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <GraduationCap className="h-4.5 w-4.5" />
                          </div>
                        </div>
                      </div>

                      {/* 2. Faculty */}
                      <div className="backdrop-blur-md bg-white/5 p-4 rounded-2xl border border-white/10 shadow-lg hover:border-white/20 transition duration-150">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-title">Appointed Profs</span>
                            <h2 className="text-2xl font-extrabold font-title text-white mt-1">{stats.totalFaculty}</h2>
                          </div>
                          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                            <Briefcase className="h-4.5 w-4.5" />
                          </div>
                        </div>
                      </div>

                      {/* 3. Courses */}
                      <div className="backdrop-blur-md bg-white/5 p-4 rounded-2xl border border-white/10 shadow-lg hover:border-white/20 transition duration-150">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-title">Active Catalog</span>
                            <h2 className="text-2xl font-extrabold font-title text-white mt-1">{stats.totalCourses}</h2>
                          </div>
                          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <BookOpen className="h-4.5 w-4.5" />
                          </div>
                        </div>
                      </div>

                      {/* 4. Attendance */}
                      <div className="backdrop-blur-md bg-white/5 p-4 rounded-2xl border border-white/10 shadow-lg hover:border-white/20 transition duration-150">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-title">Term Attendance</span>
                            <h2 className="text-2xl font-extrabold font-title text-emerald-400 mt-1">{stats.averageAttendance}%</h2>
                          </div>
                          <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                            <Activity className="h-4.5 w-4.5" />
                          </div>
                        </div>
                      </div>

                      {/* 5. Treasury Collections */}
                      <div className="backdrop-blur-md bg-white/5 p-4 rounded-2xl border border-white/10 shadow-lg hover:border-white/20 transition duration-150 sm:col-span-2 xl:col-span-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-title">Billed Treasury</span>
                            <h2 className="text-2xl font-extrabold font-title text-white mt-1">${stats.totalFeesInvoiced}</h2>
                            <span className="block text-[9px] font-mono font-semibold text-indigo-300 mt-1 truncate">
                              Paid: {stats.totalFeesInvoiced > 0 ? Math.round((stats.totalFeesCollected / stats.totalFeesInvoiced) * 100) : 0}%
                            </span>
                          </div>
                          <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            <DollarSign className="h-4.5 w-4.5" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Graphical Analysis & Grade Distribution */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Grade Distribution Canvas Column-2 */}
                    <div className="backdrop-blur-md bg-white/5 p-6 rounded-3xl border border-white/10 shadow-lg lg:col-span-2 flex flex-col justify-between">
                      <div>
                        <h3 className="text-base font-extrabold font-title text-white mb-1 flex items-center gap-2">
                          <BarChart3 className="h-4 w-4 text-indigo-400" /> Grade Distribution Analysis
                        </h3>
                        <p className="text-xs text-slate-400 mb-6">Interactive tracking of active cohort course final markings</p>
                      </div>

                      {stats && stats.gradeDistribution.length > 0 ? (
                        <div className="h-56 flex items-end justify-around border-b border-white/10 pb-2 relative">
                          {stats.gradeDistribution.map((item, index) => {
                            const maxValue = Math.max(...stats.gradeDistribution.map(g => g.count), 1);
                            const percentHeight = Math.max((item.count / maxValue) * 100, 8); // min 8% height for visibility
                            return (
                              <div key={index} className="flex flex-col items-center w-12 group relative">
                                {/* Bar Tooltip */}
                                <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute -top-8 px-2 py-1 bg-slate-950 text-white text-[10px] rounded font-mono border border-white/10 z-10 whitespace-nowrap">
                                  Incurred: {item.count} student(s)
                                </span>
                                {/* Colorful Column bar */}
                                <div 
                                  className="w-8 bg-gradient-to-t from-indigo-600 to-indigo-400 hover:from-indigo-400 hover:to-indigo-300 rounded-t-md transition-all duration-300 shadow-md shadow-indigo-950/25 relative"
                                  style={{ height: `${percentHeight * 1.4}px` }}
                                >
                                  {/* Neon peak bulb */}
                                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-indigo-200 rounded-t-md"></div>
                                </div>
                                <span className="text-xs font-bold font-mono text-slate-300 mt-2">
                                  {item.grade}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-56 border border-dashed border-white/10 rounded-2xl bg-white/5 text-slate-400">
                          <BarChart3 className="h-8 w-8 stroke-[1.5] mb-2 text-indigo-400 animate-pulse" />
                          <span className="text-xs font-semibold text-slate-300">No finalized course scores logged yet.</span>
                        </div>
                      )}
                    </div>

                    {/* Quick System Summary Metrics */}
                    <div className="backdrop-blur-md bg-white/5 p-6 rounded-3xl border border-white/10 shadow-lg flex flex-col justify-between">
                      <div>
                        <h3 className="text-base font-extrabold font-title text-white mb-1 flex items-center gap-2">
                          Portal Operations
                        </h3>
                        <p className="text-xs text-slate-400 mb-6">Syllabus densities, treasury levels and safety status</p>
                      </div>

                      <div className="space-y-4">
                        {/* Summary ratios */}
                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/5">
                          <div className="flex items-center gap-3">
                            <GraduationCap className="h-5 w-5 text-emerald-400" />
                            <div>
                              <span className="block text-[10px] text-slate-450 font-bold uppercase tracking-wide">Cohort Size Ratio</span>
                              <span className="block text-xs font-extrabold font-mono text-white mt-0.5">
                                {faculty.length ? (students.length / faculty.length).toFixed(1) : students.length} Students per Professor
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/5">
                          <div className="flex items-center gap-3">
                            <BookOpen className="h-5 w-5 text-indigo-400" />
                            <div>
                              <span className="block text-[10px] text-slate-455 font-bold uppercase tracking-wide">Course Registrations</span>
                              <span className="block text-xs font-extrabold font-mono text-white mt-0.5">
                                {courses.length ? (enrollments.length / courses.length).toFixed(1) : '0'} Allocations average
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Treasury alerts */}
                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/5">
                          <div className="flex items-center gap-3">
                            <DollarSign className="h-5 w-5 text-rose-450" />
                            <div>
                              <span className="block text-[10px] text-slate-450 font-bold uppercase tracking-wide">Treasury Delinquency</span>
                              <span className="block text-xs font-extrabold font-mono text-rose-400 mt-0.5">
                                {stats ? stats.unpaidFeesCount : 0} Outstanding Unassigned Invoices
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Overviews Activity section logs */}
                  <div className="backdrop-blur-md bg-white/5 p-6 rounded-3xl border border-white/10 shadow-lg">
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h3 className="text-base font-extrabold font-title text-white">Recent Security Operations</h3>
                        <p className="text-xs text-slate-450">Diagnostic audit of modifications and logins across active accounts</p>
                      </div>
                      <button 
                        onClick={() => setActiveTab('logs')}
                        className="text-xs font-semibold text-indigo-400 hover:text-indigo-300"
                      >
                        Open forensic ledger &rarr;
                      </button>
                    </div>

                    <div className="space-y-3">
                      {stats && stats.recentActivityLogs && stats.recentActivityLogs.length > 0 ? (
                        stats.recentActivityLogs.map((log: any) => (
                          <div key={log.id} className="p-3 bg-slate-950/20 border border-white/5 rounded-2xl flex items-start justify-between flex-wrap gap-2 hover:border-white/10 transition">
                            <div className="flex gap-3">
                              <div className={`p-2 rounded-xl h-fit border ${
                                ['USER_DELETED', 'COURSE_DELETED', 'ENROLLMENT_REVOKED'].includes(log.action)
                                  ? 'bg-rose-500/10 text-rose-400 border-rose-550/20'
                                  : ['FEE_INVOICED', 'FEE_PAYMENT_METRICS_UPDATE'].includes(log.action)
                                  ? 'bg-amber-500/10 text-amber-400 border-amber-550/10'
                                  : 'bg-indigo-500/10 text-indigo-400 border-indigo-550/20'
                              }`}>
                                <Fingerprint className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="inline-block text-[10px] font-mono font-extrabold bg-white/10 px-1.5 py-0.5 rounded text-white tracking-wider">
                                    {log.action}
                                  </span>
                                  <span className="text-xs font-bold text-slate-300 font-title">{log.userName || 'System'}</span>
                                </div>
                                <p className="text-xs text-slate-400 mt-1 font-sans">{log.details}</p>
                              </div>
                            </div>
                            <div className="text-right text-[10px] font-mono text-slate-400">
                              <span>IP Origin: {log.ipAddress || '127.0.0.1'}</span>
                              <span className="block mt-0.5">{new Date(log.createdAt).toLocaleString()}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center text-xs text-slate-400 py-6">
                          No dashboard activities monitored yet in academic database.
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              )}

              {/* ======================= TAB: USERS ======================= */}
              {activeTab === 'users' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
                  
                  {/* Create account form */}
                  <div className="backdrop-blur-md bg-white/5 p-6 rounded-3xl border border-white/10 shadow-lg h-fit">
                    <div className="flex items-center gap-2 mb-6">
                      <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        <UserPlus className="h-5 w-5" />
                      </div>
                      <h3 className="text-lg font-bold font-title text-white">Add Account Profile</h3>
                    </div>

                    {/* Filter specific roles to show in form */}
                    <div className="grid grid-cols-2 gap-2 p-1 bg-white/5 rounded-xl mb-4 border border-white/10">
                      <button
                        onClick={() => {
                          setUserRoleFilter('STUDENT');
                          setUserForm({ ...userForm, role: 'STUDENT' });
                        }}
                        className={`py-2 text-xs font-semibold rounded-lg text-center ${
                          userRoleFilter === 'STUDENT' ? 'bg-indigo-600 text-white shadow font-bold' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Student Account
                      </button>
                      <button
                        onClick={() => {
                          setUserRoleFilter('FACULTY');
                          setUserForm({ ...userForm, role: 'FACULTY' });
                        }}
                        className={`py-2 text-xs font-semibold rounded-lg text-center ${
                          userRoleFilter === 'FACULTY' ? 'bg-indigo-600 text-white shadow font-bold' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Faculty Account
                      </button>
                    </div>

                    <form onSubmit={handleCreateUser} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 font-title">Academic Name</label>
                        <input
                          required
                          type="text"
                          className="w-full px-3 py-2 text-sm rounded-xl border border-white/10 text-white bg-slate-900/95 focus:outline-none focus:ring-2 focus:ring-indigo-550 focus:border-indigo-550 transition-all"
                          placeholder="e.g., Prof. Albert Einstein"
                          value={userForm.name}
                          onChange={e => setUserForm({ ...userForm, name: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 font-title">Email Username</label>
                        <input
                          required
                          type="email"
                          className="w-full px-3 py-2 text-sm rounded-xl border border-white/10 text-white bg-slate-900/95 focus:outline-none focus:ring-2 focus:ring-indigo-550 focus:border-indigo-550"
                          placeholder="einstein@portal.com"
                          value={userForm.email}
                          onChange={e => setUserForm({ ...userForm, email: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 font-title">Portal Password</label>
                        <input
                          required
                          type="password"
                          className="w-full px-3 py-2 text-sm rounded-xl border border-white/10 text-white bg-slate-900/95 focus:outline-none focus:ring-2 focus:ring-indigo-550 focus:border-indigo-550"
                          placeholder="••••••••"
                          value={userForm.password}
                          onChange={e => setUserForm({ ...userForm, password: e.target.value })}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 font-title">Department</label>
                          <input
                            required
                            type="text"
                            className="w-full px-3 py-2 text-sm rounded-xl border border-white/10 text-white bg-slate-900/95 focus:outline-none focus:ring-2"
                            placeholder="e.g. CSE"
                            value={userForm.department}
                            onChange={e => setUserForm({ ...userForm, department: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 font-title">Phone Contact</label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 text-sm rounded-xl border border-white/10 text-white bg-slate-900/95 focus:outline-none focus:ring-2"
                            placeholder="+336..."
                            value={userForm.phone}
                            onChange={e => setUserForm({ ...userForm, phone: e.target.value })}
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full mt-2 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold font-title tracking-widest transition flex items-center justify-center gap-1.5 shadow"
                      >
                        <PlusCircle className="h-4.5 w-4.5" />
                        REGISTER ACCOUNT
                      </button>
                    </form>
                  </div>

                  {/* List Database table */}
                  <div className="backdrop-blur-md bg-white/5 p-6 rounded-3xl border border-white/10 shadow-lg lg:col-span-2">
                    
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                      <h3 className="text-lg font-bold font-title text-white">
                        {userRoleFilter === 'STUDENT' ? 'Student Enrollment Matrix' : 'Appointed Instructors Roll'}
                      </h3>
                      
                      {/* Search & Filter Container */}
                      <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                        {/* Search input */}
                        <div className="relative flex-1 sm:w-60">
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                            <Search className="h-4 w-4" />
                          </span>
                          <input
                            type="text"
                            placeholder="Search by name, reg, email..."
                            value={studentSearch}
                            onChange={(e) => setStudentSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-white/10 text-white bg-slate-900/95 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                          {studentSearch && (
                            <button 
                              onClick={() => setStudentSearch('')}
                              className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-405 hover:text-white text-[10px]"
                            >
                              ✕
                            </button>
                          )}
                        </div>

                        {/* Dept Filter */}
                        {userRoleFilter === 'STUDENT' && (
                          <div className="relative">
                            <select
                              value={studentDeptFilter}
                              onChange={(e) => setStudentDeptFilter(e.target.value)}
                              className="w-full sm:w-40 pl-3 pr-8 py-1.5 text-xs rounded-xl border border-white/10 text-white bg-slate-900/95 focus:outline-none appearance-none"
                            >
                              <option value="">All Departments</option>
                              {Array.from(new Set(students.map(s => s.department).filter(Boolean))).map(dept => (
                                <option key={dept} value={dept}>{dept}</option>
                              ))}
                            </select>
                            <span className="absolute inset-y-0 right-0 flex items-center pr-2 text-slate-400 pointer-events-none">
                              <Filter className="h-3 w-3" />
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="overflow-x-auto border border-white/10 rounded-2xl bg-slate-950/20">
                      <table className="min-w-full divide-y divide-white/10">
                        <thead className="bg-white/5">
                          <tr>
                            <th className="px-4 py-3 text-left text-[10px] font-bold font-title text-slate-400 uppercase tracking-wider">Identities</th>
                            <th className="px-4 py-3 text-left text-[10px] font-bold font-title text-slate-400 uppercase tracking-wider">Department</th>
                            <th className="px-4 py-3 text-left text-[10px] font-bold font-title text-slate-400 uppercase tracking-wider">Contact</th>
                            <th className="px-4 py-3 text-right text-[10px] font-bold font-title text-slate-400 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {userRoleFilter === 'STUDENT' ? (
                            filteredStudents.length === 0 ? (
                              <tr>
                                <td colSpan={4} className="px-4 py-8 text-center text-xs text-slate-400 w-full">No students registered matching filter criteria.</td>
                              </tr>
                            ) : (
                              filteredStudents.map(s => (
                                <tr key={s.id} className="hover:bg-white/5 transition">
                                  <td className="px-4 py-3">
                                    <span className="block text-sm font-bold text-white font-title">{s.name}</span>
                                    <span className="block text-[10px] font-mono text-slate-400 mt-0.5">{s.registrationNumber || s.email}</span>
                                  </td>
                                  <td className="px-4 py-3 text-xs font-semibold text-indigo-300 font-title">{s.department || 'N/A'}</td>
                                  <td className="px-4 py-3 text-xs text-slate-350">{s.phone || 'No phone'}</td>
                                  <td className="px-4 py-3 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <button
                                        onClick={() => handleViewStudentDetails(s.id)}
                                        className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 border border-indigo-500/10 transition cursor-pointer"
                                        title="View Academic & Financial Profile"
                                      >
                                        <Eye className="h-3.5 w-3.5" />
                                      </button>
                                      <button
                                        onClick={() => {
                                          setEditingUserId(s.id);
                                          setEditingUserForm({
                                            name: s.name,
                                            email: s.email,
                                            password: '',
                                            department: s.department || '',
                                            phone: s.phone || ''
                                          });
                                        }}
                                        className="p-1.5 rounded-lg bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/10 transition cursor-pointer"
                                        title="Edit Student Account"
                                      >
                                        <Edit className="h-3.5 w-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteUser(s.id, 'STUDENT')}
                                        className="p-1.5 rounded-lg bg-rose-500/10 text-rose-450 hover:bg-rose-500/20 border border-rose-500/10 transition cursor-pointer"
                                        title="Delete Student Profile"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )
                          ) : (
                            filteredFaculty.length === 0 ? (
                              <tr>
                                <td colSpan={4} className="px-4 py-8 text-center text-xs text-slate-400 w-full">No faculty members found matching search parameters.</td>
                              </tr>
                            ) : (
                              filteredFaculty.map(f => (
                                <tr key={f.id} className="hover:bg-white/5 transition">
                                  <td className="px-4 py-3">
                                    <span className="block text-sm font-bold text-white font-title">{f.name}</span>
                                    <span className="block text-[10px] font-mono text-slate-400 mt-0.5">{f.registrationNumber || f.email}</span>
                                  </td>
                                  <td className="px-4 py-3 text-xs font-semibold text-indigo-300 font-title">{f.department || 'N/A'}</td>
                                  <td className="px-4 py-3 text-xs text-slate-350">{f.phone || 'No phone'}</td>
                                  <td className="px-4 py-3 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <button
                                        onClick={() => handleViewFacultyDetails(f.id)}
                                        className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 border border-indigo-500/10 transition cursor-pointer"
                                        title="View Registry & Assign Subjects"
                                      >
                                        <Eye className="h-3.5 w-3.5" />
                                      </button>
                                      <button
                                        onClick={() => {
                                          setEditingUserId(f.id);
                                          setEditingUserForm({
                                            name: f.name,
                                            email: f.email,
                                            password: '',
                                            department: f.department || '',
                                            phone: f.phone || ''
                                          });
                                        }}
                                        className="p-1.5 rounded-lg bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/10 transition cursor-pointer"
                                        title="Edit Faculty Record"
                                      >
                                        <Edit className="h-3.5 w-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteUser(f.id, 'FACULTY')}
                                        className="p-1.5 rounded-lg bg-rose-500/10 text-rose-450 hover:bg-rose-500/20 border border-rose-500/10 transition cursor-pointer"
                                        title="Delete Faculty Profile"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              )}

              {/* ======================= TAB: COURSES ======================= */}
              {activeTab === 'courses' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
                  
                  {/* Create catalog course form */}
                  <div className="backdrop-blur-md bg-white/5 p-6 rounded-3xl border border-white/10 shadow-lg h-fit">
                    <div className="flex items-center gap-2 mb-6">
                      <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
                        <BookOpen className="h-5 w-5" />
                      </div>
                      <h3 className="text-lg font-bold font-title text-white">
                        {editingCourseId ? 'Alter Course catalog' : 'Create Catalogue Space'}
                      </h3>
                    </div>

                    <form onSubmit={handleCourseCreateOrUpdate} className="space-y-4">
                      <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-1">
                          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 font-title">Code</label>
                          <input
                            required
                            disabled={!!editingCourseId}
                            type="text"
                            className="w-full px-3 py-2 text-sm rounded-xl border border-white/10 text-white bg-slate-900/95 focus:outline-none uppercase"
                            placeholder="CS101"
                            value={courseForm.code}
                            onChange={e => setCourseForm({ ...courseForm, code: e.target.value })}
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 font-title">Credits</label>
                          <input
                            required
                            type="number"
                            min={1}
                            max={6}
                            className="w-full px-3 py-2 text-sm rounded-xl border border-white/10 text-white bg-slate-900/95 focus:outline-none"
                            placeholder="3"
                            value={courseForm.credits}
                            onChange={e => setCourseForm({ ...courseForm, credits: Number(e.target.value) })}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 font-title">Subject Name</label>
                        <input
                          required
                          type="text"
                          className="w-full px-3 py-2 text-sm rounded-xl border border-white/10 text-white bg-slate-900/95 focus:outline-none focus:ring-2"
                          placeholder="e.g. Distributed Operating Systems"
                          value={courseForm.name}
                          onChange={e => setCourseForm({ ...courseForm, name: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 font-title">Department division</label>
                        <input
                          required
                          type="text"
                          className="w-full px-3 py-2 text-sm rounded-xl border border-white/10 text-white bg-slate-900/95 focus:outline-none"
                          placeholder="e.g. Computer Science"
                          value={courseForm.department}
                          onChange={e => setCourseForm({ ...courseForm, department: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 font-title">Assigned Leader (Faculty)</label>
                        <select
                          className="w-full px-3 py-2.5 text-sm rounded-xl border border-white/10 text-white bg-slate-900/95"
                          value={courseForm.facultyId}
                          onChange={e => setCourseForm({ ...courseForm, facultyId: e.target.value })}
                        >
                          <option value="">-- Leave Unassigned --</option>
                          {faculty.map(f => (
                            <option key={f.id} value={f.id}>{f.name} ({f.registrationNumber})</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 font-title">Catalog Syllabus overview</label>
                        <textarea
                          className="w-full px-3 py-2 text-sm rounded-xl border border-white/10 text-white bg-slate-900/95 h-20 resize-none focus:outline-none"
                          placeholder="Brief goals of the subject curriculum..."
                          value={courseForm.description}
                          onChange={e => setCourseForm({ ...courseForm, description: e.target.value })}
                        />
                      </div>

                      <div className="flex gap-2">
                        {editingCourseId && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCourseId(null);
                              setCourseForm({ code: '', name: '', description: '', credits: 3, department: '', facultyId: '' });
                            }}
                            className="flex-1 py-3 bg-white/10 text-white hover:bg-white/20 text-xs font-bold font-title rounded-xl"
                          >
                            RESET
                          </button>
                        )}
                        <button
                          type="submit"
                          className="flex-2 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-title text-xs font-bold tracking-widest rounded-xl transition decoration-none"
                        >
                          {editingCourseId ? 'APPLY ALTERATIONS' : 'POST CURRICULUM'}
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Course database catalog display */}
                  <div className="backdrop-blur-md bg-white/5 p-6 rounded-3xl border border-white/10 shadow-lg lg:col-span-2 space-y-4">
                    <h3 className="text-lg font-bold font-title text-white">Registered Subjects</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {courses.length === 0 ? (
                        <div className="col-span-2 text-center text-xs text-slate-400 py-12 border border-dashed border-white/10 rounded-2xl bg-white/5">
                          No registered catalogs in system indices.
                        </div>
                      ) : (
                        courses.map(c => (
                          <div key={c.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-between hover:border-white/20 transition">
                            <div>
                              <div className="flex justify-between items-start">
                                <span className="inline-block px-2 py-0.5 text-[10px] bg-indigo-600/30 border border-indigo-500/20 text-white rounded font-mono font-bold uppercase">
                                  {c.code}
                                </span>
                                <span className="text-[11px] font-bold text-indigo-300 font-title">
                                  {c.credits} Term Credits
                                </span>
                              </div>
                              <h4 className="text-sm font-extrabold text-white font-title mt-3 leading-tight">{c.name}</h4>
                              <span className="block text-[10px] text-slate-400 mt-1 uppercase font-semibold font-mono tracking-wider">{c.department} Dept.</span>
                              <p className="text-xs text-slate-350 mt-2 line-clamp-2 leading-relaxed">{c.description || 'No subject description registered.'}</p>
                            </div>

                            <div className="border-t border-white/5 mt-4 pt-3.5 flex justify-between items-center bg-slate-950/20 -mx-4 -mb-4 px-4 py-2.5 rounded-b-2xl">
                              <div>
                                <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wide">assigned teacher</span>
                                <span className="block text-xs font-bold text-white font-title truncate max-w-[120px]">{c.facultyName || 'Unassigned vacancy'}</span>
                              </div>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => {
                                    setSelectedCourseForModal(c);
                                    setViewingRegistrantsCourseId(c.id);
                                    setCourseModalStudentId('');
                                  }}
                                  className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/10 transition cursor-pointer"
                                  title="Manage Enrolled Students"
                                >
                                  <UserCheck className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleEditCourseClick(c)}
                                  className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/10 transition cursor-pointer"
                                  title="Edit Subject Catalog Info"
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteCourse(c.id)}
                                  className="p-1.5 rounded-lg bg-rose-500/10 text-rose-450 hover:bg-rose-500/20 border border-rose-500/10 transition cursor-pointer"
                                  title="Delete Subject Space"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>
              )}

              {/* ======================= TAB: ENROLLMENTS ======================= */}
              {activeTab === 'enrollments' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
                  
                  {/* Register allocation scheduler */}
                  <div className="backdrop-blur-md bg-white/5 p-6 rounded-3xl border border-white/10 shadow-lg h-fit">
                    <div className="flex items-center gap-2 mb-6">
                      <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        <UserCheck className="h-5 w-5" />
                      </div>
                      <h3 className="text-lg font-bold font-title text-white">Manual Class Roll</h3>
                    </div>

                    <form onSubmit={handleEnrollStudent} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 font-title">Select Student Profiles</label>
                        <select
                          required
                          className="w-full px-3 py-2.5 text-sm rounded-xl border border-white/10 text-white bg-slate-900/95"
                          value={enrollForm.studentId}
                          onChange={e => setEnrollForm({ ...enrollForm, studentId: e.target.value })}
                        >
                          <option value="">-- Choose Target Student --</option>
                          {students.map(s => (
                            <option key={s.id} value={s.id}>{s.name} ({s.registrationNumber || s.email})</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 font-title">Select Catalog Space</label>
                        <select
                          required
                          className="w-full px-3 py-2.5 text-sm rounded-xl border border-white/10 text-white bg-slate-900/95"
                          value={enrollForm.courseId}
                          onChange={e => setEnrollForm({ ...enrollForm, courseId: e.target.value })}
                        >
                          <option value="">-- Choose Targets Course --</option>
                          {courses.map(c => (
                            <option key={c.id} value={c.id}>[{c.code}] {c.name}</option>
                          ))}
                        </select>
                      </div>

                      <button
                        type="submit"
                        className="w-full mt-2 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-title text-xs font-bold tracking-widest rounded-xl transition flex items-center justify-center gap-1.5"
                      >
                        <Plus className="h-4.5 w-4.5" />
                        REGISTER ALLOCATION
                      </button>
                    </form>
                  </div>

                  {/* Roll listing matrix */}
                  <div className="backdrop-blur-md bg-white/5 p-6 rounded-3xl border border-white/10 shadow-lg lg:col-span-2">
                    <h3 className="text-lg font-bold font-title text-white mb-6">Active Student Roll Registry</h3>

                    <div className="overflow-x-auto border border-white/10 rounded-2xl bg-slate-950/20">
                      <table className="min-w-full divide-y divide-white/10 animate-fade-in">
                        <thead className="bg-white/5">
                          <tr>
                            <th className="px-4 py-3 text-left text-[10px] font-bold font-title text-slate-400 uppercase tracking-wider">Student</th>
                            <th className="px-4 py-3 text-left text-[10px] font-bold font-title text-slate-400 uppercase tracking-wider">Subject space</th>
                            <th className="px-4 py-3 text-center text-[10px] font-bold font-title text-slate-400 uppercase tracking-wider">Grade score</th>
                            <th className="px-4 py-3 text-center text-[10px] font-bold font-title text-slate-400 uppercase tracking-wider font-mono">Attendance</th>
                            <th className="px-4 py-3 text-right text-[10px] font-bold font-title text-slate-400 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                          {enrollments.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-4 py-8 text-center text-xs text-slate-400">No students allocated in core catalogs.</td>
                            </tr>
                          ) : (
                            enrollments.map(e => (
                              <tr key={e.id} className="hover:bg-white/5 transition">
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <span className="block text-sm font-bold text-white font-title">{e.studentName}</span>
                                  <span className="block text-[10px] font-mono text-slate-400 mt-0.5">{e.studentRegistrationNumber}</span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-xs">
                                  <span className="inline-block px-1.5 py-0.5 rounded bg-white/10 font-mono font-bold text-white text-[9px] mr-1"/>
                                  <span className="font-semibold text-slate-300 font-title">{e.courseCode} - {e.courseName}</span>
                                </td>
                                <td className="px-4 py-3 text-center text-xs">
                                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold font-mono uppercase tracking-wider border ${
                                    e.grade === 'Pending' 
                                      ? 'bg-slate-500/10 text-slate-300 border-white/10' 
                                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                  }`}>
                                    {e.grade}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-center font-mono font-bold text-xs text-emerald-450">{e.attendancePercentage}%</td>
                                <td className="px-4 py-3 text-right">
                                  <button
                                    onClick={() => handleUnenrollStudent(e.id)}
                                    className="p-1.5 rounded-lg bg-rose-500/10 text-rose-450 hover:bg-rose-500/20 border border-rose-500/10 transition"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              )}
              {/* ======================= TAB: FEES & FINANCES ======================= */}
              {activeTab === 'fees' && (
                <div className="space-y-6 animate-fade-in text-left">
                  
                  {/* Financial Metrics Summary Banner */}
                  {stats && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                      <div className="backdrop-blur-md bg-white/5 p-5 rounded-2xl border border-white/10 shadow-lg">
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 font-title">Total Invoiced Billed</span>
                        <h2 className="text-3xl font-extrabold font-title text-white mt-1">${stats.totalFeesInvoiced}</h2>
                        <span className="block text-[10px] font-mono text-indigo-300 mt-1 font-semibold">Direct academic tuition bills</span>
                      </div>
                      <div className="backdrop-blur-md bg-white/5 p-5 rounded-2xl border border-white/10 shadow-lg">
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 font-title">Treasury Receipts Collected</span>
                        <h2 className="text-3xl font-extrabold font-title text-emerald-400 mt-1">${stats.totalFeesCollected}</h2>
                        <span className="block text-[10px] font-mono text-emerald-300 mt-1 font-semibold">
                          Collection rate: {stats.totalFeesInvoiced > 0 ? ((stats.totalFeesCollected / stats.totalFeesInvoiced) * 100).toFixed(1) : '0'}%
                        </span>
                      </div>
                      <div className="backdrop-blur-md bg-white/5 p-5 rounded-2xl border border-white/10 shadow-lg">
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 font-title">Outstanding Unpaid Fees</span>
                        <h2 className="text-3xl font-extrabold font-title text-amber-500 mt-1">
                          ${stats.totalFeesInvoiced - stats.totalFeesCollected}
                        </h2>
                        <span className="block text-[10px] font-mono text-amber-300 mt-1 font-semibold">Unreleased balance waiting</span>
                      </div>
                      <div className="backdrop-blur-md bg-white/5 p-5 rounded-2xl border border-white/10 shadow-lg">
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 font-title">Delinquency Count</span>
                        <h2 className="text-3xl font-extrabold font-title text-rose-450 mt-1">{stats.unpaidFeesCount}</h2>
                        <span className="block text-[10px] font-mono text-rose-350 mt-1 font-semibold">Unpaid or Overdue invoices</span>
                      </div>
                    </div>
                  )}

                  {/* Fee sub-tabs selection */}
                  <div className="flex border-b border-white/10 gap-6 mt-2">
                    <button
                      id="btn-subtab-ledger"
                      onClick={() => setFeeSubTab('ledger')}
                      className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                        feeSubTab === 'ledger'
                          ? 'border-b-2 border-indigo-500 text-indigo-300'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Outstanding Ledgers ({filteredFees.length})
                    </button>
                    <button
                      id="btn-subtab-structures"
                      onClick={() => setFeeSubTab('structures')}
                      className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                        feeSubTab === 'structures'
                          ? 'border-b-2 border-indigo-500 text-indigo-300'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Fee Structure Presets ({feeStructures.length})
                    </button>
                    <button
                      id="btn-subtab-invoice"
                      onClick={() => setFeeSubTab('invoice')}
                      className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                        feeSubTab === 'invoice'
                          ? 'border-b-2 border-indigo-500 text-indigo-300'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Invoicing Studio
                    </button>
                  </div>

                  {/* SUB-TAB PANELS */}

                  {/* ======================= FEE SUB-TAB: LEDGERS ======================= */}
                  {feeSubTab === 'ledger' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
                      {/* Left: Manual Payment records pane if recording payment */}
                      <div className="backdrop-blur-md bg-white/5 p-6 rounded-3xl border border-white/10 shadow-lg h-fit lg:col-span-1">
                        <div className="flex items-center gap-2 mb-4">
                          <CreditCard className="h-4.5 w-4.5 text-indigo-400" />
                          <h3 className="text-sm font-bold font-title text-white">Manual Payment Ledger</h3>
                        </div>

                        {isRecordingPayment ? (
                          <div className="space-y-4 text-slate-100">
                            <div className="p-3.5 bg-slate-950/40 border border-white/5 rounded-2xl">
                              <span className="block text-[9px] font-mono font-extrabold uppercase tracking-wide text-amber-400">manual payment register</span>
                              <div className="mt-2 text-xs leading-relaxed space-y-1">
                                <p><strong>Student:</strong> {isRecordingPayment.studentName}</p>
                                <p className="text-[10px] font-mono text-slate-400">ID: {isRecordingPayment.studentRegistrationNumber}</p>
                                <p className="border-t border-white/5 mt-1.5 pt-1.5"><strong>Fee Item:</strong> {isRecordingPayment.title}</p>
                                <p><strong>Original amount:</strong> ${isRecordingPayment.amount}</p>
                              </div>
                            </div>

                            <form onSubmit={handleUpdatePayment} className="space-y-4">
                              <div className="space-y-1.5">
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider font-title">Receipt collections cash ($)</label>
                                <input
                                  required
                                  type="number"
                                  min={0}
                                  max={isRecordingPayment.amount}
                                  className="w-full px-3 py-2 text-sm rounded-xl border border-white/10 bg-slate-900/95 text-white"
                                  value={paymentForm.amountPaid}
                                  onChange={e => setPaymentForm({ ...paymentForm, amountPaid: e.target.value })}
                                />
                              </div>

                              <div className="space-y-1.5">
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider font-title">Update collection status</label>
                                <select
                                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-white/10 bg-slate-900/95 text-white font-sans"
                                  value={paymentForm.status}
                                  onChange={e => setPaymentForm({ ...paymentForm, status: e.target.value })}
                                >
                                  <option value="PAID">PAID - Invoice cleared</option>
                                  <option value="PARTIALLY_PAID">PARTIALLY_PAID - Splitted</option>
                                  <option value="UNPAID">UNPAID - Pending</option>
                                  <option value="OVERDUE">OVERDUE - Penalty warning</option>
                                </select>
                              </div>

                              <div className="flex gap-2">
                                <button
                                  type="submit"
                                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold font-title tracking-wider"
                                >
                                  SAVE BOOKMARK RECEIPT
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setIsRecordingPayment(null)}
                                  className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-350 rounded-xl text-xs font-bold font-title"
                                >
                                  Cancel
                                </button>
                              </div>
                            </form>
                          </div>
                        ) : (
                          <div className="text-center py-10 bg-slate-950/25 border border-white/5 rounded-2xl text-slate-400 text-xs">
                            <CreditCard className="h-8 w-8 text-slate-600 mx-auto mb-2.5" />
                            <p className="max-w-[200px] mx-auto text-[11px] leading-relaxed">
                              Select any student ledger row's payment column to update billing details or record partial cash offline.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Right: Fees list table LEDGER */}
                      <div className="backdrop-blur-md bg-white/5 p-6 rounded-3xl border border-white/10 shadow-lg lg:col-span-2">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                          <h3 className="text-base font-bold font-title text-white">Outstanding Student Tuition Ledgers</h3>
                          <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <input
                              type="text"
                              placeholder="Search descriptions, students..."
                              className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-white/10 bg-slate-950/20 text-white"
                              value={feeSearchQuery}
                              onChange={e => setFeeSearchQuery(e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="overflow-x-auto border border-white/10 rounded-2xl bg-slate-950/20">
                          <table className="min-w-full divide-y divide-white/10 text-xs text-left">
                            <thead className="bg-white/5 font-title">
                              <tr>
                                <th className="px-4 py-3 font-semibold text-slate-400 uppercase tracking-wider">Debtor (Student)</th>
                                <th className="px-4 py-3 font-semibold text-slate-400 uppercase tracking-wider">Particular Detail</th>
                                <th className="px-4 py-3 text-center font-semibold text-slate-400 uppercase tracking-wider">Billed / Paid</th>
                                <th className="px-4 py-3 text-center font-semibold text-slate-400 uppercase tracking-wider">Due date</th>
                                <th className="px-4 py-3 text-center font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                                <th className="px-4 py-2.5 text-center font-semibold text-slate-400 uppercase tracking-wider">Pay</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10 font-sans">
                              {filteredFees.length === 0 ? (
                                <tr>
                                  <td colSpan={6} className="px-4 py-8 text-center text-xs text-slate-400">No finance fees found matching search parameters.</td>
                                </tr>
                              ) : (
                                filteredFees.map((f: any) => (
                                  <tr key={f.id} className="hover:bg-white/5 transition">
                                    <td className="px-4 py-3">
                                      <span className="block text-xs font-bold text-white font-title">{f.studentName || 'Unknown student'}</span>
                                      <span className="block text-[9px] font-mono text-slate-405">{f.studentRegistrationNumber}</span>
                                    </td>
                                    <td className="px-4 py-3 font-semibold text-slate-300 leading-tight max-w-[140px] truncate">{f.title}</td>
                                    <td className="px-4 py-3 text-center font-bold font-mono">
                                      <span className="block text-white">${f.amount}</span>
                                      <span className="block text-[9px] text-emerald-400 font-semibold">Recd: ${f.amountPaid || 0}</span>
                                    </td>
                                    <td className="px-4 py-3 text-center font-mono text-slate-350">{f.dueDate}</td>
                                    <td className="px-4 py-3 text-center">
                                      <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-extrabold font-mono border ${
                                        f.status === 'PAID' 
                                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                          : f.status === 'PARTIALLY_PAID'
                                          ? 'bg-indigo-500/15 text-indigo-300 border-indigo-400/20'
                                          : f.status === 'OVERDUE'
                                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                          : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                      }`}>
                                        {f.status}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      <button
                                        type="button"
                                        onClick={() => handleRecordPaymentClick(f)}
                                        className="p-1 px-1.5 rounded bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 border border-indigo-500/15 transition cursor-pointer text-[10px] font-bold inline-flex items-center gap-1"
                                      >
                                        <CreditCard className="h-3 w-3" /> Record
                                      </button>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ======================= FEE SUB-TAB: STRUCTURE PRESETS ======================= */}
                  {feeSubTab === 'structures' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
                      {/* Left Column: Form to create preset */}
                      <div className="backdrop-blur-md bg-white/5 p-6 rounded-3xl border border-white/10 shadow-lg h-fit lg:col-span-1">
                        <div className="flex items-center gap-2 mb-4">
                          <PlusCircle className="h-4.5 w-4.5 text-indigo-400" />
                          <h3 className="text-base font-bold font-title text-white">Define Fee Structure</h3>
                        </div>

                        <form onSubmit={handleCreateFeeStructure} className="space-y-4">
                          <div className="space-y-1.5">
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider font-title">Preset Title</label>
                            <input
                              required
                              type="text"
                              className="w-full px-3 py-2 text-sm rounded-xl border border-white/10 bg-slate-900/95 text-white placeholder:text-slate-500"
                              placeholder="e.g. Computer Science Term Tuition Fee"
                              value={structForm.name}
                              onChange={e => setStructForm({ ...structForm, name: e.target.value })}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider font-title">Category</label>
                              <select
                                className="w-full px-3 py-2.5 text-xs rounded-xl border border-white/10 bg-slate-900/95 text-white"
                                value={structForm.category}
                                onChange={e => setStructForm({ ...structForm, category: e.target.value })}
                              >
                                <option value="TUITION">TUITION</option>
                                <option value="HOSTEL">HOSTEL</option>
                                <option value="EXAM">EXAM</option>
                                <option value="LIBRARY">LIBRARY</option>
                                <option value="SPORTS">SPORTS</option>
                                <option value="OTHER">OTHER</option>
                              </select>
                            </div>
                            <div className="space-y-1.5">
                              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider font-title">Base Amount ($)</label>
                              <input
                                required
                                type="number"
                                min={0}
                                className="w-full px-3 py-2 text-sm rounded-xl border border-white/10 bg-slate-900/95 text-white"
                                placeholder="e.g. 5000"
                                value={structForm.amount}
                                onChange={e => setStructForm({ ...structForm, amount: e.target.value })}
                              />
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider font-title">Description (Optional)</label>
                            <textarea
                              rows={3}
                              className="w-full px-3 py-2 text-xs rounded-xl border border-white/10 bg-slate-900/95 text-white placeholder:text-slate-500 font-sans leading-relaxed"
                              placeholder="Describe structural details or reference details..."
                              value={structForm.description}
                              onChange={e => setStructForm({ ...structForm, description: e.target.value })}
                            />
                          </div>

                          <button
                            type="submit"
                            className="w-full mt-2 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-title text-xs font-bold tracking-widest rounded-xl transition flex items-center justify-center gap-1.5 shadow"
                          >
                            <Plus className="h-4 w-4" />
                            REGISTER PRESET STRUCTURE
                          </button>
                        </form>
                      </div>

                      {/* Right Column: Existing configurations */}
                      <div className="backdrop-blur-md bg-white/5 p-6 rounded-3xl border border-white/10 shadow-lg lg:col-span-2">
                        <div className="mb-4">
                          <h3 className="text-base font-bold font-title text-white">Configured Fee Structure Presets</h3>
                          <p className="text-xs text-slate-400 mt-1">Pre-defined institutional templates used to batch invoice or pre-populate individual billing items.</p>
                        </div>

                        {loadingStructures ? (
                          <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
                            <span className="text-xs text-slate-400 mt-2 block">Loading fee configurations...</span>
                          </div>
                        ) : feeStructures.length === 0 ? (
                          <div className="text-center py-12 bg-slate-950/20 border border-white/5 rounded-2xl">
                            <FileText className="h-10 w-10 text-slate-605 mx-auto mb-2 text-slate-500" />
                            <p className="text-xs text-slate-400">No preset structures found. Create your first preset on the left panel.</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {feeStructures.map(s => (
                              <div key={s.id} className="p-4 border border-white/5 bg-slate-950/30 hover:border-white/10 transition rounded-2xl flex flex-col justify-between">
                                <div>
                                  <div className="flex justify-between items-start gap-2">
                                    <span className="px-2 py-0.5 rounded font-mono text-[9px] font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/20">
                                      {s.category}
                                    </span>
                                    <span className="text-base font-extrabold font-mono text-emerald-400">
                                      ${Number(s.amount).toFixed(2)}
                                    </span>
                                  </div>
                                  <h4 className="text-sm font-bold font-title text-white mt-2.5 leading-snug">{s.name}</h4>
                                  <p className="text-xs text-slate-404 mt-1 leading-relaxed font-light">{s.description || 'No descriptive context recorded.'}</p>
                                </div>

                                <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center text-[10px] text-slate-450 font-mono">
                                  <span>Created: {new Date(s.createdAt).toLocaleDateString()}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteFeeStructure(s.id)}
                                    className="p-1 px-1.5 text-[10px] bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 rounded border border-rose-500/20 transition cursor-pointer flex items-center gap-0.5 font-bold"
                                  >
                                    <Trash2 className="h-3 w-3" /> Remove
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ======================= FEE SUB-TAB: INVOICING STUDIO (BULK & SINGLE) ======================= */}
                  {feeSubTab === 'invoice' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
                      
                      {/* Left: Bulk Invoicer */}
                      <div className="backdrop-blur-md bg-white/5 p-6 rounded-3xl border border-white/10 shadow-lg h-fit">
                        <div className="flex items-center gap-2 mb-4">
                          <Users className="h-4.5 w-4.5 text-indigo-400" />
                          <h3 className="text-base font-bold font-title text-white">Bulk Billing Program</h3>
                        </div>
                        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                          Invoice entire billing items or structured tuition templates to either all enrolled active student users, or to specific curricular departments at once.
                        </p>

                        <form onSubmit={handleCreateBulkInvoices} className="space-y-4">
                          <div className="space-y-1.5">
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider font-title">Choose Structure Template (Optional)</label>
                            <select
                              className="w-full px-3 py-2.5 text-sm rounded-xl border border-white/10 bg-slate-900/95 text-white"
                              value={bulkForm.structId}
                              onChange={e => {
                                const matched = feeStructures.find(s => s.id === e.target.value);
                                if (matched) {
                                  setBulkForm({
                                    ...bulkForm,
                                    structId: e.target.value,
                                    customTitle: matched.name,
                                    customAmount: String(matched.amount)
                                  });
                                } else {
                                  setBulkForm({ ...bulkForm, structId: e.target.value });
                                }
                              }}
                            >
                              <option value="">-- Apply custom pricing details --</option>
                              {feeStructures.map(s => (
                                <option key={s.id} value={s.id}>{s.name} (${s.amount})</option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1.5">
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider font-title">Billing Title / Details</label>
                            <input
                              required
                              type="text"
                              className="w-full px-3 py-2 text-sm rounded-xl border border-white/10 bg-slate-900/95 text-white"
                              value={bulkForm.customTitle}
                              onChange={e => setBulkForm({ ...bulkForm, customTitle: e.target.value })}
                              placeholder="e.g. Standard tuition semester fee"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider font-title">Amount ($)</label>
                              <input
                                required
                                type="number"
                                min={0}
                                className="w-full px-3 py-2 text-sm rounded-xl border border-white/10 bg-slate-900/95 text-white"
                                value={bulkForm.customAmount}
                                onChange={e => setBulkForm({ ...bulkForm, customAmount: e.target.value })}
                                placeholder="Amount value"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider font-title">Deadline date</label>
                              <input
                                required
                                type="date"
                                className="w-full px-3 py-2 text-sm rounded-xl border border-white/10 bg-slate-900/95 text-white text-xs"
                                value={bulkForm.dueDate}
                                onChange={e => setBulkForm({ ...bulkForm, dueDate: e.target.value })}
                              />
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider font-title">Target Cohort / Scope</label>
                            <select
                              className="w-full px-3 py-2.5 text-sm rounded-xl border border-white/10 bg-slate-900/95 text-white"
                              value={bulkForm.targetScope}
                              onChange={e => setBulkForm({ ...bulkForm, targetScope: e.target.value })}
                            >
                              <option value="ALL">Apply to All Registered Students (Cohort)</option>
                              <option value="Computer Science">Computer Science Department Only</option>
                              <option value="Electrical Engineering">Electrical Engineering Department Only</option>
                              <option value="Business Administration">Business Administration Department Only</option>
                            </select>
                          </div>

                          <button
                            type="submit"
                            className="w-full mt-4 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-title text-xs font-bold tracking-widest rounded-xl transition flex items-center justify-center gap-1.5 shadow"
                          >
                            <Users className="h-4.5 w-4.5" />
                            DEPLOY BULK BILLING RUN
                          </button>
                        </form>
                      </div>

                      {/* Right: Single student invoicer */}
                      <div className="backdrop-blur-md bg-white/5 p-6 rounded-3xl border border-white/10 shadow-lg h-fit">
                        <div className="flex items-center gap-2 mb-4">
                          <PlusCircle className="h-4.5 w-4.5 text-indigo-400" />
                          <h3 className="text-base font-bold font-title text-white">Single Student Invoice Entry</h3>
                        </div>
                        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                          Issue custom charges, isolated library penalties, or specific hostel bills to a single designated student in the database.
                        </p>

                        <form onSubmit={handleCreateFee} className="space-y-4">
                          <div className="space-y-1.5">
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider font-title">Billing Target (Student)</label>
                            <select
                              required
                              className="w-full px-3 py-2.5 text-sm rounded-xl border border-white/10 text-white bg-slate-900/95"
                              value={feeForm.studentId}
                              onChange={e => setFeeForm({ ...feeForm, studentId: e.target.value })}
                            >
                              <option value="">-- Choose active student --</option>
                              {students.map(s => (
                                <option key={s.id} value={s.id}>{s.name} ({s.registrationNumber})</option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1.5">
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider font-title">Quick fill from Preset</label>
                            <select
                              className="w-full px-3 py-2.5 text-xs rounded-xl border border-white/10 bg-slate-900/95 text-white"
                              onChange={e => {
                                const matched = feeStructures.find(s => s.id === e.target.value);
                                if (matched) {
                                  setFeeForm({
                                    ...feeForm,
                                    title: matched.name,
                                    amount: String(matched.amount)
                                  });
                                }
                              }}
                            >
                              <option value="">-- Optional: Choose structure preset --</option>
                              {feeStructures.map(s => (
                                <option key={s.id} value={s.id}>{s.name} (${s.amount})</option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1.5">
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider font-title">Fee description</label>
                            <input
                              required
                              type="text"
                              className="w-full px-3 py-2 text-sm rounded-xl border border-white/10 text-white bg-slate-900/95"
                              placeholder="e.g., Fall Term Tuition Fee 2026"
                              value={feeForm.title}
                              onChange={e => setFeeForm({ ...feeForm, title: e.target.value })}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider font-title">Invoice amount ($)</label>
                              <input
                                required
                                type="number"
                                min={0}
                                className="w-full px-3 py-2 text-sm rounded-xl border border-white/10 text-white bg-slate-900/95"
                                placeholder="4500"
                                value={feeForm.amount}
                                onChange={e => setFeeForm({ ...feeForm, amount: e.target.value })}
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider font-title">Deadline date</label>
                              <input
                                required
                                type="date"
                                className="w-full px-3 py-2 text-sm rounded-xl border border-white/10 text-white bg-slate-900/95 text-xs"
                                value={feeForm.dueDate}
                                onChange={e => setFeeForm({ ...feeForm, dueDate: e.target.value })}
                              />
                            </div>
                          </div>

                          <button
                            type="submit"
                            className="w-full mt-2 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-title text-xs font-bold tracking-widest rounded-xl transition flex items-center justify-center gap-1.5 shadow"
                          >
                            <Plus className="h-4.5 w-4.5" />
                            PUBLISH SINGLE STUDENT INVOICE
                          </button>
                        </form>
                      </div>

                    </div>
                  )}

                </div>
              )}

              {/* ======================= TAB: FORENSIC AUDIT LOGS ======================= */}
              {activeTab === 'logs' && (
                <div className="space-y-6 animate-fade-in">
                  
                  {/* Ledger Toolbar & Search */}
                  <div className="backdrop-blur-md bg-white/5 p-6 rounded-3xl border border-white/10 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h3 className="text-lg font-bold font-title text-white flex items-center gap-2">
                        <Terminal className="h-5 w-5 text-indigo-400" /> Forensic Portal Security Audit Logs
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">Full real-time system forensic analysis mapping operations, operators, entity scopes and locations</p>
                    </div>

                    <div className="relative w-full md:w-80">
                      <Search className="absolute left-3top-3 h-4 w-4 text-slate-400 mt-2.5 ml-0.5" />
                      <input
                        type="text"
                        placeholder="Search logs by action, details, user..."
                        className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl border border-white/10 bg-slate-950/20 text-white focus:outline-none"
                        value={logSearchQuery}
                        onChange={e => setLogSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Operational Ledger display */}
                  <div className="backdrop-blur-md bg-white/5 p-6 rounded-3xl border border-white/10 shadow-lg">
                    <div className="overflow-x-auto border border-white/10 rounded-2xl bg-slate-950/20">
                      <table className="min-w-full divide-y divide-white/10 text-xs">
                        <thead className="bg-white/5">
                          <tr>
                            <th className="px-4 py-3 text-left text-[10px] font-bold font-title text-slate-400 uppercase tracking-widest font-mono">Fingerprint Transaction ID</th>
                            <th className="px-4 py-3 text-left text-[10px] font-bold font-title text-slate-400 uppercase tracking-widest font-mono">Event Action Mapping</th>
                            <th className="px-4 py-3 text-left text-[10px] font-bold font-title text-slate-400 uppercase tracking-widest font-mono">Core Operator Agent</th>
                            <th className="px-4 py-3 text-left text-[10px] font-bold font-title text-slate-400 uppercase tracking-widest font-mono">Entity Target space</th>
                            <th className="px-4 py-3 text-left text-[10px] font-bold font-title text-slate-400 uppercase tracking-widest">Operator Summary/Details</th>
                            <th className="px-4 py-3 text-center text-[10px] font-bold font-title text-slate-400 uppercase tracking-widest font-mono">Terminal IP</th>
                            <th className="px-4 py-3 text-right text-[10px] font-bold font-title text-slate-400 uppercase tracking-widest font-mono">UTC Timestamp</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-sans">
                          {filteredLogs.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="px-4 py-8 text-center text-xs text-slate-400">No security logging transactions recovered in registry logs directory.</td>
                            </tr>
                          ) : (
                            filteredLogs.map((log: any) => (
                              <tr key={log.id} className="hover:bg-white/5 transition">
                                <td className="px-4 py-3 font-mono text-[10px] font-semibold text-slate-400">{log.id}</td>
                                <td className="px-4 py-3 text-left">
                                  <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-extrabold font-mono tracking-wider border uppercase ${
                                    ['USER_DELETED', 'COURSE_DELETED', 'ENROLLMENT_REVOKED'].includes(log.action)
                                      ? 'bg-rose-500/10 text-rose-400 border-rose-525/25'
                                      : ['FEE_INVOICED', 'FEE_PAYMENT_METRICS_UPDATE'].includes(log.action)
                                      ? 'bg-amber-500/10 text-amber-400 border-amber-525/25'
                                      : 'bg-indigo-500/10 text-indigo-300 border-indigo-525/20'
                                  }`}>
                                    {log.action}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="block font-bold text-white font-title">{log.userName || 'System Auto'}</span>
                                  <span className="block text-[10px] text-slate-450 uppercase tracking-wide font-semibold mt-0.5">{log.userRole || 'SYSTEM'}</span>
                                </td>
                                <td className="px-4 py-3 font-mono text-[10px] font-bold text-slate-350">{log.entity} / {log.entityId || 'N/A'}</td>
                                <td className="px-4 py-3 text-slate-300 font-medium font-sans leading-relaxed">{log.details}</td>
                                <td className="px-4 py-3 text-center text-slate-400 font-mono text-[10px] font-semibold">{log.ipAddress || '192.168.1.1'}</td>
                                <td className="px-4 py-3 text-right text-slate-400 font-mono text-[10px] font-semibold">
                                  {new Date(log.createdAt).toLocaleString()}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              )}

              {/* ======================= TAB: AGGREGATE ATTENDANCE STATISTICS ======================= */}
              {activeTab === 'attendance' && (
                <div className="space-y-6 animate-fade-in text-left">
                  
                  {loadingAttendanceStats ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
                      <span className="text-xs font-mono text-indigo-300">Compiling campus aggregate database charts...</span>
                    </div>
                  ) : !attendanceStats ? (
                    <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-3xl p-10 text-center text-slate-400 font-bold">
                      No global attendance records compiled. Have instructors marked class lists?
                    </div>
                  ) : (
                    <>
                      {/* Top Metric Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="backdrop-blur-md bg-white/5 p-5 rounded-3xl border border-white/10 shadow-lg animate-fade-in">
                          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Recorded Sessions</span>
                          <span className="block text-3xl font-bold text-indigo-300 font-mono mt-2">
                            {attendanceStats.totalSessions} Lectures Conducted
                          </span>
                        </div>

                        <div className="backdrop-blur-md bg-white/5 p-5 rounded-3xl border border-white/10 shadow-lg animate-fade-in">
                          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Present Average Ratio</span>
                          <span className={`block text-3xl font-bold font-mono mt-2 ${attendanceStats.overallAttendanceRatio >= 75 ? 'text-emerald-400' : 'text-rose-450 text-rose-500'}`}>
                            {attendanceStats.overallAttendanceRatio.toFixed(1)}% Present
                          </span>
                        </div>

                        <div className="backdrop-blur-md bg-white/5 p-5 rounded-3xl border border-white/10 shadow-lg animate-fade-in">
                          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Recorded Status Count Breakdown</span>
                          <div className="grid grid-cols-4 gap-2 mt-3 font-mono text-[10px]">
                            <div className="text-emerald-400 font-semibold bg-emerald-500/10 p-1 rounded text-center">
                              P: {attendanceStats.overallAttendanceStats?.PRESENT || 0}
                            </div>
                            <div className="text-amber-400 font-semibold bg-amber-500/10 p-1 rounded text-center">
                              L: {attendanceStats.overallAttendanceStats?.LATE || 0}
                            </div>
                            <div className="text-rose-400 font-semibold bg-rose-505/10 p-1 rounded text-center animate-pulse">
                              A: {attendanceStats.overallAttendanceStats?.ABSENT || 0}
                            </div>
                            <div className="text-cyan-400 font-semibold bg-cyan-500/10 p-1 rounded text-center">
                              E: {attendanceStats.overallAttendanceStats?.EXCUSED || 0}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Course statistics card */}
                      <div className="backdrop-blur-md bg-white/5 p-6 rounded-3xl border border-white/10 shadow-lg space-y-4">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                          Course-wise Attendance Statistics
                        </h3>
                        <div className="overflow-x-auto border border-white/10 rounded-2xl bg-slate-950/20">
                          <table className="min-w-full divide-y divide-white/10 text-xs">
                            <thead className="bg-[#0f172a]/80 text-[#94a3b8] font-mono tracking-wider uppercase">
                              <tr>
                                <th className="px-5 py-3 text-left font-bold">Course Info</th>
                                <th className="px-5 py-3 text-center font-bold">Lectures Conducted</th>
                                <th className="px-5 py-3 text-center font-bold">Averages</th>
                                <th className="px-5 py-3 text-center font-bold">Attendance Grid (P / L / A / E)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-slate-300">
                              {!attendanceStats.courseAttendance || attendanceStats.courseAttendance.length === 0 ? (
                                <tr>
                                  <td colSpan={4} className="px-5 py-8 text-center text-slate-500 font-bold">
                                    No courses are actively tracking attendance logs.
                                  </td>
                                </tr>
                              ) : (
                                attendanceStats.courseAttendance.map((ca: any) => (
                                  <tr key={ca.courseId} className="hover:bg-white/5 transition">
                                    <td className="px-5 py-3 whitespace-nowrap text-left">
                                      <span className="font-bold text-white block">{ca.courseName}</span>
                                      <span className="text-[10px] text-indigo-300 font-mono mt-0.5 block">{ca.courseCode}</span>
                                    </td>
                                    <td className="px-5 py-3 whitespace-nowrap text-center font-mono font-bold text-slate-400">
                                      {ca.totalSessions} Sessions
                                    </td>
                                    <td className="px-5 py-3 whitespace-nowrap text-center">
                                      <span className={`font-mono font-bold text-sm ${ca.ratio >= 75 ? 'text-emerald-400' : 'text-rose-500'}`}>
                                        {ca.ratio?.toFixed(1)}%
                                      </span>
                                    </td>
                                    <td className="px-5 py-3 whitespace-nowrap text-center font-mono">
                                      <div className="inline-flex gap-2">
                                        <span className="text-emerald-400">P:{ca.stats?.PRESENT || 0}</span>
                                        <span className="text-amber-400">L:{ca.stats?.LATE || 0}</span>
                                        <span className="text-rose-450 text-rose-400">A:{ca.stats?.ABSENT || 0}</span>
                                        <span className="text-cyan-400">E:{ca.stats?.EXCUSED || 0}</span>
                                      </div>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Warning Reports Panel - critical < 75% */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Attendance Warnings */}
                        <div className="backdrop-blur-md bg-[#1c080c] p-6 rounded-3xl border border-rose-500/20 shadow-lg space-y-4">
                          <h3 className="text-sm font-bold text-rose-300 flex items-center gap-2 uppercase tracking-wider">
                            <ShieldAlert className="h-4 w-4 animate-bounce text-rose-400" /> Attendance Warning Directory (&lt; 75%)
                          </h3>
                          <p className="text-[11px] text-slate-450 text-slate-400">Academic Regulations strictly require a minimum of 75% attendance to qualify for final module evaluation. Outstanding deficit attendees are flagged below:</p>
                          <div className="overflow-x-auto border border-rose-950/40 rounded-2xl bg-slate-950/45">
                            <table className="min-w-full divide-y divide-rose-950/40 text-xs">
                              <thead className="bg-[#2a1318]/90 text-rose-305 font-mono text-[10px] tracking-wider uppercase">
                                <tr>
                                  <th className="px-4 py-3 text-left font-bold">Flagged Attendee</th>
                                  <th className="px-4 py-3 text-center font-bold">Actual Index</th>
                                  <th className="px-4 py-3 text-right font-bold">Deficit Details</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-rose-950/30 text-rose-200">
                                {!attendanceStats.studentAttendance || attendanceStats.studentAttendance.filter((s: any) => s.ratio < 75).length === 0 ? (
                                  <tr>
                                    <td colSpan={3} className="px-4 py-8 text-center text-emerald-400 font-bold font-mono">
                                      ✓ Perfect Compliance. Zero students are in attendance deficit.
                                    </td>
                                  </tr>
                                ) : (
                                  attendanceStats.studentAttendance
                                    .filter((s: any) => s.ratio < 75)
                                    .map((sa: any) => (
                                      <tr key={sa.studentId} className="hover:bg-rose-950/15 transition">
                                        <td className="px-4 py-3 whitespace-nowrap text-left flex flex-col">
                                          <span className="font-bold text-white block">{sa.studentName}</span>
                                          <span className="text-[10px] text-rose-300 font-mono mt-0.5 block">{sa.registrationNumber}</span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-center font-mono font-extrabold text-rose-400 text-sm">
                                          {sa.ratio?.toFixed(1)}%
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-right font-mono text-[10px] text-slate-455 text-slate-400">
                                          {sa.stats?.PRESENT || 0}P / {sa.stats?.ABSENT || 0}A / {sa.totalSessions}T
                                        </td>
                                      </tr>
                                    ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* High Compliance List */}
                        <div className="backdrop-blur-md bg-[#081c10] p-6 rounded-3xl border border-emerald-500/20 shadow-lg space-y-4">
                          <h3 className="text-sm font-bold text-emerald-350 flex items-center gap-2 uppercase tracking-wider">
                            <Check className="h-4 w-4 text-emerald-400" /> Compliant Attendees (&ge; 75%)
                          </h3>
                          <p className="text-[11px] text-slate-455 text-slate-400">The following students maintain standard physical/virtual session compliance at or exceeding the 75% regulatory requirement:</p>
                          <div className="overflow-x-auto border border-emerald-900/40 rounded-2xl bg-slate-950/45">
                            <table className="min-w-full divide-y divide-emerald-950/40 text-xs">
                              <thead className="bg-[#132a18]/90 text-emerald-350 font-mono text-[10px] tracking-wider uppercase">
                                <tr>
                                  <th className="px-4 py-3 text-left font-bold">Attendee</th>
                                  <th className="px-4 py-3 text-center font-bold">Compliance Index</th>
                                  <th className="px-4 py-3 text-right font-bold">Sessions Logged</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-emerald-950/30 text-emerald-200">
                                {!attendanceStats.studentAttendance || attendanceStats.studentAttendance.filter((s: any) => s.ratio >= 75).length === 0 ? (
                                  <tr>
                                    <td colSpan={3} className="px-4 py-8 text-center text-slate-550 font-semibold italic">
                                      No students are recorded yet with standard attendance data.
                                    </td>
                                  </tr>
                                ) : (
                                  attendanceStats.studentAttendance
                                    .filter((s: any) => s.ratio >= 75)
                                    .map((sa: any) => (
                                      <tr key={sa.studentId} className="hover:bg-emerald-950/15 transition">
                                        <td className="px-4 py-3 whitespace-nowrap text-left flex flex-col">
                                          <span className="font-bold text-white block">{sa.studentName}</span>
                                          <span className="text-[10px] text-emerald-350 font-mono mt-0.5 block">{sa.registrationNumber}</span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-center font-mono font-extrabold text-emerald-400 text-sm">
                                          {sa.ratio?.toFixed(1)}%
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-right font-mono text-[10px] text-slate-455 text-slate-400">
                                          {sa.stats?.PRESENT || 0}P / {sa.stats?.ABSENT || 0}A / {sa.totalSessions}T
                                        </td>
                                      </tr>
                                    ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>

                      </div>
                    </>
                  )}

                </div>
              )}

              {/* ======================= TAB: ACADEMIC EXAMINATIONS & EVALUATIONS REPORT HUB ======================= */}
              {activeTab === 'exams-report' && (
                <div className="space-y-6 animate-fade-in text-left">
                  <div className="bg-slate-900/40 border border-white/10 rounded-3xl p-6 backdrop-blur-md">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          <GraduationCap className="h-5 w-5 text-indigo-400 font-bold" /> Academic Evaluation & Examination Hub
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">
                          Consolidated academic report of syllabus examinations, average classroom grades, pass metrics, and deficit logs across all courses.
                        </p>
                      </div>
                      <button
                        onClick={fetchAcademicReport}
                        className="py-1.5 px-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl text-xs font-mono transition flex items-center gap-1 cursor-pointer"
                      >
                        Refresh Report
                      </button>
                    </div>

                    {loadingAcademicReport || !academicReport ? (
                      <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
                        <span className="text-xs text-slate-400 font-mono">Aggregating department evaluations and score sheets...</span>
                      </div>
                    ) : (
                      <>
                        {/* Overall Stats Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                          <div className="bg-slate-950/20 p-4 rounded-2xl border border-white/5">
                            <span className="block text-[9px] text-slate-400 font-mono uppercase tracking-wider font-bold">Total Exams Registered</span>
                            <span className="block text-2xl font-bold text-white mt-1 font-title">
                              {academicReport.overallStats?.totalExams || 0}
                            </span>
                          </div>
                          <div className="bg-slate-950/20 p-4 rounded-2xl border border-white/5">
                            <span className="block text-[9px] text-indigo-300 font-mono uppercase tracking-wider font-bold">Released Score Cards</span>
                            <div className="flex items-baseline mt-1 gap-1">
                              <span className="text-2xl font-bold text-indigo-400 font-title">
                                {academicReport.overallStats?.publishedExams || 0}
                              </span>
                              <span className="text-xs text-slate-500 font-mono">/ {academicReport.overallStats?.totalExams || 0}</span>
                            </div>
                          </div>
                          <div className="bg-slate-950/20 p-4 rounded-2xl border border-white/5">
                            <span className="block text-[9px] text-slate-400 font-mono uppercase tracking-wider font-bold">Total Scores Logged</span>
                            <span className="block text-2xl font-bold text-slate-200 mt-1 font-title">
                              {academicReport.overallStats?.totalMarksEntered || 0}
                            </span>
                          </div>
                          <div className="bg-slate-900/60 p-4 rounded-2xl border border-indigo-500/10">
                            <span className="block text-[9px] text-emerald-400 font-mono uppercase tracking-wider font-semibold">Continuous Marks Avg</span>
                            <span className="block text-2xl font-extrabold text-emerald-400 mt-1 font-mono">
                              {academicReport.overallStats?.averageScorePercent || 0}%
                            </span>
                          </div>
                        </div>

                        {/* Course performance aggregate and Top Performers */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                          {/* Course performance aggregator */}
                          <div className="bg-slate-950/20 border border-white/5 rounded-3xl p-6 space-y-4">
                            <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                              <div className="w-1.5 h-3 bg-indigo-500 rounded-sm"></div> Syllabus Course Averages
                            </h4>
                            <div className="space-y-4">
                              {(!academicReport.courseWise || academicReport.courseWise.length === 0) ? (
                                <p className="text-xs font-mono text-slate-500 italic text-center py-6">No graded marks logged yet.</p>
                              ) : (
                                academicReport.courseWise.map((c: any) => {
                                  const avgPercent = c.averagePercent || 0;
                                  let color = 'bg-emerald-500';
                                  if (avgPercent < 50) color = 'bg-rose-500';
                                  else if (avgPercent < 75) color = 'bg-amber-500';

                                  return (
                                    <div key={c.courseCode} className="space-y-1.5">
                                      <div className="flex justify-between text-xs items-center">
                                        <span className="block text-left">
                                          <strong className="text-slate-200 mr-2">{c.courseName}</strong>
                                          <span className="text-[10px] text-slate-500 font-mono">({c.courseCode})</span>
                                        </span>
                                        <span className="font-mono text-slate-300 font-bold block">{avgPercent}% score avg</span>
                                      </div>
                                      <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-white/5">
                                        <div className={`h-full ${color}`} style={{ width: `${avgPercent}%` }} />
                                      </div>
                                      <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
                                        <span>Graded Papers: {c.gradedCount}</span>
                                        <span className={c.passRate >= 75 ? 'text-emerald-400' : 'text-rose-450 text-rose-400'}>Clearance Ratio: {c.passRate}%</span>
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>

                          {/* Honor Roll / High Score logs */}
                          <div className="bg-slate-950/20 border border-white/5 rounded-3xl p-6 space-y-4">
                            <h4 className="text-sm font-bold text-indigo-305 uppercase tracking-wider flex items-center gap-2 text-indigo-300">
                              <Check className="h-4 w-4" /> Academic Honor Roll (Top Performers)
                            </h4>
                            <div className="overflow-x-auto border border-white/5 rounded-2xl bg-slate-950/25">
                              <table className="min-w-full divide-y divide-white/5 text-xs text-left">
                                <thead className="bg-slate-900/60 text-slate-400 text-[9px] font-mono uppercase tracking-wider font-bold">
                                  <tr>
                                    <th className="px-3 py-2.5">Student Profile</th>
                                    <th className="px-3 py-2.5">Course Exam</th>
                                    <th className="px-3 py-2.5 text-center">Score Pct</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 font-sans">
                                  {(!academicReport.topPerformers || academicReport.topPerformers.length === 0) ? (
                                    <tr>
                                      <td colSpan={3} className="px-3 py-6 text-center text-slate-550 font-semibold italic">
                                        No outstanding recorded exam marks found.
                                      </td>
                                    </tr>
                                  ) : (
                                    academicReport.topPerformers.map((tp: any, index: number) => (
                                      <tr key={index} className="hover:bg-white/5 transition duration-100">
                                        <td className="px-3 py-2.5 whitespace-nowrap">
                                          <span className="block font-bold text-white">{tp.studentName}</span>
                                          <span className="block font-mono text-[9px] text-indigo-300">{tp.studentRegistrationNumber}</span>
                                        </td>
                                        <td className="px-3 py-2.5 whitespace-normal">
                                          <span className="block text-slate-200 font-semibold">{tp.examTitle}</span>
                                          <span className="block text-[9px] font-mono text-slate-500">{tp.courseCode} ({tp.examType})</span>
                                        </td>
                                        <td className="px-3 py-2.5 text-center whitespace-nowrap font-mono font-black text-emerald-400 select-all">
                                          {tp.percentage}%
                                        </td>
                                      </tr>
                                    ))
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>

                        {/* Exam Wise Performance breakdown */}
                        <div className="bg-slate-950/20 border border-white/5 rounded-3xl p-6 mt-6 space-y-4">
                          <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                             <div className="w-1.5 h-3 bg-indigo-500 rounded-sm"></div> Department Exam Settings & Graded Metrics
                          </h4>
                          <div className="overflow-x-auto border border-white/5 rounded-2xl bg-slate-950/25">
                            <table className="min-w-full divide-y divide-white/5 text-xs text-left">
                              <thead className="bg-[#181e2e] text-slate-400 text-[9px] font-mono uppercase tracking-wider font-bold">
                                <tr>
                                  <th className="px-4 py-3">Department Subject Block</th>
                                  <th className="px-4 py-3">Exam Designation</th>
                                  <th className="px-4 py-3 text-center">Class Avg</th>
                                  <th className="px-4 py-3 text-center">Highest Marks</th>
                                  <th className="px-4 py-3 text-center">Clearance</th>
                                  <th className="px-4 py-3 text-center">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/5 font-sans">
                                {(!academicReport.examWise || academicReport.examWise.length === 0) ? (
                                  <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-slate-550 font-semibold italic">
                                      No examination blocks have been created in database stores.
                                    </td>
                                  </tr>
                                ) : (
                                  academicReport.examWise.map((ex: any) => (ex && (
                                    <tr key={ex.id} className="hover:bg-white/5 transition duration-100">
                                      <td className="px-4 py-3 whitespace-nowrap">
                                        <span className="font-bold text-white block">{ex.courseName}</span>
                                        <span className="text-[9px] font-mono text-indigo-300 mt-0.5 block">{ex.courseCode}</span>
                                      </td>
                                      <td className="px-4 py-3 whitespace-nowrap">
                                        <span className="font-semibold text-slate-200 block">{ex.title}</span>
                                        <span className="text-[9px] font-mono text-slate-500 block">Max Score: {ex.maxMarks} • {ex.type}</span>
                                      </td>
                                      <td className="px-4 py-3 text-center whitespace-nowrap font-mono font-black text-white">
                                        {ex.averageObtained} <span className="text-[10px] text-slate-500 font-normal">({ex.averagePercent}%)</span>
                                      </td>
                                      <td className="px-4 py-3 text-center whitespace-nowrap font-mono font-bold text-emerald-400">
                                        {ex.maxObtained}
                                      </td>
                                      <td className="px-4 py-3 text-center whitespace-nowrap font-mono">
                                        <span className={`font-bold ${ex.passRate >= 75 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                          {ex.passRate}% Pass
                                        </span>
                                        <span className="block text-[9px] text-slate-500">{ex.totalGraded || 0} graded</span>
                                      </td>
                                      <td className="px-4 py-3 text-center whitespace-nowrap">
                                        {ex.isPublished ? (
                                          <span className="px-2 py-0.5 rounded text-[9px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">Released</span>
                                        ) : (
                                          <span className="px-2 py-0.5 rounded text-[9px] font-mono uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">Review-Draft</span>
                                        )}
                                      </td>
                                    </tr>
                                  )))
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Deficit / Needs attention list */}
                        <div className="bg-slate-950/20 border border-white/5 rounded-3xl p-6 mt-6 space-y-4">
                          <h4 className="text-sm font-bold text-rose-400 uppercase tracking-wider flex items-center gap-2">
                             <ShieldAlert className="h-4 w-4 animate-bounce" /> score deficits flagged (&lt; 50%)
                          </h4>
                          <p className="text-[11px] text-slate-400">
                            The following students are performing inside academic score deficit bands and require continuous supervision or remediation:
                          </p>
                          <div className="overflow-x-auto border border-rose-950/20 rounded-2xl bg-[#1c080c]/20">
                            <table className="min-w-full divide-y divide-rose-950/25 text-xs text-left">
                              <tbody className="divide-y divide-rose-950/20 text-rose-100 font-sans">
                                {(!academicReport.flaggedDeficits || academicReport.flaggedDeficits.length === 0) ? (
                                  <tr>
                                    <td className="px-4 py-8 text-center text-emerald-400 font-bold font-mono">
                                       ✓ Standard scores fully clear. Zero grade deficits recorded.
                                    </td>
                                  </tr>
                                ) : (
                                  academicReport.flaggedDeficits.map((fd: any, i: number) => (
                                    <tr key={i} className="hover:bg-rose-950/15 transition duration-100">
                                      <td className="px-4 py-3 whitespace-nowrap">
                                        <strong className="block text-white">{fd.studentName}</strong>
                                        <span className="block font-mono text-[9px] text-rose-350">{fd.studentRegistrationNumber}</span>
                                      </td>
                                      <td className="px-4 py-3 whitespace-nowrap font-mono text-[10px] text-slate-400">
                                        <span className="font-semibold text-slate-200 block">{fd.examTitle}</span>
                                        <span>{fd.courseCode}</span>
                                      </td>
                                      <td className="px-4 py-3 text-center whitespace-nowrap font-mono">
                                        <span className="font-extrabold text-rose-450 text-rose-400 text-sm">{fd.obtainedMarks}</span>
                                        <span className="text-[10px] text-slate-500"> / {fd.maxMarks}</span>
                                        <span className="block text-[10px] text-rose-300">({fd.percentage}%)</span>
                                      </td>
                                      <td className="px-4 py-3 whitespace-normal max-w-xs text-slate-450 text-slate-400">
                                        {fd.remarks || <span className="text-rose-950/50 italic leading-none font-light">No comment provided</span>}
                                      </td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ======================= TAB: NOTICES & ANNOUNCEMENTS BROADCAST SYSTEM ======================= */}
          {activeTab === 'notices' && (
            <div className="space-y-6 animate-fade-in text-left">
              <div className="bg-slate-900/40 border border-white/10 rounded-3xl p-6 backdrop-blur-md">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Bell className="h-5 w-5 text-indigo-400 font-bold" /> Notices & Announcements Broadcast System
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Draft urgent alerts, financial balance reminders, system maintenance events, or specific targeted announcements. Global notices propagate automatically into all student logs and dashboards.
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
                  {/* Left: Compose Notice Form */}
                  <form onSubmit={handleSendNotice} className="lg:col-span-5 space-y-4 bg-slate-950/25 border border-white/5 p-6 rounded-2xl">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 border-b border-white/5 pb-2 mb-4">
                      Draft Notice Broadcast
                    </h4>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-title">Notice Caption / Heading</label>
                      <input
                        required
                        type="text"
                        placeholder="e.g. Annual Sports Fest Registration Open"
                        className="w-full px-3 py-2 text-sm rounded-xl border border-white/10 text-white bg-slate-950 focus:outline-none focus:ring-1 focus:ring-indigo-505 focus:ring-indigo-500"
                        value={noticeForm.title}
                        onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-title font-mono">Scope of Broadcast</label>
                      <select
                        className="w-full px-3 py-2 text-sm rounded-xl border border-white/10 text-white bg-slate-950 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-title font-sans"
                        value={noticeForm.userId}
                        onChange={(e) => setNoticeForm({ ...noticeForm, userId: e.target.value })}
                      >
                        <option value="all">System-wide Broadcast (All Students)</option>
                        {students.map(std => (
                          <option key={std.id} value={std.id}>
                            Target Student: {std.name} ({std.registrationNumber || 'N/A'})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-title">Notice Category</label>
                        <select
                          className="w-full px-3 py-2 text-sm rounded-xl border border-white/10 text-white bg-slate-950 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                          value={noticeForm.type}
                          onChange={(e) => setNoticeForm({ ...noticeForm, type: e.target.value })}
                        >
                          <option value="SYSTEM">SYSTEM / CAMPUS</option>
                          <option value="GRADE">ACADEMIC / GRADE</option>
                          <option value="ATTENDANCE">ATTENDANCE ALERT</option>
                          <option value="FEE">FINANCIAL / DEBT</option>
                          <option value="ASSIGNMENT">HOMEWORK / COURSEWORK</option>
                          <option value="EXAM">EXAMINATION NOTICE</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-title">Notice Details</label>
                      <textarea
                        required
                        rows={4}
                        placeholder="Write comprehensive notification particulars and compliance instructions here..."
                        className="w-full px-3 py-2 text-sm rounded-xl border border-white/10 text-white bg-slate-950 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        value={noticeForm.message}
                        onChange={(e) => setNoticeForm({ ...noticeForm, message: e.target.value })}
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={sendingNotice}
                        className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold font-title uppercase tracking-widest transition shadow-lg shadow-indigo-950/40 cursor-pointer flex justify-center items-center gap-2"
                      >
                        <Bell className="h-4 w-4" />
                        {sendingNotice ? 'Broadcasting...' : 'Broadcast Notice'}
                      </button>
                    </div>
                  </form>

                  {/* Right: Sent Notices List */}
                  <div className="lg:col-span-7 space-y-4">
                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-indigo-300">
                        Broadcast Notices Log ({notices.length})
                      </h4>
                      <span className="text-[10px] font-mono text-slate-500">Live feed</span>
                    </div>

                    {loadingNotices ? (
                      <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                        <span className="text-xs text-slate-500 font-mono">Consolidating sent broadcast items...</span>
                      </div>
                    ) : notices.length === 0 ? (
                      <div className="text-center py-12 bg-white/5 border border-dashed border-white/10 rounded-2xl">
                        <Bell className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                        <p className="text-xs text-slate-400 italic">No custom notices have been broadcasted yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 animate-fade-in">
                        {notices.map((notif: any) => {
                          const targetStudent = students.find(s => s.id === notif.userId);
                          return (
                            <div key={notif.id} className="bg-slate-950/20 border border-white/5 rounded-2xl p-4 hover:border-indigo-500/20 transition group">
                              <div className="flex justify-between items-start gap-2">
                                <div>
                                  <span className={`inline-block px-2 py-0.5 text-[8px] font-mono font-black uppercase rounded ${
                                    notif.type === 'FEE' ? 'bg-amber-500/15 text-amber-400' :
                                    notif.type === 'GRADE' ? 'bg-purple-500/20 text-purple-300' :
                                    notif.type === 'EXAM' ? 'bg-sky-500/20 text-sky-300' : 'bg-slate-800 text-slate-300'
                                  }`}>
                                    {notif.type}
                                  </span>
                                  <h5 className="text-sm font-bold text-white mt-1.5 group-hover:text-indigo-300 transition">{notif.title}</h5>
                                </div>
                                <span className="text-[9px] font-mono text-slate-500 whitespace-nowrap">
                                  {notif.createdAt ? new Date(notif.createdAt).toLocaleString() : 'N/A'}
                                </span>
                              </div>
                              <p className="text-xs text-slate-350 mt-2 whitespace-pre-line leading-relaxed font-sans">{notif.message}</p>
                              <div className="mt-3 pt-3 border-t border-white/5 flex justify-between items-center text-[10px] text-slate-400 font-mono">
                                <span>Recipient: <span className="text-indigo-400 font-medium">{targetStudent ? `${targetStudent.name} (${targetStudent.registrationNumber || 'N/A'})` : '📢 Global Broadcast'}</span></span>
                                <span>Status: <span className={notif.isRead ? "text-emerald-400" : "text-amber-400"}>{notif.isRead ? "Viewed" : "Unread"}</span></span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* MODAL: EDIT ACADEMIC PORTAL USER DETAILS */}
      {editingUserId && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-slate-950/30">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <Edit className="h-4.5 w-4.5" />
                </div>
                <h3 className="text-sm font-bold font-title text-white">Edit Academic Account Details</h3>
              </div>
              <button 
                onClick={() => setEditingUserId(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateUser} className="p-6 space-y-4 text-left">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-title">Academic Name</label>
                <input
                  required
                  type="text"
                  placeholder="Academic Name"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-white/10 text-white bg-slate-950 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  value={editingUserForm.name}
                  onChange={(e) => setEditingUserForm({ ...editingUserForm, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-title">Email Username Address</label>
                <input
                  required
                  type="email"
                  placeholder="email@portal.com"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-white/10 text-white bg-slate-950 focus:outline-none"
                  value={editingUserForm.email}
                  onChange={(e) => setEditingUserForm({ ...editingUserForm, email: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-title">Department</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. CSE"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-white/10 text-white bg-slate-950 focus:outline-none focus:ring-1"
                    value={editingUserForm.department}
                    onChange={(e) => setEditingUserForm({ ...editingUserForm, department: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-title">Phone Contact</label>
                  <input
                    type="text"
                    placeholder="Phone number"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-white/10 text-white bg-slate-950 focus:outline-none focus:ring-1"
                    value={editingUserForm.phone || ''}
                    onChange={(e) => setEditingUserForm({ ...editingUserForm, phone: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 font-title text-indigo-300">
                  Authentication Password Override (Leave blank to keep current)
                </label>
                <input
                  type="password"
                  placeholder="•••••••• (Optional update)"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-white/10 text-white bg-slate-950 focus:outline-none focus:ring-1"
                  value={editingUserForm.password || ''}
                  onChange={(e) => setEditingUserForm({ ...editingUserForm, password: e.target.value })}
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setEditingUserId(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold font-title tracking-widest text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl flex items-center gap-1.5 shadow"
                >
                  <Save className="h-3.5 w-3.5" />
                  APPLY CHANGES
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DETAILED STUDENT PORTAL VIEW (TRANSCRIPT AND LEDGER STATEMENTS) */}
      {viewingStudentId && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-white/10 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl animate-scale-up my-8 text-left">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-slate-950/30">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <GraduationCap className="h-4.5 w-4.5" />
                </div>
                <h3 className="text-sm font-bold font-title text-white">Student Academic & Financial Registry</h3>
              </div>
              <button 
                onClick={() => setViewingStudentId(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {loadingStudentDetail ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-indigo-500"></div>
                  <span className="text-xs text-slate-400 font-mono">Querying central databases...</span>
                </div>
              ) : detailedStudentData ? (
                <div className="space-y-6">
                  {/* Registry Details Badge Card */}
                  <div className="bg-slate-950/40 border border-white/5 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-title">Academic Identity Name</span>
                      <span className="text-base font-bold text-white block mt-0.5">{detailedStudentData.student.name}</span>
                      <span className="text-xs text-slate-404 block mt-1">{detailedStudentData.student.email}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-title">Registration Number</span>
                      <span className="text-sm font-mono font-semibold text-indigo-300 block mt-0.5">{detailedStudentData.student.registrationNumber || 'N/A'}</span>
                      <span className="text-[10px] text-slate-400 block mt-1">Enrollment Date: {new Date(detailedStudentData.student.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-title">Department Division</span>
                      <span className="text-xs font-semibold text-indigo-200 block mt-0.5">{detailedStudentData.student.department || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-title">Phone Contact</span>
                      <span className="text-xs text-slate-350 block mt-0.5">{detailedStudentData.student.phone || 'N/A'}</span>
                    </div>
                  </div>

                  {/* Class Load & Transcripts */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold font-title uppercase tracking-widest text-indigo-300 flex items-center gap-1.5 border-b border-white/5 pb-2">
                      <BookOpen className="h-4 w-4 text-emerald-400" /> Course Catalog Allocations
                    </h4>
                    {detailedStudentData.enrollments.length === 0 ? (
                      <p className="text-xs text-slate-400 italic text-center py-4 bg-white/5 rounded-xl border border-white/5">No active study courses catalogued.</p>
                    ) : (
                      <div className="overflow-hidden border border-white/5 rounded-xl bg-slate-950/20">
                        <table className="min-w-full divide-y divide-white/5 text-xs">
                          <thead className="bg-white/5">
                            <tr>
                              <th className="px-3 py-2 text-left font-bold text-slate-400 font-title uppercase">Course Catalogue</th>
                              <th className="px-3 py-2 text-center font-bold text-slate-400 font-title uppercase">Credits</th>
                              <th className="px-3 py-2 text-center font-bold text-slate-400 font-title uppercase">Midterm/Final Grade</th>
                              <th className="px-3 py-2 text-center font-bold text-slate-400 font-title uppercase">Faculty Coach</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {detailedStudentData.enrollments.map((enr: any) => (
                              <tr key={enr.id} className="hover:bg-white/5">
                                <td className="px-3 py-2.5">
                                  <span className="block font-bold text-white font-title">{enr.courseName}</span>
                                  <span className="block text-[9px] font-mono text-indigo-300 mt-0.5">{enr.courseCode}</span>
                                </td>
                                <td className="px-3 py-2.5 text-center font-bold font-mono text-slate-300">{enr.credits} Credits</td>
                                <td className="px-3 py-2.5 text-center">
                                  {enr.grade ? (
                                    <span className="inline-block px-1.5 py-0.5 text-[9px] font-semibold tracking-wider font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/10 rounded">
                                      {enr.grade}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-slate-450 italic">Ungraded / Pending</span>
                                  )}
                                </td>
                                <td className="px-3 py-2.5 text-center text-slate-350">{enr.facultyName || 'Unassigned'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Financial ledger & outstanding tuition */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold font-title uppercase tracking-widest text-indigo-300 flex items-center gap-1.5 border-b border-white/5 pb-2">
                      <DollarSign className="h-4 w-4 text-amber-400" /> Billed Financial accounts
                    </h4>
                    {detailedStudentData.fees.length === 0 ? (
                      <p className="text-xs text-slate-440 italic text-center py-4 bg-white/5 rounded-xl border border-white/5">No active tuition details or invoices available.</p>
                    ) : (
                      <div className="space-y-2">
                        <div className="overflow-hidden border border-white/5 rounded-xl bg-slate-950/20">
                          <table className="min-w-full divide-y divide-white/5 text-xs">
                            <thead className="bg-white/5">
                              <tr>
                                <th className="px-3 py-2 text-left font-bold text-slate-400 font-title uppercase">Invoice Title</th>
                                <th className="px-3 py-2 text-center font-bold text-slate-400 font-title uppercase">Billed Amount</th>
                                <th className="px-3 py-2 text-center font-bold text-slate-400 font-title uppercase">Amount Paid</th>
                                <th className="px-3 py-2 text-right font-bold text-slate-400 font-title uppercase">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                              {detailedStudentData.fees.map((f: any) => (
                                <tr key={f.id} className="hover:bg-white/5">
                                  <td className="px-3 py-2.5">
                                    <span className="block font-bold text-white">{f.title}</span>
                                    <span className="block text-[9px] text-slate-450 mt-0.5">Due date: {f.dueDate}</span>
                                  </td>
                                  <td className="px-3 py-2.5 text-center font-bold font-mono text-white">${f.amount}</td>
                                  <td className="px-3 py-2.5 text-center font-mono text-emerald-400 font-semibold">${f.amountPaid || 0} Paid</td>
                                  <td className="px-3 py-2.5 text-right">
                                    <span className={`inline-block px-1.5 py-0.5 text-[9px] font-bold font-mono rounded uppercase border ${
                                      f.status === 'PAID' 
                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/10' 
                                        : f.status === 'OVERDUE'
                                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/10'
                                        : 'bg-amber-500/15 text-amber-400 border-amber-500/10'
                                    }`}>
                                      {f.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center">Academic snapshot could not be processed.</p>
              )}
              
              <div className="flex justify-end pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setViewingStudentId(null)}
                  className="px-5 py-2 text-xs font-bold font-title tracking-wider text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition"
                >
                  CLOSE MONITOR
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DETAILED FACULTY REGISTRY & SUBJECT ASSIGNMENT VIEW */}
      {viewingFacultyId && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-white/10 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl animate-scale-up my-8 text-left">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-slate-950/30">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <Briefcase className="h-4.5 w-4.5" />
                </div>
                <h3 className="text-sm font-bold font-title text-white">Faculty Academic & Teaching Registry</h3>
              </div>
              <button 
                onClick={() => setViewingFacultyId(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {loadingFacultyDetail ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-indigo-500"></div>
                  <span className="text-xs text-slate-400 font-mono">Querying central databases...</span>
                </div>
              ) : detailedFacultyData ? (
                <div className="space-y-6">
                  {/* Registry Details Badge Card */}
                  <div className="bg-slate-950/40 border border-white/5 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-title">Academic Identity Name</span>
                      <span className="text-base font-bold text-white block mt-0.5">{detailedFacultyData.faculty.name}</span>
                      <span className="text-xs text-slate-404 block mt-1">{detailedFacultyData.faculty.email}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-title">Faculty Registration ID</span>
                      <span className="text-sm font-mono font-semibold text-indigo-300 block mt-0.5">{detailedFacultyData.faculty.registrationNumber || 'N/A'}</span>
                      <span className="text-[10px] text-slate-400 block mt-1">Appointed Date: {new Date(detailedFacultyData.faculty.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-title">Department Division</span>
                      <span className="text-xs font-semibold text-indigo-200 block mt-0.5">{detailedFacultyData.faculty.department || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-title">Phone Contact</span>
                      <span className="text-xs text-slate-350 block mt-0.5">{detailedFacultyData.faculty.phone || 'N/A'}</span>
                    </div>
                  </div>

                  {/* Active Teachings */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold font-title uppercase tracking-widest text-indigo-300 flex items-center gap-1.5 border-b border-white/5 pb-2">
                      <BookOpen className="h-4 w-4 text-emerald-400" /> Current Subject Allocations
                    </h4>
                    {detailedFacultyData.courses.length === 0 ? (
                      <p className="text-xs text-slate-400 italic text-center py-4 bg-white/5 rounded-xl border border-white/5">No active subjects currently assigned.</p>
                    ) : (
                      <div className="overflow-hidden border border-white/5 rounded-xl bg-slate-950/20">
                        <table className="min-w-full divide-y divide-white/5 text-xs">
                          <thead className="bg-white/5">
                            <tr>
                              <th className="px-3 py-2 text-left font-bold text-slate-400 font-title uppercase">Subject / Course</th>
                              <th className="px-3 py-2 text-center font-bold text-slate-400 font-title uppercase">Credits</th>
                              <th className="px-3 py-2 text-center font-bold text-slate-400 font-title uppercase">Department</th>
                              <th className="px-3 py-2 text-center font-bold text-slate-400 font-title uppercase">Student Registry Load</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {detailedFacultyData.courses.map((c: any) => (
                              <tr key={c.id} className="hover:bg-white/5">
                                <td className="px-3 py-2.5">
                                  <span className="block font-bold text-white font-title">{c.name}</span>
                                  <span className="block text-[9px] font-mono text-indigo-300 mt-0.5">{c.code}</span>
                                </td>
                                <td className="px-3 py-2.5 text-center font-bold font-mono text-slate-300">{c.credits} Credits</td>
                                <td className="px-3 py-2.5 text-center text-slate-350">{c.department}</td>
                                <td className="px-3 py-2.5 text-center">
                                  <span className="inline-block px-1.5 py-0.5 text-[10px] font-semibold font-mono bg-indigo-500/15 text-indigo-300 rounded-full border border-indigo-500/10">
                                    {c.studentCount} Students
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Assign Subjects Section */}
                  <div className="border-t border-white/5 pt-4 space-y-3">
                    <h4 className="text-xs font-bold font-title uppercase tracking-widest text-indigo-300 flex items-center gap-1.5 pb-2 border-b border-white/5">
                      <Save className="h-4 w-4 text-amber-400" /> Assign & Map Subjects Catalog
                    </h4>
                    <form onSubmit={handleUpdateFacultyCourses} className="space-y-4">
                      <p className="text-[11px] text-slate-404 leading-relaxed">
                        Toggle checkmarks below to assign or unassign courses from the global curriculum catalog directly to this faculty instructor's active caseload registry.
                      </p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto p-2.5 bg-slate-950/40 rounded-2xl border border-white/5">
                        {courses.length === 0 ? (
                          <div className="col-span-2 text-center py-6 text-xs text-slate-400 italic">No courses exist in the system catalog records.</div>
                        ) : (
                          courses.map(c => {
                            const isChecked = selectedCourseIdsForFaculty.includes(c.id);
                            return (
                              <label 
                                key={c.id} 
                                className={`flex items-start gap-2.5 p-2 rounded-xl border transition cursor-pointer select-none text-left ${
                                  isChecked 
                                    ? 'bg-indigo-500/10 border-indigo-500/20 text-white' 
                                    : 'bg-transparent border-transparent hover:bg-white/5 text-slate-300'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedCourseIdsForFaculty([...selectedCourseIdsForFaculty, c.id]);
                                    } else {
                                      setSelectedCourseIdsForFaculty(selectedCourseIdsForFaculty.filter(id => id !== c.id));
                                    }
                                  }}
                                  className="mt-0.5 rounded border-white/10 text-indigo-600 focus:ring-indigo-500/50 bg-slate-950"
                                />
                                <div className="text-xs">
                                  <span className="block font-bold leading-tight">{c.name}</span>
                                  <span className="block text-[9px] font-mono text-slate-400 mt-0.5">{c.code} • {c.credits} Credits • {c.department}</span>
                                </div>
                              </label>
                            );
                          })
                        )}
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          type="submit"
                          disabled={assigningFacultyCourses}
                          className="px-4 py-2 text-xs font-bold font-title tracking-wider bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl flex items-center gap-1.5 shadow-lg active:scale-95 transition cursor-pointer"
                        >
                          <Save className="h-3.5 w-3.5" />
                          {assigningFacultyCourses ? 'APPLYING REGISTRY...' : 'SAVE MAPPED CATALOG'}
                        </button>
                      </div>
                    </form>
                  </div>

                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center">Faculty snapshots could not be processed.</p>
              )}
              
              <div className="flex justify-end pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setViewingFacultyId(null)}
                  className="px-5 py-2 text-xs font-bold font-title tracking-wider text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition cursor-pointer"
                >
                  CLOSE MONITOR
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: MANAGE COURSE REGISTRANTS AND ENROLLMENTS */}
      {viewingRegistrantsCourseId && selectedCourseForModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-white/10 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl animate-scale-up my-8 text-left">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-slate-950/30">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <UserCheck className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-title text-white">Course Registry & Student Load</h3>
                  <p className="text-[10px] font-mono text-slate-400 mt-0.5">{selectedCourseForModal.code} • {selectedCourseForModal.name}</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setViewingRegistrantsCourseId(null);
                  setSelectedCourseForModal(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Info row */}
              <div className="bg-slate-950/40 border border-white/5 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-title">Assigned Leader</span>
                  <span className="text-sm font-bold text-indigo-300 block mt-0.5">{selectedCourseForModal.facultyName || 'Unassigned vacancy'}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-title">Credits / Dept.</span>
                  <span className="text-xs font-semibold text-slate-250 block mt-0.5">{selectedCourseForModal.credits} Term Credits • {selectedCourseForModal.department}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-title">Current Load</span>
                  <span className="text-xs font-mono text-emerald-400 block mt-0.5">
                    {enrollments.filter(e => (e.courseId || e.course_id) === viewingRegistrantsCourseId).length} Enrolled
                  </span>
                </div>
              </div>

              {/* Fast enrollment form inside modal */}
              <div className="border-t border-white/5 pt-4 space-y-3">
                <h4 className="text-xs font-bold font-title uppercase tracking-widest text-emerald-400 flex items-center gap-1.5 pb-2 border-b border-white/5">
                  <PlusCircle className="h-4 w-4" /> Enroll New Student Direct
                </h4>
                <form onSubmit={handleEnrollStudentFromModal} className="flex flex-col sm:flex-row gap-3 items-end">
                  <div className="flex-grow w-full">
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1 font-title">Select Student to Enroll</label>
                    <select
                      required
                      value={courseModalStudentId}
                      onChange={e => setCourseModalStudentId(e.target.value)}
                      className="w-full px-3 py-2.5 text-xs rounded-xl border border-white/10 text-white bg-slate-950 focus:outline-none"
                    >
                      <option value="">-- Select Eligible Student --</option>
                      {students
                        .filter(s => !enrollments.some(e => (e.courseId || e.course_id) === viewingRegistrantsCourseId && (e.studentId || e.student_id) === s.id))
                        .map(s => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.registrationNumber || s.email}) - {s.department || 'No Dept'}
                          </option>
                        ))
                      }
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={isEnrollingModalStudent}
                    className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold font-title uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap font-sans font-bold"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {isEnrollingModalStudent ? 'Enrolling...' : 'Enroll Partner'}
                  </button>
                </form>
              </div>

              {/* Current Registrants table */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold font-title uppercase tracking-widest text-indigo-300 flex items-center gap-1.5 border-b border-white/5 pb-2">
                  <Users className="h-4 w-4 text-indigo-400" /> Currently Enrolled Student Roster
                </h4>
                {enrollments.filter(e => (e.courseId || e.course_id) === viewingRegistrantsCourseId).length === 0 ? (
                  <p className="text-xs text-slate-450 italic text-center py-6 bg-white/5 rounded-xl border border-white/5">No students are currently enrolled in this subject space.</p>
                ) : (
                  <div className="overflow-hidden border border-white/5 rounded-xl bg-slate-950/20 max-h-60 overflow-y-auto">
                    <table className="min-w-full divide-y divide-white/5 text-xs">
                      <thead className="bg-white/5 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left font-bold text-slate-400 font-title uppercase">Student</th>
                          <th className="px-3 py-2 text-center font-bold text-slate-400 font-title uppercase">Grade</th>
                          <th className="px-3 py-2 text-center font-bold text-slate-400 font-title uppercase font-mono">Attendance</th>
                          <th className="px-3 py-2 text-right font-bold text-slate-400 font-title uppercase font-title">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {enrollments
                          .filter(e => (e.courseId || e.course_id) === viewingRegistrantsCourseId)
                          .map(e => (
                            <tr key={e.id} className="hover:bg-white/5">
                              <td className="px-3 py-2.5">
                                <span className="block font-bold text-white font-title">{e.studentName || 'Unknown Student'}</span>
                                <span className="block text-[9px] font-mono text-slate-400 mt-0.5">{e.studentRegistrationNumber || 'N/A'}</span>
                              </td>
                              <td className="px-3 py-2.5 text-center">
                                <span className={`inline-block px-2 py-0.5 text-[10px] font-mono font-bold rounded ${
                                  e.grade === 'A' || e.grade === 'A+' ? 'bg-emerald-500/20 text-emerald-300' :
                                  e.grade === 'F' ? 'bg-rose-500/20 text-rose-350' : 'bg-indigo-500/20 text-indigo-300'
                                }`}>
                                  {e.grade || 'Pending'}
                                </span>
                              </td>
                              <td className="px-3 py-2.5 text-center font-bold font-mono text-slate-350">
                                {e.attendancePercentage !== undefined ? `${e.attendancePercentage}%` : 'N/A'}
                              </td>
                              <td className="px-3 py-2 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleUnenrollStudent(e.id)}
                                  className="px-2 py-1 text-[10px] font-bold font-title bg-rose-500/10 text-rose-450 hover:bg-rose-500/20 border border-rose-500/10 rounded transition cursor-pointer"
                                  title="Unenroll student"
                                >
                                  Unenroll
                                </button>
                              </td>
                            </tr>
                          ))
                        }
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end p-6 border-t border-white/5">
              <button
                type="button"
                onClick={() => {
                  setViewingRegistrantsCourseId(null);
                  setSelectedCourseForModal(null);
                }}
                className="px-5 py-2 text-xs font-bold font-title tracking-wider text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition cursor-pointer"
              >
                CLOSE LOADER
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
