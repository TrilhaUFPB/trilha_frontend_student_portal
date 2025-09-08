"use client";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { 
  fetchAllAssignments, 
  fetchAllSubmissions,
  fetchAllGroups,
  deleteAssignment
} from "@/utils/api";
import Link from "next/link";
import { AssignmentTeacherDashboard, SubmissionTeacher, Group } from "@/types/interfaces";

interface AssignmentWithStats extends AssignmentTeacherDashboard {
  submissionCount: number;
  groupCount: number;
  isOverdue: boolean;
  daysUntilDue?: number;
}

export default function TeacherAssignmentsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [assignments, setAssignments] = useState<AssignmentWithStats[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [filter, setFilter] = useState<"all" | "individual" | "group" | "overdue" | "upcoming">("all");
  const [sortBy, setSortBy] = useState<"date" | "title" | "submissions" | "due_date">("due_date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number, title: string } | null>(null);
  const allowedRoles = ["teacher", "admin"]
  
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    } else if (!loading && user && user.role?.name && !allowedRoles.includes(user.role.name)) {
      router.push("/");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (user && user.role.name &&allowedRoles.includes(user.role.name)) {
      loadAssignmentsData();
    }
  }, [user]);

  const loadAssignmentsData = async () => {
    try {
      setLoadingData(true);
      
      const [allAssignments, allSubmissions, allGroups] = await Promise.all([
        fetchAllAssignments(),
        fetchAllSubmissions(),
        fetchAllGroups()
      ]);
      
      // Enrich assignments with statistics
      const enrichedAssignments: AssignmentWithStats[] = (allAssignments as AssignmentTeacherDashboard[]).map((assignment) => {
        const submissions = (allSubmissions as SubmissionTeacher[]).filter(s => s.assignment_id === assignment.id);
        const groups = (allGroups as Group[]).filter(g => g.assignment_id === assignment.id);
        
        const now = new Date();
        const due_date = assignment.due_date ? new Date(assignment.due_date) : null;
        const isOverdue = due_date ? due_date < now : false;
        const daysUntilDue = due_date ? Math.ceil((due_date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : undefined;
        
        return {
          ...assignment,
          submissionCount: submissions.length,
          groupCount: groups.length,
          isOverdue,
          daysUntilDue
        };
      });
      
      setAssignments(enrichedAssignments);
      
    } catch (error) {
      console.error("Error loading assignments data:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const getFilteredAssignments = () => {
    let filtered = assignments;
    
    // Apply filter
    switch (filter) {
      case "individual":
        filtered = filtered.filter(a => !a.is_group_work);
        break;
      case "group":
        filtered = filtered.filter(a => a.is_group_work);
        break;
      case "overdue":
        filtered = filtered.filter(a => a.isOverdue);
        break;
      case "upcoming":
        filtered = filtered.filter(a => !a.isOverdue && a.daysUntilDue !== undefined && a.daysUntilDue <= 7);
        break;
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case "date":
          // Sort by creation date - we'll use the assignment ID as a proxy
          comparison = a.id - b.id;
          break;
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
        case "submissions":
          comparison = a.submissionCount - b.submissionCount;
          break;
        case "due_date":
          if (!a.due_date && !b.due_date) comparison = 0;
          else if (!a.due_date) comparison = 1;
          else if (!b.due_date) comparison = -1;
          else comparison = new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
          break;
      }
      
      return sortOrder === "asc" ? comparison : -comparison;
    });
    
    return filtered;
  };

  const getAssignmentStats = () => {
    const totalAssignments = assignments.length;
    const individualAssignments = assignments.filter(a => !a.is_group_work).length;
    const groupAssignments = assignments.filter(a => a.is_group_work).length;
    const overdueAssignments = assignments.filter(a => a.isOverdue).length;
    const totalSubmissions = assignments.reduce((sum, a) => sum + a.submissionCount, 0);
    const totalGroups = assignments.reduce((sum, a) => sum + a.groupCount, 0);
    
    return {
      totalAssignments,
      individualAssignments,
      groupAssignments,
      overdueAssignments,
      totalSubmissions,
      totalGroups
    };
  };

  const handleDeleteAssignment = async (id: number) => {
    try {
      await deleteAssignment(id);
      setDeleteConfirm(null);
      loadAssignmentsData(); // Reload to show updated list
    } catch (error) {
      console.error("Error deleting assignment:", error);
      alert("Failed to delete assignment. Please try again.");
    }
  };

  const getStatusColor = (assignment: AssignmentWithStats) => {
    if (assignment.isOverdue) return "bg-red-100 text-red-800 border-red-200";
    if (assignment.daysUntilDue !== undefined && assignment.daysUntilDue <= 3) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-green-100 text-green-800 border-green-200";
  };

  const getStatusText = (assignment: AssignmentWithStats) => {
    if (assignment.isOverdue) return "Overdue";
    if (assignment.daysUntilDue !== undefined) {
      if (assignment.daysUntilDue <= 0) return "Due Today";
      if (assignment.daysUntilDue <= 3) return `Due in ${assignment.daysUntilDue} day${assignment.daysUntilDue > 1 ? 's' : ''}`;
      return `Due in ${assignment.daysUntilDue} days`;
    }
    return "No due date";
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

  const filteredAssignments = getFilteredAssignments();
  const stats = getAssignmentStats();

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Assignment Management</h1>
              <p className="text-gray-600 mt-2">Create, manage, and track all your assignments</p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/teacher/assignments/create"
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Create New Assignment
              </Link>
              <Link
                href="/teacher/dashboard"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Total</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.totalAssignments}</p>
            <p className="text-sm text-gray-500 mt-1">Assignments</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Individual</h3>
            <p className="text-3xl font-bold text-green-600">{stats.individualAssignments}</p>
            <p className="text-sm text-gray-500 mt-1">Solo work</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Group</h3>
            <p className="text-3xl font-bold text-purple-600">{stats.groupAssignments}</p>
            <p className="text-sm text-gray-500 mt-1">Team work</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Overdue</h3>
            <p className="text-3xl font-bold text-red-600">{stats.overdueAssignments}</p>
            <p className="text-sm text-gray-500 mt-1">Past deadline</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Submissions</h3>
            <p className="text-3xl font-bold text-orange-600">{stats.totalSubmissions}</p>
            <p className="text-sm text-gray-500 mt-1">Total received</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Groups</h3>
            <p className="text-3xl font-bold text-indigo-600">{stats.totalGroups}</p>
            <p className="text-sm text-gray-500 mt-1">Student groups</p>
          </div>
        </div>

        {/* Filters and Sorting */}
        <div className="bg-white rounded-lg p-6 shadow-sm mb-8">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Filter:</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Assignments</option>
                <option value="individual">Individual Only</option>
                <option value="group">Group Only</option>
                <option value="overdue">Overdue</option>
                <option value="upcoming">Due Soon (7 days)</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="due_date">Due Date</option>
                <option value="title">Title</option>
                <option value="date">Creation Date</option>
                <option value="submissions">Submission Count</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Order:</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          </div>
        </div>

        {/* Assignments List */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">
              Assignments ({filteredAssignments.length})
            </h2>
          </div>
          
          {filteredAssignments.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500 text-lg">No assignments found.</p>
              <p className="text-gray-400 mt-2">
                {filter === "all" 
                  ? "Create your first assignment to get started!" 
                  : "Try adjusting your filters to see more assignments."}
              </p>
              <Link
                href="/teacher/assignments/create"
                className="inline-block mt-4 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Create Assignment
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredAssignments.map((assignment) => (
                <div key={assignment.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-800">{assignment.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(assignment)}`}>
                          {getStatusText(assignment)}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          assignment.is_group_work 
                            ? "bg-purple-100 text-purple-800" 
                            : "bg-blue-100 text-blue-800"
                        }`}>
                          {assignment.is_group_work ? "Group Work" : "Individual"}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 mb-3 line-clamp-2">{assignment.description}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
                        <div>
                          <p><strong>Due Date:</strong> {
                            assignment.due_date 
                              ? new Date(assignment.due_date).toLocaleString()
                              : "No due date"
                          }</p>
                        </div>
                        <div>
                          <p><strong>Submissions:</strong> {assignment.submissionCount}</p>
                        </div>
                        <div>
                          <p><strong>Groups:</strong> {assignment.groupCount} {assignment.is_group_work ? "created" : "(N/A)"}</p>
                        </div>
                      </div>
                      
                      {assignment.github_link && (
                        <div className="mb-3">
                          <a
                            href={assignment.github_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 transition-colors text-sm"
                          >
                            📚 Reference Repository →
                          </a>
                        </div>
                      )}
                    </div>
                    
                    <div className="ml-4 flex flex-col gap-2">
                      <Link
                        href={`/teacher/submissions/${assignment.id}`}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm text-center"
                      >
                        View Submissions ({assignment.submissionCount})
                      </Link>
                      
                      <Link
                        href={`/teacher/assignments/${assignment.id}/edit`}
                        className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors text-sm text-center"
                      >
                        Edit
                      </Link>
                      
                      <button
                        onClick={() => setDeleteConfirm({id: assignment.id, title: assignment.title})}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Confirm Deletion</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete "<strong>{deleteConfirm.title}</strong>"? 
                This action cannot be undone and will also delete all associated submissions and groups.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteAssignment(deleteConfirm.id)}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete Assignment
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
} 