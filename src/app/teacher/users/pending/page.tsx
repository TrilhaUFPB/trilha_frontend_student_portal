"use client";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchAllUsers } from "@/utils/api";
import Link from "next/link";

interface User {
  id: number;
  name: string;
  email: string;
  role_id: number;
  role: { id: number; name: string };
  created_at: string;
  updated_at: string;
}

export default function TeacherPendingUsersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
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
      const usersData = await fetchAllUsers();
      
      // Filter only pending users
      const allUsers = usersData as User[];
      setPendingUsers(allUsers.filter(u => u.role.name === "pending"));
    } catch (error) {
      console.error("Error loading data:", error);
      alert("Error loading pending users. Please try again.");
    } finally {
      setLoadingData(false);
    }
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
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Pending Users</h1>
              <p className="text-gray-600 mt-2">View users awaiting approval</p>
            </div>
            <Link
              href="/teacher/users"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              All Users
            </Link>
          </div>
        </div>

        {/* Information Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-blue-800 font-medium">Information Only</p>
              <p className="text-blue-700 text-sm">As a teacher, you can view pending users but cannot approve them. Contact an administrator to approve these users.</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Pending Approvals</h3>
              <p className="text-gray-600">Users waiting for role assignment</p>
            </div>
            <div className="text-3xl font-bold text-orange-600">
              {pendingUsers.length}
            </div>
          </div>
        </div>

        {/* Pending Users List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Users Awaiting Approval</h2>
          </div>
          <div>
            {pendingUsers.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Users</h3>
                <p>All users have been approved or there are no new registrations.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {pendingUsers.map((pendingUser) => (
                  <div key={pendingUser.id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                          {pendingUser.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-medium text-gray-900">
                            {pendingUser.name}
                          </h3>
                          <p className="text-gray-600">{pendingUser.email}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            Registered on {new Date(pendingUser.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                          Pending Approval
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">
                          User Information:
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Registration Date:</span>
                            <span className="ml-2 font-medium text-gray-900">
                              {new Date(pendingUser.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Current Status:</span>
                            <span className="ml-2 font-medium text-orange-600">
                              Awaiting Administrator Approval
                            </span>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-xs text-gray-500">
                            This user has registered and is waiting for an administrator to assign them a role (Student, Teacher, or Admin).
                            As a teacher, you can view this information but cannot approve users. Contact an administrator if this user should be approved.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Information */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-900 mb-4">
            <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L5.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            Want to Help with User Approvals?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-yellow-800 mb-2">Contact Administrator</h4>
              <p className="text-sm text-yellow-700 mb-3">
                If you know any of these pending users and can recommend their approval, contact a system administrator.
              </p>
              <div className="text-sm text-yellow-700">
                <p><strong>Admin Contact:</strong> admin@trilha.com</p>
                <p><strong>Include:</strong> User's name and recommended role</p>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-yellow-800 mb-2">Role Recommendations</h4>
              <p className="text-sm text-yellow-700 mb-3">
                Help administrators by suggesting appropriate roles:
              </p>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• <strong>Student:</strong> For learners taking assignments</li>
                <li>• <strong>Teacher:</strong> For instructors managing courses</li>
                <li>• <strong>Admin:</strong> For system administrators only</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 