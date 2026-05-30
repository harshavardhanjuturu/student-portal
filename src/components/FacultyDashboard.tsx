/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Users, BookOpen, Clock, Calendar, Check, X, Award, FileSpreadsheet, Save,
  Plus, Edit2, AlertTriangle, TrendingUp, BellRing, RefreshCw, ListFilter,
  ArrowRight, FilePenLine, Info, BarChart2, ShieldAlert, GraduationCap, Send, Inbox, ExternalLink, Upload
} from 'lucide-react';
import { Course, Enrollment } from '../types';

interface FacultyDashboardProps {
  token: string;
}

interface Assignment {
  id: string;
  courseId: string;
  title: string;
  description: string;
  maxScore: number;
  dueDate: string;
  createdAt: string;
  materialUrl?: string;
}

interface Submission {
  id: string;
  assignmentId: string;
  assignmentTitle?: string;
  maxScore?: number;
  studentId: string;
  studentName?: string;
  studentRegistrationNumber?: string;
  submissionText: string;
  fileUrl: string;
  score: number | null;
  feedback: string | null;
  gradedBy: string | null;
  gradedAt: string | null;
  submittedAt: string;
}

interface Exam {
  id: string;
  courseId: string;
  title: string;
  type: 'MIDTERM' | 'FINAL' | 'QUIZ' | 'PRACTICAL';
  maxMarks: number;
  createdAt: string;
}

interface Mark {
  id: string;
  examId: string;
  examTitle?: string;
  maxMarks?: number;
  studentId: string;
  studentName?: string;
  studentRegistrationNumber?: string;
  obtainedMarks: number;
  gradePoint: number;
  remarks: string;
  createdAt: string;
}

