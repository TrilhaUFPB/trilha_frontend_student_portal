"use client";
import "./globals.css";
import type { ReactNode } from "react";
import RoleNavBar from "@/components/RoleNavBar";
import { AuthProvider, useAuth } from "@/context/AuthContext";

function AppLayout({ children }: { children: ReactNode }) {
  const { role, loading } = useAuth();
  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <span>Loading...</span>
      </main>
    );
  }
  return (
    <>
      <RoleNavBar role={role} />
      {children}
    </>
  );
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <AppLayout>{children}</AppLayout>
        </AuthProvider>
      </body>
    </html>
  );
} 