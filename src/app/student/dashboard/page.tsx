"use client";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchAllAssignments, fetchAllSubmissions } from "@/utils/api";
import Link from "next/link";
import { SubmissionTeacherDashboard, AssignmentTeacherDashboard } from "@/types/interfaces";

export default function StudentDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [assignments, setAssignments] = useState<AssignmentTeacherDashboard[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionTeacherDashboard[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    } else if (!loading && user && user.role.name !== "student") {
      router.push("/");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (user && user.role.name === "student") {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoadingData(true);
      const [assignmentsData, submissionsData] = await Promise.all([
        fetchAllAssignments(),
        fetchAllSubmissions(),
      ]);
      setAssignments(assignmentsData as AssignmentTeacherDashboard[]);
      setSubmissions(submissionsData as SubmissionTeacherDashboard[]);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const getSubmissionStatus = (assignmentId: number) => {
    const submission = submissions.find(s => s.assignment_id === assignmentId);
    if (submission) {
      return { status: "submitted", submission };
    }
    return { status: "not_submitted", submission: null };
  };

  const isOverdue = (due_date: string) => {
    return new Date(due_date) < new Date();
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
          <h1 className="text-3xl font-bold text-gray-800">Student Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back, {user.name}!</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Assignments</h3>
            <p className="text-3xl font-bold text-blue-600">{assignments.length}</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Submitted</h3>
            <p className="text-3xl font-bold text-green-600">
              {assignments.filter(a => getSubmissionStatus(a.id).status === "submitted").length}
            </p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Pending</h3>
            <p className="text-3xl font-bold text-orange-600">
              {assignments.filter(a => getSubmissionStatus(a.id).status === "not_submitted").length}
            </p>
          </div>
        </div>

        {/* Assignments List */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Assignments</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {assignments.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>No assignments available yet.</p>
              </div>
            ) : (
              assignments.map((assignment) => {
                const submissionStatus = getSubmissionStatus(assignment.id);
                const overdue = isOverdue(assignment.due_date);
                
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
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            submissionStatus.status === "submitted"
                              ? "bg-green-100 text-green-800"
                              : overdue
                                ? "bg-red-100 text-red-800"
                                : "bg-orange-100 text-orange-800"
                          }`}>
                            {submissionStatus.status === "submitted"
                              ? "Submitted"
                              : overdue
                                ? "Overdue"
                                : "Pending"
                            }
                          </span>
                        </div>
                        <p className="text-gray-600 mb-3 line-clamp-2">
                          {assignment.description}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>
                            Due: {new Date(assignment.due_date).toLocaleDateString()}
                          </span>
                          {submissionStatus.status === "submitted" && (
                            <span>
                              Submitted: {new Date(submissionStatus.submission!.submitted_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="ml-4 flex flex-col gap-2">
                        <Link
                          href={`/student/assignments/${assignment.id}`}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-center"
                        >
                          View Details
                        </Link>
                        {submissionStatus.status === "submitted" && (
                          <a
                            href={submissionStatus.submission!.github_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-center text-sm"
                          >
                            View Submission
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link
                href="/student/submissions"
                className="block w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors text-center"
              >
                View All Submissions
              </Link>
              <Link
                href="/student/groups"
                className="block w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors text-center"
              >
                Manage Groups
              </Link>
              <Link
                href="/student/courses"
                className="block w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors text-center"
              >
                All Courses
              </Link>
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
            <div className="space-y-3 text-sm text-gray-600">
              {submissions.slice(0, 3).map((submission) => {
                const assignment = assignments.find(a => a.id === submission.assignment_id);
                return (
                  <div key={submission.id} className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>
                      Submitted "{assignment?.title}" on {new Date(submission.submitted_at).toLocaleDateString()}
                    </span>
                  </div>
                );
              })}
              {submissions.length === 0 && (
                <p className="text-gray-500">No recent activity.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 