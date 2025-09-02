"use client";

import React, { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";


const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If user is already authenticated, redirect to appropriate dashboard
    if (!loading && user) {
      switch (user.role.name) {
        case "pending":
          router.replace("/pending");
          break;
        case "student":
          router.replace("/student/dashboard");
          break;
        case "teacher":
          router.replace("/teacher/dashboard");
          break;
        case "admin":
          router.replace("/admin/dashboard");
          break;
        default:
          router.replace("/");
          break;
      }
    }
  }, [loading, user, router]);

  const handleLogin = () => {
    // This is a browser redirect, NOT fetch!
    window.location.href = `${BACKEND_URL}/api/auth/google/login?redirect_uri=${encodeURIComponent(window.location.origin + "/auth/callback")}`;
  };

  // Show loading while checking authentication
  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8">
        <h1 className="text-2xl font-bold mb-4">Loading...</h1>
        <p className="text-gray-500">Checking authentication...</p>
      </main>
    );
  }

  // If user is authenticated, show redirecting message
  if (user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8">
        <h1 className="text-2xl font-bold mb-4">Already Logged In</h1>
        <p className="text-gray-500">Redirecting to your dashboard...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-2xl font-bold mb-4">Login</h1>
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        onClick={handleLogin}
      >
        Sign in with Google
      </button>
      <p className="mt-4 text-gray-500">You will be redirected to Google to sign in.</p>
    </main>
  );
} 