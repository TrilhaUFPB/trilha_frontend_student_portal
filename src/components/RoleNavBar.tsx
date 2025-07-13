"use client";
import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import type { UserRole } from "@/context/AuthContext";

interface RoleNavBarProps {
  role: UserRole;
}

export default function RoleNavBar({ role }: RoleNavBarProps) {
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <nav className="w-full bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-xl font-bold text-gray-800">
              Trilha Student Portal
            </Link>
            <Link 
              href="/login" 
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Login
            </Link>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="w-full bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-xl font-bold text-gray-800">
              Trilha Student Portal
            </Link>
            
            {role === "pending" && (
              <div className="flex items-center gap-6">
                <Link 
                  href="/pending" 
                  className="text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Status
                </Link>
              </div>
            )}

            {role === "student" && (
              <div className="flex items-center gap-6">
                <Link 
                  href="/student/dashboard" 
                  className="text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Dashboard
                </Link>
                <Link 
                  href="/student/assignments" 
                  className="text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Assignments
                </Link>
                <Link 
                  href="/student/submissions" 
                  className="text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Submissions
                </Link>
                <Link 
                  href="/student/groups" 
                  className="text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Groups
                </Link>
              </div>
            )}

            {role === "teacher" && (
              <div className="flex items-center gap-6">
                <Link 
                  href="/teacher/dashboard" 
                  className="text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Dashboard
                </Link>
                <Link 
                  href="/teacher/assignments" 
                  className="text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Assignments
                </Link>
                <Link 
                  href="/teacher/submissions" 
                  className="text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Submissions
                </Link>
                <Link 
                  href="/teacher/users" 
                  className="text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Users
                </Link>
              </div>
            )}

            {role === "admin" && (
              <div className="flex items-center gap-6">
                <Link 
                  href="/admin/dashboard" 
                  className="text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Dashboard
                </Link>
                <Link 
                  href="/admin/users" 
                  className="text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Users
                </Link>
                <Link 
                  href="/admin/assignments" 
                  className="text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Assignments
                </Link>
                <Link 
                  href="/admin/submissions" 
                  className="text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Submissions
                </Link>
                <Link 
                  href="/admin/groups" 
                  className="text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Groups
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              Welcome, <span className="font-medium">{user.name}</span>
              <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                role === "pending"
                  ? "bg-orange-100 text-orange-800"
                  : role === "admin"
                  ? "bg-red-100 text-red-800"
                  : role === "teacher"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-green-100 text-green-800"
              }`}>
                {role}
              </span>
            </div>
            <button 
              onClick={logout}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
} 