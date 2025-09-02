"use client";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { 
  fetchAllGroups,
  fetchAllAssignments,
  fetchGroupMembersByGroupId,
  fetchAllUsers,
  fetchAllSubmissions,
  createGroup,
  addGroupMember,
  removeGroupMember,
} from "@/utils/api";
import Link from "next/link";
import { AssignmentTeacherDashboard, GroupAssignment, GroupMember, UserGroups, SubmissionTeacher, GroupWithDetails } from "@/types/interfaces";

export default function StudentGroupsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [groups, setGroups] = useState<GroupWithDetails[]>([]);
  const [assignments, setAssignments] = useState<AssignmentTeacherDashboard[]>([]);
  const [users, setUsers] = useState<UserGroups[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionTeacher[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [filter, setFilter] = useState<"all" | "my-groups" | "available">("all");
  const [sortBy, setSortBy] = useState<"date" | "assignment" | "members">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  
  // Form states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<number | null>(null);
  const [groupName, setGroupName] = useState("");
  const [groupError, setGroupError] = useState("");
  const [addMemberStates, setAddMemberStates] = useState<{[key: number]: {userId: string, error: string}}>({});

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    } else if (!loading && user && user.role.name !== "student") {
      router.push("/");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (user && user.role.name === "student") {
      loadGroupsData();
    }
  }, [user]);

  const loadGroupsData = async () => {
    try {
      setLoadingData(true);
      
      // Load all necessary data
      const [allGroups, allAssignments, allUsers, allSubmissions] = await Promise.all([
        fetchAllGroups(),
        fetchAllAssignments(),
        fetchAllUsers(),
        fetchAllSubmissions()
      ]);
      
      // Only show groups for group assignments
      const groupAssignments = (allAssignments as AssignmentTeacherDashboard[]).filter(a => a.is_group_work);
      const relevantGroups = (allGroups as GroupAssignment[]).filter(g => 
        groupAssignments.some(a => a.id === g.assignment_id)
      );
      
      // Enrich groups with details
      const enrichedGroups: GroupWithDetails[] = await Promise.all(
        relevantGroups.map(async (group) => {
          const members = await fetchGroupMembersByGroupId(group.id);
          const assignment = groupAssignments.find(a => a.id === group.assignment_id);
          const submission = (allSubmissions as SubmissionTeacher[]).find(s => s.group_id === group.id);
          
          const isUserMember = members.some(m => m.user_id === user!.id);
          const isUserLeader = group.leader_id === user!.id;
          
          return {
            ...group,
            assignment,
            members,
            memberCount: members.length,
            isUserMember,
            isUserLeader,
            submission
          };
        })
      );
      
      setGroups(enrichedGroups);
      setAssignments(groupAssignments);
      setUsers(allUsers as UserGroups[]);
      setSubmissions(allSubmissions as SubmissionTeacher[]);
      
    } catch (error) {
      console.error("Error loading groups data:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const getFilteredGroups = () => {
    let filtered = groups;
    
    // Apply filter
    if (filter === "my-groups") {
      filtered = filtered.filter(g => g.isUserMember);
    } else if (filter === "available") {
      filtered = filtered.filter(g => !g.isUserMember);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case "date":
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case "assignment":
          comparison = (a.assignment?.title || "").localeCompare(b.assignment?.title || "");
          break;
        case "members":
          comparison = a.memberCount - b.memberCount;
          break;
      }
      
      return sortOrder === "asc" ? comparison : -comparison;
    });
    
    return filtered;
  };

  const getGroupStats = () => {
    const myGroups = groups.filter(g => g.isUserMember);
    const groupsILead = groups.filter(g => g.isUserLeader);
    const availableGroups = groups.filter(g => !g.isUserMember);
    const submittedGroups = myGroups.filter(g => g.submission);
    
    return {
      myGroups: myGroups.length,
      groupsILead: groupsILead.length,
      availableGroups: availableGroups.length,
      submittedGroups: submittedGroups.length
    };
  };

  const getAvailableAssignments = () => {
    return assignments.filter(a => {
      // Only show assignments where user is not already in a group
      const existingGroup = groups.find(g => g.assignment_id === a.id && g.isUserMember);
      return !existingGroup;
    });
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignmentId || !groupName.trim()) {
      setGroupError("Please select an assignment and provide a group name");
      return;
    }
    
    try {
      const groupData = {
        assignment_id: selectedAssignmentId,
        name: groupName.trim(),
        leader_id: user!.id,
      };
      
      const newGroup = await createGroup(groupData);
      
      // Add the creator as the first member
      await addGroupMember({
        group_id: (newGroup as any).id,
        user_id: user!.id,
      });
      
      setGroupName("");
      setSelectedAssignmentId(null);
      setGroupError("");
      setShowCreateForm(false);
      loadGroupsData(); // Reload to show the new group
    } catch (error) {
      console.error("Error creating group:", error);
      setGroupError("Failed to create group. Please try again.");
    }
  };

  const handleAddMember = async (groupId: number, userId: number) => {
    try {
      await addGroupMember({
        group_id: groupId,
        user_id: userId,
      });
      
      // Clear the form state
      setAddMemberStates(prev => ({
        ...prev,
        [groupId]: { userId: "", error: "" }
      }));
      
      loadGroupsData(); // Reload to show the new member
    } catch (error) {
      console.error("Error adding member:", error);
      setAddMemberStates(prev => ({
        ...prev,
        [groupId]: { 
          ...prev[groupId], 
          error: "Failed to add member. Please check the user ID and try again." 
        }
      }));
    }
  };

  const handleRemoveMember = async (groupId: number, userId: number) => {
    if (!confirm("Are you sure you want to remove this member?")) return;
    
    try {
      // Note: This assumes there's a way to get the group_member record ID
      // In a real implementation, you might need to find the record first
      await removeGroupMember(groupId); // This might need adjustment based on API
      loadGroupsData(); // Reload data
    } catch (error) {
      console.error("Error removing member:", error);
      alert("Failed to remove member. Please try again.");
    }
  };

  const handleJoinGroup = async (groupId: number) => {
    try {
      await addGroupMember({
        group_id: groupId,
        user_id: user!.id,
      });
      
      loadGroupsData(); // Reload to show updated membership
    } catch (error) {
      console.error("Error joining group:", error);
      alert("Failed to join group. Please try again.");
    }
  };

  const isOverdue = (due_date: string) => {
    return new Date(due_date) < new Date();
  };

  const getStudentUsers = () => {
    return users.filter(u => u.role.name === "student");
  };

  if (loading || loadingData) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8">
        <h1 className="text-2xl font-bold mb-4">Loading...</h1>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  const filteredGroups = getFilteredGroups();
  const stats = getGroupStats();
  const availableAssignments = getAvailableAssignments();

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Group Management</h1>
              <p className="text-gray-600 mt-2">Manage your group memberships and create new groups</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Create New Group
              </button>
              <Link
                href="/student/dashboard"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>

        {/* Create Group Form */}
        {showCreateForm && (
          <div className="bg-white rounded-lg p-6 shadow-sm mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Create New Group</h2>
            <form onSubmit={handleCreateGroup}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assignment
                  </label>
                  <select
                    value={selectedAssignmentId || ""}
                    onChange={(e) => setSelectedAssignmentId(parseInt(e.target.value) || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select an assignment...</option>
                    {availableAssignments.map((assignment) => (
                      <option key={assignment.id} value={assignment.id}>
                        {assignment.title}
                        {assignment.due_date && isOverdue(assignment.due_date) && " (Overdue)"}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Group Name
                  </label>
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Enter group name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Create Group
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
              {groupError && <p className="text-red-600 text-sm mt-2">{groupError}</p>}
            </form>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">My Groups</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.myGroups}</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Leading</h3>
            <p className="text-3xl font-bold text-green-600">{stats.groupsILead}</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Available</h3>
            <p className="text-3xl font-bold text-purple-600">{stats.availableGroups}</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Submitted</h3>
            <p className="text-3xl font-bold text-orange-600">{stats.submittedGroups}</p>
          </div>
        </div>

        {/* Filters and Sorting */}
        <div className="bg-white rounded-lg p-6 shadow-sm mb-8">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Filter:</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as "all" | "my-groups" | "available")}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Groups</option>
                <option value="my-groups">My Groups</option>
                <option value="available">Available Groups</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "date" | "assignment" | "members")}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="date">Creation Date</option>
                <option value="assignment">Assignment</option>
                <option value="members">Member Count</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Order:</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>
          </div>
        </div>

        {/* Groups List */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">
              Groups ({filteredGroups.length})
            </h2>
          </div>
          
          {filteredGroups.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500 text-lg">No groups found.</p>
              <p className="text-gray-400 mt-2">
                {filter === "my-groups" 
                  ? "You haven't joined any groups yet." 
                  : "No groups match your current filter."}
              </p>
              {filter === "my-groups" && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="inline-block mt-4 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Create Your First Group
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredGroups.map((group) => (
                <div key={group.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-800">{group.name}</h3>
                        {group.isUserMember && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Member
                          </span>
                        )}
                        {group.isUserLeader && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Leader
                          </span>
                        )}
                        {group.submission && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Submitted
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                        <div>
                          <p><strong>Assignment:</strong> {group.assignment?.title || "Unknown"}</p>
                          <p><strong>Members:</strong> {group.memberCount}</p>
                        </div>
                        <div>
                          <p><strong>Created:</strong> {new Date(group.created_at).toLocaleDateString()}</p>
                          <p><strong>Due Date:</strong> {
                            group.assignment?.due_date 
                              ? new Date(group.assignment.due_date).toLocaleDateString()
                              : "No due date"
                          }</p>
                        </div>
                      </div>
                      
                      {/* Member List */}
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-700 mb-2">Members</h4>
                        <div className="flex flex-wrap gap-2">
                          {group.members.map((member) => (
                            <div key={member.user_id} className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full">
                              <span className="text-sm">
                                {member.user?.name || `User ${member.user_id}`}
                              </span>
                              {member.user_id === group.leader_id && (
                                <span className="text-xs text-yellow-600">👑</span>
                              )}
                              {group.isUserLeader && member.user_id !== user.id && (
                                <button
                                  onClick={() => handleRemoveMember(group.id, member.user_id)}
                                  className="text-red-600 hover:text-red-800 text-xs"
                                >
                                  ×
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Add Member Form (only for leaders) */}
                      {group.isUserLeader && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium text-gray-700 mb-2">Add Member</h4>
                          <div className="flex gap-2">
                            <select
                              value={addMemberStates[group.id]?.userId || ""}
                              onChange={(e) => setAddMemberStates(prev => ({
                                ...prev,
                                [group.id]: { ...prev[group.id], userId: e.target.value, error: "" }
                              }))}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Select a student...</option>
                              {getStudentUsers()
                                .filter(u => u.id !== user.id && !group.members.some(m => m.user_id === u.id))
                                .map((student) => (
                                  <option key={student.id} value={student.id}>
                                    {student.name} ({student.email})
                                  </option>
                                ))}
                            </select>
                            <button
                              onClick={() => handleAddMember(group.id, parseInt(addMemberStates[group.id]?.userId || "0"))}
                              disabled={!addMemberStates[group.id]?.userId}
                              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                              Add
                            </button>
                          </div>
                          {addMemberStates[group.id]?.error && (
                            <p className="text-red-600 text-sm mt-2">{addMemberStates[group.id].error}</p>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="ml-4 flex flex-col gap-2">
                      <Link
                        href={`/student/assignments/${group.assignment_id}`}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm text-center"
                      >
                        View Assignment
                      </Link>
                      
                      {!group.isUserMember && (
                        <button
                          onClick={() => handleJoinGroup(group.id)}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                        >
                          Join Group
                        </button>
                      )}
                    </div>
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