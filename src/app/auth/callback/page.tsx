"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { setToken } from "@/utils/auth";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    // Try to get the token from query string or fragment
    const url = new URL(window.location.href);
    const token = url.searchParams.get("token") || url.hash.replace(/^#?token=/, "");
    if (token) {
      setToken(token);
      // Redirect to home page
      router.replace("/");
    } else {
      // No token found, redirect to login
      router.replace("/login");
    }
  }, [router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-2xl font-bold mb-4">Signing you in...</h1>
      <p className="text-gray-500">Please wait.</p>
    </main>
  );
} 