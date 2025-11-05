"use client";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchAllAssignments, fetchAllSubmissions, fetchAllUsers, fetchAllGroups } from "@/utils/api";
import Link from "next/link";
import { UserTeacherDashboard, AssignmentTeacherDashboard, SubmissionTeacherDashboard, GroupDashboard } from "@/types/interfaces";

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [assignments, setAssignments] = useState<AssignmentTeacherDashboard[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionTeacherDashboard[]>([]);
  const [users, setUsers] = useState<UserTeacherDashboard[]>([]);
  const [groups, setGroups] = useState<GroupDashboard[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    } else if (!loading && user && user.role.name !== "admin") {
      router.push("/");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (user && user.role.name === "admin") {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoadingData(true);
      const [assignmentsData, submissionsData, usersData, groupsData] = await Promise.all([
        fetchAllAssignments(),
        fetchAllSubmissions(),
        fetchAllUsers(),
        fetchAllGroups(),
      ]);
      setAssignments(assignmentsData as AssignmentTeacherDashboard[]);
      setSubmissions(submissionsData as SubmissionTeacherDashboard[]);
      setUsers(usersData as UserTeacherDashboard[]);
      setGroups(groupsData as GroupDashboard[]);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const getStudentCount = () => {
    return users.filter(u => u.role.name === "student").length;
  };

  const getTeacherCount = () => {
    return users.filter(u => u.role.name === "teacher").length;
  };

  const getPendingCount = () => {
    return users.filter(u => u.role.name === "pending").length;
  };

  const getAdminCount = () => {
    return users.filter(u => u.role.name === "admin").length;
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
          <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back, {user.name}! You have full system access.</p>
        </div>

        {/* System Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Users</h3>
            <p className="text-3xl font-bold text-blue-600">{users.length}</p>
            <p className="text-sm text-gray-500 mt-1">
              {getAdminCount()} admins, {getTeacherCount()} teachers, {getStudentCount()} students
            </p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Pending Approvals</h3>
            <p className="text-3xl font-bold text-orange-600">{getPendingCount()}</p>
            <p className="text-sm text-gray-500 mt-1">Awaiting role assignment</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Assignments</h3>
            <p className="text-3xl font-bold text-green-600">{assignments.length}</p>
            <p className="text-sm text-gray-500 mt-1">{submissions.length} submissions</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Groups</h3>
            <p className="text-3xl font-bold text-purple-600">{groups.length}</p>
            <p className="text-sm text-gray-500 mt-1">Active student groups</p>
          </div>
        </div>

        {/* Management Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* User Management */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">User Management</h3>
            <div className="space-y-3">
              <Link
                href="/admin/users"
                className="block w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors text-center"
              >
                Manage All Users
              </Link>
              <Link
                href="/admin/users/pending"
                className="block w-full bg-orange-600 text-white px-4 py-3 rounded-lg hover:bg-orange-700 transition-colors text-center"
              >
                Approve Pending Users
              </Link>
              <Link
                href="/admin/users/create"
                className="block w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors text-center"
              >
                Create New User
              </Link>
              <Link
                href="/teacher/courses"
                className="block w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors text-center"
              >
                All Courses
              </Link>
            </div>
          </div>

          {/* Assignment Management */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Assignment Management</h3>
            <div className="space-y-3">
              <Link
                href="/admin/assignments"
                className="block w-full bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition-colors text-center"
              >
                Manage Assignments
              </Link>
              <Link
                href="/admin/assignments/create"
                className="block w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors text-center"
              >
                Create Assignment
              </Link>
              <Link
                href="/admin/submissions"
                className="block w-full bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-700 transition-colors text-center"
              >
                View All Submissions
              </Link>
            </div>
          </div>

          {/* System Management */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">System Management</h3>
            <div className="space-y-3">
              <Link
                href="/admin/groups"
                className="block w-full bg-cyan-600 text-white px-4 py-3 rounded-lg hover:bg-cyan-700 transition-colors text-center"
              >
                Manage Groups
              </Link>
              <Link
                href="/admin/roles"
                className="block w-full bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700 transition-colors text-center"
              >
                Manage Roles
              </Link>
              <Link
                href="/admin/analytics"
                className="block w-full bg-pink-600 text-white px-4 py-3 rounded-lg hover:bg-pink-700 transition-colors text-center"
              >
                View Analytics
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Users */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Recent Users</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {users.slice(0, 5).map((user) => (
                  <div key={user.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{user.name}</p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.role.name === "pending"
                        ? "bg-orange-100 text-orange-800"
                        : user.role.name === "admin"
                        ? "bg-red-100 text-red-800"
                        : user.role.name === "teacher"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-green-100 text-green-800"
                    }`}>
                      {user.role.name}
                    </span>
                  </div>
                ))}
                {users.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No users found.</p>
                )}
              </div>
            </div>
          </div>

          {/* Recent Assignments */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Recent Assignments</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {assignments.slice(0, 5).map((assignment) => {
                  const submissionCount = submissions.filter(s => s.assignment_id === assignment.id).length;
                  return (
                    <div key={assignment.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold">
                        A
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{assignment.title}</p>
                        <p className="text-sm text-gray-600">
                          Due: {new Date(assignment.due_date).toLocaleDateString()} • {submissionCount} submissions
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {assignment.is_group_work && (
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                            Group
                          </span>
                        )}
                        <Link
                          href={`/student/assignments/${assignment.id}`}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  );
                })}
                {assignments.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No assignments found.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 