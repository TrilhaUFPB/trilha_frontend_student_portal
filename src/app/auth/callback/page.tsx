"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { setToken } from "@/utils/auth";
import { fetchCurrentUser } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";

export default function AuthCallbackPage() {
  const router = useRouter();
  const { refreshAuth } = useAuth();
  const [status, setStatus] = useState("Processing...");

  useEffect(() => {
    // Try to get the token from query string or fragment
    const url = new URL(window.location.href);
    const token = url.searchParams.get("token") || url.hash.replace(/^#?token=/, "");
    
    if (token) {
      console.log("AuthCallback: Token received, storing...");
      setToken(token);
      setStatus("Authentication successful! Redirecting...");
      
      // Force refresh the auth context and redirect immediately
      refreshAuth();
      setTimeout(() => {
        console.log("AuthCallback: Redirecting to home...");
        router.replace("/");
      }, 100);
    } else {
      // No token found, redirect to login
      setStatus("No token found. Redirecting to login...");
      setTimeout(() => router.replace("/login"), 1000);
    }
  }, [router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-2xl font-bold mb-4">Signing you in...</h1>
      <p className="text-gray-500">{status}</p>
    </main>
  );
} 