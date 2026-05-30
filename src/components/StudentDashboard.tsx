/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Check, X, BookOpen, GraduationCap, Award, Calendar, Phone, Mail, Clock, PlusCircle,
  CreditCard, Bell, CalendarDays, DollarSign, ArrowRight, CheckCircle2, AlertCircle, Info,
  Upload, Inbox, ExternalLink, FileSpreadsheet, AlertTriangle, Download
} from 'lucide-react';
import { User, Enrollment, Course } from '../types';

interface StudentDashboardProps {
  user: User;
  token: string;
}

interface TimetableItem {
  day: string; // "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday"
  time: string; // e.g., "09:00 AM - 10:30 AM"
  courseCode: string;
  courseName: string;
  instructor: string;
  room: string;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ user, token }) => {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [fees, setFees] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [granularAttendance, setGranularAttendance] = useState<any[]>([]);
  const [examMarks, setExamMarks] = useState<any[]>([]);
  
  // Assignment and coursework states
  const [assignments, setAssignments] = useState<any[]>([]);
  const [selectedSubmittingAssignId, setSelectedSubmittingAssignId] = useState<string | null>(null);
  const [studentSubmissionText, setStudentSubmissionText] = useState('');
  const [studentSubmissionFileUrl, setStudentSubmissionFileUrl] = useState('');
  const [studentSubmissionFileName, setStudentSubmissionFileName] = useState('');
  const [uploadingSubmission, setUploadingSubmission] = useState(false);
  const [studentDragActive, setStudentDragActive] = useState(false);
  
  // Tab control
  const [activeTab, setActiveTab] = useState<'my-courses' | 'attendance' | 'exams-marks' | 'assignments' | 'registration' | 'fees' | 'notifications'>('my-courses');

  // Status indicators
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [payingFeeId, setPayingFeeId] = useState<string | null>(null);

  const triggerAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 4000);
  };

  const loadStudentData = async () => {
    setLoading(true);
    try {
      // Parallelize fetches of student classes, registrations, billing ledgers, notifications, granular attendance, and assignments
      const [eRes, cRes, fRes, nRes, aRes, mRes, asRes] = await Promise.all([
        fetch('/api/student/courses', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/student/available-courses', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/student/fees', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/student/notifications', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/student/attendance', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/student/exams/marks', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/student/assignments', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (eRes.ok) {
        const eData = await eRes.json();
        setEnrollments(eData.enrollments);
      }
      if (cRes.ok) {
        const cData = await cRes.json();
        setAvailableCourses(cData.courses);
      }
      if (fRes.ok) {
        const fData = await fRes.json();
        setFees(fData.fees || []);
      }
      if (nRes.ok) {
        const nData = await nRes.json();
        setNotifications(nData.notifications || []);
      }
      if (aRes.ok) {
        const aData = await aRes.json();
        setGranularAttendance(aData.attendance || []);
      }
      if (mRes.ok) {
        const mData = await mRes.json();
        setExamMarks(mData.marks || []);
      }
      if (asRes.ok) {
        const asData = await asRes.json();
        setAssignments(asData.assignments || []);
      }
    } catch (err) {
      console.error(err);
      triggerAlert('error', 'Failed loading academic records, fee rosters, or campus channels.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudentData();
  }, []);

  const handleSelfEnroll = async (courseId: string) => {
    try {
      const res = await fetch('/api/student/enroll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ course_id: courseId })
      });
      const data = await res.json();
      if (res.ok) {
        triggerAlert('success', 'You have successfully signed up for this course!');
        loadStudentData(); // Refresh all datasets
      } else {
        triggerAlert('error', data.message || 'Self registration collapsed.');
      }
    } catch (err: any) {
      triggerAlert('error', err.toString());
    }
  };

  const handlePayFee = async (feeId: string) => {
    setPayingFeeId(feeId);
    try {
      const res = await fetch(`/api/student/fees/${feeId}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        triggerAlert('success', 'Fee invoice settled successfully! (Simulation Approved)');
        loadStudentData(); // Refresh finances & notify arrays
      } else {
        triggerAlert('error', data.message || 'Payment simulation failed.');
      }
    } catch (err: any) {
      triggerAlert('error', err.toString());
    } finally {
      setPayingFeeId(null);
    }
  };

  const downloadReceipt = (fee: any) => {
    const isPaid = fee.status === 'PAID';
    const documentTitle = isPaid ? 'OFFICIAL_RECEIPT' : 'INVOICE_BILLING';
    const cleanDate = (dateStr: string) => dateStr ? new Date(dateStr).toLocaleDateString() : 'N/A';
    
    const content = `=========================================================
               ACADEMIC PORTAL INTELLECT
               OFFICIAL FINANCIAL SERVICE GATEWAY
=========================================================

DOCUMENT TYPE: \t${isPaid ? 'OFFICIAL COMPLIANCE PAYMENT RECEIPT' : 'PENDING TUITION DEBT ACCOUNT STATEMENT'}
DOCUMENT REF:  \t${fee.id}
DATE GENERATED:\t${new Date().toLocaleDateString()}
CURRENCY:      \tUSD ($)

----------------------- DEBTOR DETAIL ------------------
STUDENT COHORT MIGRATED ACCOUNT
REGISTRATION:  \t${user?.registrationNumber || 'N/A'}
STUDENT NAME:  \t${user?.name || 'Academic Student'}
STATUS:        \tACTIVE ENROLLMENT

----------------------- BILL PARTICULARS ------------------
FEE ITEM:      \t${fee.title}
FEE CATEGORY:  \t${fee.category || 'ACADEMIC ASSESSMENT'}
DUE DEADLINE:  \t${cleanDate(fee.dueDate)}
ORIGINAL AMOUNT:\t$${Number(fee.amount).toFixed(2)}

----------------------- PAYMENT PARTICULARS ---------------
TOTAL COLLECTED:\t$${Number(fee.amountPaid || 0).toFixed(2)}
REMAINING DEBT: \t$${(Number(fee.amount) - Number(fee.amountPaid || 0)).toFixed(2)}
SETTLEMENT DATE:\t${fee.paidAt ? cleanDate(fee.paidAt) : 'PENDING UNTIL CLEARANCE'}
PAYMENT STATUS: \t${fee.status}

-------------------- SECURE BANKING VERIFICATION ---------------
AUTHENTICATION HASH:\t0x${Math.random().toString(16).substr(2, 12).toUpperCase()}
INTEREST ACCRUED:   \t$0.00
TREASURY SEAL:      \t[ VERIFIED DIGITAL COMPLIANCE ACCOUNT ]

=========================================================
This is a secure machine-generated financial document. 
No signature is required. Contact academic treasury 
support for query inquiries.
=========================================================`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${documentTitle}_${fee.id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleStudentFileUpload = (file: File) => {
    setUploadingSubmission(true);
    setStudentSubmissionFileName(file.name);
    setTimeout(() => {
      setUploadingSubmission(false);
      const cleanName = encodeURIComponent(file.name.replace(/\s+/g, '_'));
      const mockUrl = `https://storage.university.edu/student-work/${cleanName}`;
      setStudentSubmissionFileUrl(mockUrl);
      triggerAlert('success', `Submission attachment "${file.name}" ready to hand in.`);
    }, 1200);
  };

  const handleStudentDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setStudentDragActive(true);
    } else if (e.type === "dragleave") {
      setStudentDragActive(false);
    }
  };

  const handleStudentDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setStudentDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleStudentFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleStudentFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleStudentFileUpload(e.target.files[0]);
    }
  };

  const handleHomeworkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmittingAssignId) return;
    try {
      const res = await fetch(`/api/student/assignments/${selectedSubmittingAssignId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          submissionText: studentSubmissionText,
          fileUrl: studentSubmissionFileUrl
        })
      });
      const data = await res.json();
      if (res.ok) {
        triggerAlert('success', 'Your homework submission has been submitted.');
        setSelectedSubmittingAssignId(null);
        setStudentSubmissionText('');
        setStudentSubmissionFileUrl('');
        setStudentSubmissionFileName('');
        loadStudentData(); // Refresh list to reflect submitted status!
      } else {
        triggerAlert('error', data.message || 'Error submitting coursework');
      }
    } catch (err: any) {
      triggerAlert('error', err.toString());
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/student/notifications/${id}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        // Optimistically update notifications list locally
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      } else {
        triggerAlert('error', 'Failed setting read status.');
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  // Metric Calculation helpers
  const totalEnrolledCredits = enrollments.reduce((sum, e) => sum + (e.credits || 0), 0);
  
  // Calculated completed credits (where grade is not pending and not F)
  const completedCredits = enrollments
    .filter(e => e.grade && e.grade !== 'Pending' && e.grade !== 'F')
    .reduce((sum, e) => sum + (e.credits || 0), 0);

  // Overall Attendance Percentage
  const overallAttendance = enrollments.length > 0
    ? Number((enrollments.reduce((sum, e) => sum + (e.attendancePercentage || 0), 0) / enrollments.length).toFixed(1))
    : 100;

  // Simple GPA index helper
  const getGpaPoints = (grade: string): number => {
    switch (grade) {
      case 'A+': return 4.0;
      case 'A': return 4.0;
      case 'B+': return 3.5;
      case 'B': return 3.0;
      case 'C+': return 2.5;
      case 'C': return 2.0;
      case 'D': return 1.0;
      case 'F': return 0.0;
      default: return -1; // Pending
    }
  };

  const getCalculatedGpa = () => {
    const gradedList = enrollments.filter(e => e.grade && e.grade !== 'Pending');
    if (gradedList.length === 0) return '0.00';
    let totalPoints = 0;
    let totalCreds = 0;
    gradedList.forEach(e => {
      const pts = getGpaPoints(e.grade!);
      if (pts !== -1) {
        totalPoints += pts * (e.credits || 3);
        totalCreds += (e.credits || 3);
      }
    });
    return totalCreds > 0 ? (totalPoints / totalCreds).toFixed(2) : '0.00';
  };

  // Finance summaries
  const outstandingBal = fees
    .filter(f => f.status === 'UNPAID' || f.status === 'OVERDUE')
    .reduce((sum, f) => sum + Number(f.amount || 0), 0);

  // Unread announcements / notifications count
  const unreadNotifCount = notifications.filter(n => !n.isRead).length;

  // Generate deterministic class schedule timetable
  const getWeeklyTimetable = (enrollList: Enrollment[]): TimetableItem[] => {
    const items: TimetableItem[] = [];
    enrollList.forEach((e, idx) => {
      const code = e.courseCode || 'GEN101';
      const cName = e.courseName || 'Selected Academic Component';
      const codeHash = code.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      
      // Select two weekdays for each subject (e.g. Tuesday & Thursday or Monday & Wednesday)
      const primaryDayIdx = codeHash % 5; // (0: Mon, 1: Tue, 2: Wed, 3: Thu, 4: Fri)
      const secondaryDayIdx = (primaryDayIdx + 2) % 5;
      
      const slots = [
        "09:00 AM - 10:30 AM",
        "10:45 AM - 12:15 PM",
        "01:00 PM - 02:30 PM",
        "02:45 PM - 04:15 PM"
      ];
      const time = slots[(codeHash + idx) % slots.length];
      const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
      const prof = (e as any).facultyName || 'Professor Assigned';
      const room = `Hall ${100 + (codeHash % 12)}`;

      items.push({
        day: days[primaryDayIdx],
        time,
        courseCode: code,
        courseName: cName,
        instructor: prof,
        room
      });

      items.push({
        day: days[secondaryDayIdx],
        time,
        courseCode: code,
        courseName: cName,
        instructor: prof,
        room
      });
    });
    return items;
  };

  const timetable = getWeeklyTimetable(enrollments);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10 text-left">
      {/* Alert Banner */}
      {alert && (
        <div id="student-alert" className={`fixed bottom-6 right-6 p-4 rounded-xl shadow-lg border text-sm font-semibold backdrop-blur-xl transition-all duration-300 z-50 flex items-center gap-2 ${
          alert.type === 'success' 
            ? 'bg-emerald-500/10 text-emerald-305 border-emerald-500/20' 
            : 'bg-rose-500/10 text-rose-300 border-rose-500/20'
        }`}>
          {alert.type === 'success' ? <Check className="h-5 w-5 text-emerald-400" /> : <X className="h-5 w-5 text-rose-400" />}
          {alert.message}
        </div>
      )}

      {/* Profile Header Header Box */}
      <div className="backdrop-blur-md bg-slate-900/60 rounded-3xl border border-white/10 p-6 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 h-40 w-40 bg-indigo-500/10 rounded-full translate-x-12 -translate-y-12 blur-xl animate-pulse"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/20">
              <GraduationCap className="h-9 w-9 stroke-[1.6]" />
            </div>
            <div>
              <span className="block text-[10px] font-mono font-bold text-indigo-300 uppercase tracking-widest leading-none">
                Academic Student Record Profile
              </span>
              <h2 className="text-2xl font-bold font-title text-white mt-1 leading-none">
                {user.name}
              </h2>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className="inline-block text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full font-title uppercase tracking-wide border border-emerald-500/20">
                  {user.department || 'General Curriculum'}
                </span>
                <span className="inline-block text-[10px] font-mono font-semibold text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded-full uppercase tracking-wide border border-indigo-500/20">
                  ID: {user.registrationNumber || 'STU-RECORD-PENDING'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs font-mono font-semibold text-slate-300 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-indigo-400" />
              <span>{user.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-indigo-400" />
              <span>{user.phone || 'No Contact Listed'}</span>
            </div>
            <div className="flex items-center gap-2 sm:col-span-2">
              <Clock className="h-4 w-4 text-indigo-400" />
              <span>Admitted Term: {new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}</span>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500 border-t-transparent"></div>
          <span className="text-xs font-mono text-slate-400">Loading comprehensive academic, balance, and notification datatrees...</span>
        </div>
      ) : (
        <div className="space-y-8 animate-fade-in">
          {/* Top academic summary metrics cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="backdrop-blur-md bg-slate-900/40 p-5 rounded-3xl border border-white/10 shadow-lg">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-title">Enrolled Academic Course Count</span>
                  <h2 className="text-2xl font-bold font-title text-white mt-1 font-sans">{enrollments.length} Modules <span className="text-xs text-slate-400">({totalEnrolledCredits} Cr)</span></h2>
                </div>
                <div className="p-2.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl">
                  <BookOpen className="h-5 w-5" />
                </div>
              </div>
            </div>

            <div className="backdrop-blur-md bg-slate-900/40 p-5 rounded-3xl border border-white/10 shadow-lg">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-title font-title">Cumulative Academics GPA</span>
                  <h2 className="text-2xl font-bold font-title text-emerald-400 mt-1 font-sans">
                    {getCalculatedGpa()} <span className="text-xs text-slate-400">/ 4.00</span>
                  </h2>
                </div>
                <div className="p-2.5 bg-emerald-500/10 text-emerald-405 border border-emerald-500/20 rounded-xl">
                  <Award className="h-5 w-5" />
                </div>
              </div>
            </div>

            <div className="backdrop-blur-md bg-slate-900/40 p-5 rounded-3xl border border-white/10 shadow-lg">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-title">Term Attendance Average</span>
                  <h2 className="text-2xl font-bold font-title text-cyan-400 mt-1 font-sans">{overallAttendance}%</h2>
                </div>
                <div className="p-2.5 bg-cyan-500/10 text-cyan-400 border border-cyan-520/20 rounded-xl">
                  <Clock className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-2 text-[9px] font-semibold font-mono text-slate-400 flex items-center gap-1">
                {overallAttendance < 75 ? (
                  <span className="text-rose-400 flex items-center gap-1">⚠️ Deficit! Min 75% required</span>
                ) : (
                  <span className="text-emerald-400 flex items-center gap-1">✓ Clear. Standard approved status</span>
                )}
              </div>
            </div>

            <div className="backdrop-blur-md bg-slate-900/40 p-5 rounded-3xl border border-white/10 shadow-lg">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-title">Outstanding Fee Balance</span>
                  <h2 className="text-2xl font-bold font-title mt-1 font-sans text-rose-400">
                    ${outstandingBal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </h2>
                </div>
                <div className="p-2.5 bg-rose-500/10 text-rose-450 border border-rose-500/20 rounded-xl">
                  <DollarSign className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-2 text-[9px] font-semibold font-mono text-slate-400">
                {outstandingBal > 0 ? (
                  <span className="text-amber-400">Pending invoice settlement due</span>
                ) : (
                  <span className="text-emerald-400">No active balance due</span>
                )}
              </div>
            </div>
          </div>

          {/* Subnavigation choices */}
          <div className="flex items-center justify-between border-b border-white/10 pb-2 flex-wrap gap-4">
            <div className="flex flex-wrap gap-4 leading-none">
              <button
                id="btn-tab-my-courses"
                onClick={() => setActiveTab('my-courses')}
                className={`pb-4 text-xs font-bold font-title tracking-wider uppercase border-b-2 transition-all duration-150 cursor-pointer ${
                  activeTab === 'my-courses' 
                    ? 'border-indigo-500 text-indigo-300' 
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Courses & Timetable
              </button>
              <button
                id="btn-tab-attendance"
                onClick={() => setActiveTab('attendance')}
                className={`pb-4 text-xs font-bold font-title tracking-wider uppercase border-b-2 transition-all duration-150 cursor-pointer ${
                  activeTab === 'attendance' 
                    ? 'border-indigo-505 text-indigo-300' 
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Attendance Reports
              </button>
              <button
                id="btn-tab-exams-marks"
                onClick={() => setActiveTab('exams-marks')}
                className={`pb-4 text-xs font-bold font-title tracking-wider uppercase border-b-2 transition-all duration-150 cursor-pointer ${
                  activeTab === 'exams-marks' 
                    ? 'border-indigo-500 text-indigo-300' 
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Exams & Academic Marks
              </button>
              <button
                id="btn-tab-assignments"
                onClick={() => setActiveTab('assignments')}
                className={`pb-4 text-xs font-bold font-title tracking-wider uppercase border-b-2 transition-all duration-150 cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'assignments' 
                    ? 'border-indigo-500 text-indigo-300' 
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Coursework & Assignments
                {assignments.filter(a => !a.submissionId).length > 0 && (
                  <span className="px-1.5 py-0.5 text-[9px] bg-indigo-600 text-white rounded-full font-mono font-bold animate-pulse">
                    {assignments.filter(a => !a.submissionId).length}
                  </span>
                )}
              </button>
              <button
                id="btn-tab-registration"
                onClick={() => setActiveTab('registration')}
                className={`pb-4 text-xs font-bold font-title tracking-wider uppercase border-b-2 transition-all duration-150 cursor-pointer ${
                  activeTab === 'registration' 
                    ? 'border-indigo-500 text-indigo-300' 
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Self Registration
              </button>
              <button
                id="btn-tab-fees"
                onClick={() => setActiveTab('fees')}
                className={`pb-4 text-xs font-bold font-title tracking-wider uppercase border-b-2 transition-all duration-150 cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'fees' 
                    ? 'border-indigo-500 text-indigo-300' 
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Invoices & Finances 
                {outstandingBal > 0 && <span className="h-1.5 w-1.5 rounded-full bg-rose-550 animate-ping"></span>}
              </button>
              <button
                id="btn-tab-notifications"
                onClick={() => setActiveTab('notifications')}
                className={`pb-4 text-xs font-bold font-title tracking-wider uppercase border-b-2 transition-all duration-150 cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'notifications' 
                    ? 'border-indigo-500 text-indigo-300' 
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Campus Bulletins
                {unreadNotifCount > 0 && (
                  <span className="px-1.5 py-0.5 text-[9px] font-mono leading-none font-bold rounded bg-indigo-505 text-indigo-200 border border-indigo-500/30">
                    {unreadNotifCount}
                  </span>
                )}
              </button>
            </div>
            <span className="text-[10px] font-mono text-slate-400 pb-2">
              Academic Standing: Approved (Satisfactory Progress)
            </span>
          </div>

          {/* ======================= TAB: ENROLLED CLASSES & TIMETABLE ======================= */}
          {activeTab === 'my-courses' && (
            <div className="space-y-8 animate-fade-in">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                    Term Registered Course Loads
                  </h3>
                </div>

                {enrollments.length === 0 ? (
                  <div className="text-center py-16 backdrop-blur-md bg-white/5 rounded-3xl border border-white/10 p-6">
                    <BookOpen className="h-10 w-10 text-indigo-400 mx-auto mb-3" />
                    <h3 className="text-base font-bold font-title text-slate-200">You are not registered in any classes yet</h3>
                    <p className="text-xs text-slate-450 max-w-sm mx-auto mt-1 font-sans">
                      Enroll yourself in active course modules via the course self-registration portal.
                    </p>
                    <button
                      onClick={() => setActiveTab('registration')}
                      className="mt-5 px-4 py-2 bg-indigo-600 hover:bg-indigo-505 border border-indigo-705 text-white rounded-xl text-xs font-bold transition-all hover:shadow-lg hover:shadow-indigo-950/40 active:scale-95 cursor-pointer leading-tight uppercase font-title font-bold tracking-wider"
                    >
                      Browse Available Courses
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {enrollments.map(e => (
                      <div key={e.id} className="backdrop-blur-md bg-slate-900/40 border border-white/10 rounded-3xl p-5 flex flex-col justify-between hover:border-white/20 transition-all shadow-xl">
                        <div>
                          <div className="flex justify-between items-start">
                            <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-3 w-fit font-bold font-mono text-[10px] border border-indigo-500/20 rounded uppercase tracking-wider">
                              {e.courseCode}
                            </span>
                            <span className="text-xs font-semibold text-slate-300 bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-lg font-title">
                              {e.credits} Credits
                            </span>
                          </div>

                          <h4 className="text-base font-extrabold text-white font-title mt-4 tracking-tight leading-snug">
                            {e.courseName}
                          </h4>

                          <span className="block text-xs text-slate-400 mt-2 font-medium font-sans">
                            Instructor: <span className="font-semibold text-slate-210 font-title">Professor {(e as any).facultyName || 'Unassigned'}</span>
                          </span>
                        </div>

                        {/* Attendance & Grades Summary block */}
                        <div className="grid grid-cols-2 gap-4 border-t border-white/5 mt-6 pt-4 bg-slate-950/20 -mx-5 -mb-5 p-4 rounded-b-3xl">
                          <div className="text-left">
                            <span className="block text-[10px] text-slate-400 font-semibold uppercase tracking-wider font-title">Attendance Index</span>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="font-mono font-bold text-white text-sm">{e.attendancePercentage !== undefined ? `${e.attendancePercentage}%` : 'N/A'}</span>
                              <span className={`inline-block w-2 h-2 rounded-full ${
                                (e.attendancePercentage || 0) < 75 ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'
                              }`} title={(e.attendancePercentage || 0) < 75 ? 'Attendance Deficit!' : 'Approved'}></span>
                            </div>
                          </div>

                          <div className="text-right border-l border-white/10 pl-4">
                            <span className="block text-[10px] text-slate-400 font-semibold uppercase tracking-wider font-title">Academic Score</span>
                            <span className={`inline-flex px-3 py-0.5 mt-1.5 rounded-md font-mono font-bold text-xs uppercase tracking-wide leading-none ${
                              e.grade === 'Pending' 
                                ? 'bg-slate-800 text-slate-400 border border-white/5' 
                                : ['A', 'A+', 'B', 'B+'].includes(e.grade || '') 
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/10' 
                                : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/10'
                            }`}>
                              {e.grade || 'Pending'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* WEEKLY CLASS SCHEDULE PLANNER TIMETABLE GRID */}
              {enrollments.length > 0 && (
                <div className="backdrop-blur-md bg-slate-900/60 border border-white/10 rounded-3xl p-6 shadow-xl">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      <CalendarDays className="h-5 w-5 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold font-title text-white">Academic Classroom Timetable</h3>
                      <p className="text-[11px] text-slate-400 font-sans mt-0.5">Automated class block scheduler derived from registered course slots</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map(dayName => {
                      const dayClasses = timetable.filter(item => item.day === dayName).sort((a,b) => a.time.localeCompare(b.time));
                      return (
                        <div key={dayName} className="bg-slate-950/40 rounded-2xl p-4 border border-white/5 flex flex-col justify-between h-full gap-4">
                          <div>
                            <span className="block text-xs font-bold font-title text-indigo-400 uppercase tracking-widest border-b border-white/5 pb-2 mb-2">
                              {dayName}
                            </span>
                            {dayClasses.length === 0 ? (
                              <p className="text-[10px] text-slate-540 italic py-6 text-center font-sans">No Lectures</p>
                            ) : (
                              <div className="space-y-2.5">
                                {dayClasses.map((cl, sIdx) => (
                                  <div key={sIdx} className="p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/10 text-left">
                                    <span className="block text-[9px] font-mono text-slate-350 font-bold leading-none">{cl.time}</span>
                                    <span className="block text-xs font-extrabold text-white font-title mt-2 leading-tight">{cl.courseCode}</span>
                                    <span className="block text-[10px] text-indigo-200 truncate mt-0.5" title={cl.courseName}>{cl.courseName}</span>
                                    <span className="block text-[9px] text-slate-400 mt-1.5 text-right font-mono italic">{cl.room}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          {dayClasses.length > 0 && (
                            <div className="text-[8px] font-mono text-slate-400 border-t border-white/5 pt-1 text-center">
                              {dayClasses.length} sessions active
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ======================= TAB: ATTENDANCE DETAILED LOGS ======================= */}
          {activeTab === 'attendance' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-slate-900/40 border border-white/10 rounded-3xl p-6 backdrop-blur-md">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Clock className="h-5 w-5 text-indigo-400" /> Detail Attendance Transcript
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">Review lecture-by-lecture attendance checkpoints recorded by faculty including class remarks.</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 p-4 rounded-2xl bg-slate-950/20 border border-white/5">
                  <div className="text-left">
                    <span className="block text-[9px] text-slate-400 uppercase tracking-widest font-mono">Present Count</span>
                    <span className="block text-xl font-bold font-mono text-emerald-400 mt-0.5">
                      {granularAttendance.filter(a => a.status === 'PRESENT').length} Days
                    </span>
                  </div>
                  <div className="text-left">
                    <span className="block text-[9px] text-slate-400 uppercase tracking-widest font-mono">Late Entries</span>
                    <span className="block text-xl font-bold font-mono text-amber-400 mt-0.5">
                      {granularAttendance.filter(a => a.status === 'LATE').length} Days
                    </span>
                  </div>
                  <div className="text-left">
                    <span className="block text-[9px] text-slate-400 uppercase tracking-widest font-mono">Excused Slips</span>
                    <span className="block text-xl font-bold font-mono text-cyan-400 mt-0.5">
                      {granularAttendance.filter(a => a.status === 'EXCUSED').length} Days
                    </span>
                  </div>
                  <div className="text-left">
                    <span className="block text-[9px] text-slate-400 uppercase tracking-widest font-mono">Absent Flags</span>
                    <span className={`block text-xl font-bold font-mono mt-0.5 ${granularAttendance.filter(a => a.status === 'ABSENT').length > 3 ? 'text-rose-500' : 'text-slate-400'}`}>
                      {granularAttendance.filter(a => a.status === 'ABSENT').length} Days
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto border border-white/10 rounded-2xl bg-slate-950/40 mt-6">
                  <table className="min-w-full divide-y divide-white/10">
                    <thead className="bg-[#0f172a]/80 text-[#94a3b8] text-[10px] font-mono tracking-wider uppercase">
                      <tr>
                        <th className="px-6 py-4 text-left font-bold">Allocated Course Details</th>
                        <th className="px-6 py-4 text-center font-bold">Lecture Date</th>
                        <th className="px-6 py-4 text-center font-bold">Status Badge</th>
                        <th className="px-6 py-4 text-left font-bold">Assigned Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                      {granularAttendance.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-12 text-center text-slate-500 font-bold">
                            No individual lecture attendance logs have been published yet.
                          </td>
                        </tr>
                      ) : (
                        granularAttendance.map((rec, i) => {
                          let badgeBg = 'bg-emerald-500/10 text-emerald-350 border-emerald-500/20';
                          if (rec.status === 'ABSENT') badgeBg = 'bg-rose-500/10 text-rose-350 border-rose-500/20';
                          if (rec.status === 'LATE') badgeBg = 'bg-amber-500/10 text-amber-350 border-amber-500/20';
                          if (rec.status === 'EXCUSED') badgeBg = 'bg-cyan-500/10 text-cyan-350 border-cyan-500/20';

                          return (
                            <tr key={rec.id || i} className="hover:bg-white/2 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap text-left">
                                <span className="font-bold text-white block">{rec.courseName}</span>
                                <span className="text-[10px] text-indigo-300 font-mono mt-0.5 block uppercase tracking-wide">{rec.courseCode}</span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center font-mono font-semibold text-slate-400">
                                {new Date(rec.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold font-mono uppercase tracking-widest border ${badgeBg}`}>
                                  {rec.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-left font-medium text-slate-350">
                                {rec.remarks || (
                                  <span className="text-slate-500 italic font-normal">Regular on-time record log</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ======================= TAB: EXAMS & MARKS DETAILED LOGS ======================= */}
          {activeTab === 'exams-marks' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-slate-900/40 border border-white/10 rounded-3xl p-6 backdrop-blur-md">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                       <GraduationCap className="h-5 w-5 text-indigo-400" /> Syllabus Examinations Log & Grades
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Check your continuous evaluation scores, mock practicals, semester midterms, and official finals published by instructors.
                    </p>
                  </div>
                </div>

                {/* Score Summary Metrics Grid */}
                {(() => {
                  const gradedExams = examMarks.length;
                  let gainedSum = 0;
                  let maxSum = 0;
                  let passedExams = 0;

                  examMarks.forEach(m => {
                    gainedSum += m.obtainedMarks;
                    maxSum += m.maxMarks;
                    if (m.obtainedMarks >= (m.maxMarks * 0.5)) {
                      passedExams++;
                    }
                  });

                  const overallScorePct = maxSum > 0 ? (gainedSum / maxSum) * 100 : 0;
                  const overallPassRate = gradedExams > 0 ? (passedExams / gradedExams) * 100 : 0;

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 p-4 rounded-2xl bg-slate-950/20 border border-white/5 font-mono">
                      <div className="text-left p-4 rounded-xl bg-white/5 border border-white/5">
                        <span className="block text-[9px] text-indigo-300 uppercase tracking-widest font-bold">Assessments Released</span>
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className="text-2xl font-bold font-title text-white">{gradedExams}</span>
                          <span className="text-[10px] text-slate-500 font-normal">exams graded</span>
                        </div>
                      </div>
                      <div className="text-left p-4 rounded-xl bg-white/5 border border-white/5">
                        <span className="block text-[9px] text-emerald-400 uppercase tracking-widest font-bold">Average Credit Score</span>
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className="text-2xl font-bold font-title text-emerald-400">
                            {overallScorePct > 0 ? `${overallScorePct.toFixed(1)}%` : '0.0%'}
                          </span>
                          <span className="text-[10px] text-slate-500 font-normal">weighted avg</span>
                        </div>
                      </div>
                      <div className="text-left p-4 rounded-xl bg-white/5 border border-white/5">
                        <span className="block text-[9px] text-indigo-300 uppercase tracking-widest font-bold">Course Clearance Ratio</span>
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className="text-2xl font-bold font-title text-white">
                            {overallPassRate > 0 ? `${overallPassRate.toFixed(1)}%` : '0.0%'}
                          </span>
                          <span className="text-[10px] text-slate-500 font-normal">pass indicator</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Exams List Table */}
                <div className="mt-6 overflow-x-auto border border-white/10 rounded-2xl bg-slate-950/25">
                  <table className="min-w-full divide-y divide-white/5 text-xs text-left">
                    <thead className="bg-slate-900/80 text-slate-400 text-[9px] font-mono uppercase font-bold tracking-wider">
                      <tr>
                        <th className="px-6 py-4">Course Syllabus Block</th>
                        <th className="px-6 py-4">Assigned Exam Title</th>
                        <th className="px-6 py-4 text-center">Format</th>
                        <th className="px-6 py-4 text-center">Score Sheet</th>
                        <th className="px-6 py-4 text-center">Credit GP</th>
                        <th className="px-6 py-4">Evaluator Comments</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-sans">
                      {examMarks.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-semibold italic">
                            No published grading sheets or evaluation records found for this registration.
                          </td>
                        </tr>
                      ) : (
                        examMarks.map(m => {
                          const percent = (m.obtainedMarks / m.maxMarks) * 100;
                          let barColor = 'bg-emerald-500';
                          let textColor = 'text-emerald-400';
                          if (percent < 50) {
                            barColor = 'bg-rose-550';
                            textColor = 'text-rose-400';
                          } else if (percent < 75) {
                            barColor = 'bg-amber-500';
                            textColor = 'text-amber-400';
                          }

                          return (
                            <tr key={m.id} className="hover:bg-white/5 transition duration-105">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="block font-bold text-white">{m.courseName}</span>
                                <span className="block font-mono text-[9px] text-indigo-300 mt-0.5">{m.courseCode}</span>
                              </td>
                              <td className="px-6 py-4">
                                <span className="font-bold text-slate-200">{m.examTitle}</span>
                              </td>
                              <td className="px-6 py-4 text-center whitespace-nowrap">
                                <span className="px-2 py-0.5 rounded font-mono text-[9px] bg-white/5 text-slate-400 border border-white/5 font-semibold">
                                  {m.examType}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-center whitespace-nowrap">
                                <div className="inline-block text-left">
                                  <div className="flex items-center gap-1.5 justify-center">
                                    <span className={`font-mono font-black text-sm ${textColor}`}>
                                      {m.obtainedMarks}
                                    </span>
                                    <span className="text-[10px] text-slate-500 font-mono">/ {m.maxMarks}</span>
                                  </div>
                                  <div className="w-24 bg-white/5 h-1 md:h-1.5 rounded-full mt-1.5 overflow-hidden">
                                    <div className={`h-full ${barColor}`} style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}></div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-center whitespace-nowrap">
                                <span className="font-mono font-bold text-indigo-300 bg-indigo-500/10 border border-indigo-500/15 px-2.5 py-1 rounded-lg">
                                  {Number(m.gradePoint || 0).toFixed(1)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-normal max-w-xs">
                                <p className="text-slate-400 leading-normal text-xs">
                                  {m.remarks || <span className="text-slate-500 italic leading-none font-light">None parsed</span>}
                                </p>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ======================= TAB: COURSEWORK & ASSIGNMENTS ======================= */}
          {activeTab === 'assignments' && (
            <div className="space-y-6 animate-fade-in text-left">
              <div className="bg-slate-900/40 border border-white/10 rounded-3xl p-6 backdrop-blur-md">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <FileSpreadsheet className="h-5 w-5 text-indigo-400" /> Syllabus Coursework & Assignments
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Access referenced lecture materials, check upcoming homework deadlines, upload solution files, and review evaluated submission sheets.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
                  {/* Left Side: Assignment Timeline Catalog */}
                  <div className={`${selectedSubmittingAssignId ? 'lg:col-span-6' : 'lg:col-span-12'} space-y-4`}>
                    <label className="block text-[10px] text-indigo-300 font-bold font-mono uppercase tracking-widest">Available Tasks Plan</label>
                    
                    {assignments.length === 0 ? (
                      <div className="text-center py-12 bg-slate-950/20 rounded-2xl border border-white/5 p-6">
                        <Inbox className="h-10 w-10 text-slate-600 mx-auto mb-3 animate-bounce" />
                        <h4 className="text-sm font-bold text-slate-300">No Coursework Assigned</h4>
                        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">None of your registered classes have published coursework pages or homework packets yet.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4">
                        {assignments.map(a => {
                          const isOverdue = new Date() > new Date(a.dueDate);
                          const isSubmitted = !!a.submissionId;
                          const isGraded = a.score !== null && a.score !== undefined;
                          
                          return (
                            <div 
                              key={a.id} 
                              className={`p-5 rounded-2xl border transition duration-150 relative overflow-hidden ${
                                selectedSubmittingAssignId === a.id
                                  ? 'border-indigo-500 bg-indigo-950/25 shadow-lg shadow-indigo-950/20'
                                  : 'border-white/5 bg-slate-950/30 hover:border-white/10 hover:bg-slate-950/50'
                              }`}
                            >
                              <div className="flex justify-between items-start gap-4">
                                <div className="space-y-1">
                                  <span className="inline-block px-2.5 py-0.5 rounded font-mono text-[9px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/15 font-semibold">
                                    {a.courseCode} — {a.courseName}
                                  </span>
                                  <h4 className="text-sm font-bold text-white mt-1.5">{a.title}</h4>
                                </div>

                                <div className="text-right flex flex-col items-end gap-1.5">
                                  {isGraded ? (
                                    <div className="flex items-center gap-1">
                                      <span className="text-xs text-slate-400 font-mono">Score:</span>
                                      <span className="px-2 py-0.5 rounded font-mono text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 font-extrabold">
                                        {a.score} / {a.maxScore}
                                      </span>
                                    </div>
                                  ) : isSubmitted ? (
                                    <span className="px-2 py-0.5 rounded font-mono text-[9px] bg-amber-500/15 text-amber-300 border border-amber-500/20 font-bold flex items-center gap-1">
                                      <Check className="h-3 w-3" /> Submitted
                                    </span>
                                  ) : isOverdue ? (
                                    <span className="px-2 py-0.5 rounded font-mono text-[9px] bg-rose-500/15 text-rose-400 border border-rose-500/20 font-bold flex items-center gap-1">
                                      <AlertTriangle className="h-3 w-3 animate-pulse" /> Overdue
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded font-mono text-[9px] bg-slate-800 text-slate-350 border border-white/5 font-semibold">
                                      Pending Work
                                    </span>
                                  )}
                                  
                                  <span className="text-[9px] font-mono text-slate-400 block">
                                    Due: {new Date(a.dueDate).toLocaleDateString()} at {new Date(a.dueDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                  </span>
                                </div>
                              </div>

                              {a.description && (
                                <p className="text-xs mt-2.5 text-slate-300 leading-relaxed max-w-2xl font-light">
                                  {a.description}
                                </p>
                              )}

                              {a.materialUrl && (
                                <div className="mt-3.5 pt-3 border-t border-white/5 flex items-center justify-between flex-wrap gap-2 text-left">
                                  <div className="flex items-center gap-2">
                                    <FileSpreadsheet className="h-4 w-4 text-indigo-400" />
                                    <span className="text-[10px] text-slate-300 font-medium">Assigned reference guidelines & materials sheet:</span>
                                  </div>
                                  <a 
                                    href={a.materialUrl} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="px-3 py-1 bg-white/5 rounded-xl text-[10px] font-mono text-indigo-300 border border-white/5 hover:border-white/10 hover:text-white flex items-center gap-1 cursor-pointer transition shadow-sm"
                                  >
                                    <ExternalLink className="h-3.5 w-3.5 shrink-0" /> Launch Material Doc
                                  </a>
                                </div>
                              )}

                              {isSubmitted && (
                                <div className="mt-4 p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-2.5 text-xs text-left">
                                  <div className="flex justify-between border-b border-white/5 pb-1.5 text-[10px] font-mono text-indigo-300">
                                    <span>YOUR HAND-IN WORK</span>
                                    <span>Submitted: {a.submittedAt ? new Date(a.submittedAt).toLocaleDateString() : 'Pending'}</span>
                                  </div>
                                  {a.submissionText && (
                                    <p className="text-slate-300 font-mono whitespace-pre-wrap leading-relaxed text-[11px] bg-slate-950/20 p-2.5 border border-white/5 rounded-xl">
                                      {a.submissionText}
                                    </p>
                                  )}
                                  {a.submissionFileUrl && (
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono text-[10px] text-slate-400">Attached solution file:</span>
                                      <a 
                                        href={a.submissionFileUrl} 
                                        target="_blank" 
                                        rel="noreferrer" 
                                        className="text-[10px] text-indigo-400 hover:underline flex items-center gap-0.5 font-mono cursor-pointer"
                                      >
                                        <ExternalLink className="h-2.5 w-2.5" /> preview_sheet.pdf
                                      </a>
                                    </div>
                                  )}
                                  
                                  {isGraded && (
                                    <div className="mt-3 pt-2.5 border-t border-white/5 space-y-1">
                                      <div className="flex items-center gap-1.5">
                                        <Award className="h-4 w-4 text-emerald-400 shrink-0" />
                                        <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wide">Instructor Assessment & Notes:</span>
                                      </div>
                                      <p className="text-slate-300 italic pl-5 text-xs leading-normal">
                                        "{a.feedback || 'Excellent layout, complete submission criteria successfully satisfied.'}"
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}

                              {!isSubmitted && (
                                <div className="mt-4 flex justify-end">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedSubmittingAssignId(a.id);
                                      setStudentSubmissionText('');
                                      setStudentSubmissionFileUrl('');
                                      setStudentSubmissionFileName('');
                                    }}
                                    className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer select-none transition shadow-sm"
                                  >
                                    {isOverdue ? 'Hand In Late Submission' : 'Submit Hand-In Work'}
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Right Side: Active Homework Hand-in Submission Form */}
                  {selectedSubmittingAssignId && (
                    <div className="lg:col-span-6 space-y-4 animate-fade-in">
                      {(() => {
                        const targetAssign = assignments.find(a => a.id === selectedSubmittingAssignId);
                        if (!targetAssign) return null;
                        const isLateHandIn = new Date() > new Date(targetAssign.dueDate);

                        return (
                          <div className="bg-slate-950/35 border border-white/10 rounded-2xl p-5 space-y-4 relative text-left">
                            <button 
                              type="button"
                              onClick={() => setSelectedSubmittingAssignId(null)}
                              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 cursor-pointer"
                            >
                              <X className="h-4 w-4" />
                            </button>

                            <div className="space-y-1 pb-1">
                              <span className="text-[9px] uppercase font-bold font-mono tracking-widest text-indigo-400 block">HAND-IN COURSEWORK</span>
                              <h4 className="text-sm font-black text-slate-100">{targetAssign.title}</h4>
                              <p className="text-[10px] text-slate-400 font-mono">
                                Max Points: {targetAssign.maxScore} • Max Penalty: {isLateHandIn ? 'Late work score penalty applied' : 'None'}
                              </p>
                            </div>

                            {/* Warning badge if late hand in */}
                            {isLateHandIn && (
                              <div className="p-3 bg-rose-500/10 border border-rose-500/15 rounded-xl flex items-center gap-2.5 text-xs text-rose-300">
                                <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
                                <span><strong>Caution:</strong> The evaluation deadline is overdue. This coursework submit will be cataloged as "LATE".</span>
                              </div>
                            )}

                            <form onSubmit={handleHomeworkSubmit} className="space-y-4 text-left">
                              <div className="space-y-1.5">
                                <label className="block text-[10px] text-slate-300 font-bold uppercase font-mono tracking-wide">Submission Text / Notes</label>
                                <textarea 
                                  required={!studentSubmissionFileUrl}
                                  rows={4}
                                  placeholder="Fill in summary write-up, github repositories link, code explanations, or evaluation answers..."
                                  value={studentSubmissionText}
                                  onChange={e => setStudentSubmissionText(e.target.value)}
                                  className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
                                />
                              </div>

                              {/* Drag and Drop solutions attachment portal */}
                              <div className="space-y-1.5">
                                <label className="block text-[10px] text-slate-300 font-bold uppercase font-mono tracking-wide">
                                  Drag & Drop Solutions File (Optional)
                                </label>
                                <div 
                                  onDragEnter={handleStudentDrag}
                                  onDragOver={handleStudentDrag}
                                  onDragLeave={handleStudentDrag}
                                  onDrop={handleStudentDrop}
                                  onClick={() => document.getElementById('student-file-input')?.click()}
                                  className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition relative overflow-hidden ${
                                    studentDragActive ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/5 bg-slate-900/60 hover:border-white/10 hover:bg-slate-900/90'
                                  }`}
                                >
                                  <input 
                                    type="file" 
                                    id="student-file-input" 
                                    className="hidden" 
                                    onChange={handleStudentFileChange}
                                  />
                                  
                                  {uploadingSubmission ? (
                                    <div className="flex flex-col items-center justify-center space-y-1.5 py-1">
                                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
                                      <span className="text-[10px] text-slate-400 font-mono">Uploading study file packet...</span>
                                    </div>
                                  ) : studentSubmissionFileUrl ? (
                                    <div className="flex flex-col items-center justify-center space-y-1 py-0.5">
                                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                                      <span className="text-[10px] text-emerald-400 font-bold">Attachment Ready!</span>
                                      <span className="text-[9px] font-mono text-slate-400 truncate max-w-xs">{studentSubmissionFileName}</span>
                                    </div>
                                  ) : (
                                    <div className="flex flex-col items-center justify-center space-y-1.5 py-0.5">
                                      <Upload className="h-5 w-5 text-indigo-400" />
                                      <div>
                                        <span className="text-[10px] text-slate-300 font-bold">Attach project sheets</span>
                                        <span className="text-[10px] text-slate-400"> or drag solutions inside</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-3 pt-1">
                                <button
                                  type="submit"
                                  className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer select-none transition duration-150 flex items-center gap-1.5"
                                >
                                  <Check className="h-4 w-4" /> Finalize & Turn In Work
                                </button>
                                
                                <button
                                  type="button"
                                  onClick={() => setSelectedSubmittingAssignId(null)}
                                  className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer select-none transition"
                                >
                                  Cancel
                                </button>
                              </div>
                            </form>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ======================= TAB: COURSE SELF REGISTRATION ======================= */}
          {activeTab === 'registration' && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                Enrollable Core-Curriculum Catalogs
              </h3>

              {availableCourses.length === 0 ? (
                <div className="text-center py-16 backdrop-blur-md bg-slate-900/40 rounded-3xl border border-white/10 p-6 shadow-sm">
                  <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto mb-3" />
                  <h3 className="text-base font-bold font-title text-slate-200">Term registrations finished</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto font-sans leading-relaxed">
                    You have enrolled in all active cataloged academic blocks for this session. No remaining vacancy spaces found.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {availableCourses.map(c => (
                    <div key={c.id} className="backdrop-blur-md bg-slate-900/40 border border-white/10 hover:border-white/20 hover:shadow-2xl rounded-3xl p-5 flex flex-col justify-between transition-all">
                      <div>
                        <div className="flex justify-between items-start">
                          <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-3 font-bold font-mono text-[10px] border border-indigo-500/20 rounded uppercase tracking-wider">
                            {c.code}
                          </span>
                          <span className="text-xs font-semibold text-slate-300 bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-lg font-title">
                            {c.credits} Credits
                          </span>
                        </div>

                        <h4 className="text-base font-extrabold text-white font-title mt-4 tracking-tight leading-snug">
                          {c.name}
                        </h4>
                        <span className="block text-[11px] font-semibold text-indigo-400 font-title mt-1.5">
                          {c.department} Department
                        </span>
                        
                        <p className="text-xs text-slate-350 mt-2 line-clamp-2 leading-relaxed">
                          {c.description || 'No detailed curricula blueprints or summaries have been listed for this subject yet.'}
                        </p>
                      </div>

                      <div className="border-t border-white/10 mt-4 pt-3.5 flex justify-between items-center bg-slate-950/20 -mx-5 -mb-5 px-5 py-3 rounded-b-3xl">
                        <div>
                          <span className="block text-[9px] text-slate-400 uppercase font-semibold">Class Instructor</span>
                          <span className="block text-xs font-extrabold font-title text-slate-200">
                            {c.facultyName || 'Staff vacancy'}
                          </span>
                        </div>

                        <button
                          onClick={() => handleSelfEnroll(c.id)}
                          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 border border-indigo-500 text-white rounded-xl text-xs font-bold font-title shadow-lg active:scale-95 cursor-pointer leading-none font-sans uppercase font-bold tracking-wider"
                        >
                          <PlusCircle className="h-3.5 w-3.5" />
                          Register
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ======================= TAB: INVOICES & FEE LEDGER ======================= */}
          {activeTab === 'fees' && (
            <div className="space-y-6 animate-fade-in text-left">
              {/* Stat block specific to finances */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-slate-900/50 border border-white/15 p-4 rounded-2xl">
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest font-title">Unpaid Billing Liability</span>
                  <span className="block text-xl font-bold font-sans text-rose-450 mt-1">
                    ${outstandingBal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="bg-slate-900/50 border border-white/15 p-4 rounded-2xl">
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest font-title">Total Settled Billings</span>
                  <span className="block text-xl font-bold font-sans text-emerald-400 mt-1">
                    ${fees.filter(f => f.status === 'PAID').reduce((sum, f) => sum + Number(f.amount || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="bg-slate-900/50 border border-white/15 p-4 rounded-2xl sm:col-span-2 md:col-span-1">
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest font-title">Approved Ledger Status</span>
                  <span className="block text-xs font-semibold text-emerald-450 flex items-center gap-1 mt-2 font-mono">
                    {outstandingBal === 0 ? (
                      <span className="text-emerald-400 flex items-center gap-1">✓ Term Invoices Settled</span>
                    ) : (
                      <span className="text-amber-400 flex items-center gap-1">⚠️ Active Payment Outstanding</span>
                    )}
                  </span>
                </div>
              </div>

              {/* Table Ledger list */}
              <div className="border border-white/10 rounded-2xl bg-slate-900/30 overflow-hidden shadow-xl text-xs">
                <div className="px-6 py-4 border-b border-white/5 bg-slate-950/20 flex justify-between items-center">
                  <h4 className="text-xs font-bold font-title uppercase tracking-widest text-[#a5b4fc]">Ledger Statements & Semester Fees Invoices</h4>
                  <span className="text-[10px] font-mono text-slate-400">Total bills: {fees.length}</span>
                </div>

                {fees.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-10">No pending or previous tuition/fee assignments listed.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-white/5 text-left">
                      <thead className="bg-slate-900/40">
                        <tr>
                          <th className="px-6 py-3 font-bold font-title uppercase text-slate-400">Invoice Items / Bill title</th>
                          <th className="px-6 py-3 font-bold font-title uppercase text-slate-400 text-center">Due date</th>
                          <th className="px-6 py-3 font-bold font-title uppercase text-slate-400 text-right">Amount</th>
                          <th className="px-6 py-3 font-bold font-title uppercase text-slate-400 text-center">Receipt Status</th>
                          <th className="px-6 py-3 font-bold font-title uppercase text-slate-400 text-right">Transaction Ledger Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-sans">
                        {fees.map((f: any) => {
                          const isUnpaid = f.status === 'UNPAID' || f.status === 'OVERDUE';
                          return (
                            <tr key={f.id} className="hover:bg-white/5">
                              <td className="px-6 py-4">
                                <span className="block font-bold text-white text-sm font-title">{f.title}</span>
                                <span className="block text-[9px] font-mono text-slate-400 mt-0.5">Reference hash: {f.id}</span>
                              </td>
                              <td className="px-6 py-4 text-center font-mono font-semibold text-slate-350">
                                {new Date(f.dueDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                              </td>
                              <td className="px-6 py-4 text-right font-mono font-bold text-white text-sm">
                                ${Number(f.amount).toFixed(2)}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className={`inline-block px-2.5 py-1 text-[10px] font-bold font-mono rounded ${
                                  f.status === 'PAID' ? 'bg-emerald-500/15 text-emerald-305' :
                                  f.status === 'OVERDUE' ? 'bg-rose-500/15 text-rose-350' : 'bg-amber-500/15 text-amber-300'
                                }`}>
                                  {f.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                {isUnpaid ? (
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      id={`btn-download-invoice-${f.id}`}
                                      onClick={() => downloadReceipt(f)}
                                      title="Download Invoice Billing Statement"
                                      className="p-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg border border-white/10 transition cursor-pointer flex items-center justify-center"
                                    >
                                      <Download className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      id={`btn-pay-fee-${f.id}`}
                                      onClick={() => handlePayFee(f.id)}
                                      disabled={payingFeeId === f.id}
                                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold tracking-wider font-title uppercase transition cursor-pointer flex items-center gap-1 shadow-md"
                                    >
                                      <CreditCard className="h-3 w-3" />
                                      {payingFeeId === f.id ? 'settling...' : 'sim pay'}
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-end gap-3">
                                    <div className="text-[10px] font-mono text-slate-400 pr-2">
                                      Paid ${Number(f.amountPaid || f.amount).toFixed(2)}
                                      <span className="block text-[9px] text-slate-500 mt-0.5">
                                        {f.paidAt ? new Date(f.paidAt).toLocaleDateString() : 'Clearing verified'}
                                      </span>
                                    </div>
                                    <button
                                      id={`btn-download-receipt-${f.id}`}
                                      onClick={() => downloadReceipt(f)}
                                      title="Download Receipt"
                                      className="p-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 hover:text-white rounded-lg border border-emerald-500/20 transition cursor-pointer flex items-center justify-center shadow-sm"
                                    >
                                      <Download className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ======================= TAB: LIVE CAMPUS BULLETINS ======================= */}
          {activeTab === 'notifications' && (
            <div className="space-y-4 animate-fade-in text-left">
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                  Campus Channels & Announcements Room
                </h3>
                {unreadNotifCount > 0 && (
                  <span className="text-[10px] font-mono text-amber-305">
                    {unreadNotifCount} unread announcements
                  </span>
                )}
              </div>

              {notifications.length === 0 ? (
                <div className="text-center py-16 bg-slate-900/30 border border-white/5 rounded-3xl">
                  <Bell className="h-9 w-9 text-slate-500 mx-auto mb-2" />
                  <p className="text-xs text-slate-405 italic">The bulletin board is empty. Check back later.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((n: any) => (
                    <div 
                      key={n.id} 
                      className={`p-4 rounded-2xl border transition-all relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        !n.isRead 
                          ? 'bg-indigo-500/10 border-indigo-505/30 hover:border-indigo-500/40' 
                          : 'bg-slate-900/20 border-white/5 hover:border-white/10'
                      }`}
                    >
                      <div className="space-y-1 text-left">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-1.5 py-0.5 text-[8px] font-bold font-mono tracking-wide rounded ${
                            n.type === 'GRADE' ? 'bg-emerald-500/15 text-emerald-400' :
                            n.type === 'FEE' ? 'bg-rose-500/15 text-rose-400' :
                            n.type === 'ATTENDANCE' ? 'bg-cyan-500/15 text-cyan-400' : 'bg-slate-800 text-slate-300'
                          }`}>
                            {n.type || 'SYSTEM'}
                          </span>
                          {!n.isRead && (
                            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" title="New notification"></span>
                          )}
                          <span className="text-[10px] text-slate-500 font-mono">
                            {n.createdAt ? new Date(n.createdAt).toLocaleString() : 'Recent'}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white font-title">{n.title}</h4>
                        <p className="text-xs text-slate-300 leading-relaxed font-sans">{n.message}</p>
                      </div>

                      {!n.isRead && (
                        <button
                          onClick={() => handleMarkAsRead(n.id)}
                          className="px-2.5 py-1 text-[9px] font-bold font-mono tracking-wider font-title uppercase bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 rounded-lg transition-all cursor-pointer whitespace-nowrap self-start sm:self-center"
                        >
                          mark read
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
