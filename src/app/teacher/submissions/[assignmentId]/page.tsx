"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { fetchAssignmentById, fetchAllSubmissions, createRating } from "@/utils/api";

interface Assignment { id: number; title: string }
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

export default function TeacherAssignmentSubmissionsPage({ params }: { params: { assignmentId: string } }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const assignmentId = Number(params.assignmentId);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [scoreById, setScoreById] = useState<Record<number, string>>({});
  const [feedbackById, setFeedbackById] = useState<Record<number, string>>({});
  const [submittingId, setSubmittingId] = useState<number | null>(null);

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
        const [a, subs] = await Promise.all([
          fetchAssignmentById(assignmentId),
          fetchAllSubmissions(),
        ]);
        setAssignment(a as Assignment);
        setSubmissions((subs as Submission[]).filter(s => s.assignment_id === assignmentId));
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("Failed to load assignment submissions", e);
      } finally {
        setLoadingData(false);
      }
    };
    if (user && (user.role.name === "teacher" || user.role.name === "admin")) load();
  }, [user, assignmentId]);

  const onRate = async (submissionId: number) => {
    const score = Number(scoreById[submissionId]);
    const feedback = feedbackById[submissionId] || "";
    if (Number.isNaN(score) || score < 0 || score > 100) {
      alert("Score must be between 0 and 100");
      return;
    }
    try {
      setSubmittingId(submissionId);
      await createRating({ submission_id: submissionId, score, feedback });
      alert("Rating saved");
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Failed to rate", e);
      alert("Failed to save rating");
    } finally {
      setSubmittingId(null);
    }
  };

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
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Submissions: {assignment?.title || `#${assignmentId}`}</h1>
          <p className="text-gray-600 mt-1">Review and rate student work</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Submissions ({submissions.length})</h2>
          </div>
          {submissions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No submissions for this assignment yet.</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {submissions.map((s) => (
                <div key={s.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-lg font-semibold text-gray-800">Submission #{s.id}</span>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">v{s.version}</span>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 capitalize">{s.status}</span>
                      </div>
                      <p className="text-sm text-gray-500 mb-1">Submitted: {new Date(s.submitted_at).toLocaleString()}</p>
                      <a href={s.submission_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 break-all">
                        {s.submission_link}
                      </a>
                    </div>
                    <div className="ml-4 w-full max-w-sm">
                      <div className="grid grid-cols-1 gap-2">
                        <input
                          type="number"
                          placeholder="Score (0-100)"
                          value={scoreById[s.id] || ""}
                          onChange={(e) => setScoreById(prev => ({ ...prev, [s.id]: e.target.value }))}
                          className="px-3 py-2 border border-gray-300 rounded-lg"
                        />
                        <textarea
                          placeholder="Feedback (optional)"
                          value={feedbackById[s.id] || ""}
                          onChange={(e) => setFeedbackById(prev => ({ ...prev, [s.id]: e.target.value }))}
                          className="px-3 py-2 border border-gray-300 rounded-lg"
                          rows={3}
                        />
                        <button
                          onClick={() => onRate(s.id)}
                          disabled={submittingId === s.id}
                          className={`px-4 py-2 rounded-lg text-white ${submittingId === s.id ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"}`}
                        >
                          {submittingId === s.id ? "Saving..." : "Save Rating"}
                        </button>
                      </div>
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

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  fetchAssignmentById,
  fetchSubmissionsByAssignmentId,
  fetchCommentsBySubmissionId,
  fetchRatingsBySubmissionId,
  fetchUserById,
  fetchGroupById,
  createComment,
  createRating,
  updateComment,
  updateRating,
  deleteComment,
  deleteRating,
  fetchCurrentUser,
} from "@/utils/api";

interface Assignment {
  id: number;
  title: string;
  description: string;
  githubLink: string;
  dueDate: string;
  isGroupWork: boolean;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface Group {
  id: number;
  name: string;
  assignmentId: number;
  maxMembers: number;
}

interface Submission {
  id: number;
  assignmentId: number;
  groupId?: number;
  userId?: number;
  submissionLink: string;
  submittedAt: string;
  version: number;
  status: string;
  user?: User;
  group?: Group;
}

interface Comment {
  id: number;
  submissionId: number;
  userId: number;
  comment: string;
  commentedAt: string;
  user: User;
}

interface Rating {
  id: number;
  submissionId: number;
  raterId: number;
  score: number;
  feedback: string;
  ratedAt: string;
  rater: User;
}

export default function SubmissionReviewPage() {
  const params = useParams();
  const router = useRouter();
  const assignmentId = parseInt(params?.assignmentId as string);

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [submissionDetails, setSubmissionDetails] = useState<{
    [key: number]: {
      comments: Comment[];
      ratings: Rating[];
      user?: User;
      group?: Group;
    };
  }>({});
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [newComment, setNewComment] = useState<{ [key: number]: string }>({});
  const [newRating, setNewRating] = useState<{ [key: number]: { score: number; feedback: string } }>({});
  const [editingComment, setEditingComment] = useState<{ id: number; text: string } | null>(null);
  const [editingRating, setEditingRating] = useState<{ id: number; score: number; feedback: string } | null>(null);

  // UI states
  const [expandedSubmissions, setExpandedSubmissions] = useState<{ [key: number]: boolean }>({});
  const [activeTab, setActiveTab] = useState<{ [key: number]: 'comments' | 'ratings' }>({});

  useEffect(() => {
    fetchData();
  }, [assignmentId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch assignment and current user
      const [assignmentData, currentUserData] = await Promise.all([
        fetchAssignmentById(assignmentId),
        fetchCurrentUser(),
      ]);

      setAssignment(assignmentData as Assignment);
      setCurrentUser(currentUserData as User);

      // Fetch submissions
      const submissionsData = await fetchSubmissionsByAssignmentId(assignmentId);
      setSubmissions(submissionsData);

      // Fetch details for each submission
      const details: { [key: number]: any } = {};
      
      for (const submission of submissionsData) {
        const [comments, ratings] = await Promise.all([
          fetchCommentsBySubmissionId(submission.id),
          fetchRatingsBySubmissionId(submission.id),
        ]);

        // Fetch user or group information
        let user: User | undefined;
        let group: Group | undefined;
        
        if (submission.userId) {
          user = await fetchUserById(submission.userId) as User;
        } else if (submission.groupId) {
          group = await fetchGroupById(submission.groupId) as Group;
        }

        details[submission.id] = {
          comments,
          ratings,
          user,
          group,
        };
      }

      setSubmissionDetails(details);
    } catch (err) {
      setError("Failed to load submission data");
      console.error("Error loading submissions:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (submissionId: number) => {
    if (!newComment[submissionId]?.trim()) return;

    try {
      const commentData = {
        submissionId,
        userId: currentUser?.id,
        comment: newComment[submissionId].trim(),
      };

      await createComment(commentData);
      setNewComment(prev => ({ ...prev, [submissionId]: "" }));
      
      // Refresh comments for this submission
      const updatedComments = await fetchCommentsBySubmissionId(submissionId);
      setSubmissionDetails(prev => ({
        ...prev,
        [submissionId]: {
          ...prev[submissionId],
          comments: updatedComments,
        },
      }));
    } catch (err) {
      setError("Failed to add comment");
      console.error("Error adding comment:", err);
    }
  };

  const handleAddRating = async (submissionId: number) => {
    if (!newRating[submissionId]?.score) return;

    try {
      const ratingData = {
        submissionId,
        raterId: currentUser?.id,
        score: newRating[submissionId].score,
        feedback: newRating[submissionId].feedback || "",
      };

      await createRating(ratingData);
      setNewRating(prev => ({ ...prev, [submissionId]: { score: 0, feedback: "" } }));
      
      // Refresh ratings for this submission
      const updatedRatings = await fetchRatingsBySubmissionId(submissionId);
      setSubmissionDetails(prev => ({
        ...prev,
        [submissionId]: {
          ...prev[submissionId],
          ratings: updatedRatings,
        },
      }));
    } catch (err) {
      setError("Failed to add rating");
      console.error("Error adding rating:", err);
    }
  };

  const handleUpdateComment = async () => {
    if (!editingComment) return;

    try {
      await updateComment(editingComment.id, {
        comment: editingComment.text,
      });
      setEditingComment(null);
      
      // Refresh all comments
      fetchData();
    } catch (err) {
      setError("Failed to update comment");
      console.error("Error updating comment:", err);
    }
  };

  const handleUpdateRating = async () => {
    if (!editingRating) return;

    try {
      await updateRating(editingRating.id, {
        score: editingRating.score,
        feedback: editingRating.feedback,
      });
      setEditingRating(null);
      
      // Refresh all ratings
      fetchData();
    } catch (err) {
      setError("Failed to update rating");
      console.error("Error updating rating:", err);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    try {
      await deleteComment(commentId);
      fetchData();
    } catch (err) {
      setError("Failed to delete comment");
      console.error("Error deleting comment:", err);
    }
  };

  const handleDeleteRating = async (ratingId: number) => {
    if (!confirm("Are you sure you want to delete this rating?")) return;

    try {
      await deleteRating(ratingId);
      fetchData();
    } catch (err) {
      setError("Failed to delete rating");
      console.error("Error deleting rating:", err);
    }
  };

  const toggleSubmissionExpansion = (submissionId: number) => {
    setExpandedSubmissions(prev => ({
      ...prev,
      [submissionId]: !prev[submissionId],
    }));
  };

  const setSubmissionTab = (submissionId: number, tab: 'comments' | 'ratings') => {
    setActiveTab(prev => ({
      ...prev,
      [submissionId]: tab,
    }));
  };

  // Calculate statistics
  const totalSubmissions = submissions.length;
  const ratedSubmissions = submissions.filter(sub => 
    submissionDetails[sub.id]?.ratings?.length > 0
  ).length;
  const pendingSubmissions = totalSubmissions - ratedSubmissions;
  const averageRating = submissions.reduce((acc, sub) => {
    const ratings = submissionDetails[sub.id]?.ratings || [];
    if (ratings.length > 0) {
      const avgForSubmission = ratings.reduce((sum, rating) => sum + rating.score, 0) / ratings.length;
      return acc + avgForSubmission;
    }
    return acc;
  }, 0) / Math.max(ratedSubmissions, 1);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600 mb-4">{error || "Assignment not found"}</p>
          <button
            onClick={() => router.push("/teacher/assignments")}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Assignments
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Assignment Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900">{assignment.title}</h1>
          <div className="flex gap-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              assignment.isGroupWork 
                ? 'bg-purple-100 text-purple-800' 
                : 'bg-blue-100 text-blue-800'
            }`}>
              {assignment.isGroupWork ? 'Group Assignment' : 'Individual Assignment'}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              new Date(assignment.dueDate) < new Date()
                ? 'bg-red-100 text-red-800'
                : 'bg-green-100 text-green-800'
            }`}>
              Due: {new Date(assignment.dueDate).toLocaleDateString()}
            </span>
          </div>
        </div>
        
        <p className="text-gray-600 mb-4">{assignment.description}</p>
        
        <div className="flex items-center gap-4">
          <a
            href={assignment.githubLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <span>📋</span>
            View Assignment Details
          </a>
          <button
            onClick={() => router.push("/teacher/assignments")}
            className="text-gray-600 hover:text-gray-800 flex items-center gap-1"
          >
            <span>←</span>
            Back to Assignments
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Submissions</p>
              <p className="text-2xl font-bold text-gray-900">{totalSubmissions}</p>
            </div>
            <div className="text-blue-600 text-2xl">📄</div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Rated</p>
              <p className="text-2xl font-bold text-green-600">{ratedSubmissions}</p>
            </div>
            <div className="text-green-600 text-2xl">✅</div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Review</p>
              <p className="text-2xl font-bold text-orange-600">{pendingSubmissions}</p>
            </div>
            <div className="text-orange-600 text-2xl">⏳</div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Rating</p>
              <p className="text-2xl font-bold text-purple-600">
                {ratedSubmissions > 0 ? averageRating.toFixed(1) : '--'}
              </p>
            </div>
            <div className="text-purple-600 text-2xl">⭐</div>
          </div>
        </div>
      </div>

      {/* Submissions */}
      <div className="space-y-4">
        {submissions.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-gray-400 text-6xl mb-4">📝</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Submissions Yet</h3>
            <p className="text-gray-600">No submissions have been made for this assignment yet.</p>
          </div>
        ) : (
          submissions.map((submission) => {
            const details = submissionDetails[submission.id];
            const isExpanded = expandedSubmissions[submission.id];
            const activeTabForSubmission = activeTab[submission.id] || 'comments';
            
            return (
              <div key={submission.id} className="bg-white rounded-lg shadow-md">
                {/* Submission Header */}
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        {assignment.isGroupWork 
                          ? `${details?.group?.name || 'Group'} Submission`
                          : `${details?.user?.name || 'User'} Submission`
                        }
                      </h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        submission.status === 'submitted' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {submission.status}
                      </span>
                      <span className="text-sm text-gray-500">
                        Version {submission.version}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">
                        {new Date(submission.submittedAt).toLocaleDateString()}
                      </span>
                      <button
                        onClick={() => toggleSubmissionExpansion(submission.id)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        {isExpanded ? '▼' : '▶'}
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-2 flex items-center gap-4">
                    <a
                      href={submission.submissionLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <span>🔗</span>
                      View Submission
                    </a>
                    
                    {details?.ratings?.length > 0 && (
                      <div className="flex items-center gap-1">
                        <span>⭐</span>
                        <span className="text-sm font-medium">
                          {(details.ratings.reduce((sum, r) => sum + r.score, 0) / details.ratings.length).toFixed(1)}
                        </span>
                        <span className="text-sm text-gray-500">
                          ({details.ratings.length} rating{details.ratings.length !== 1 ? 's' : ''})
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="p-4">
                    {/* Tab Navigation */}
                    <div className="flex border-b border-gray-200 mb-4">
                      <button
                        onClick={() => setSubmissionTab(submission.id, 'comments')}
                        className={`px-4 py-2 border-b-2 font-medium text-sm ${
                          activeTabForSubmission === 'comments'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        Comments ({details?.comments?.length || 0})
                      </button>
                      <button
                        onClick={() => setSubmissionTab(submission.id, 'ratings')}
                        className={`px-4 py-2 border-b-2 font-medium text-sm ${
                          activeTabForSubmission === 'ratings'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        Ratings ({details?.ratings?.length || 0})
                      </button>
                    </div>

                    {/* Comments Tab */}
                    {activeTabForSubmission === 'comments' && (
                      <div className="space-y-4">
                        {/* Existing Comments */}
                        {details?.comments?.map((comment) => (
                          <div key={comment.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">{comment.user?.name}</span>
                                <span className="text-sm text-gray-500">
                                  {new Date(comment.commentedAt).toLocaleDateString()}
                                </span>
                              </div>
                              
                              {comment.userId === currentUser?.id && (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => setEditingComment({ id: comment.id, text: comment.comment })}
                                    className="text-blue-600 hover:text-blue-800 text-sm"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteComment(comment.id)}
                                    className="text-red-600 hover:text-red-800 text-sm"
                                  >
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                            
                            {editingComment?.id === comment.id ? (
                              <div className="space-y-2">
                                <textarea
                                  value={editingComment.text}
                                  onChange={(e) => setEditingComment(prev => prev ? { ...prev, text: e.target.value } : null)}
                                  className="w-full p-2 border border-gray-300 rounded-md resize-none"
                                  rows={3}
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={handleUpdateComment}
                                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingComment(null)}
                                    className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-sm"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-gray-700">{comment.comment}</p>
                            )}
                          </div>
                        ))}
                        
                        {/* Add New Comment */}
                        <div className="border border-gray-200 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-2">Add Comment</h4>
                          <div className="space-y-2">
                            <textarea
                              value={newComment[submission.id] || ''}
                              onChange={(e) => setNewComment(prev => ({ ...prev, [submission.id]: e.target.value }))}
                              placeholder="Write your comment..."
                              className="w-full p-2 border border-gray-300 rounded-md resize-none"
                              rows={3}
                            />
                            <button
                              onClick={() => handleAddComment(submission.id)}
                              disabled={!newComment[submission.id]?.trim()}
                              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                              Add Comment
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Ratings Tab */}
                    {activeTabForSubmission === 'ratings' && (
                      <div className="space-y-4">
                        {/* Existing Ratings */}
                        {details?.ratings?.map((rating) => (
                          <div key={rating.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">{rating.rater?.name}</span>
                                <div className="flex items-center gap-1">
                                  <span className="text-yellow-400">⭐</span>
                                  <span className="font-medium">{rating.score}/10</span>
                                </div>
                                <span className="text-sm text-gray-500">
                                  {new Date(rating.ratedAt).toLocaleDateString()}
                                </span>
                              </div>
                              
                              {rating.raterId === currentUser?.id && (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => setEditingRating({ 
                                      id: rating.id, 
                                      score: rating.score, 
                                      feedback: rating.feedback 
                                    })}
                                    className="text-blue-600 hover:text-blue-800 text-sm"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteRating(rating.id)}
                                    className="text-red-600 hover:text-red-800 text-sm"
                                  >
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                            
                            {editingRating?.id === rating.id ? (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <label className="text-sm font-medium text-gray-700">Score:</label>
                                  <select
                                    value={editingRating.score}
                                    onChange={(e) => setEditingRating(prev => prev ? { ...prev, score: parseInt(e.target.value) } : null)}
                                    className="p-1 border border-gray-300 rounded"
                                  >
                                    {[...Array(10)].map((_, i) => (
                                      <option key={i + 1} value={i + 1}>{i + 1}</option>
                                    ))}
                                  </select>
                                </div>
                                <textarea
                                  value={editingRating.feedback}
                                  onChange={(e) => setEditingRating(prev => prev ? { ...prev, feedback: e.target.value } : null)}
                                  placeholder="Feedback (optional)"
                                  className="w-full p-2 border border-gray-300 rounded-md resize-none"
                                  rows={3}
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={handleUpdateRating}
                                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingRating(null)}
                                    className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-sm"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              rating.feedback && <p className="text-gray-700 mt-2">{rating.feedback}</p>
                            )}
                          </div>
                        ))}
                        
                        {/* Add New Rating */}
                        <div className="border border-gray-200 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-2">Add Rating</h4>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <label className="text-sm font-medium text-gray-700">Score:</label>
                              <select
                                value={newRating[submission.id]?.score || ''}
                                onChange={(e) => setNewRating(prev => ({ 
                                  ...prev, 
                                  [submission.id]: { 
                                    ...prev[submission.id], 
                                    score: parseInt(e.target.value) 
                                  } 
                                }))}
                                className="p-1 border border-gray-300 rounded"
                              >
                                <option value="">Select score</option>
                                {[...Array(10)].map((_, i) => (
                                  <option key={i + 1} value={i + 1}>{i + 1}</option>
                                ))}
                              </select>
                            </div>
                            <textarea
                              value={newRating[submission.id]?.feedback || ''}
                              onChange={(e) => setNewRating(prev => ({ 
                                ...prev, 
                                [submission.id]: { 
                                  ...prev[submission.id], 
                                  feedback: e.target.value 
                                } 
                              }))}
                              placeholder="Feedback (optional)"
                              className="w-full p-2 border border-gray-300 rounded-md resize-none"
                              rows={3}
                            />
                            <button
                              onClick={() => handleAddRating(submission.id)}
                              disabled={!newRating[submission.id]?.score}
                              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                              Add Rating
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
} 