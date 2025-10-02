"use client";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchAllAssignments, fetchAllSubmissions, fetchAllUsers } from "@/utils/api";
import Link from "next/link";
import { AssignmentTeacherDashboard, SubmissionTeacherDashboard, UserTeacherDashboard } from "@/types/interfaces";

export default function TeacherDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [assignments, setAssignments] = useState<AssignmentTeacherDashboard[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionTeacherDashboard[]>([]);
  const [users, setUsers] = useState<UserTeacherDashboard[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    } else if (!loading && user && user.role.name !== "teacher") {
      router.push("/");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (user && user.role.name === "teacher") {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoadingData(true);
      const [assignmentsData, submissionsData, usersData] = await Promise.all([
        fetchAllAssignments(),
        fetchAllSubmissions(),
        fetchAllUsers(),
      ]);
      setAssignments(assignmentsData as AssignmentTeacherDashboard[]);
      setSubmissions(submissionsData as SubmissionTeacherDashboard[]);
      setUsers(usersData as UserTeacherDashboard[]);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const getSubmissionCount = (assignmentId: number) => {
    return submissions.filter(s => s.assignment_id === assignmentId).length;
  };

  const getStudentCount = () => {
    return users.filter(u => u.role.name === "student").length;
  };

  const getPendingCount = () => {
    return users.filter(u => u.role.name === "pending").length;
  };

  if (loading || loadingData) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8">
        <h1 className="text-2xl font-bold mb-4">Loading...</h1>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Teacher Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back, {user.name}!</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Assignments</h3>
            <p className="text-3xl font-bold text-blue-600">{assignments.length}</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Submissions</h3>
            <p className="text-3xl font-bold text-green-600">{submissions.length}</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Students</h3>
            <p className="text-3xl font-bold text-purple-600">{getStudentCount()}</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Pending Approvals</h3>
            <p className="text-3xl font-bold text-orange-600">{getPendingCount()}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Assignment Management</h3>
            <div className="space-y-3">
              <Link
                href="/teacher/assignments"
                className="block w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors text-center"
              >
                Manage Assignments
              </Link>
              <Link
                href="/teacher/assignments/create"
                className="block w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors text-center"
              >
                Create Assignment
              </Link>
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Submission Review</h3>
            <div className="space-y-3">
              <Link
                href="/teacher/submissions"
                className="block w-full bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition-colors text-center"
              >
                Review Submissions
              </Link>
              <Link
                href="/teacher/submissions/pending"
                className="block w-full bg-orange-600 text-white px-4 py-3 rounded-lg hover:bg-orange-700 transition-colors text-center"
              >
                Pending Reviews
              </Link>
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">User Management</h3>
            <div className="space-y-3">
              <Link
                href="/teacher/users"
                className="block w-full bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700 transition-colors text-center"
              >
                View Users
              </Link>
              <Link
                href="/teacher/users/pending"
                className="block w-full bg-yellow-600 text-white px-4 py-3 rounded-lg hover:bg-yellow-700 transition-colors text-center"
              >
                Pending Approvals
              </Link>
              <Link
                href="/teacher/courses"
                className="block w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors text-center"
              >
                All Courses
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Assignments */}
        <div className="bg-white rounded-lg shadow-sm mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Recent Assignments</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {assignments.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>No assignments created yet.</p>
                <Link
                  href="/teacher/assignments/create"
                  className="inline-block mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Your First Assignment
                </Link>
              </div>
            ) : (
              assignments.slice(0, 5).map((assignment) => {
                const submissionCount = getSubmissionCount(assignment.id);
                
                return (
                  <div key={assignment.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-800">
                            {assignment.title}
                          </h3>
                          {assignment.is_group_work && (
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                              Group Work
                            </span>
                          )}
                          <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium">
                            {submissionCount} submissions
                          </span>
                        </div>
                        <p className="text-gray-600 mb-3 line-clamp-2">
                          {assignment.description}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>
                            Due: {new Date(assignment.due_date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4 flex flex-col gap-2">
                        <Link
                          href={`/teacher/assignments/${assignment.id}`}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-center"
                        >
                          View Details
                        </Link>
                        <Link
                          href={`/teacher/submissions?assignment=${assignment.id}`}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-center"
                        >
                          Review Submissions
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Recent Activity</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {submissions.slice(0, 5).map((submission) => {
                const assignment = assignments.find(a => a.id === submission.assignment_id);
                return (
                  <div key={submission.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">
                        New submission for "{assignment?.title}"
                      </p>
                      <p className="text-sm text-gray-600">
                        Submitted on {new Date(submission.submitted_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Link
                      href={`/teacher/submissions/${submission.id}`}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                    >
                      Review
                    </Link>
                  </div>
                );
              })}
              {submissions.length === 0 && (
                <p className="text-gray-500 text-center py-8">No recent activity.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 