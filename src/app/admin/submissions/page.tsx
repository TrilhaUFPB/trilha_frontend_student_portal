"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchAllSubmissions, fetchAllAssignments } from "@/utils/api";
import Link from "next/link";
import { SubmissionTeacher, AssignmentSubmissions } from "@/types/interfaces";


export default function AdminSubmissionsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [submissions, setSubmissions] = useState<SubmissionTeacher[]>([]);
  const [assignments, setAssignments] = useState<AssignmentSubmissions[]>([]);
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
        const [subs, asg] = await Promise.all([
          fetchAllSubmissions(),
          fetchAllAssignments(),
        ]);
        setSubmissions(subs as SubmissionTeacher[]);
        setAssignments(asg as AssignmentSubmissions[]);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("Failed to load submissions", e);
      } finally {
        setLoadingData(false);
      }
    };
    if (user && user.role.name === "admin") load();
  }, [user]);

  const getAssignment = (assignmentId: number) => assignments.find(a => a.id === assignmentId);

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
          <h1 className="text-3xl font-bold text-gray-800">All Submissions</h1>
          <p className="text-gray-600 mt-1">System-wide view of student submissions</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Submissions ({submissions.length})</h2>
          </div>
          {submissions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No submissions yet.</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {submissions.map((s) => (
                <div key={s.id} className="p-6 flex items-start justify-between hover:bg-gray-50">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <Link href={`/student/assignments/${s.assignment_id}`} className="text-lg font-semibold text-blue-600 hover:text-blue-800">
                        {getAssignment(s.assignment_id)?.title || `Assignment #${s.assignment_id}`}
                      </Link>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">v{s.version}</span>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 capitalize">{s.status}</span>
                      {s.group_id ? (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">Group</span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Individual</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mb-1">Submitted: {new Date(s.submitted_at).toLocaleString()}</p>
                    <a href={s.submission_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 break-all">
                      {s.submission_link}
                    </a>
                  </div>
                  <div className="ml-4 flex gap-2">
                    <Link href={`/student/assignments/${s.assignment_id}`} className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700">View</Link>
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


