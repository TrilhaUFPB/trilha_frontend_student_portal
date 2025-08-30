"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchAllRoles } from "@/utils/api";
import { Role } from "@/types/interfaces";

export default function AdminRolesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user) router.push("/login");
      else if (user.role.name !== "admin") router.push("/");
    }
  }, [loading, user, router]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingData(true);
        const data = await fetchAllRoles();
        setRoles(data as Role[]);
      } finally {
        setLoadingData(false);
      }
    };
    if (user && user.role.name === "admin") load();
  }, [user]);

  if (loading || loadingData || !user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8">
        <h1 className="text-2xl font-bold mb-4">Loading...</h1>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Roles</h1>
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">System Roles ({roles.length})</h2>
          </div>
          <ul className="divide-y divide-gray-200">
            {roles.map((r) => (
              <li key={r.id} className="p-6 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{r.name}</p>
                  <p className="text-sm text-gray-500">ID: {r.id}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${r.name === "admin" ? "bg-red-100 text-red-800" :
                    r.name === "teacher" ? "bg-blue-100 text-blue-800" :
                      r.name === "student" ? "bg-green-100 text-green-800" :
                        "bg-orange-100 text-orange-800"
                  }`}>{r.name}</span>
              </li>
            ))}
            {roles.length === 0 && (
              <li className="p-6 text-center text-gray-500">No roles found.</li>
            )}
          </ul>
        </div>
      </div>
    </main>
  );
}