export const FacultyDashboard: React.FC<FacultyDashboardProps> = ({ token }) => {
  // Main loaded states from server
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // Active viewing Tab
  const [activeTab, setActiveTab] = useState<'roster' | 'attendance' | 'assignments' | 'exams' | 'announcements' | 'analytics'>('roster');

  // Daily Attendance marking states
  const [attendanceDate, setAttendanceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dailyAttendanceSheet, setDailyAttendanceSheet] = useState<{ [enrollmentId: string]: { status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'; remarks: string } }>({});
  const [loadingAttendanceSheet, setLoadingAttendanceSheet] = useState<boolean>(false);

  // Course-specific statistics and records
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>('');
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [examMarks, setExamMarks] = useState<Mark[]>([]);

  // Editing controls for default class roster grades & attendance
  const [editingGradeEnrollId, setEditingGradeEnrollId] = useState<string | null>(null);
  const [editingAttendanceEnrollId, setEditingAttendanceEnrollId] = useState<string | null>(null);
  const [gradeInput, setGradeInput] = useState('Pending');
  const [attendanceInput, setAttendanceInput] = useState<number>(100);

  // Adding new Assignment form state
  const [isAddingAssignment, setIsAddingAssignment] = useState(false);
  const [newAssignTitle, setNewAssignTitle] = useState('');
  const [newAssignDesc, setNewAssignDesc] = useState('');
  const [newAssignMaxScore, setNewAssignMaxScore] = useState(100);
  const [newAssignDueDate, setNewAssignDueDate] = useState('');
  const [newAssignMaterialUrl, setNewAssignMaterialUrl] = useState('');
  const [materialFileName, setMaterialFileName] = useState('');
  const [uploadingMaterial, setUploadingMaterial] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Grading submissions state
  const [gradingSubmissionId, setGradingSubmissionId] = useState<string | null>(null);
  const [gradingScoreInput, setGradingScoreInput] = useState<number>(100);
  const [gradingFeedbackInput, setGradingFeedbackInput] = useState('');

  // Adding new Exam form state
  const [isAddingExam, setIsAddingExam] = useState(false);
  const [newExamTitle, setNewExamTitle] = useState('');
  const [newExamType, setNewExamType] = useState<'MIDTERM' | 'FINAL' | 'QUIZ' | 'PRACTICAL'>('QUIZ');
  const [newExamMaxMarks, setNewExamMaxMarks] = useState(100);

  // Editing existing Exam details state
  const [isEditingExam, setIsEditingExam] = useState(false);
  const [editExamTitle, setEditExamTitle] = useState('');
  const [editExamType, setEditExamType] = useState<'MIDTERM' | 'FINAL' | 'QUIZ' | 'PRACTICAL'>('QUIZ');
  const [editExamMaxMarks, setEditExamMaxMarks] = useState(105);

  // Editing individual student Exam Marks state
  const [editingMarkKey, setEditingMarkKey] = useState<string | null>(null); // 'examId-studentId'
  const [obtainedMarksInput, setObtainedMarksInput] = useState<number>(0);
  const [obtainedRemarksInput, setObtainedRemarksInput] = useState<string>('');

  // Course Announcements broadcasting forms
  const [announceTitle, setAnnounceTitle] = useState('');
  const [announceMsg, setAnnounceMsg] = useState('');
  const [announcementHistory, setAnnouncementHistory] = useState<{title: string, message: string, date: string}[]>([]);

  // Status indicators
  const [loading, setLoading] = useState(true);
  const [facultyRefreshing, setFacultyRefreshing] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const triggerAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 4000);
  };

  // 1. Initial Load of teaching catalog courses and overall enrollments
  const loadFacultyData = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    else setFacultyRefreshing(true);

    try {
      // Fetch teaching classes of log-owner
      const cRes = await fetch('/api/faculty/courses', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const cData = await cRes.json();
      if (cRes.ok && cData.courses) {
        setCourses(cData.courses);
        if (cData.courses.length > 0 && !selectedCourse) {
          setSelectedCourse(cData.courses[0]);
        }
      }

      // Fetch student roster enrolled in any of those classes
      const eRes = await fetch('/api/faculty/enrollments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const eData = await eRes.json();
      if (eRes.ok && eData.enrollments) {
        setEnrollments(eData.enrollments);
      }
    } catch (err) {
      console.error(err);
      triggerAlert('error', 'Failed to retrieve academic program classes.');
    } finally {
      setLoading(false);
      setFacultyRefreshing(false);
    }
  };

  useEffect(() => {
    loadFacultyData();
  }, []);

  // 2. Load detail sub-coursework elements (assignments, submissions, exams, marks)
  const fetchCourseData = async (courseId: string) => {
    try {
      // Load Class Assignments
      const aRes = await fetch(`/api/faculty/courses/${courseId}/assignments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const aData = await aRes.json();
      if (aRes.ok && aData.assignments) {
        setAssignments(aData.assignments);
        if (aData.assignments.length > 0) {
          const firstAssignId = aData.assignments[0].id;
          setSelectedAssignmentId(firstAssignId);
          fetchSubmissions(firstAssignId);
        } else {
          setSelectedAssignmentId('');
          setSubmissions([]);
        }
      }

      // Load Class Exams
      const eRes = await fetch(`/api/faculty/courses/${courseId}/exams`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const eData = await eRes.json();
      if (eRes.ok && eData.exams) {
        setExams(eData.exams);
        if (eData.exams.length > 0) {
          const firstExamId = eData.exams[0].id;
          setSelectedExamId(firstExamId);
          fetchExamMarks(firstExamId);
        } else {
          setSelectedExamId('');
          setExamMarks([]);
        }
      }
    } catch (err) {
      console.error('Error fetching deep course records:', err);
    }
  };

  useEffect(() => {
    if (selectedExamId && exams.length > 0) {
      const match = exams.find(e => e.id === selectedExamId);
      if (match) {
        setEditExamTitle(match.title);
        setEditExamType(match.type);
        setEditExamMaxMarks(match.maxMarks);
      }
    }
  }, [selectedExamId, exams]);

  useEffect(() => {
    if (selectedCourse) {
      fetchCourseData(selectedCourse.id);
    }
  }, [selectedCourse]);

  // Reactive sub-queries for selection dropdowns
  const fetchSubmissions = async (assignmentId: string) => {
    if (!assignmentId) return;
    try {
      const res = await fetch(`/api/faculty/assignments/${assignmentId}/submissions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setSubmissions(data.submissions || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchExamMarks = async (examId: string) => {
    if (!examId) return;
    try {
      const res = await fetch(`/api/faculty/exams/${examId}/marks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setExamMarks(data.marks || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedAssignmentId(id);
    fetchSubmissions(id);
  };

  const handleExamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedExamId(id);
    fetchExamMarks(id);
  };

  // 3. Update Course-level overall student attributes
  const handleUpdateGrade = async (enrollmentId: string) => {
    try {
      const res = await fetch(`/api/faculty/enrollments/${enrollmentId}/grade`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ grade: gradeInput.toUpperCase() })
      });
      const data = await res.json();
      if (res.ok) {
        triggerAlert('success', 'Letter grade logged successfully.');
        setEditingGradeEnrollId(null);
        // Sync parent list
        setEnrollments(prev => prev.map(e => e.id === enrollmentId ? { ...e, grade: gradeInput.toUpperCase() } : e));
      } else {
        triggerAlert('error', data.message || 'Verification failure.');
      }
    } catch (err: any) {
      triggerAlert('error', err.toString());
    }
  };

  const handleUpdateAttendance = async (enrollmentId: string) => {
    try {
      const res = await fetch(`/api/faculty/enrollments/${enrollmentId}/attendance`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ attendancePercentage: Number(attendanceInput) })
      });
      const data = await res.json();
      if (res.ok) {
        triggerAlert('success', 'Overall class attendance synchronized.');
        setEditingAttendanceEnrollId(null);
        setEnrollments(prev => prev.map(e => e.id === enrollmentId ? { ...e, attendancePercentage: Number(attendanceInput) } : e));
      } else {
        triggerAlert('error', data.message || 'Operation failure.');
      }
    } catch (err: any) {
      triggerAlert('error', err.toString());
    }
  };

  const handleMaterialFileUpload = (file: File) => {
    setUploadingMaterial(true);
    setMaterialFileName(file.name);
    setTimeout(() => {
      setUploadingMaterial(false);
      const cleanName = encodeURIComponent(file.name.replace(/\s+/g, '_'));
      const mockUrl = `https://storage.university.edu/materials/${cleanName}`;
      setNewAssignMaterialUrl(mockUrl);
      triggerAlert('success', `Reference material "${file.name}" uploaded successfully.`);
    }, 1200);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleMaterialFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleMaterialFileUpload(e.target.files[0]);
    }
  };

  // 4. Create coursework entities
  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;
    if (!newAssignTitle || newAssignMaxScore <= 0 || !newAssignDueDate) {
      triggerAlert('error', 'Please fill in all necessary assignment properties.');
      return;
    }

    try {
      const res = await fetch(`/api/faculty/courses/${selectedCourse.id}/assignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newAssignTitle,
          description: newAssignDesc,
          maxScore: Number(newAssignMaxScore),
          dueDate: new Date(newAssignDueDate).toISOString(),
          materialUrl: newAssignMaterialUrl
        })
      });
      const data = await res.json();
      if (res.ok) {
        triggerAlert('success', `Assignment "${newAssignTitle}" published to class.`);
        setIsAddingAssignment(false);
        setNewAssignTitle('');
        setNewAssignDesc('');
        setNewAssignMaxScore(100);
        setNewAssignDueDate('');
        setNewAssignMaterialUrl('');
        
        // Refresh detail catalog
        fetchCourseData(selectedCourse.id);
      } else {
        triggerAlert('error', data.message || 'Error publishing assignment');
      }
    } catch (err: any) {
      triggerAlert('error', err.toString());
    }
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;
    if (!newExamTitle || newExamMaxMarks <= 0) {
      triggerAlert('error', 'Title and valid max marks must be parsed.');
      return;
    }

    try {
      const res = await fetch(`/api/faculty/courses/${selectedCourse.id}/exams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newExamTitle,
          type: newExamType,
          maxMarks: Number(newExamMaxMarks)
        })
      });
      const data = await res.json();
      if (res.ok) {
        triggerAlert('success', `Exam item "${newExamTitle}" registered successfully.`);
        setIsAddingExam(false);
        setNewExamTitle('');
        setNewExamMaxMarks(100);
        
        fetchCourseData(selectedCourse.id);
      } else {
        triggerAlert('error', data.message || 'Error registering exam section.');
      }
    } catch (err: any) {
      triggerAlert('error', err.toString());
    }
  };

  // 5. Submit individual scores
  const handleGradeSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingSubmissionId) return;

    try {
      const res = await fetch(`/api/faculty/submissions/${gradingSubmissionId}/grade`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          score: Number(gradingScoreInput),
          feedback: gradingFeedbackInput
        })
      });
      const data = await res.json();
      if (res.ok) {
        triggerAlert('success', 'Homework assessment completed successfully.');
        setGradingSubmissionId(null);
        setGradingFeedbackInput('');

        if (selectedAssignmentId) {
          fetchSubmissions(selectedAssignmentId);
        }
      } else {
        triggerAlert('error', data.message || 'Error finalizing grade.');
      }
    } catch (err: any) {
      triggerAlert('error', err.toString());
    }
  };

  const handleSaveExamMark = async (studentId: string) => {
    if (!selectedExamId) return;
    try {
      const res = await fetch(`/api/faculty/exams/${selectedExamId}/marks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          studentId,
          obtainedMarks: Number(obtainedMarksInput),
          gradePoint: Number((obtainedMarksInput / (exams.find(ex => ex.id === selectedExamId)?.maxMarks || 100) * 10).toFixed(2)),
          remarks: obtainedRemarksInput
        })
      });
      const data = await res.json();
      if (res.ok) {
        triggerAlert('success', 'Marks recorded in master worksheet.');
        setEditingMarkKey(null);
        setObtainedRemarksInput('');
        
        fetchExamMarks(selectedExamId);
      } else {
        triggerAlert('error', data.message || 'Error entering student marks.');
      }
    } catch (err: any) {
      triggerAlert('error', err.toString());
    }
  };

  const handleUpdateExamSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExamId || !selectedCourse) return;
    if (!editExamTitle || editExamMaxMarks <= 0) {
      triggerAlert('error', 'Title and valid max marks must be provided.');
      return;
    }

    try {
      const res = await fetch(`/api/faculty/exams/${selectedExamId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: editExamTitle,
          type: editExamType,
          maxMarks: Number(editExamMaxMarks)
        })
      });
      const data = await res.json();
      if (res.ok) {
        triggerAlert('success', `Exam Category "${editExamTitle}" updated successfully.`);
        setIsEditingExam(false);
        fetchCourseData(selectedCourse.id);
      } else {
        triggerAlert('error', data.message || 'Error updating exam settings.');
      }
    } catch (err: any) {
      triggerAlert('error', err.toString());
    }
  };

  const handlePublishExam = async () => {
    if (!selectedExamId || !selectedCourse) return;
    try {
      const res = await fetch(`/api/faculty/exams/${selectedExamId}/publish`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        triggerAlert('success', 'Exam results officially published and class notifications sent!');
        fetchCourseData(selectedCourse.id);
      } else {
        triggerAlert('error', data.message || 'Error publishing exam results.');
      }
    } catch (err: any) {
      triggerAlert('error', err.toString());
    }
  };

  // 6. Broadcast Custom announcements
  const handleSendAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;
    if (!announceTitle || !announceMsg) {
      triggerAlert('error', 'Announcement title and content details are required.');
      return;
    }

    try {
      const res = await fetch(`/api/faculty/courses/${selectedCourse.id}/announce`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: announceTitle,
          message: announceMsg
        })
      });
      if (res.ok) {
        triggerAlert('success', 'Class announcement broadcasted to all students.');
        
        // Save local history reference
        setAnnouncementHistory(prev => [
          {
            title: announceTitle,
            message: announceMsg,
            date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          },
          ...prev
        ]);
        setAnnounceTitle('');
        setAnnounceMsg('');
      } else {
        const errorData = await res.json();
        triggerAlert('error', errorData.message || 'Announce failure.');
      }
    } catch (err: any) {
      triggerAlert('error', err.toString());
    }
  };

  // Fetch granular attendance records for a selected date
  const fetchDailyAttendanceSheet = async (courseId: string, dateStr: string) => {
    if (!courseId || !dateStr) return;
    setLoadingAttendanceSheet(true);
    try {
      const res = await fetch(`/api/faculty/courses/${courseId}/attendance?date=${dateStr}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.records) {
        // Initialize with default PRESENT for all course enrollments
        const sheet: { [enrollmentId: string]: { status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'; remarks: string } } = {};
        const courseEnrollments = enrollments.filter(e => e.courseId === courseId);
        courseEnrollments.forEach(e => {
          sheet[e.id] = { status: 'PRESENT', remarks: '' };
        });

        // Override with loaded logs
        data.records.forEach((rec: any) => {
          if (rec.enrollmentId) {
            sheet[rec.enrollmentId] = {
              status: rec.status,
              remarks: rec.remarks || ''
            };
          }
        });
        setDailyAttendanceSheet(sheet);
      }
    } catch (err) {
      console.error('Error fetching granular attendance sheet:', err);
    } finally {
      setLoadingAttendanceSheet(false);
    }
  };

  const handleSaveDailyAttendance = async () => {
    if (!selectedCourse) return;
    try {
      setLoadingAttendanceSheet(true);
      const recordsToPost = Object.keys(dailyAttendanceSheet).map(enrollId => ({
        enrollmentId: enrollId,
        status: dailyAttendanceSheet[enrollId].status,
        remarks: dailyAttendanceSheet[enrollId].remarks
      }));

      const res = await fetch('/api/faculty/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          courseId: selectedCourse.id,
          date: attendanceDate,
          records: recordsToPost
        })
      });
      const data = await res.json();
      if (res.ok) {
        triggerAlert('success', `Daily attendance roster synced: ${recordsToPost.length} lines.`);
        // Reload enrollments to sync overall attendance percentage computed by backend
        const eRes = await fetch('/api/faculty/enrollments', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const eData = await eRes.json();
        if (eRes.ok && eData.enrollments) {
          setEnrollments(eData.enrollments);
        }
      } else {
        triggerAlert('error', data.message || 'Error syncing attendance records.');
      }
    } catch (err: any) {
      triggerAlert('error', err.toString());
    } finally {
      setLoadingAttendanceSheet(false);
    }
  };

  useEffect(() => {
    if (selectedCourse && activeTab === 'attendance' && enrollments.length > 0) {
      fetchDailyAttendanceSheet(selectedCourse.id, attendanceDate);
    }
  }, [selectedCourse, attendanceDate, activeTab, enrollments.length]);

  // Filter student rolls targeting the current selected course
  const filteredEnrollments = selectedCourse 
    ? enrollments.filter(e => e.courseId === selectedCourse.id)
    : [];

  const letterGrades = ['Pending', 'A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'];

  // Analytics Helpers
  const avgAttendance = filteredEnrollments.length > 0 
    ? filteredEnrollments.reduce((sum, e) => sum + (e.attendancePercentage || 0), 0) / filteredEnrollments.length
    : 100;

  const totalGraded = filteredEnrollments.filter(e => e.grade && e.grade !== 'Pending').length;
  const gradedRatio = filteredEnrollments.length > 0 
    ? (totalGraded / filteredEnrollments.length) * 100 
    : 0;

  const failingCount = filteredEnrollments.filter(e => e.grade === 'F').length;
  const passRate = filteredEnrollments.length > 0
    ? ((filteredEnrollments.length - failingCount) / filteredEnrollments.length) * 100
    : 100;

  // Grade Count Calculations for simple visual histogram
  const gradeBreakdownList = letterGrades.map(g => {
    const count = filteredEnrollments.filter(e => e.grade === g).length;
    return { grade: g, count };
  });

  // Identify At-Risk Students
  const atRiskStudents = filteredEnrollments.filter(e => {
    const isLowAttendance = (e.attendancePercentage || 0) < 75;
    const isFailing = e.grade === 'F';
    return isLowAttendance || isFailing;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in relative z-10 text-slate-100">
      
      {/* Alerts Overlay */}
      {alert && (
        <div id="faculty-alert" className={`fixed bottom-6 right-6 p-4 rounded-2xl shadow-2xl border text-sm font-semibold backdrop-blur-xl transition-all duration-300 z-50 flex items-center gap-2 max-w-sm ${
          alert.type === 'success' 
            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40' 
            : 'bg-rose-950/80 text-rose-300 border-rose-500/40'
        }`}>
          {alert.type === 'success' ? <Check className="h-5 w-5 text-emerald-400 shrink-0" /> : <X className="h-5 w-5 text-rose-400 shrink-0" />}
          <span className="leading-tight">{alert.message}</span>
        </div>
      )}

      {/* Main Header Card with ambient clean styling */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 bg-slate-900/60 p-6 rounded-3xl border border-slate-800/40 backdrop-blur-md">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 to-slate-350 bg-clip-text text-transparent flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-indigo-400" />
            Faculty Workbench
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Record student session attendances, assign class assessments, grade submissions, publish exam scores, and review cohort analytics.
          </p>
        </div>
        <button
          onClick={() => loadFacultyData(true)}
          disabled={facultyRefreshing}
          className="flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-700 hover:border-indigo-500/40 hover:bg-indigo-500/10 active:scale-95 transition bg-slate-900 cursor-pointer text-indigo-300 shrink-0 select-none font-mono"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${facultyRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
          {facultyRefreshing ? 'Refreshing Hub...' : 'Refresh Workbench'}
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 bg-slate-950/20 rounded-3xl border border-slate-900 p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
          <span className="text-xs font-mono text-indigo-300 tracking-wider">Syncing Coursework Catalog...</span>
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/40 rounded-3xl border border-slate-800 p-6 backdrop-blur-md">
          <BookOpen className="h-16 w-16 text-slate-650 mx-auto stroke-[1] mb-4 text-indigo-400" />
          <h3 className="text-xl font-bold text-slate-200">No Allocated Subject Groups</h3>
          <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">
            You are currently not recorded as the primary instructor for any syllabus modules. Kindly prompt administrators to allocate academic groups.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* 1. Left Sidebar: Allocated Courses List */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase text-indigo-300 tracking-wider px-1 font-mono flex items-center gap-2">
              <BookOpen className="h-4 w-4" /> Allocated Lecturing Catalog
            </h3>
            <div className="space-y-2">
              {courses.map(c => {
                const countOfEnrolled = enrollments.filter(e => e.courseId === c.id).length;
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedCourse(c);
                      setActiveTab('roster');
                      setEditingGradeEnrollId(null);
                      setEditingAttendanceEnrollId(null);
                      setIsAddingAssignment(false);
                      setIsAddingExam(false);
                    }}
                    className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 relative cursor-pointer block select-none ${
                      selectedCourse?.id === c.id
                        ? 'bg-slate-900/95 border-indigo-500 shadow-xl shadow-indigo-950/25 ring-1 ring-indigo-500/20'
                        : 'bg-slate-900/40 border-slate-800/80 text-slate-300 hover:bg-slate-900/70 hover:border-slate-700/60'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className="inline-block px-2 py-0.5 text-[9px] font-bold font-mono bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded uppercase">
                        {c.code}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold font-mono">
                        {countOfEnrolled} Students
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white mt-3 leading-snug tracking-tight line-clamp-2">
                      {c.name}
                    </h4>
                    <span className="block text-[10px] text-slate-400 mt-2 font-mono uppercase tracking-wider">
                      {c.department} Dept. • {c.credits} Credits
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Right Workspace Content */}
          {selectedCourse && (
            <div className="lg:col-span-3 space-y-6">
              
              {/* Active Course Master Summary Card */}
              <div className="bg-slate-900/60 p-6 rounded-3xl border border-slate-800/55 shadow-lg relative overflow-hidden backdrop-blur-md">
                <div className="absolute -top-12 -right-12 h-32 w-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
                <span className="text-[10px] font-bold font-mono text-indigo-400 uppercase tracking-widest block">
                  Active Instruction Focus • {selectedCourse.code}
                </span>
                <h2 className="text-2xl font-extrabold text-white tracking-tight mt-1.5">
                  {selectedCourse.name}
                </h2>
                <p className="text-xs text-slate-300 mt-2 max-w-2xl leading-relaxed">
                  {selectedCourse.description || 'No descriptive overview recorded for this course.'}
                </p>

                {/* Dynamic mini overview metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-slate-800/80 mt-6 pt-5 bg-slate-950/20 p-4 rounded-xl">
                  <div>
                    <span className="block text-[9px] text-slate-400 uppercase tracking-widest font-mono">Cohort Capacity</span>
                    <span className="block text-base font-extrabold text-white font-mono mt-0.5">
                      {filteredEnrollments.length} Registered
                    </span>
                  </div>
                  <div>
                    <span className="block text-[9px] text-slate-400 uppercase tracking-widest font-mono">Session Attendance</span>
                    <span className={`block text-base font-extrabold font-mono mt-0.5 ${avgAttendance < 75 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {avgAttendance.toFixed(1)}%
                    </span>
                  </div>
                  <div>
                    <span className="block text-[9px] text-slate-400 uppercase tracking-widest font-mono">Cohorts Graded</span>
                    <span className="block text-base font-extrabold text-indigo-300 font-mono mt-0.5">
                      {gradedRatio.toFixed(0)}% Done
                    </span>
                  </div>
                  <div>
                    <span className="block text-[9px] text-slate-400 uppercase tracking-widest font-mono">Passing Index</span>
                    <span className="block text-base font-extrabold text-[#10b981] font-mono mt-0.5">
                      {passRate.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* TAB BAR CONTROL SYSTEM */}
              <div className="flex flex-wrap gap-2 border-b border-slate-800/80 pb-1.5">
                {[
                  { id: 'roster', label: 'Class Students', icon: Users },
                  { id: 'attendance', label: 'Mark Attendance', icon: Calendar },
                  { id: 'assignments', label: 'Assign & Homeworks', icon: FileSpreadsheet },
                  { id: 'exams', label: 'Exams & Marks Entry', icon: FilePenLine },
                  { id: 'announcements', label: 'Announce & Alerts', icon: BellRing },
                  { id: 'analytics', label: 'Cohort Insight Graphs', icon: BarChart2 }
                ].map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold select-none cursor-pointer transition ${
                        activeTab === tab.id
                          ? 'bg-indigo-600 border border-indigo-500 text-white shadow-md'
                          : 'bg-slate-900/40 border border-slate-800/60 text-slate-300 hover:bg-slate-900/80 hover:text-white'
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* TAB PANELS ELEMENT MOUNTS */}
              
              {/* TAB 1.5: DAILY ATTENDANCE MARKING */}
              {activeTab === 'attendance' && (
                <div className="bg-slate-900/40 rounded-3xl border border-slate-800 p-6 space-y-6 backdrop-blur-md">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-indigo-400" /> Mark Daily Log
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">Specify date, record session physical/virtual attendance status, log optional remarks, and submit for direct cohort catalog update.</p>
                    </div>

                    {/* Date Selector & Bulk Actions */}
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-2 bg-slate-950/40 px-3 py-1.5 rounded-xl border border-slate-800/80">
                        <span className="text-[10px] font-bold font-mono uppercase text-slate-400 shrink-0">Log Date:</span>
                        <input
                          type="date"
                          value={attendanceDate}
                          onChange={(e) => setAttendanceDate(e.target.value)}
                          className="text-xs bg-transparent border-none text-indigo-300 font-mono outline-none cursor-pointer focus:ring-0"
                        />
                      </div>

                      <button
                        onClick={() => {
                          const sheetValue = { ...dailyAttendanceSheet };
                          filteredEnrollments.forEach(e => {
                            sheetValue[e.id] = { ...(sheetValue[e.id] || {}), status: 'PRESENT', remarks: sheetValue[e.id]?.remarks || '' };
                          });
                          setDailyAttendanceSheet(sheetValue);
                        }}
                        className="text-[10px] font-bold font-mono uppercase bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-3 py-1.5 border border-emerald-500/20 rounded-xl transition cursor-pointer select-none font-semibold"
                      >
                        All Present
                      </button>

                      <button
                        onClick={() => {
                          const sheetValue = { ...dailyAttendanceSheet };
                          filteredEnrollments.forEach(e => {
                            sheetValue[e.id] = { ...(sheetValue[e.id] || {}), status: 'ABSENT', remarks: sheetValue[e.id]?.remarks || '' };
                          });
                          setDailyAttendanceSheet(sheetValue);
                        }}
                        className="text-[10px] font-bold font-mono uppercase bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 px-3 py-1.5 border border-rose-500/20 rounded-xl transition cursor-pointer select-none font-semibold"
                      >
                        All Absent
                      </button>
                    </div>
                  </div>

                  {loadingAttendanceSheet ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                      <span className="text-xs font-mono text-indigo-300">Synchronizing Session Sheet...</span>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="overflow-x-auto border border-slate-800/60 rounded-2xl bg-slate-950/20">
                        <table className="min-w-full divide-y divide-slate-800/70">
                          <thead className="bg-slate-900/60 text-slate-300 text-[10px] font-mono tracking-wider uppercase">
                            <tr>
                              <th className="px-6 py-4 text-left font-bold">Attendee Info</th>
                              <th className="px-6 py-4 text-center font-bold">Status Picker</th>
                              <th className="px-6 py-4 text-left font-bold">Remarks & Session Diary Note</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/40 text-xs">
                            {filteredEnrollments.length === 0 ? (
                              <tr>
                                <td colSpan={3} className="px-6 py-10 text-center font-bold text-slate-500">
                                  No students are registered in this syllabus catalog section.
                                </td>
                              </tr>
                            ) : (
                              filteredEnrollments.map(e => {
                                const current = dailyAttendanceSheet[e.id] || { status: 'PRESENT', remarks: '' };
                                return (
                                  <tr key={e.id} className="hover:bg-slate-900/10 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-left">
                                      <span className="block font-bold text-white text-sm">{e.studentName}</span>
                                      <span className="block font-mono text-[10px] text-indigo-300 mt-0.5">{e.studentRegistrationNumber}</span>
                                    </td>
                                    
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-xs">
                                      <div className="inline-flex gap-1.5 p-1 rounded-xl bg-slate-950/40 border border-slate-800/60">
                                        {[
                                          { value: 'PRESENT', label: 'Present', activeClass: 'bg-emerald-600 text-white font-semibold', idleClass: 'text-slate-400 hover:text-emerald-300 hover:bg-emerald-500/10' },
                                          { value: 'LATE', label: 'Late', activeClass: 'bg-amber-600 text-white font-semibold', idleClass: 'text-slate-400 hover:text-amber-300 hover:bg-amber-500/10' },
                                          { value: 'ABSENT', label: 'Absent', activeClass: 'bg-rose-600 text-white font-semibold', idleClass: 'text-slate-400 hover:text-rose-300 hover:bg-rose-500/10' },
                                          { value: 'EXCUSED', label: 'Excused', activeClass: 'bg-cyan-600 text-white font-semibold', idleClass: 'text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10' }
                                        ].map(statusBtn => (
                                          <button
                                            key={statusBtn.value}
                                            onClick={() => {
                                              setDailyAttendanceSheet(prev => ({
                                                ...prev,
                                                [e.id]: { ...current, status: statusBtn.value as any }
                                              }));
                                            }}
                                            className={`px-3 py-1 text-[10px] rounded-lg transition-all duration-150 cursor-pointer select-none font-mono tracking-wider uppercase ${
                                              current.status === statusBtn.value ? statusBtn.activeClass : statusBtn.idleClass
                                            }`}
                                          >
                                            {statusBtn.label}
                                          </button>
                                        ))}
                                      </div>
                                    </td>

                                    <td className="px-6 py-4 text-left">
                                      <input
                                        type="text"
                                        placeholder="Add attendee remarks (e.g., excused medical certificate)"
                                        value={current.remarks}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setDailyAttendanceSheet(prev => ({
                                            ...prev,
                                            [e.id]: { ...current, remarks: val }
                                          }));
                                        }}
                                        className="w-full bg-slate-950/40 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2 text-xs text-slate-200 outline-none transition"
                                      />
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>

                      {filteredEnrollments.length > 0 && (
                        <div className="flex justify-end pt-2">
                          <button
                            onClick={handleSaveDailyAttendance}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-semibold text-xs px-5 py-3 rounded-xl transition cursor-pointer select-none shadow-md"
                          >
                            <Save className="h-4 w-4" />
                            Submit Session Attendance Sheet
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 1: CLASS ROSTER & ATTENDANCE */}
              {activeTab === 'roster' && (
                <div className="bg-slate-900/40 rounded-3xl border border-slate-800 p-6 space-y-6 backdrop-blur-md">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Users className="h-5 w-5 text-indigo-400" /> Subject Group Matrix
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">Review active student enrollments, modify overall attendance index, and register final subject evaluation letter codes.</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto border border-slate-800/60 rounded-2xl bg-slate-950/20">
                    <table className="min-w-full divide-y divide-slate-800/70">
                      <thead className="bg-slate-900/60 text-slate-300 text-[10px] font-mono tracking-wider uppercase">
                        <tr>
                          <th className="px-6 py-4 text-left font-bold">Enrolled Student Info</th>
                          <th className="px-6 py-4 text-center font-bold">Attendance Ratio</th>
                          <th className="px-6 py-4 text-center font-bold">Overall Subject Grade</th>
                          <th className="px-6 py-4 text-right font-bold">Operations Logs</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40 text-xs">
                        {filteredEnrollments.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-6 py-10 text-center font-bold text-slate-500">
                              No students are enrolled in this course catalog section.
                            </td>
                          </tr>
                        ) : (
                          filteredEnrollments.map(e => (
                            <tr key={e.id} className="hover:bg-slate-900/20 transition-colors">
                              
                              {/* Student Identity */}
                              <td className="px-6 py-4 whitespace-nowrap text-left">
                                <span className="block font-bold text-white text-sm">{e.studentName}</span>
                                <span className="block font-mono text-[10px] text-indigo-300 mt-0.5">{e.studentRegistrationNumber}</span>
                              </td>

                              {/* Interactive Attendance management Cell */}
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                {editingAttendanceEnrollId === e.id ? (
                                  <div className="flex items-center gap-2 justify-center mx-auto max-w-[170px]">
                                    <input 
                                      type="number"
                                      min="0"
                                      max="100"
                                      value={attendanceInput}
                                      onChange={val => setAttendanceInput(Math.min(Math.max(Number(val.target.value), 0), 100))}
                                      className="w-16 px-2.5 py-1 text-center font-mono font-bold rounded-lg border border-slate-705 text-white bg-slate-950 focus:outline-none focus:border-indigo-500"
                                    />
                                    <span className="text-slate-400 font-mono">%</span>
                                    <button
                                      onClick={() => handleUpdateAttendance(e.id)}
                                      className="p-1 px-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md shrink-0 cursor-pointer"
                                      title="Update percentage"
                                    >
                                      <Save className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      onClick={() => setEditingAttendanceEnrollId(null)}
                                      className="p-1 px-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md shrink-0 cursor-pointer"
                                      title="Cancel"
                                    >
                                      <X className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center justify-center cursor-pointer group"
                                       onClick={() => {
                                         setEditingAttendanceEnrollId(e.id);
                                         setAttendanceInput(e.attendancePercentage || 100);
                                         setEditingGradeEnrollId(null);
                                       }}>
                                    <span className="font-mono font-bold text-sm text-white group-hover:text-indigo-300 transition block">
                                      {e.attendancePercentage}% <span className="text-[9px] text-slate-500 font-normal">✎</span>
                                    </span>
                                    {/* Small aesthetic progress scale */}
                                    <div className="w-16 h-1 mt-1 bg-slate-800 rounded-full overflow-hidden">
                                      <div 
                                        className={`h-full rounded-full ${
                                          (e.attendancePercentage || 0) < 75 ? 'bg-amber-500 shadow-sm shadow-amber-500/20' : 'bg-emerald-500 shadow-sm shadow-emerald-500/20'
                                        }`}
                                        style={{ width: `${e.attendancePercentage}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                )}
                              </td>

                              {/* Interactive Subject Grade management Cell */}
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                {editingGradeEnrollId === e.id ? (
                                  <div className="flex items-center gap-1.5 justify-center mx-auto max-w-[170px]">
                                    <select
                                      value={gradeInput}
                                      onChange={ev => setGradeInput(ev.target.value)}
                                      className="px-2 py-1 bg-slate-950 border border-slate-700 text-white rounded-lg font-mono font-bold text-xs focus:outline-none focus:border-indigo-550"
                                    >
                                      {letterGrades.map(g => (
                                        <option key={g} value={g} className="bg-slate-950">{g}</option>
                                      ))}
                                    </select>
                                    <button
                                      onClick={() => handleUpdateGrade(e.id)}
                                      className="p-1 px-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md shrink-0 cursor-pointer"
                                    >
                                      <Save className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      onClick={() => setEditingGradeEnrollId(null)}
                                      className="p-1 px-1.5 bg-slate-850 hover:bg-slate-700 text-slate-350 rounded-md shrink-0 cursor-pointer"
                                    >
                                      <X className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <span 
                                    onClick={() => {
                                      setEditingGradeEnrollId(e.id);
                                      setGradeInput(e.grade || 'Pending');
                                      setEditingAttendanceEnrollId(null);
                                    }}
                                    className={`inline-flex px-3 py-1 rounded-full font-mono font-bold text-[10px] uppercase tracking-wider border cursor-pointer hover:border-indigo-400 hover:scale-105 transition-all duration-150 ${
                                      e.grade === 'Pending' 
                                        ? 'bg-slate-800/50 text-slate-400 border-slate-700/50' 
                                        : e.grade === 'F'
                                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                        : ['A', 'A+', 'B+', 'B'].includes(e.grade || '') 
                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' 
                                        : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                    }`}
                                  >
                                    {e.grade} {e.grade === 'Pending' ? '...' : ''}
                                  </span>
                                )}
                              </td>

                              {/* Manual direct actions shortcuts column */}
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                <div className="flex justify-end gap-1.5">
                                  <button
                                    onClick={() => {
                                      setEditingAttendanceEnrollId(e.id);
                                      setAttendanceInput(e.attendancePercentage || 100);
                                      setEditingGradeEnrollId(null);
                                    }}
                                    className="px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-850 hover:text-white text-slate-300 font-semibold transition text-[10px] cursor-pointer inline-flex items-center gap-1 shrink-0"
                                  >
                                    Log Attendance
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingGradeEnrollId(e.id);
                                      setGradeInput(e.grade || 'Pending');
                                      setEditingAttendanceEnrollId(null);
                                    }}
                                    className="px-2.5 py-1.5 rounded-lg border border-indigo-500/20 bg-indigo-650/10 hover:bg-indigo-600/20 text-indigo-300 font-semibold transition text-[10px] cursor-pointer inline-flex items-center gap-1 shrink-0"
                                  >
                                    Grade Roll
                                  </button>
                                </div>
                              </td>

                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 2: COURSE ASSIGNMENTS */}
              {activeTab === 'assignments' && (
                <div className="bg-slate-900/40 rounded-3xl border border-slate-800 p-6 space-y-6 backdrop-blur-md">
                  
                  {/* Top Header Block / Add Option trigger */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <FileSpreadsheet className="h-5 w-5 text-indigo-400" /> Syllabus Course Work Tasks
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">Manage class homeworks, evaluate task-submissions, and provide helpful student feedback.</p>
                    </div>

                    <button
                      onClick={() => setIsAddingAssignment(!isAddingAssignment)}
                      className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-550 text-white font-bold select-none text-xs transition cursor-pointer flex items-center gap-1.5 shrink-0"
                    >
                      {isAddingAssignment ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                      {isAddingAssignment ? 'Close Builder' : 'Create Assignment'}
                    </button>
                  </div>

                  {/* Form to append new Homework Assignment */}
                  {isAddingAssignment && (
                    <form onSubmit={handleCreateAssignment} className="p-5 bg-slate-950/40 border border-indigo-500/20 rounded-2xl space-y-4 animate-slide-in">
                      <h4 className="text-xs font-bold uppercase text-indigo-300 font-mono tracking-widest flex items-center gap-2">
                        <Plus className="h-4 w-4" /> Publish New Project Assignment
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2 space-y-1.5">
                          <label className="block text-[10px] text-slate-400 font-bold uppercase font-mono tracking-wide">Assignment Sheet Name</label>
                          <input 
                            type="text" 
                            required
                            placeholder="e.g. LAB #1: Dynamic Data Trees"
                            value={newAssignTitle}
                            onChange={v => setNewAssignTitle(v.target.value)}
                            className="w-full px-3 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-[10px] text-slate-400 font-bold uppercase font-mono tracking-wide">Max Evaluation Score</label>
                          <input 
                            type="number" 
                            required
                            min="1"
                            value={newAssignMaxScore}
                            onChange={v => setNewAssignMaxScore(Number(v.target.value))}
                            className="w-full px-3 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-indigo-550"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] text-slate-400 font-bold uppercase font-mono tracking-wide">Submission Deadline (Due Date)</label>
                        <input 
                          type="datetime-local" 
                          required
                          value={newAssignDueDate}
                          onChange={v => setNewAssignDueDate(v.target.value)}
                          className="w-full px-3 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-slate-350 text-xs font-mono focus:outline-none focus:border-indigo-550"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] text-slate-400 font-bold uppercase font-mono tracking-wide">Instructions / Guidelines</label>
                        <textarea 
                          rows={3}
                          placeholder="Provide descriptive homework specs, file format standards, or requirements overview..."
                          value={newAssignDesc}
                          onChange={v => setNewAssignDesc(v.target.value)}
                          className="w-full px-3 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-550 resize-y"
                        />
                      </div>

                      <div className="space-y-1.5 text-left">
                        <label className="block text-[10px] text-slate-400 font-bold uppercase font-mono tracking-wide">
                          Upload Assignment Reference Materials (Syllabus/Sheet)
                        </label>
                        <div 
                          onDragEnter={handleDrag}
                          onDragOver={handleDrag}
                          onDragLeave={handleDrag}
                          onDrop={handleDrop}
                          onClick={() => document.getElementById('material-file-input')?.click()}
                          className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition relative overflow-hidden ${
                            dragActive ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/75'
                          }`}
                        >
                          <input 
                            type="file" 
                            id="material-file-input" 
                            className="hidden" 
                            onChange={handleFileChange}
                          />
                          
                          {uploadingMaterial ? (
                            <div className="flex flex-col items-center justify-center space-y-2 py-2">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                              <span className="text-xs text-slate-400 font-mono">Uploading reference specifications file...</span>
                            </div>
                          ) : newAssignMaterialUrl ? (
                            <div className="flex flex-col items-center justify-center space-y-1.5 py-1">
                              <Check className="h-6 w-6 text-emerald-400 animate-bounce" />
                              <span className="text-xs text-emerald-400 font-bold">Successfully Staged!</span>
                              <span className="text-[10px] font-mono text-slate-400 truncate max-w-xs">{materialFileName || 'Reference Material Doc'}</span>
                              <span className="text-[9px] font-mono text-indigo-400 truncate max-w-sm">{newAssignMaterialUrl}</span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center space-y-2 py-1">
                              <Upload className="h-6 w-6 text-indigo-400" />
                              <div>
                                <span className="text-xs text-slate-300 font-bold">Click to upload</span>
                                <span className="text-xs text-slate-400"> or drag and drop reference PDF / DOCX</span>
                              </div>
                              <span className="text-[9px] text-slate-500 font-mono uppercase">Max size: 25MB • Secure cloud persistence</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer select-none transition shadow-lg shadow-indigo-950/20"
                      >
                        Publish with Live Notification
                      </button>
                    </form>
                  )}

                  {/* Active List of Course Work Task Elements */}
                  {assignments.length === 0 ? (
                    <div className="text-center py-10 bg-slate-950/10 rounded-2xl border border-slate-800/40 p-4">
                      <Inbox className="h-10 w-10 text-slate-600 mx-auto mb-2.5" />
                      <h4 className="text-sm font-bold text-slate-300">No Assignments Published</h4>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">This syllabus catalog has not released coursework pages yet. Click "Create Assignment" to post the first task.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2">
                      
                      {/* Left Side: Select assignment to view its submissions */}
                      <div className="md:col-span-4 space-y-3">
                        <label className="block text-[10px] text-indigo-300 font-bold font-mono uppercase tracking-widest">Select Assignment Focus</label>
                        <select
                          className="w-full p-3 bg-slate-950 border border-slate-800 rounded-2xl text-slate-100 text-xs font-mono focus:outline-none focus:cursor-pointer"
                          value={selectedAssignmentId}
                          onChange={handleAssignmentChange}
                        >
                          {assignments.map(a => (
                            <option key={a.id} value={a.id} className="bg-slate-950">
                              {a.title} ({a.maxScore} pts)
                            </option>
                          ))}
                        </select>

                        {/* Summary panel of Selected Assignment */}
                        {selectedAssignmentId && (
                          <div className="p-4 bg-slate-950/20 rounded-2xl border border-slate-800/40 space-y-3 text-xs leading-relaxed text-slate-300">
                            {(() => {
                              const curr = assignments.find(a => a.id === selectedAssignmentId);
                              if (!curr) return null;
                              return (
                                <>
                                  <div className="flex justify-between font-mono text-[10px] text-slate-400 border-b border-slate-800 pb-2">
                                    <span>Max Marks: {curr.maxScore}</span>
                                    <span>Due: {new Date(curr.dueDate).toLocaleDateString()}</span>
                                  </div>
                                  <div className="text-slate-300 mt-2 line-clamp-4">
                                    {curr.description || <span className="text-slate-500 italic">No notes published.</span>}
                                  </div>
                                  {curr.materialUrl && (
                                    <div className="pt-2 border-t border-slate-800 flex flex-col gap-1">
                                      <span className="text-[10px] uppercase font-mono text-slate-400 block">Class Materials:</span>
                                      <a 
                                        href={curr.materialUrl} 
                                        target="_blank" 
                                        rel="noreferrer" 
                                        className="text-[10px] text-indigo-400 hover:underline flex items-center gap-1 font-mono break-all"
                                      >
                                        <ExternalLink className="h-3.5 w-3.5 shrink-0" /> Open Referenced Materials 
                                      </a>
                                    </div>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        )}
                      </div>

                      {/* Right Side: Submission evaluating sheets */}
                      <div className="md:col-span-8 space-y-4">
                        <h4 className="text-xs font-bold uppercase text-indigo-300 font-mono tracking-widest">Submissions evaluations Roll</h4>
                        
                        {/* Interactive homework evaluation entry overlay */}
                        {gradingSubmissionId && (
                          <form onSubmit={handleGradeSubmission} className="p-4 bg-indigo-950/30 border border-indigo-500/20 rounded-2xl space-y-3 animate-fade-in text-xs">
                            <div className="flex justify-between items-center bg-indigo-955 p-2 rounded-lg">
                              <span className="font-mono font-bold text-indigo-300">Evaluating: {submissions.find(s => s.id === gradingSubmissionId)?.studentName}</span>
                              <button type="button" onClick={() => setGradingSubmissionId(null)} className="text-slate-400 hover:text-white"><X className="h-4 w-4" /></button>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-3">
                              <div className="col-span-1 space-y-1">
                                <label className="block text-[10px] text-slate-400 font-bold uppercase">Points Score</label>
                                <input 
                                  type="number"
                                  min="0"
                                  max={submissions.find(s => s.id === gradingSubmissionId)?.maxScore || 100}
                                  value={gradingScoreInput}
                                  onChange={ev => setGradingScoreInput(Number(ev.target.value))}
                                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono font-bold text-center"
                                />
                                <span className="block text-[9px] text-slate-500 font-mono mt-0.5">Max Score: {submissions.find(s => s.id === gradingSubmissionId)?.maxScore || 100}</span>
                              </div>
                              <div className="col-span-2 space-y-1">
                                <label className="block text-[10px] text-slate-400 font-bold uppercase font-title">Assigned Coach feedback</label>
                                <input 
                                  type="text"
                                  placeholder="Well annotated algorithms, minor code structure issue."
                                  value={gradingFeedbackInput}
                                  onChange={ev => setGradingFeedbackInput(ev.target.value)}
                                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white"
                                />
                              </div>
                            </div>

                            <button 
                              type="submit"
                              className="px-3 py-1.5 bg-indigo-650 hover:bg-indigo-600 text-white rounded-lg cursor-pointer font-bold select-none text-[11px]"
                            >
                              Finalize Core Assessment Score
                            </button>
                          </form>
                        )}

                        <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950/10">
                          <table className="min-w-full divide-y divide-slate-800/60 text-xs">
                            <thead className="bg-slate-900/60 text-slate-400 text-[10px] font-mono uppercase font-bold text-[9px] tracking-wider">
                              <tr>
                                <th className="px-4 py-3 text-left">Student</th>
                                <th className="px-4 py-3 text-left">Attached document</th>
                                <th className="px-4 py-3 text-center">Score Grade</th>
                                <th className="px-4 py-3 text-right">Operation</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/40">
                              {submissions.length === 0 ? (
                                <tr>
                                  <td colSpan={4} className="px-4 py-6 text-center text-slate-500 italic font-mono uppercase text-[10px]">
                                    No student sheets have been submitted for this homework yet.
                                  </td>
                                </tr>
                              ) : (
                                submissions.map(sub => (
                                  <tr key={sub.id} className="hover:bg-slate-900/10">
                                    <td className="px-4 py-3.5 whitespace-nowrap text-left">
                                      <span className="block font-bold text-white">{sub.studentName}</span>
                                      <span className="block font-mono text-[9px] text-indigo-300 mt-0.5">{sub.studentRegistrationNumber}</span>
                                    </td>
                                    
                                    <td className="px-4 py-3.5">
                                      <div className="max-w-[190px] leading-relaxed">
                                        {sub.submissionText && <p className="text-slate-350 truncate">{sub.submissionText}</p>}
                                        {sub.fileUrl && (
                                          <a 
                                            href={sub.fileUrl} 
                                            target="_blank" 
                                            rel="noreferrer" 
                                            className="text-[10px] text-indigo-400 hover:underline flex items-center gap-0.5 mt-0.5"
                                          >
                                            <ExternalLink className="h-3 w-3 shrink-0" /> Open Cloud Sheet
                                          </a>
                                        )}
                                      </div>
                                    </td>

                                    <td className="px-4 py-3.5 text-center">
                                      {sub.score !== null ? (
                                        <div className="inline-flex flex-col items-center">
                                          <span className="font-mono font-bold text-sm text-emerald-400">{sub.score} <span className="text-slate-500 text-[10px]">/ {sub.maxScore || 100}</span></span>
                                          {sub.feedback && <span className="text-[9px] text-slate-400 italic block mt-0.5 max-w-[130px] truncate" title={sub.feedback}>"{sub.feedback}"</span>}
                                        </div>
                                      ) : (
                                        <span className="font-mono text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/15 text-[10px]">UNGRADED</span>
                                      )}
                                    </td>

                                    <td className="px-4 py-3.5 whitespace-nowrap text-right">
                                      <button
                                        onClick={() => {
                                          setGradingSubmissionId(sub.id);
                                          setGradingScoreInput(sub.score !== null ? Number(sub.score) : Number(sub.maxScore || 100));
                                          setGradingFeedbackInput(sub.feedback || '');
                                        }}
                                        className="px-2.5 py-1.5 rounded-lg border border-indigo-500/20 bg-indigo-650/10 hover:bg-indigo-600/20 text-indigo-300 font-bold transition text-[10px] cursor-pointer"
                                      >
                                        Evaluate Roll
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

                </div>
              )}

              {/* TAB 3: EXAMS & MARKS ENTRY */}
              {activeTab === 'exams' && (
                <div className="bg-slate-900/40 rounded-3xl border border-slate-800 p-6 space-y-6 backdrop-blur-md">
                  
                  {/* Top Header Block / Add Option trigger */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <FilePenLine className="h-5 w-5 text-indigo-400" /> Syllabus Examinations Registry
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">Register course exams (quizzes, midterms, finals) and enter detailed student gained marks.</p>
                    </div>

                    <button
                      onClick={() => setIsAddingExam(!isAddingExam)}
                      className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-550 text-white font-bold select-none text-xs transition cursor-pointer flex items-center gap-1.5 shrink-0"
                    >
                      {isAddingExam ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                      {isAddingExam ? 'Close Register' : 'Register Exam Category'}
                    </button>
                  </div>

                  {/* Form to log new exam assessment category */}
                  {isAddingExam && (
                    <form onSubmit={handleCreateExam} className="p-5 bg-slate-950/40 border border-indigo-500/20 rounded-2xl space-y-4 animate-slide-in">
                      <h4 className="text-xs font-bold uppercase text-indigo-300 font-mono tracking-widest flex items-center gap-2">
                        <Plus className="h-4 w-4" /> Publish New Exam Category
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2 space-y-1.5">
                          <label className="block text-[10px] text-slate-400 font-bold uppercase font-mono tracking-wide">Exam Sheet Name</label>
                          <input 
                            type="text" 
                            required
                            placeholder="e.g. CS101 Advanced Algorithm Theory"
                            value={newExamTitle}
                            onChange={v => setNewExamTitle(v.target.value)}
                            className="w-full px-3 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-550"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-[10px] text-slate-400 font-bold uppercase font-mono tracking-wide">Exam Section Category</label>
                          <select
                            value={newExamType}
                            onChange={v => setNewExamType(v.target.value as any)}
                            className="w-full px-3 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-slate-350 text-xs font-mono focus:outline-none focus:border-indigo-550"
                          >
                            <option value="QUIZ">Quiz Event</option>
                            <option value="MIDTERM">Midterm Exams</option>
                            <option value="FINAL">Syllabus Finals</option>
                            <option value="PRACTICAL">Lab Practicals</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1.5 max-w-sm">
                        <label className="block text-[10px] text-slate-400 font-bold uppercase font-mono tracking-wide">Maximum Evaluation Marks</label>
                        <input 
                          type="number"
                          required
                          min="1"
                          value={newExamMaxMarks}
                          onChange={v => setNewExamMaxMarks(Number(v.target.value))}
                          className="w-full px-3 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-indigo-550"
                        />
                      </div>

                      <button
                        type="submit"
                        className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer select-none transition shadow-lg shadow-indigo-950/25"
                      >
                        Log Live Exam Worksheet
                      </button>
                    </form>
                  )}

                  {exams.length === 0 ? (
                    <div className="text-center py-10 bg-slate-950/10 rounded-2xl border border-slate-800/40 p-4">
                      <Inbox className="h-10 w-10 text-slate-600 mx-auto mb-2.5" />
                      <h4 className="text-sm font-bold text-slate-300">No Assessment Exams Set</h4>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">This syllabus group has not declared periodic examinations yet. Click "Register Exam Category" to start.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2">
                      
                      {/* Select exam left sidebar column */}
                      <div className="md:col-span-4 space-y-3">
                        <label className="block text-[10px] text-indigo-300 font-bold font-mono uppercase tracking-widest">Select Exam Focus</label>
                        <select
                          className="w-full p-3 bg-slate-950 border border-slate-800 rounded-2xl text-slate-100 text-xs font-mono focus:outline-none focus:cursor-pointer"
                          value={selectedExamId}
                          onChange={handleExamChange}
                        >
                          {exams.map(ex => (
                            <option key={ex.id} value={ex.id} className="bg-slate-950">
                              [{ex.type}] {ex.title}
                            </option>
                          ))}
                        </select>

                        {/* Selected Exam quick specs panel */}
                        {selectedExamId && (
                          <div className="p-4 bg-slate-950/20 rounded-2xl border border-slate-800/40 space-y-2.5 text-xs text-slate-300">
                            {(() => {
                              const currEx = exams.find(ex => ex.id === selectedExamId);
                              if (!currEx) return null;
                              const isReleased = !!(currEx.isPublished || (currEx as any).is_published);
                              return (
                                <>
                                  <div className="flex justify-between font-mono text-[10px] text-slate-400 uppercase tracking-wider">
                                    <span>Type: {currEx.type}</span>
                                    <span>Max Marks: {currEx.maxMarks}</span>
                                  </div>
                                  <div className="flex items-center justify-between text-[11px] pt-1">
                                    <span className="text-slate-400">Status:</span>
                                    {isReleased ? (
                                      <span className="px-2 py-0.5 rounded text-[9px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">Released</span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded text-[9px] font-mono uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">Draft</span>
                                    )}
                                  </div>

                                  {!isReleased && (
                                    <button
                                      type="button"
                                      onClick={handlePublishExam}
                                      className="w-full mt-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold uppercase text-[10px] tracking-wider rounded-xl cursor-pointer shadow-lg shadow-emerald-950/30 transition flex items-center justify-center gap-1.5"
                                    >
                                      <Send className="h-3 w-3" /> Publish Results
                                    </button>
                                  )}

                                  <div className="border-t border-slate-850/60 my-2 pt-3">
                                    <button
                                      type="button"
                                      onClick={() => setIsEditingExam(!isEditingExam)}
                                      className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-indigo-300 border border-indigo-500/10 font-mono text-[10px] uppercase font-bold tracking-wider rounded-xl cursor-pointer transition flex items-center justify-center gap-1"
                                    >
                                      {isEditingExam ? 'Cancel Settings Edit' : 'Edit Exam Details'}
                                    </button>
                                  </div>

                                  {isEditingExam && (
                                    <form onSubmit={handleUpdateExamSettings} className="space-y-3 pt-2 border-t border-slate-800/20 animate-slide-in">
                                      <div>
                                        <label className="block text-[9px] text-slate-400 font-bold uppercase font-mono mb-1">Title</label>
                                        <input
                                          type="text"
                                          value={editExamTitle}
                                          onChange={e => setEditExamTitle(e.target.value)}
                                          className="w-full px-2 py-1.5 bg-slate-950 border border-slate-850 text-white font-mono text-xs rounded focus:outline-none"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-[9px] text-slate-400 font-bold uppercase font-mono mb-1">Type</label>
                                        <select
                                          value={editExamType}
                                          onChange={e => setEditExamType(e.target.value as any)}
                                          className="w-full px-2 py-1.5 bg-slate-950 border border-slate-850 text-slate-200 font-mono text-xs rounded focus:outline-none"
                                        >
                                          <option value="QUIZ">Quiz Event</option>
                                          <option value="MIDTERM">Midterm Exams</option>
                                          <option value="FINAL">Syllabus Finals</option>
                                          <option value="PRACTICAL">Lab Practicals</option>
                                        </select>
                                      </div>
                                      <div>
                                        <label className="block text-[9px] text-slate-400 font-bold uppercase font-mono mb-1">Max Marks</label>
                                        <input
                                          type="number"
                                          value={editExamMaxMarks}
                                          onChange={e => setEditExamMaxMarks(Number(e.target.value))}
                                          className="w-full px-2 py-1.5 bg-slate-950 border border-slate-850 text-white font-mono text-xs rounded focus:outline-none"
                                        />
                                      </div>
                                      <button
                                        type="submit"
                                        className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-bold text-[9px] uppercase tracking-wide rounded cursor-pointer transition"
                                      >
                                        Apply Config Changes
                                      </button>
                                    </form>
                                  )}

                                  <p className="text-[10px] leading-normal pt-1.5 border-t border-slate-850 text-slate-500 italic">
                                    Raw student records entered are preserved as unpublished draft values until the results toggle releases notifications.
                                  </p>
                                </>
                              );
                            })()}
                          </div>
                        )}
                      </div>

                      {/* Marks Sheets entries column */}
                      <div className="md:col-span-8 space-y-4">
                        <div className="flex justify-between items-center bg-slate-950/20 p-3 rounded-xl border border-slate-805">
                          <span className="text-xs font-bold uppercase text-indigo-300 font-mono tracking-widest">Enrollment Marks Register Ledger</span>
                          <span className="text-[10px] font-mono text-slate-400">{filteredEnrollments.length} Students Qualified</span>
                        </div>

                        <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950/15">
                          <table className="min-w-full divide-y divide-slate-805 text-xs">
                            <thead className="bg-slate-900/60 text-slate-400 text-[9px] font-mono uppercase font-bold tracking-wider">
                              <tr>
                                <th className="px-4 py-3 text-left">Student</th>
                                <th className="px-4 py-3 text-center">Marks Score</th>
                                <th className="px-4 py-3 text-center">GPA Point</th>
                                <th className="px-4 py-3 text-right">Raw Entry Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/40">
                              {filteredEnrollments.length === 0 ? (
                                <tr>
                                  <td colSpan={4} className="px-4 py-6 text-center text-slate-550 font-semibold italic">
                                    No students registered.
                                  </td>
                                </tr>
                              ) : (
                                filteredEnrollments.map(stud => {
                                  const savedMark = examMarks.find(m => m.studentId === stud.studentId);
                                  const key = `${selectedExamId}-${stud.studentId}`;
                                  const isEditing = editingMarkKey === key;
                                  const maxMarksValue = exams.find(ex => ex.id === selectedExamId)?.maxMarks || 100;

                                  return (
                                    <tr key={stud.id} className="hover:bg-slate-900/10">
                                      
                                      {/* Student info */}
                                      <td className="px-4 py-3.5 whitespace-nowrap text-left">
                                        <span className="block font-bold text-white">{stud.studentName}</span>
                                        <span className="block font-mono text-[9px] text-indigo-300 mt-0.5">{stud.studentRegistrationNumber}</span>
                                      </td>

                                      {/* Marks Entry cell */}
                                      <td className="px-4 py-3.5 whitespace-nowrap text-center">
                                        {isEditing ? (
                                          <div className="flex items-center gap-1.5 justify-center">
                                            <input 
                                              type="number"
                                              min="0"
                                              max={maxMarksValue}
                                              value={obtainedMarksInput}
                                              onChange={evt => setObtainedMarksInput(Math.min(Math.max(Number(evt.target.value), 0), maxMarksValue))}
                                              className="w-16 px-2 py-1 bg-slate-950 border border-slate-700 text-white font-mono font-bold text-center rounded-lg focus:outline-none"
                                            />
                                            <span className="text-slate-500 font-mono">/ {maxMarksValue}</span>
                                          </div>
                                        ) : (
                                          <span className="font-mono font-bold text-sm text-white">
                                            {savedMark ? `${savedMark.obtainedMarks}` : <span className="text-slate-500 italic text-[10px]">Unrecorded</span>}
                                          </span>
                                        )}
                                      </td>

                                      {/* GPA Auto Calculation Cell */}
                                      <td className="px-4 py-3.5 whitespace-nowrap text-center text-xs">
                                        {isEditing ? (
                                          <span className="font-mono font-bold text-indigo-300">
                                            {((obtainedMarksInput / maxMarksValue) * 10).toFixed(2)} pts
                                          </span>
                                        ) : (
                                          <span className={`font-mono font-bold ${savedMark && Number(savedMark.gradePoint) >= 7.5 ? 'text-emerald-400' : savedMark && Number(savedMark.gradePoint) < 5.0 ? 'text-amber-500' : 'text-slate-400'}`}>
                                            {savedMark ? `${savedMark.gradePoint} IP` : '—'}
                                          </span>
                                        )}
                                      </td>

                                      {/* Action buttons list */}
                                      <td className="px-4 py-3.5 whitespace-nowrap text-right text-xs">
                                        {isEditing ? (
                                          <div className="flex justify-end gap-1.5">
                                            {/* Remarks Box */}
                                            <input 
                                              type="text" 
                                              placeholder="Remarks (optional)"
                                              value={obtainedRemarksInput}
                                              onChange={evt => setObtainedRemarksInput(evt.target.value)}
                                              className="px-2 py-1 text-slate-300 bg-slate-900 border border-slate-700 rounded-lg text-xs max-w-[120px]"
                                            />
                                            <button
                                              onClick={() => handleSaveExamMark(stud.studentId)}
                                              className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shrink-0 cursor-pointer"
                                              title="Save Score"
                                            >
                                              <Save className="h-3.5 w-3.5" />
                                            </button>
                                            <button
                                              onClick={() => setEditingMarkKey(null)}
                                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg shrink-0 cursor-pointer"
                                              title="Cancel"
                                            >
                                              <X className="h-3.5 w-3.5" />
                                            </button>
                                          </div>
                                        ) : (
                                          <button
                                            onClick={() => {
                                              setEditingMarkKey(key);
                                              setObtainedMarksInput(savedMark ? Number(savedMark.obtainedMarks) : 0);
                                              setObtainedRemarksInput(savedMark?.remarks || '');
                                            }}
                                            className="px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-850 hover:text-white text-slate-300 font-bold transition text-[10px] cursor-pointer inline-flex items-center gap-1"
                                          >
                                            <FilePenLine className="h-3 w-3" />
                                            {savedMark ? 'Modify Entry' : 'Post Marks'}
                                          </button>
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

                </div>
              )}

              {/* TAB 4: ANNOUNCEMENTS BROADCAST */}
              {activeTab === 'announcements' && (
                <div className="bg-slate-900/40 rounded-3xl border border-slate-800 p-6 space-y-6 backdrop-blur-md">
                  
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <BellRing className="h-5 w-5 text-indigo-400" /> classroom live announcements
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">Broadcast direct academic, reschedule, or review notices straight to the students of this class group.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                    
                    {/* Announce dispatch form */}
                    <form onSubmit={handleSendAnnouncement} className="md:col-span-5 p-5 bg-slate-950/40 border border-slate-800 rounded-2xl space-y-4 shadow-inner">
                      <h4 className="text-xs font-bold uppercase text-indigo-300 font-mono tracking-widest flex items-center gap-1.5">
                        <Send className="h-4 w-4" /> Dispatch New Bullet
                      </h4>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Announcement Title Header</label>
                        <input 
                          type="text"
                          required
                          placeholder="e.g. Schedule Change: Extra Lab Hour"
                          value={announceTitle}
                          onChange={evt => setAnnounceTitle(evt.target.value)}
                          className="w-full px-3 py-2 bg-slate-905 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Message Content Body</label>
                        <textarea 
                          rows={4}
                          required
                          placeholder="Describe instructions, timelines, link elements, or homework details clearly..."
                          value={announceMsg}
                          onChange={evt => setAnnounceMsg(evt.target.value)}
                          className="w-full px-3 py-2 bg-slate-905 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-550 resize-y"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition select-none flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                      >
                        <Send className="h-3.5 w-3.5" />
                        Send Broadcast to Cohort
                      </button>
                    </form>

                    {/* Historical Announcements Column */}
                    <div className="md:col-span-7 space-y-4">
                      <h4 className="text-xs font-bold uppercase text-indigo-300 font-mono tracking-widest flex items-center gap-1">
                        <Calendar className="h-4 w-4" /> Historic Classroom Broadcasts
                      </h4>

                      {announcementHistory.length === 0 ? (
                        <div className="p-6 bg-slate-950/15 rounded-2xl border border-slate-800/40 text-center">
                          <Info className="h-8 w-8 text-indigo-400/60 mx-auto mb-2" />
                          <p className="text-xs text-slate-400">No announcements broadcasted in this session yet.</p>
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                          {announcementHistory.map((not, idx) => (
                            <div key={idx} className="p-4 bg-slate-950/20 border border-slate-805 rounded-xl space-y-1.5 shadow-sm animate-fade-in text-xs">
                              <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                                <span className="font-bold text-indigo-300 uppercase">📢 BROADCAST</span>
                                <span>{not.date}</span>
                              </div>
                              <h5 className="font-bold text-white">{not.title}</h5>
                              <p className="text-slate-350 leading-relaxed">{not.message}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>

                </div>
              )}

              {/* TAB 5: COURSE INSIGHTS ANALYTICS */}
              {activeTab === 'analytics' && (
                <div className="bg-slate-900/40 rounded-3xl border border-slate-800 p-6 space-y-6 backdrop-blur-md">
                  
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <BarChart2 className="h-5 w-5 text-indigo-400" /> Syllabus Class cohort analytics
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">Real-time statistics regarding grades concentration, session attendance distribution, and at-risk early warnings.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Graph 1: Simple interactive Tailwind Grade Breakdown Histogram */}
                    <div className="p-5 bg-slate-950/20 border border-slate-800/60 rounded-2xl space-y-4 shadow-sm">
                      <h4 className="text-xs font-bold uppercase text-indigo-300 font-mono tracking-widest flex items-center gap-1.5">
                        <GraduationCap className="h-4 w-4" /> Letter Grades Histogram Distribution
                      </h4>

                      <div className="space-y-2 pt-2">
                        {gradeBreakdownList.map((row, idx) => {
                          const maxCount = Math.max(...gradeBreakdownList.map(r => r.count), 1);
                          const percentage = (row.count / maxCount) * 100;
                          return (
                            <div key={idx} className="flex items-center gap-2 text-xs">
                              <span className="w-14 font-mono font-bold text-slate-300 shrink-0">{row.grade}</span>
                              <div className="flex-grow h-6 bg-slate-900 rounded-lg overflow-hidden border border-slate-800 flex items-center pr-2 relative">
                                <div 
                                  className={`h-full opacity-65 ${
                                    row.grade === 'F' 
                                      ? 'bg-rose-500' 
                                      : row.grade === 'Pending' 
                                      ? 'bg-slate-700' 
                                      : 'bg-indigo-550'
                                  }`}
                                  style={{ width: `${percentage}%` }}
                                ></div>
                                <span className="absolute right-2 font-mono font-bold text-[10px] text-white">
                                  {row.count} Student{row.count !== 1 ? 's' : ''}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Graph 2: At-Risk monitoring cohort indicators */}
                    <div className="p-5 bg-slate-950/20 border border-slate-800/60 rounded-2xl space-y-4 shadow-sm text-xs">
                      <h4 className="text-xs font-semibold uppercase text-indigo-300 font-mono tracking-widest flex items-center gap-1.5">
                        <ShieldAlert className="h-4 w-4 text-amber-400" /> At-Risk Cohort Indicators (Warnings)
                      </h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        The early-detection system highlights students who have overall attendance index under 75% or holding failing 'F' statuses. Work with them proactively to improve performance.
                      </p>

                      <div className="space-y-2 pt-1 max-h-[220px] overflow-y-auto">
                        {atRiskStudents.length === 0 ? (
                          <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 text-emerald-400 rounded-xl text-center font-semibold">
                            ✓ Great Job! All cohort members maintain safe performance levels.
                          </div>
                        ) : (
                          atRiskStudents.map((ar, idx) => (
                            <div key={idx} className="p-3 bg-slate-900 border border-slate-800/80 rounded-xl flex justify-between items-center gap-2">
                              <div>
                                <span className="block font-bold text-white">{ar.studentName}</span>
                                <span className="block font-mono text-[9px] text-slate-400 mt-0.5">{ar.studentRegistrationNumber}</span>
                              </div>
                              <div className="text-right">
                                {ar.attendancePercentage! < 75 && (
                                  <span className="inline-block px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono font-bold text-[8px] uppercase mr-1">
                                    Low Attendance: {ar.attendancePercentage}%
                                  </span>
                                )}
                                {ar.grade === 'F' && (
                                  <span className="inline-block px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-mono font-bold text-[8px] uppercase">
                                    Failing Grade: F
                                  </span>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                  </div>

                </div>
              )}

            </div>
          )}

        </div>
      )}

    </div>
  );
};
