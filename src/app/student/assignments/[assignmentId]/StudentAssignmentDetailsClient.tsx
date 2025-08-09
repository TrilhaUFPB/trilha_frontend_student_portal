"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  fetchCurrentUser,
  fetchUserSubmissionForAssignment,
  fetchGroupSubmissionForAssignment,
  fetchUserGroupForAssignment,
  fetchGroupsByAssignmentId,
  fetchGroupMembersByGroupId,
  fetchCommentsBySubmissionId,
  fetchRatingsBySubmissionId,
  createSubmission,
  updateSubmission,
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

interface GroupMember {
  id: number;
  groupId: number;
  userId: number;
  joinedAt: string;
  user: User;
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

interface Props {
  assignment: Assignment;
  assignmentId: number;
}

export default function StudentAssignmentDetailsClient({ assignment, assignmentId }: Props) {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [userGroup, setUserGroup] = useState<Group | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [availableGroups, setAvailableGroups] = useState<Group[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [submissionLink, setSubmissionLink] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'submit' | 'group' | 'feedback'>('details');

  useEffect(() => {
    fetchData();
  }, [assignmentId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch current user
      const currentUserData = await fetchCurrentUser() as User;
      setCurrentUser(currentUserData);

      // Fetch user's submission
      let submissionData: Submission | null = null;
      if (assignment.isGroupWork) {
        // For group work, check if user has a group first
        try {
          const groupData = await fetchUserGroupForAssignment(assignmentId, currentUserData.id);
          if (groupData) {
            setUserGroup(groupData as Group);
            // Fetch group members
            const membersData = await fetchGroupMembersByGroupId(groupData.id);
            setGroupMembers(membersData as GroupMember[]);
            // Fetch group submission
            submissionData = await fetchGroupSubmissionForAssignment(assignmentId, groupData.id) as Submission;
          }
        } catch (err) {
          // User doesn't have a group yet
          console.log("User doesn't have a group yet");
        }
        
        // Fetch available groups
        const groupsData = await fetchGroupsByAssignmentId(assignmentId);
        setAvailableGroups(groupsData as Group[]);
      } else {
        // For individual work, fetch user's submission
        try {
          submissionData = await fetchUserSubmissionForAssignment(assignmentId, currentUserData.id) as Submission;
        } catch (err) {
          // User hasn't submitted yet
          console.log("User hasn't submitted yet");
        }
      }

      if (submissionData) {
        setSubmission(submissionData);
        setSubmissionLink(submissionData.submissionLink);
        
        // Fetch comments and ratings for the submission
        const [commentsData, ratingsData] = await Promise.all([
          fetchCommentsBySubmissionId(submissionData.id),
          fetchRatingsBySubmissionId(submissionData.id),
        ]);
        
        setComments(commentsData as Comment[]);
        setRatings(ratingsData as Rating[]);
      }
    } catch (err) {
      setError("Failed to load assignment data");
      console.error("Error loading assignment:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submissionLink.trim()) return;

    try {
      setSubmitting(true);
      setError(null);

      const submissionData = {
        assignmentId,
        submissionLink: submissionLink.trim(),
        ...(assignment.isGroupWork && userGroup ? { groupId: userGroup.id } : { userId: currentUser?.id }),
      };

      if (submission) {
        // Update existing submission
        await updateSubmission(submission.id, submissionData);
      } else {
        // Create new submission
        await createSubmission(submissionData);
      }

      // Refresh data
      await fetchData();
      setActiveTab('details');
    } catch (err) {
      setError("Failed to submit assignment");
      console.error("Error submitting assignment:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const getSubmissionStatus = () => {
    if (!submission) return "Not Submitted";
    
    if (assignment.isGroupWork && !userGroup) return "No Group";
    
    return submission.status === "submitted" ? "Submitted" : submission.status;
  };

  const getStatusColor = () => {
    const status = getSubmissionStatus();
    switch (status) {
      case "Submitted": return "bg-green-100 text-green-800";
      case "Not Submitted": return "bg-red-100 text-red-800";
      case "No Group": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const isOverdue = new Date(assignment.dueDate) < new Date();
  const canSubmit = assignment.isGroupWork ? userGroup !== null : true;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push("/student/assignments")}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Assignments
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
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
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor()}`}>
              {getSubmissionStatus()}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              isOverdue ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
            }`}>
              Due: {new Date(assignment.dueDate).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => router.push("/student/assignments")}
            className="text-gray-600 hover:text-gray-800 flex items-center gap-1"
          >
            <span>←</span>
            Back to Assignments
          </button>
          <a
            href={assignment.githubLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <span>📋</span>
            View Assignment Details
          </a>
        </div>

        {isOverdue && !submission && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-red-600">⚠️</span>
              <span className="text-red-800 font-medium">This assignment is overdue!</span>
            </div>
          </div>
        )}

        {assignment.isGroupWork && !userGroup && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <span className="text-yellow-600">⚠️</span>
              <span className="text-yellow-800 font-medium">You need to join a group to submit this assignment.</span>
            </div>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('details')}
            className={`px-6 py-3 font-medium text-sm ${
              activeTab === 'details'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Assignment Details
          </button>
          <button
            onClick={() => setActiveTab('submit')}
            className={`px-6 py-3 font-medium text-sm ${
              activeTab === 'submit'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {submission ? 'Update Submission' : 'Submit Assignment'}
          </button>
          {assignment.isGroupWork && (
            <button
              onClick={() => setActiveTab('group')}
              className={`px-6 py-3 font-medium text-sm ${
                activeTab === 'group'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Group Management
            </button>
          )}
          {submission && (
            <button
              onClick={() => setActiveTab('feedback')}
              className={`px-6 py-3 font-medium text-sm ${
                activeTab === 'feedback'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Feedback ({comments.length + ratings.length})
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Assignment Details Tab */}
          {activeTab === 'details' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Description</h3>
                <p className="text-gray-600 whitespace-pre-wrap">{assignment.description}</p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Assignment Link</h3>
                <a
                  href={assignment.githubLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 break-all"
                >
                  {assignment.githubLink}
                </a>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Due Date</h3>
                <p className={`font-medium ${isOverdue ? 'text-red-600' : 'text-green-600'}`}>
                  {new Date(assignment.dueDate).toLocaleDateString()} at {new Date(assignment.dueDate).toLocaleTimeString()}
                </p>
              </div>

              {submission && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Your Submission</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-2">
                      Submitted on: {new Date(submission.submittedAt).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-600 mb-2">Version: {submission.version}</p>
                    <a
                      href={submission.submissionLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 break-all"
                    >
                      {submission.submissionLink}
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Submit Assignment Tab */}
          {activeTab === 'submit' && (
            <div className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Submission Link *
                  </label>
                  <input
                    type="url"
                    value={submissionLink}
                    onChange={(e) => setSubmissionLink(e.target.value)}
                    placeholder="https://github.com/your-username/your-repository"
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={!canSubmit}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Please provide a link to your GitHub repository or other submission platform.
                  </p>
                </div>

                {!canSubmit && assignment.isGroupWork && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-yellow-800">
                      You need to join a group before you can submit this assignment.
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!canSubmit || submitting || !submissionLink.trim()}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Submitting...' : (submission ? 'Update Submission' : 'Submit Assignment')}
                </button>
              </form>
            </div>
          )}

          {/* Group Management Tab */}
          {activeTab === 'group' && assignment.isGroupWork && (
            <div className="space-y-4">
              {userGroup ? (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Your Group: {userGroup.name}</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Group Members:</h4>
                    <ul className="space-y-2">
                      {groupMembers.map((member) => (
                        <li key={member.id} className="flex items-center justify-between">
                          <span className="text-gray-700">{member.user.name}</span>
                          <span className="text-sm text-gray-500">
                            Joined: {new Date(member.joinedAt).toLocaleDateString()}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Available Groups</h3>
                  {availableGroups.length === 0 ? (
                    <p className="text-gray-600">No groups available for this assignment.</p>
                  ) : (
                    <div className="grid gap-4">
                      {availableGroups.map((group) => (
                        <div key={group.id} className="border border-gray-200 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900">{group.name}</h4>
                          <p className="text-sm text-gray-600">Max members: {group.maxMembers}</p>
                          <button
                            onClick={() => router.push(`/student/groups/${group.id}`)}
                            className="mt-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                          >
                            View Group
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Feedback Tab */}
          {activeTab === 'feedback' && submission && (
            <div className="space-y-6">
              {/* Ratings */}
              {ratings.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Ratings</h3>
                  <div className="space-y-4">
                    {ratings.map((rating) => (
                      <div key={rating.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{rating.rater.name}</span>
                            <div className="flex items-center gap-1">
                              <span className="text-yellow-400">⭐</span>
                              <span className="font-medium">{rating.score}/10</span>
                            </div>
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(rating.ratedAt).toLocaleDateString()}
                          </span>
                        </div>
                        {rating.feedback && (
                          <p className="text-gray-700 mt-2">{rating.feedback}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Comments */}
              {comments.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Comments</h3>
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div key={comment.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900">{comment.user.name}</span>
                          <span className="text-sm text-gray-500">
                            {new Date(comment.commentedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-gray-700">{comment.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {ratings.length === 0 && comments.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-4">💬</div>
                  <p className="text-gray-600">No feedback available yet.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 