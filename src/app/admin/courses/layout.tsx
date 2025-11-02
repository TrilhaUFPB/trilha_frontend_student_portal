"use client"
import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/context/AuthContext";

export default function CoursesLayout({ children }: { children: React.ReactNode }) {
  const { role, loading } = useAuth();
  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <span>Loading...</span>
      </main>
    );
  }
  return (
    
    <div className="flex">
      <Sidebar role={role} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
