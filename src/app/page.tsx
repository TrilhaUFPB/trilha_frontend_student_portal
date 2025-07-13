"use client";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    } else if (!loading && user) {
      // Redirect to role-specific dashboard
      switch (user.role.name) {
        case "pending":
          router.push("/pending");
          break;
        case "student":
          router.push("/student/dashboard");
          break;
        case "teacher":
          router.push("/teacher/dashboard");
          break;
        case "admin":
          router.push("/admin/dashboard");
          break;
        default:
          // Keep current page if role is unknown
          break;
      }
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8">
        <h1 className="text-2xl font-bold mb-4">Loading...</h1>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8">
        <h1 className="text-3xl font-bold mb-4">Trilha Student Portal</h1>
        <p className="mb-6">Welcome! Please login to continue.</p>
      </main>
    );
  }

  // Show loading while redirecting
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-2xl font-bold mb-4">Redirecting...</h1>
      <p className="text-gray-600">Taking you to your dashboard...</p>
    </main>
  );
} 