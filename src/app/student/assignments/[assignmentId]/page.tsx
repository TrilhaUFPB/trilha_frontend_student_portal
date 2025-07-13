"use client";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { 
  fetchAssignmentById, 
  fetchUserSubmissionForAssignment, 
  fetchGroupSubmissionForAssignment,
  fetchUserGroupForAssignment,
  fetchGroupsByAssignmentId,
  fetchGroupMembersByGroupId,
  fetchCommentsBySubmissionId,
  fetchRatingsBySubmissionId,
  createSubmission,
  createGroup,
  addGroupMember,
  createComment,
  fetchAllUsers
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
  leader?: any;
}

interface GroupMember {
  group_id: number;
  user_id: number;
  joined_at: string;
  user?: any;
}

interface Comment {
  id: number;
  submission_id: number;
  user_id: number;
  comment: string;
  commented_at: string;
  user?: any;
}

interface Rating {
  id: number;
  submission_id: number;
  rater_id: number;
  score: number;
  feedback: string;
  rated_at: string;
  rater?: any;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: { name: string };
}

export default function StudentAssignmentDetailsPage({ params }: { params: { assignmentId: string } }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const assignmentId = parseInt(params.assignmentId);
  
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [userGroup, setUserGroup] = useState<Group | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [availableGroups, setAvailableGroups] = useState<Group[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  
  // Form states
  const [submissionLink, setSubmissionLink] = useState("");
  const [submissionError, setSubmissionError] = useState("");
  const [groupName, setGroupName] = useState("");
  const [groupError, setGroupError] = useState("");
  const [addMemberUserId, setAddMemberUserId] = useState("");
  const [addMemberError, setAddMemberError] = useState("");
  const [newComment, setNewComment] = useState("");
  const [commentError, setCommentError] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    } else if (!loading && user && user.role.name !== "student") {
      router.push("/");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (user && user.role.name === "student") {
      loadAssignmentData();
    }
  }, [user, assignmentId]);

  const loadAssignmentData = async () => {
    try {
      setLoadingData(true);
      
      // Load assignment details
      const assignmentData = await fetchAssignmentById(assignmentId) as Assignment;
      setAssignment(assignmentData);
      
      // Load user's group for this assignment (if any)
      const userGroupData = await fetchUserGroupForAssignment(assignmentId, user!.id);
      setUserGroup(userGroupData);
      
      // Load submission based on assignment type
      let submissionData = null;
      if (assignmentData.is_group_work && userGroupData) {
        submissionData = await fetchGroupSubmissionForAssignment(assignmentId, userGroupData.id);
      } else if (!assignmentData.is_group_work) {
        submissionData = await fetchUserSubmissionForAssignment(assignmentId, user!.id);
      }
      setSubmission(submissionData);
      
      // Load group members if user is in a group
      if (userGroupData) {
        const membersData = await fetchGroupMembersByGroupId(userGroupData.id);
        setGroupMembers(membersData);
      }
      
      // Load available groups for this assignment
      const groupsData = await fetchGroupsByAssignmentId(assignmentId);
      setAvailableGroups(groupsData);
      
      // Load comments and ratings if there's a submission
      if (submissionData) {
        const commentsData = await fetchCommentsBySubmissionId(submissionData.id);
        const ratingsData = await fetchRatingsBySubmissionId(submissionData.id);
        setComments(commentsData);
        setRatings(ratingsData);
      }
      
      // Load all users for group management
      const usersData = await fetchAllUsers();
      setAllUsers(usersData as User[]);
      
    } catch (error) {
      console.error("Error loading assignment data:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submissionLink.trim()) {
      setSubmissionError("Please provide a submission link");
      return;
    }
    
    try {
      const submissionData: any = {
        assignment_id: assignmentId,
        submission_link: submissionLink.trim(),
      };
      
      if (assignment?.is_group_work && userGroup) {
        submissionData.group_id = userGroup.id;
      }
      
      await createSubmission(submissionData);
      setSubmissionLink("");
      setSubmissionError("");
      loadAssignmentData(); // Reload to show the new submission
    } catch (error) {
      console.error("Error creating submission:", error);
      setSubmissionError("Failed to submit assignment. Please try again.");
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) {
      setGroupError("Please provide a group name");
      return;
    }
    
    try {
      const groupData = {
        assignment_id: assignmentId,
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
      setGroupError("");
      loadAssignmentData(); // Reload to show the new group
    } catch (error) {
      console.error("Error creating group:", error);
      setGroupError("Failed to create group. Please try again.");
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addMemberUserId.trim()) {
      setAddMemberError("Please provide a user ID");
      return;
    }
    
    try {
      await addGroupMember({
        group_id: userGroup!.id,
        user_id: parseInt(addMemberUserId.trim()),
      });
      
      setAddMemberUserId("");
      setAddMemberError("");
      loadAssignmentData(); // Reload to show the new member
    } catch (error) {
      console.error("Error adding member:", error);
      setAddMemberError("Failed to add member. Please check the user ID and try again.");
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) {
      setCommentError("Please provide a comment");
      return;
    }
    
    try {
      await createComment({
        submission_id: submission!.id,
        comment: newComment.trim(),
      });
      
      setNewComment("");
      setCommentError("");
      loadAssignmentData(); // Reload to show the new comment
    } catch (error) {
      console.error("Error adding comment:", error);
      setCommentError("Failed to add comment. Please try again.");
    }
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  const getStudentUsers = () => {
    return allUsers.filter(u => u.role.name === "student");
  };

  if (loading || loadingData) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8">
        <h1 className="text-2xl font-bold mb-4">Loading...</h1>
      </main>
    );
  }

  if (!user || !assignment) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{assignment.title}</h1>
              <p className="text-gray-600 mt-2">
                Assignment Details • {assignment.is_group_work ? "Group Work" : "Individual Work"}
              </p>
            </div>
            <Link
              href="/student/dashboard"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Assignment Information */}
        <div className="bg-white rounded-lg p-6 shadow-sm mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Assignment Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Description</h3>
              <p className="text-gray-600 whitespace-pre-wrap">{assignment.description}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Details</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Due Date:</strong> {assignment.due_date ? new Date(assignment.due_date).toLocaleString() : "No due date"}</p>
                <p><strong>Type:</strong> {assignment.is_group_work ? "Group Assignment" : "Individual Assignment"}</p>
                <p><strong>Status:</strong> 
                  <span className={`ml-2 ${assignment.due_date && isOverdue(assignment.due_date) ? 'text-red-600' : 'text-green-600'}`}>
                    {assignment.due_date && isOverdue(assignment.due_date) ? 'Overdue' : 'Active'}
                  </span>
                </p>
                {assignment.github_link && (
                  <p><strong>Reference:</strong> <a href={assignment.github_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">GitHub Repository</a></p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Group Management (for group assignments) */}
        {assignment.is_group_work && (
          <div className="bg-white rounded-lg p-6 shadow-sm mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Group Management</h2>
            
            {!userGroup ? (
              <div>
                <div className="mb-6">
                  <h3 className="font-medium text-gray-700 mb-3">Create New Group</h3>
                  <form onSubmit={handleCreateGroup} className="flex gap-4">
                    <input
                      type="text"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      placeholder="Group name"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="submit"
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Create Group
                    </button>
                  </form>
                  {groupError && <p className="text-red-600 text-sm mt-2">{groupError}</p>}
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-700 mb-3">Available Groups</h3>
                  {availableGroups.length > 0 ? (
                    <div className="space-y-2">
                      {availableGroups.map((group) => (
                        <div key={group.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                          <div>
                            <p className="font-medium">{group.name}</p>
                            <p className="text-sm text-gray-600">Leader: {group.leader?.name || `ID ${group.leader_id}`}</p>
                          </div>
                          <button
                            onClick={() => {
                              // This would need to be implemented - joining an existing group
                              console.log("Join group:", group.id);
                            }}
                            className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors text-sm"
                          >
                            Request to Join
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No groups available. Create the first one!</p>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <div className="mb-6">
                  <h3 className="font-medium text-gray-700 mb-3">Your Group: {userGroup.name}</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-800 mb-2">Group Members</h4>
                    <div className="space-y-2">
                      {groupMembers.map((member) => (
                        <div key={member.user_id} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{member.user?.name || `User ID ${member.user_id}`}</p>
                            <p className="text-sm text-gray-600">Joined: {new Date(member.joined_at).toLocaleDateString()}</p>
                          </div>
                          {member.user_id === userGroup.leader_id && (
                            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm">Leader</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {userGroup.leader_id === user.id && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-3">Add Member</h4>
                    <form onSubmit={handleAddMember} className="flex gap-4">
                      <select
                        value={addMemberUserId}
                        onChange={(e) => setAddMemberUserId(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select a student...</option>
                        {getStudentUsers()
                          .filter(u => u.id !== user.id && !groupMembers.some(m => m.user_id === u.id))
                          .map((student) => (
                            <option key={student.id} value={student.id}>
                              {student.name} ({student.email})
                            </option>
                          ))}
                      </select>
                      <button
                        type="submit"
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Add Member
                      </button>
                    </form>
                    {addMemberError && <p className="text-red-600 text-sm mt-2">{addMemberError}</p>}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Submission Section */}
        <div className="bg-white rounded-lg p-6 shadow-sm mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Submission</h2>
          
          {!submission ? (
            <div>
              <p className="text-gray-600 mb-4">No submission yet. Submit your work below:</p>
              <form onSubmit={handleSubmitAssignment}>
                <div className="mb-4">
                  <label htmlFor="submissionLink" className="block text-sm font-medium text-gray-700 mb-2">
                    GitHub Repository Link
                  </label>
                  <input
                    id="submissionLink"
                    type="url"
                    value={submissionLink}
                    onChange={(e) => setSubmissionLink(e.target.value)}
                    placeholder="https://github.com/username/repository"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Submit Assignment
                </button>
                {submissionError && <p className="text-red-600 text-sm mt-2">{submissionError}</p>}
              </form>
            </div>
          ) : (
            <div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <h3 className="font-medium text-green-800 mb-2">Submission Completed</h3>
                <div className="text-sm text-green-700">
                  <p><strong>Submitted:</strong> {new Date(submission.submitted_at).toLocaleString()}</p>
                  <p><strong>Repository:</strong> <a href={submission.submission_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{submission.submission_link}</a></p>
                  <p><strong>Status:</strong> {submission.status}</p>
                  <p><strong>Version:</strong> {submission.version}</p>
                </div>
              </div>
              
              {/* Comments Section */}
              <div className="mb-6">
                <h3 className="font-medium text-gray-700 mb-3">Comments & Feedback</h3>
                {comments.length > 0 ? (
                  <div className="space-y-3 mb-4">
                    {comments.map((comment) => (
                      <div key={comment.id} className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-medium text-gray-800">{comment.user?.name || `User ID ${comment.user_id}`}</p>
                          <p className="text-sm text-gray-600">{new Date(comment.commented_at).toLocaleString()}</p>
                        </div>
                        <p className="text-gray-700">{comment.comment}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 mb-4">No comments yet.</p>
                )}
                
                <form onSubmit={handleAddComment}>
                  <div className="mb-3">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add Comment
                  </button>
                  {commentError && <p className="text-red-600 text-sm mt-2">{commentError}</p>}
                </form>
              </div>
              
              {/* Ratings Section */}
              {ratings.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-700 mb-3">Ratings</h3>
                  <div className="space-y-3">
                    {ratings.map((rating) => (
                      <div key={rating.id} className="bg-blue-50 p-3 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-medium text-blue-800">{rating.rater?.name || `Rater ID ${rating.rater_id}`}</p>
                          <div className="flex items-center gap-2">
                            <span className="bg-blue-600 text-white px-2 py-1 rounded text-sm">
                              {rating.score}/100
                            </span>
                            <p className="text-sm text-blue-600">{new Date(rating.rated_at).toLocaleString()}</p>
                          </div>
                        </div>
                        {rating.feedback && <p className="text-blue-700">{rating.feedback}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
} 