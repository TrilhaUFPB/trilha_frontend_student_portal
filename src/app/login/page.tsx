"use client";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

export default function LoginPage() {
  const handleLogin = () => {
    // This is a browser redirect, NOT fetch!
    window.location.href = `${BACKEND_URL}/api/auth/google/login?redirect_uri=${encodeURIComponent(window.location.origin + "/auth/callback")}`;
  };

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