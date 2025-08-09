"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchAllGroups, fetchAllAssignments, fetchGroupMembersByGroupId } from "@/utils/api";
import Link from "next/link";

interface Assignment { id: number; title: string; }
interface Group { id: number; assignment_id: number; name: string; leader_id?: number; created_at: string; }
interface GroupMember { group_id: number; user_id: number; }

export default function AdminGroupsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [memberCounts, setMemberCounts] = useState<Record<number, number>>({});
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
        const [gs, as] = await Promise.all([
          fetchAllGroups(),
          fetchAllAssignments(),
        ]);
        setGroups(gs as Group[]);
        setAssignments(as as Assignment[]);
        // member counts
        const counts: Record<number, number> = {};
        for (const g of gs as Group[]) {
          const ms = (await fetchGroupMembersByGroupId(g.id)) as GroupMember[];
          counts[g.id] = ms.length;
        }
        setMemberCounts(counts);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("Failed to load groups", e);
      } finally {
        setLoadingData(false);
      }
    };
    if (user && user.role.name === "admin") load();
  }, [user]);

  const getAssignment = (id: number) => assignments.find(a => a.id === id);

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
          <h1 className="text-3xl font-bold text-gray-800">Groups</h1>
          <p className="text-gray-600 mt-1">Manage student groups per assignment</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">All Groups ({groups.length})</h2>
          </div>
          {groups.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No groups found.</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {groups.map((g) => (
                <div key={g.id} className="p-6 flex items-start justify-between hover:bg-gray-50">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-semibold text-gray-800">{g.name}</h3>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{memberCounts[g.id] || 0} members</span>
                    </div>
                    <p className="text-sm text-gray-500">Assignment: {getAssignment(g.assignment_id)?.title || `#${g.assignment_id}`}</p>
                    <p className="text-sm text-gray-500 mt-1">Created: {new Date(g.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="ml-4 flex gap-2">
                    <Link href={`/student/assignments/${g.assignment_id}`} className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700">View Assignment</Link>
                    <Link href={`/student/groups/${g.id}`} className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">View Group</Link>
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


