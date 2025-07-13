"use client";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchAllUsers, fetchAllRoles, updateUser } from "@/utils/api";
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

interface Role {
  id: number;
  name: string;
}

export default function AdminPendingUsersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [processingUserId, setProcessingUserId] = useState<number | null>(null);

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
      const [usersData, rolesData] = await Promise.all([
        fetchAllUsers(),
        fetchAllRoles(),
      ]);
      
      // Filter only pending users
      const allUsers = usersData as User[];
      setPendingUsers(allUsers.filter(u => u.role.name === "pending"));
      setRoles(rolesData as Role[]);
    } catch (error) {
      console.error("Error loading data:", error);
      alert("Error loading pending users. Please try again.");
    } finally {
      setLoadingData(false);
    }
  };

  const handleApproveUser = async (userId: number, roleId: number) => {
    try {
      setProcessingUserId(userId);
      const userToUpdate = pendingUsers.find(u => u.id === userId);
      if (!userToUpdate) return;

      await updateUser(userId, {
        ...userToUpdate,
        role_id: roleId,
      });

      // Refresh data
      await loadData();
      alert("User approved successfully!");
    } catch (error) {
      console.error("Error approving user:", error);
      alert("Error approving user. Please try again.");
    } finally {
      setProcessingUserId(null);
    }
  };

  const getRoleName = (roleId: number) => {
    const role = roles.find(r => r.id === roleId);
    return role ? role.name : "Unknown";
  };

  const getAvailableRoles = () => {
    return roles.filter(r => r.name !== "pending");
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
              <h1 className="text-3xl font-bold text-gray-800">Pending User Approvals</h1>
              <p className="text-gray-600 mt-2">Review and approve new user registrations</p>
            </div>
            <Link
              href="/admin/users"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              All Users
            </Link>
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
                <h3 className="text-lg font-medium text-gray-900 mb-2">All Caught Up!</h3>
                <p>No pending user approvals at this time.</p>
                <Link
                  href="/admin/users/create"
                  className="inline-block mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Create New User
                </Link>
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
                        <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">
                          Pending Approval
                        </span>
                      </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-2">
                            Assign Role to Approve User:
                          </h4>
                          <p className="text-sm text-gray-600">
                            Choose the appropriate role for this user to complete their registration.
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          {getAvailableRoles().map((role) => (
                            <button
                              key={role.id}
                              onClick={() => handleApproveUser(pendingUser.id, role.id)}
                              disabled={processingUserId === pendingUser.id}
                              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                role.name === "student"
                                  ? "bg-green-600 hover:bg-green-700 text-white"
                                  : role.name === "teacher"
                                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                                  : role.name === "admin"
                                  ? "bg-red-600 hover:bg-red-700 text-white"
                                  : "bg-gray-600 hover:bg-gray-700 text-white"
                              } ${
                                processingUserId === pendingUser.id
                                  ? "opacity-50 cursor-not-allowed"
                                  : ""
                              }`}
                            >
                              {processingUserId === pendingUser.id ? (
                                "Processing..."
                              ) : (
                                `Approve as ${role.name.charAt(0).toUpperCase() + role.name.slice(1)}`
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Role Descriptions */}
        {pendingUsers.length > 0 && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">Role Descriptions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4">
                <h4 className="font-medium text-green-800 mb-2">Student</h4>
                <p className="text-sm text-gray-600">
                  Can view assignments, submit work, join groups, and interact with their own submissions.
                </p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">Teacher</h4>
                <p className="text-sm text-gray-600">
                  Can create assignments, review submissions, add ratings and comments, and view users.
                </p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <h4 className="font-medium text-red-800 mb-2">Admin</h4>
                <p className="text-sm text-gray-600">
                  Full system access including user management, role assignment, and all other features.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
} 