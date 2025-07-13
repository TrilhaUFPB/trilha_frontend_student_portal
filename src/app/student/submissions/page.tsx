"use client";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { 
  fetchAllSubmissions, 
  fetchAllAssignments,
  fetchUserGroupForAssignment,
  fetchCommentsBySubmissionId,
  fetchRatingsBySubmissionId,
  fetchGroupById
} from "@/utils/api";
import Link from "next/link";

interface Assignment {
  id: number;
  title: string;
  description: string;
  due_date: string;
  is_group_work: boolean;
  github_link?: string;
}

interface Submission {
  id: number;
  assignment_id: number;
  user_id?: number;
  group_id?: number;
  submission_link: string;
  submitted_at: string;
  version: number;
  status: string;
}

interface Group {
  id: number;
  assignment_id: number;
  name: string;
  leader_id: number;
  created_at: string;
}

interface Comment {
  id: number;
  submission_id: number;
  user_id: number;
  comment: string;
  commented_at: string;
}

interface Rating {
  id: number;
  submission_id: number;
  rater_id: number;
  score: number;
  feedback: string;
  rated_at: string;
}

interface SubmissionWithDetails extends Submission {
  assignment: Assignment;
  group?: Group;
  comments: Comment[];
  ratings: Rating[];
  averageRating?: number;
}

