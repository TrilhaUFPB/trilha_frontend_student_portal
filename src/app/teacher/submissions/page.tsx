"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchAllAssignments, fetchAllSubmissions } from "@/utils/api";
import Link from "next/link";

interface Assignment {
  id: number;
  title: string;
  description: string;
  due_date?: string;
  is_group_work: boolean;
}

interface Submission { id: number; assignment_id: number }

export default function TeacherSubmissionsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissionCounts, setSubmissionCounts] = useState<Record<number, number>>({});
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user) router.push("/login");
      else if (user.role.name !== "teacher" && user.role.name !== "admin") router.push("/");
    }
  }, [loading, user, router]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingData(true);
        const [as, subs] = await Promise.all([
          fetchAllAssignments(),
          fetchAllSubmissions(),
        ]);
        setAssignments(as as Assignment[]);
        const counts: Record<number, number> = {};
        (subs as Submission[]).forEach((s) => {
          counts[s.assignment_id] = (counts[s.assignment_id] || 0) + 1;
        });
        setSubmissionCounts(counts);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("Failed to load teacher submissions", e);
      } finally {
        setLoadingData(false);
      }
    };
    if (user && (user.role.name === "teacher" || user.role.name === "admin")) load();
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Submissions by Assignment</h1>
          <p className="text-gray-600 mt-1">Browse assignments to review submissions</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Assignments ({assignments.length})</h2>
          </div>
          {assignments.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No assignments found.</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {assignments.map((a) => (
                <div key={a.id} className="p-6 flex items-start justify-between hover:bg-gray-50">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-semibold text-gray-800">{a.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${a.is_group_work ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"}`}>
                        {a.is_group_work ? "Group" : "Individual"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">Due: {a.due_date ? new Date(a.due_date).toLocaleString() : "No due date"}</p>
                    <p className="text-sm text-gray-500 mt-1">Submissions: {submissionCounts[a.id] || 0}</p>
                  </div>
                  <div className="ml-4">
                    <Link href={`/teacher/submissions/${a.id}`} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Open</Link>
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


