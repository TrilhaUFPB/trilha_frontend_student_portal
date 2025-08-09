"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchAllAssignments } from "@/utils/api";
import Link from "next/link";

interface Assignment {
  id: number;
  title: string;
  description: string;
  due_date?: string;
  is_group_work: boolean;
}

export default function AdminAssignmentsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
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
        const data = await fetchAllAssignments();
        setAssignments(data as Assignment[]);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("Failed to load assignments", e);
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
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Assignments</h1>
            <p className="text-gray-600 mt-1">Manage and review all assignments</p>
          </div>
          <Link href="/teacher/assignments/create" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
            Create Assignment
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">All Assignments ({assignments.length})</h2>
          </div>
          {assignments.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No assignments found.</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {assignments.map((a) => (
                <div key={`assignment-${a.id}`} className="p-6 flex items-start justify-between hover:bg-gray-50">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-semibold text-gray-800">{a.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${a.is_group_work ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"}`}>
                        {a.is_group_work ? "Group" : "Individual"}
                      </span>
                    </div>
                    <p className="text-gray-600 line-clamp-2">{a.description}</p>
                    <p className="text-sm text-gray-500 mt-2">Due: {a.due_date ? new Date(a.due_date).toLocaleString() : "No due date"}</p>
                  </div>
                  <div className="ml-4 flex gap-2">
                    <Link href={`/teacher/assignments/${a.id}/edit`} className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">Edit</Link>
                    <Link href={`/student/assignments/${a.id}`} className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700">View</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}


