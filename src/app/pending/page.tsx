"use client";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function PendingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    } else if (!loading && user && user.role.name !== "pending") {
      router.push("/");
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
    return null;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full">
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-yellow-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L5.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-yellow-800 mb-2">Account Pending Approval</h1>
            <p className="text-yellow-700 text-lg">
              Welcome, {user.name}! Your account has been successfully created.
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 mb-6 text-left">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Your Account Information</h2>
            <div className="space-y-2">
              <p><strong>Name:</strong> {user.name}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Status:</strong> <span className="text-yellow-600 font-medium">Pending Approval</span></p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6 text-left">
            <h2 className="text-xl font-semibold mb-3 text-blue-800">What's Next?</h2>
            <p className="text-blue-700 mb-3">
              Your account is currently awaiting approval from an administrator or professor. Once approved, you'll be assigned a role and gain access to the platform features.
            </p>
            <ul className="text-blue-700 space-y-2">
              <li>• <strong>Student:</strong> Access assignments, submit work, and join groups</li>
              <li>• <strong>Teacher:</strong> Create assignments, review submissions, and manage students</li>
              <li>• <strong>Admin:</strong> Full platform management capabilities</li>
            </ul>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-left">
            <h2 className="text-xl font-semibold mb-3 text-gray-800">Need Help?</h2>
            <p className="text-gray-700 mb-3">
              If you have any questions or concerns about your account status, please contact our support team:
            </p>
            <div className="space-y-2 text-gray-700">
              <p><strong>Email:</strong> support@trilha.com</p>
              <p><strong>Phone:</strong> +55 (11) 99999-9999</p>
              <p><strong>Hours:</strong> Monday - Friday, 9:00 AM - 6:00 PM (BRT)</p>
            </div>
          </div>

          <div className="mt-8">
            <button
              onClick={() => window.location.reload()}
              className="bg-yellow-600 text-white px-6 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
            >
              Refresh Status
            </button>
          </div>
        </div>
      </div>
    </main>
  );
} 