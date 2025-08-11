"use client";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { 
  fetchAllAssignments, 
  fetchAllSubmissions,
  fetchUserGroupForAssignment
} from "@/utils/api";
import Link from "next/link";
import { AssignmentTeacherDashboard, SubmissionTeacher , AssignmentWithStatus} from "@/types/interfaces";

export default function StudentAssignmentsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [assignments, setAssignments] = useState<AssignmentWithStatus[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [filter, setFilter] = useState<"all" | "individual" | "group" | "submitted" | "pending" | "overdue">("all");
  const [sortBy, setSortBy] = useState<"due_date" | "title" | "type" | "status">("due_date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    } else if (!loading && user && user.role.name !== "student") {
      router.push("/");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (user && user.role.name === "student") {
      loadAssignmentsData();
    }
  }, [user]);

  const loadAssignmentsData = async () => {
    try {
      setLoadingData(true);
      
      const [allAssignments, allSubmissions] = await Promise.all([
        fetchAllAssignments(),
        fetchAllSubmissions()
      ]);
      
      // Enrich assignments with submission status and other info
      const enrichedAssignments: AssignmentWithStatus[] = await Promise.all(
        (allAssignments as AssignmentTeacherDashboard[]).map(async (assignment) => {
          // Check for user's submission (individual assignments)
          let userSubmission = (allSubmissions as SubmissionTeacher[]).find(s => 
            s.assignment_id === assignment.id && s.user_id === user!.id
          );
          
                     // Check for group submission and user's group (group assignments)
           let userGroup: any = null;
           let groupSubmission: SubmissionTeacher | undefined = undefined;
           if (assignment.is_group_work) {
             userGroup = await fetchUserGroupForAssignment(assignment.id, user!.id);
             if (userGroup) {
               groupSubmission = (allSubmissions as SubmissionTeacher[]).find(s => 
                 s.assignment_id === assignment.id && s.group_id === userGroup.id
               );
             }
           }
           
           const submission = assignment.is_group_work ? groupSubmission : userSubmission;
          const hasSubmission = !!submission;
          
          // Calculate due date info
          const now = new Date();
          const due_date = assignment.due_date ? new Date(assignment.due_date) : null;
          const isOverdue = due_date ? due_date < now : false;
          const daysUntilDue = due_date ? Math.ceil((due_date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : undefined;
          
          // Determine if user can submit
          let canSubmit = !hasSubmission;
          if (assignment.is_group_work) {
            canSubmit = canSubmit && !!userGroup; // Must be in a group to submit
          }
          
          return {
            ...assignment,
            hasSubmission,
            submission,
            userGroup,
            isOverdue,
            daysUntilDue,
            canSubmit
          };
        })
      );
      
      setAssignments(enrichedAssignments);
      
    } catch (error) {
      console.error("Error loading assignments data:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const getFilteredAssignments = () => {
    let filtered = assignments;
    
    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(a => 
        a.title.toLowerCase().includes(searchLower) ||
        a.description.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply category filter
    switch (filter) {
      case "individual":
        filtered = filtered.filter(a => !a.is_group_work);
        break;
      case "group":
        filtered = filtered.filter(a => a.is_group_work);
        break;
      case "submitted":
        filtered = filtered.filter(a => a.hasSubmission);
        break;
      case "pending":
        filtered = filtered.filter(a => !a.hasSubmission);
        break;
      case "overdue":
        filtered = filtered.filter(a => a.isOverdue && !a.hasSubmission);
        break;
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case "due_date":
          if (!a.due_date && !b.due_date) comparison = 0;
          else if (!a.due_date) comparison = 1;
          else if (!b.due_date) comparison = -1;
          else comparison = new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
          break;
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
        case "type":
          comparison = (a.is_group_work ? 1 : 0) - (b.is_group_work ? 1 : 0);
          break;
        case "status":
          comparison = (a.hasSubmission ? 1 : 0) - (b.hasSubmission ? 1 : 0);
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
    const submittedAssignments = assignments.filter(a => a.hasSubmission).length;
    const pendingAssignments = assignments.filter(a => !a.hasSubmission).length;
    const overdueAssignments = assignments.filter(a => a.isOverdue && !a.hasSubmission).length;
    
    return {
      totalAssignments,
      individualAssignments,
      groupAssignments,
      submittedAssignments,
      pendingAssignments,
      overdueAssignments
    };
  };

  const getStatusColor = (assignment: AssignmentWithStatus) => {
    if (assignment.hasSubmission) return "bg-green-100 text-green-800 border-green-200";
    if (assignment.isOverdue) return "bg-red-100 text-red-800 border-red-200";
    if (assignment.daysUntilDue !== undefined && assignment.daysUntilDue <= 3) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-blue-100 text-blue-800 border-blue-200";
  };

  const getStatusText = (assignment: AssignmentWithStatus) => {
    if (assignment.hasSubmission) return "Submitted";
    if (assignment.isOverdue) return "Overdue";
    if (assignment.daysUntilDue !== undefined) {
      if (assignment.daysUntilDue <= 0) return "Due Today";
      if (assignment.daysUntilDue <= 3) return `Due in ${assignment.daysUntilDue} day${assignment.daysUntilDue > 1 ? 's' : ''}`;
      return `Due in ${assignment.daysUntilDue} days`;
    }
    return "No Due Date";
  };

  const getActionText = (assignment: AssignmentWithStatus) => {
    if (assignment.hasSubmission) return "View Details";
    if (assignment.is_group_work && !assignment.userGroup) return "Join/Create Group";
    if (assignment.canSubmit) return "Submit Assignment";
    return "View Details";
  };

  const getActionColor = (assignment: AssignmentWithStatus) => {
    if (assignment.hasSubmission) return "bg-green-600 hover:bg-green-700";
    if (assignment.isOverdue) return "bg-red-600 hover:bg-red-700";
    if (assignment.canSubmit) return "bg-blue-600 hover:bg-blue-700";
    return "bg-gray-600 hover:bg-gray-700";
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
              <h1 className="text-3xl font-bold text-gray-800">All Assignments</h1>
              <p className="text-gray-600 mt-2">Browse and access your assignments</p>
            </div>
            <Link
              href="/student/dashboard"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Dashboard
            </Link>
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
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Submitted</h3>
            <p className="text-3xl font-bold text-green-600">{stats.submittedAssignments}</p>
            <p className="text-sm text-gray-500 mt-1">Completed</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Pending</h3>
            <p className="text-3xl font-bold text-orange-600">{stats.pendingAssignments}</p>
            <p className="text-sm text-gray-500 mt-1">To do</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Overdue</h3>
            <p className="text-3xl font-bold text-red-600">{stats.overdueAssignments}</p>
            <p className="text-sm text-gray-500 mt-1">Past due</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg p-6 shadow-sm mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search assignments..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Assignments</option>
                <option value="individual">Individual Only</option>
                <option value="group">Group Only</option>
                <option value="submitted">Submitted</option>
                <option value="pending">Pending</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort by</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="due_date">Due Date</option>
                <option value="title">Title</option>
                <option value="type">Type</option>
                <option value="status">Status</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Order</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                {searchTerm ? "Try adjusting your search term or filters." : "No assignments are available yet."}
              </p>
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
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                        <div>
                          <p><strong>Due Date:</strong> {
                            assignment.due_date 
                              ? new Date(assignment.due_date).toLocaleString()
                              : "No due date"
                          }</p>
                          <p><strong>Type:</strong> {assignment.is_group_work ? "Group Assignment" : "Individual Assignment"}</p>
                        </div>
                        <div>
                          {assignment.is_group_work && (
                            <p><strong>Group Status:</strong> {
                              assignment.userGroup ? `In group "${assignment.userGroup.name}"` : "Not in a group"
                            }</p>
                          )}
                          {assignment.hasSubmission && assignment.submission && (
                            <p><strong>Submitted:</strong> {new Date(assignment.submission.submitted_at).toLocaleDateString()}</p>
                          )}
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
                      
                      {/* Warning for group assignments without group */}
                      {assignment.is_group_work && !assignment.userGroup && !assignment.hasSubmission && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                          <p className="text-yellow-800 text-sm">
                            ⚠️ You need to join or create a group before you can submit this assignment.
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="ml-4">
                      <Link
                        href={`/student/assignments/${assignment.id}`}
                        className={`${getActionColor(assignment)} text-white px-4 py-2 rounded-lg transition-colors text-sm`}
                      >
                        {getActionText(assignment)}
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/student/submissions"
            className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-2">My Submissions</h3>
            <p className="text-gray-600 text-sm">View all your submitted assignments and their status</p>
            <div className="mt-3 text-blue-600 text-sm font-medium">
              View Submissions →
            </div>
          </Link>
          
          <Link
            href="/student/groups"
            className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Group Management</h3>
            <p className="text-gray-600 text-sm">Create, join, and manage your assignment groups</p>
            <div className="mt-3 text-purple-600 text-sm font-medium">
              Manage Groups →
            </div>
          </Link>
          
          <Link
            href="/student/dashboard"
            className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Dashboard</h3>
            <p className="text-gray-600 text-sm">Overview of assignments, deadlines, and progress</p>
            <div className="mt-3 text-green-600 text-sm font-medium">
              Go to Dashboard →
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
} 