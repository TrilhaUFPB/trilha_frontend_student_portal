"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  fetchAssignmentById, createRating,
  fetchSubmissionsByAssignmentId,
  fetchCommentsBySubmissionId,
  fetchRatingsBySubmissionId,
  fetchUserById,
  fetchGroupById,
  createComment,
  updateComment,
  updateRating,
  deleteComment,
  deleteRating,
  fetchCurrentUser,
} from "@/utils/api";
import { AssignmentReview, SubmissionReview, CommentReview, RatingReview, UserReview, GroupReview } from "@/types/interfaces"

export default function SubmissionReviewPage() {
  const params = useParams();
  const router = useRouter();
  const assignmentId = parseInt(params?.assignmentId as string);

  const [AssignmentReview, setAssignment] = useState<AssignmentReview | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionReview[]>([]);
  const [submissionDetails, setSubmissionDetails] = useState<{
    [key: number]: {
      comments: CommentReview[];
      ratings: RatingReview[];
      UserReview?: UserReview;
      GroupReview?: GroupReview;
    };
  }>({});
  const [currentUser, setCurrentUser] = useState<UserReview | null>(null);
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

      // Fetch AssignmentReview and current UserReview
      const [assignmentData, currentUserData] = await Promise.all([
        fetchAssignmentById(assignmentId),
        fetchCurrentUser(),
      ]);

      setAssignment(assignmentData as AssignmentReview);
      setCurrentUser(currentUserData as UserReview);

      // Fetch submissions
      const submissionsData = await fetchSubmissionsByAssignmentId(assignmentId);
      setSubmissions(submissionsData);

      // Fetch details for each SubmissionReview
      const details: { [key: number]: any } = {};

      for (const SubmissionReview of submissionsData) {
        const [comments, ratings] = await Promise.all([
          fetchCommentsBySubmissionId(SubmissionReview.id),
          fetchRatingsBySubmissionId(SubmissionReview.id),
        ]);

        // Fetch UserReview or GroupReview information
        let UserReview: UserReview | undefined;
        let GroupReview: GroupReview | undefined;

        if (SubmissionReview.userId) {
          UserReview = await fetchUserById(SubmissionReview.userId) as UserReview;
        } else if (SubmissionReview.groupId) {
          GroupReview = await fetchGroupById(SubmissionReview.groupId) as GroupReview;
        }

        details[SubmissionReview.id] = {
          comments,
          ratings,
          UserReview,
          GroupReview,
        };
      }

      setSubmissionDetails(details);
    } catch (err) {
      setError("Failed to load SubmissionReview data");
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
        CommentReview: newComment[submissionId].trim(),
      };

      await createComment(commentData);
      setNewComment(prev => ({ ...prev, [submissionId]: "" }));

      // Refresh comments for this SubmissionReview
      const updatedComments = await fetchCommentsBySubmissionId(submissionId);
      setSubmissionDetails(prev => ({
        ...prev,
        [submissionId]: {
          ...prev[submissionId],
          comments: updatedComments,
        },
      }));
    } catch (err) {
      setError("Failed to add CommentReview");
      console.error("Error adding CommentReview:", err);
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

      // Refresh ratings for this SubmissionReview
      const updatedRatings = await fetchRatingsBySubmissionId(submissionId);
      setSubmissionDetails(prev => ({
        ...prev,
        [submissionId]: {
          ...prev[submissionId],
          ratings: updatedRatings,
        },
      }));
    } catch (err) {
      setError("Failed to add RatingReview");
      console.error("Error adding RatingReview:", err);
    }
  };

  const handleUpdateComment = async () => {
    if (!editingComment) return;

    try {
      await updateComment(editingComment.id, {
        CommentReview: editingComment.text,
      });
      setEditingComment(null);

      // Refresh all comments
      fetchData();
    } catch (err) {
      setError("Failed to update CommentReview");
      console.error("Error updating CommentReview:", err);
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
      setError("Failed to update RatingReview");
      console.error("Error updating RatingReview:", err);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm("Are you sure you want to delete this CommentReview?")) return;

    try {
      await deleteComment(commentId);
      fetchData();
    } catch (err) {
      setError("Failed to delete CommentReview");
      console.error("Error deleting CommentReview:", err);
    }
  };

  const handleDeleteRating = async (ratingId: number) => {
    if (!confirm("Are you sure you want to delete this RatingReview?")) return;

    try {
      await deleteRating(ratingId);
      fetchData();
    } catch (err) {
      setError("Failed to delete RatingReview");
      console.error("Error deleting RatingReview:", err);
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
      const avgForSubmission = ratings.reduce((sum, RatingReview) => sum + RatingReview.score, 0) / ratings.length;
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

  if (error || !AssignmentReview) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600 mb-4">{error || "AssignmentReview not found"}</p>
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
      {/* AssignmentReview Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900">{AssignmentReview.title}</h1>
          <div className="flex gap-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${AssignmentReview.is_group_work
              ? 'bg-purple-100 text-purple-800'
              : 'bg-blue-100 text-blue-800'
              }`}>
              {AssignmentReview.is_group_work ? 'GroupReview AssignmentReview' : 'Individual AssignmentReview'}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${new Date(AssignmentReview.due_date) < new Date()
              ? 'bg-red-100 text-red-800'
              : 'bg-green-100 text-green-800'
              }`}>
              Due: {new Date(AssignmentReview.due_date).toLocaleDateString()}
            </span>
          </div>
        </div>

        <p className="text-gray-600 mb-4">{AssignmentReview.description}</p>

        <div className="flex items-center gap-4">
          <a
            href={AssignmentReview.github_link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <span>📋</span>
            View AssignmentReview Details
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
              <p className="text-sm font-medium text-gray-600">Average RatingReview</p>
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
            <p className="text-gray-600">No submissions have been made for this AssignmentReview yet.</p>
          </div>
        ) : (
          submissions.map((SubmissionReview) => {
            const details = submissionDetails[SubmissionReview.id];
            const isExpanded = expandedSubmissions[SubmissionReview.id];
            const activeTabForSubmission = activeTab[SubmissionReview.id] || 'comments';

            return (
              <div key={SubmissionReview.id} className="bg-white rounded-lg shadow-md">
                {/* SubmissionReview Header */}
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        {AssignmentReview.is_group_work
                          ? `${details?.GroupReview?.name || 'GroupReview'} SubmissionReview`
                          : `${details?.UserReview?.name || 'UserReview'} SubmissionReview`
                        }
                      </h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${SubmissionReview.status === 'submitted'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                        }`}>
                        {SubmissionReview.status}
                      </span>
                      <span className="text-sm text-gray-500">
                        Version {SubmissionReview.version}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">
                        {new Date(SubmissionReview.submittedAt).toLocaleDateString()}
                      </span>
                      <button
                        onClick={() => toggleSubmissionExpansion(SubmissionReview.id)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        {isExpanded ? '▼' : '▶'}
                      </button>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center gap-4">
                    <a
                      href={SubmissionReview.submissionLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <span>🔗</span>
                      View SubmissionReview
                    </a>

                    {details?.ratings?.length > 0 && (
                      <div className="flex items-center gap-1">
                        <span>⭐</span>
                        <span className="text-sm font-medium">
                          {(details.ratings.reduce((sum, r) => sum + r.score, 0) / details.ratings.length).toFixed(1)}
                        </span>
                        <span className="text-sm text-gray-500">
                          ({details.ratings.length} RatingReview{details.ratings.length !== 1 ? 's' : ''})
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
                        onClick={() => setSubmissionTab(SubmissionReview.id, 'comments')}
                        className={`px-4 py-2 border-b-2 font-medium text-sm ${activeTabForSubmission === 'comments'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                      >
                        Comments ({details?.comments?.length || 0})
                      </button>
                      <button
                        onClick={() => setSubmissionTab(SubmissionReview.id, 'ratings')}
                        className={`px-4 py-2 border-b-2 font-medium text-sm ${activeTabForSubmission === 'ratings'
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
                        {details?.comments?.map((CommentReview) => (
                          <div key={CommentReview.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">{CommentReview.UserReview?.name}</span>
                                <span className="text-sm text-gray-500">
                                  {new Date(CommentReview.commentedAt).toLocaleDateString()}
                                </span>
                              </div>

                              {CommentReview.userId === currentUser?.id && (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => setEditingComment({ id: CommentReview.id, text: CommentReview.CommentReview })}
                                    className="text-blue-600 hover:text-blue-800 text-sm"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteComment(CommentReview.id)}
                                    className="text-red-600 hover:text-red-800 text-sm"
                                  >
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>

                            {editingComment?.id === CommentReview.id ? (
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
                              <p className="text-gray-700">{CommentReview.CommentReview}</p>
                            )}
                          </div>
                        ))}

                        {/* Add New CommentReview */}
                        <div className="border border-gray-200 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-2">Add CommentReview</h4>
                          <div className="space-y-2">
                            <textarea
                              value={newComment[SubmissionReview.id] || ''}
                              onChange={(e) => setNewComment(prev => ({ ...prev, [SubmissionReview.id]: e.target.value }))}
                              placeholder="Write your CommentReview..."
                              className="w-full p-2 border border-gray-300 rounded-md resize-none"
                              rows={3}
                            />
                            <button
                              onClick={() => handleAddComment(SubmissionReview.id)}
                              disabled={!newComment[SubmissionReview.id]?.trim()}
                              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                              Add CommentReview
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Ratings Tab */}
                    {activeTabForSubmission === 'ratings' && (
                      <div className="space-y-4">
                        {/* Existing Ratings */}
                        {details?.ratings?.map((RatingReview) => (
                          <div key={RatingReview.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">{RatingReview.rater?.name}</span>
                                <div className="flex items-center gap-1">
                                  <span className="text-yellow-400">⭐</span>
                                  <span className="font-medium">{RatingReview.score}/10</span>
                                </div>
                                <span className="text-sm text-gray-500">
                                  {new Date(RatingReview.ratedAt).toLocaleDateString()}
                                </span>
                              </div>

                              {RatingReview.raterId === currentUser?.id && (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => setEditingRating({
                                      id: RatingReview.id,
                                      score: RatingReview.score,
                                      feedback: RatingReview.feedback
                                    })}
                                    className="text-blue-600 hover:text-blue-800 text-sm"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteRating(RatingReview.id)}
                                    className="text-red-600 hover:text-red-800 text-sm"
                                  >
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>

                            {editingRating?.id === RatingReview.id ? (
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
                              RatingReview.feedback && <p className="text-gray-700 mt-2">{RatingReview.feedback}</p>
                            )}
                          </div>
                        ))}

                        {/* Add New RatingReview */}
                        <div className="border border-gray-200 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-2">Add RatingReview</h4>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <label className="text-sm font-medium text-gray-700">Score:</label>
                              <select
                                value={newRating[SubmissionReview.id]?.score || ''}
                                onChange={(e) => setNewRating(prev => ({
                                  ...prev,
                                  [SubmissionReview.id]: {
                                    ...prev[SubmissionReview.id],
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
                              value={newRating[SubmissionReview.id]?.feedback || ''}
                              onChange={(e) => setNewRating(prev => ({
                                ...prev,
                                [SubmissionReview.id]: {
                                  ...prev[SubmissionReview.id],
                                  feedback: e.target.value
                                }
                              }))}
                              placeholder="Feedback (optional)"
                              className="w-full p-2 border border-gray-300 rounded-md resize-none"
                              rows={3}
                            />
                            <button
                              onClick={() => handleAddRating(SubmissionReview.id)}
                              disabled={!newRating[SubmissionReview.id]?.score}
                              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                              Add RatingReview
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