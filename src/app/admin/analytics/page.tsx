"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { fetchAllAssignments, fetchAllSubmissions, fetchAllUsers, fetchAllGroups } from "@/utils/api";

interface Assignment { id: number; is_group_work: boolean; due_date?: string }
interface Submission { id: number; assignment_id: number; status: string; submitted_at: string }
interface User { id: number; role: { name: string } }
interface Group { id: number; assignment_id: number }

export default function AdminAnalyticsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
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
        const [as, ss, us, gs] = await Promise.all([
          fetchAllAssignments(),
          fetchAllSubmissions(),
          fetchAllUsers(),
          fetchAllGroups(),
        ]);
        setAssignments(as as Assignment[]);
        setSubmissions(ss as Submission[]);
        setUsers(us as User[]);
        setGroups(gs as Group[]);
      } finally {
        setLoadingData(false);
      }
    };
    if (user && user.role.name === "admin") load();
  }, [user]);

  const stats = useMemo(() => {
    const totalUsers = users.length;
    const byRole = users.reduce<Record<string, number>>((acc, u) => {
      const k = u.role?.name || "unknown";
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {});
    const totalAssignments = assignments.length;
    const groupAssignments = assignments.filter(a => a.is_group_work).length;
    const totalGroups = groups.length;
    const totalSubs = submissions.length;
    const rated = submissions.filter(s => s.status.toLowerCase() === "rated" || s.status.toLowerCase() === "graded").length;
    return { totalUsers, byRole, totalAssignments, groupAssignments, totalGroups, totalSubs, rated };
  }, [users, assignments, groups, submissions]);

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
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Analytics</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Users</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.totalUsers}</p>
            <p className="text-sm text-gray-500 mt-1">admin {stats.byRole.admin || 0} • teacher {stats.byRole.teacher || 0} • student {stats.byRole.student || 0} • pending {stats.byRole.pending || 0}</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Assignments</h3>
            <p className="text-3xl font-bold text-green-600">{stats.totalAssignments}</p>
            <p className="text-sm text-gray-500 mt-1">{stats.groupAssignments} group</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Groups</h3>
            <p className="text-3xl font-bold text-purple-600">{stats.totalGroups}</p>
            <p className="text-sm text-gray-500 mt-1">Active groups</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Submissions</h3>
            <p className="text-3xl font-bold text-indigo-600">{stats.totalSubs}</p>
            <p className="text-sm text-gray-500 mt-1">Rated {stats.rated}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Overview</h2>
          <p className="text-gray-600">Basic analytics derived from current data. Enhance this page with charts and trends later.</p>
        </div>
      </div>
    </main>
  );
}


