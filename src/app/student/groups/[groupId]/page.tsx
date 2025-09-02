"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchGroupById, fetchGroupMembersByGroupId, fetchAssignmentById } from "@/utils/api";
import Link from "next/link";
import { GroupGroups, AssignmentGroups, GroupMember2 } from "@/types/interfaces";


export default function StudentGroupDetailsPage({ params }: { params: { groupId: string } }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const groupId = Number(params.groupId);

  const [group, setGroup] = useState<GroupGroups | null>(null);
  const [members, setMembers] = useState<GroupMember2[]>([]);
  const [assignment, setAssignment] = useState<AssignmentGroups | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user) router.push("/login");
      else if (user.role.name !== "student") router.push("/");
    }
  }, [loading, user, router]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingData(true);
        const g = await fetchGroupById(groupId) as GroupGroups;
        setGroup(g);
        const m = await fetchGroupMembersByGroupId(groupId) as GroupMember2[];
        setMembers(m);
        if (g?.assignment_id) {
          const a = await fetchAssignmentById(g.assignment_id) as AssignmentGroups;
          setAssignment(a);
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("Failed to load group", e);
      } finally {
        setLoadingData(false);
      }
    };
    load();
  }, [groupId]);

  if (loading || loadingData || !user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8">
        <h1 className="text-2xl font-bold mb-4">Loading...</h1>
      </main>
    );
  }

  if (!group) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8">
        <h1 className="text-2xl font-bold mb-4">Group not found</h1>
        <Link href="/student/groups" className="text-blue-600 hover:text-blue-800">Back to Groups</Link>
      </main>
    );
  }

  const isLeader = user?.id === group.leader_id;
  const isMember = members.some(m => m.user_id === user.id);

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{group.name}</h1>
            <p className="text-gray-600 mt-1">
              {assignment ? (
                <>Assignment: <Link href={`/student/assignments/${assignment.id}`} className="text-blue-600 hover:text-blue-800">{assignment.title}</Link></>
              ) : (
                "Assignment details unavailable"
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/student/groups" className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">Back</Link>
            {isLeader && (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 self-center">Leader</span>
            )}
            {isMember && !isLeader && (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 self-center">Member</span>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Members</h2>
          {members.length === 0 ? (
            <p className="text-gray-500">No members yet.</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {members.map((m) => (
                <li key={`${m.group_id}-${m.user_id}`} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{m.user?.name || `User ${m.user_id}`}</p>
                    <p className="text-sm text-gray-500">Joined {new Date(m.joined_at).toLocaleDateString()}</p>
                  </div>
                  {group.leader_id === m.user_id && <span className="text-xs text-yellow-700">👑</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}