export default function StudentSubmissionsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [submissions, setSubmissions] = useState<SubmissionWithDetails[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [filter, setFilter] = useState<"all" | "individual" | "group">("all");
  const [sortBy, setSortBy] = useState<"date" | "assignment" | "status">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    } else if (!loading && user && user.role.name !== "student") {
      router.push("/");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (user && user.role.name === "student") {
      loadSubmissionsData();
    }
  }, [user]);

  const loadSubmissionsData = async () => {
    try {
      setLoadingData(true);
      
      // Load all submissions and assignments
      const [allSubmissions, allAssignments] = await Promise.all([
        fetchAllSubmissions(),
        fetchAllAssignments()
      ]);
      
      // Filter submissions for the current user
      const userSubmissions = (allSubmissions as Submission[]).filter(s => 
        s.user_id === user!.id
      );
      
      // Find group submissions for assignments where user is in a group
      const groupSubmissions: Submission[] = [];
      for (const assignment of allAssignments as Assignment[]) {
        if (assignment.is_group_work) {
          const userGroup = await fetchUserGroupForAssignment(assignment.id, user!.id);
          if (userGroup) {
            const groupSubmission = (allSubmissions as Submission[]).find(s => 
              s.assignment_id === assignment.id && s.group_id === userGroup.id
            );
            if (groupSubmission) {
              groupSubmissions.push(groupSubmission);
            }
          }
        }
      }
      
      // Combine individual and group submissions
      const allUserSubmissions = [...userSubmissions, ...groupSubmissions];
      
      // Remove duplicates based on submission id
      const uniqueSubmissions = allUserSubmissions.filter((submission, index, self) => 
        index === self.findIndex(s => s.id === submission.id)
      );
      
      // Enrich submissions with assignment details, comments, and ratings
      const enrichedSubmissions: SubmissionWithDetails[] = await Promise.all(
        uniqueSubmissions.map(async (submission) => {
          const assignment = (allAssignments as Assignment[]).find(a => a.id === submission.assignment_id)!;
          const comments = await fetchCommentsBySubmissionId(submission.id);
          const ratings = await fetchRatingsBySubmissionId(submission.id);
          
          let group: Group | undefined = undefined;
          if (submission.group_id) {
            try {
              group = await fetchGroupById(submission.group_id) as Group;
            } catch (error) {
              console.error(`Error fetching group ${submission.group_id}:`, error);
            }
          }
          
          const averageRating = ratings.length > 0 
            ? ratings.reduce((sum: number, rating: any) => sum + rating.score, 0) / ratings.length 
            : undefined;
          
          return {
            ...submission,
            assignment,
            group,
            comments,
            ratings,
            averageRating
          };
        })
      );
      
      setSubmissions(enrichedSubmissions);
      setAssignments(allAssignments as Assignment[]);
      
    } catch (error) {
      console.error("Error loading submissions data:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const getFilteredSubmissions = () => {
    let filtered = submissions;
    
    // Apply filter
    if (filter === "individual") {
      filtered = filtered.filter(s => !s.group_id);
    } else if (filter === "group") {
      filtered = filtered.filter(s => s.group_id);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case "date":
          comparison = new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime();
          break;
        case "assignment":
          comparison = a.assignment.title.localeCompare(b.assignment.title);
          break;
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
      }
      
      return sortOrder === "asc" ? comparison : -comparison;
    });
    
    return filtered;
  };

  const getSubmissionStats = () => {
    const totalSubmissions = submissions.length;
    const individualSubmissions = submissions.filter(s => !s.group_id).length;
    const groupSubmissions = submissions.filter(s => s.group_id).length;
    const ratedSubmissions = submissions.filter(s => s.ratings.length > 0).length;
    const averageRating = submissions.filter(s => s.averageRating !== undefined)
      .reduce((sum, s) => sum + s.averageRating!, 0) / ratedSubmissions || 0;
    
    return {
      totalSubmissions,
      individualSubmissions,
      groupSubmissions,
      ratedSubmissions,
      averageRating
    };
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "submitted":
        return "bg-blue-100 text-blue-800";
      case "graded":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
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

  const filteredSubmissions = getFilteredSubmissions();
  const stats = getSubmissionStats();

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">My Submissions</h1>
              <p className="text-gray-600 mt-2">Track your assignment submissions and their progress</p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Submissions</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.totalSubmissions}</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Individual</h3>
            <p className="text-3xl font-bold text-green-600">{stats.individualSubmissions}</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Group</h3>
            <p className="text-3xl font-bold text-purple-600">{stats.groupSubmissions}</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Rated</h3>
            <p className="text-3xl font-bold text-orange-600">{stats.ratedSubmissions}</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Avg. Rating</h3>
            <p className="text-3xl font-bold text-indigo-600">
              {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "N/A"}
            </p>
          </div>
        </div>

        {/* Filters and Sorting */}
        <div className="bg-white rounded-lg p-6 shadow-sm mb-8">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Filter:</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as "all" | "individual" | "group")}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Submissions</option>
                <option value="individual">Individual Only</option>
                <option value="group">Group Only</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "date" | "assignment" | "status")}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="date">Date</option>
                <option value="assignment">Assignment</option>
                <option value="status">Status</option>
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

        {/* Submissions List */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">
              Submissions ({filteredSubmissions.length})
            </h2>
          </div>
          
          {filteredSubmissions.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500 text-lg">No submissions found.</p>
              <p className="text-gray-400 mt-2">Start by visiting your assignments and submitting your work!</p>
              <Link
                href="/student/dashboard"
                className="inline-block mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Assignments
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredSubmissions.map((submission) => (
                <div key={submission.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Link
                          href={`/student/assignments/${submission.assignment.id}`}
                          className="text-lg font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          {submission.assignment.title}
                        </Link>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(submission.status)}`}>
                          {submission.status}
                        </span>
                        {submission.group_id && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            Group: {submission.group?.name || `ID ${submission.group_id}`}
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                        <div>
                          <p><strong>Submitted:</strong> {new Date(submission.submitted_at).toLocaleString()}</p>
                          <p><strong>Version:</strong> {submission.version}</p>
                        </div>
                        <div>
                          <p><strong>Due Date:</strong> {
                            submission.assignment.due_date 
                              ? new Date(submission.assignment.due_date).toLocaleString()
                              : "No due date"
                          }</p>
                          <p><strong>Type:</strong> {submission.assignment.is_group_work ? "Group Assignment" : "Individual Assignment"}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm">
                        <a
                          href={submission.submission_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          View Repository →
                        </a>
                        
                        {submission.comments.length > 0 && (
                          <span className="text-gray-500">
                            💬 {submission.comments.length} comment{submission.comments.length > 1 ? 's' : ''}
                          </span>
                        )}
                        
                        {submission.ratings.length > 0 && (
                          <span className="text-gray-500">
                            ⭐ {submission.ratings.length} rating{submission.ratings.length > 1 ? 's' : ''}
                            {submission.averageRating && (
                              <span className="ml-1 font-medium">
                                (avg: {submission.averageRating.toFixed(1)}/100)
                              </span>
                            )}
                          </span>
                        )}
                        
                        {submission.assignment.due_date && isOverdue(submission.assignment.due_date) && (
                          <span className="text-red-600 font-medium">
                            ⚠️ Was overdue
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="ml-4">
                      <Link
                        href={`/student/assignments/${submission.assignment.id}`}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        View Details
                      </Link>
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