import { getToken } from "./auth";
import { Assignment, Comment, Group, GroupGroups, GroupMember, Rating, SubmissionReview, User, Video } from "../types/interfaces";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8080";

export async function apiFetch<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    const errorMessage = await response.text();
    throw new Error(`Request failed (${response.status}): ${errorMessage}`);
  }

  const responseText = await response.text();

  if (!responseText.trim()) {
    return null as unknown as T;
  }

  try {
    return JSON.parse(responseText);
  } catch {
    return responseText as unknown as T;
  }
}

// =============================================================================
// USER MANAGEMENT
// =============================================================================

export async function fetchCurrentUser() {
  return apiFetch(`${BACKEND_URL}/api/users/me`);
}

export async function fetchAllUsers() {
  return apiFetch(`${BACKEND_URL}/api/users`);
}

export async function fetchUserById(id: number) {
  return apiFetch(`${BACKEND_URL}/api/users/${id}`);
}

export async function createUser(userData: User) {
  return apiFetch(`${BACKEND_URL}/api/users`, {
    method: "POST",
    body: JSON.stringify(userData),
  });
}

export async function updateUser(id: number, userData: User) {
  return apiFetch(`${BACKEND_URL}/api/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(userData),
  });
}

export async function deleteUser(id: number) {
  return apiFetch(`${BACKEND_URL}/api/users/${id}`, {
    method: "DELETE",
  });
}

// =============================================================================
// ASSIGNMENT MANAGEMENT
// =============================================================================

type RawAssignment = Assignment;
const mapAssignment = (a: RawAssignment) => ({
  id: a?.id ?? a?.id,
  title: a?.title ?? a?.title,
  description: a?.description ?? a?.description ?? "",
  due_date: a?.due_date ?? a?.due_date ?? null,
  is_group_work: a?.is_group_work ?? a?.is_group_work ?? false,
  github_link: a?.github_link ?? a?.github_link ?? undefined,
});

export async function fetchAllAssignments() {
  const data = await apiFetch(`${BACKEND_URL}/api/assignments`);
  if (Array.isArray(data)) {
    return data.map(mapAssignment);
  }
  return [];
}

export async function fetchAssignmentById(id: number, options: RequestInit = {}) {
  const data = await apiFetch<Assignment>(`${BACKEND_URL}/api/assignments/${id}`, options);
  return mapAssignment(data);
}

export async function createAssignment(assignmentData: Assignment) {
  return apiFetch(`${BACKEND_URL}/api/assignments`, {
    method: "POST",
    body: JSON.stringify(assignmentData),
  });
}

export async function updateAssignment(id: number, assignmentData: Assignment) {
  return apiFetch(`${BACKEND_URL}/api/assignments/${id}`, {
    method: "PUT",
    body: JSON.stringify(assignmentData),
  });
}

export async function deleteAssignment(id: number) {
  return apiFetch(`${BACKEND_URL}/api/assignments/${id}`, {
    method: "DELETE",
  });
}

// =============================================================================
// SUBMISSION MANAGEMENT
// =============================================================================

export async function fetchAllSubmissions() {
  return apiFetch(`${BACKEND_URL}/api/submissions`);
}

export async function fetchSubmissionById(id: number) {
  return apiFetch(`${BACKEND_URL}/api/submissions/${id}`);
}

export async function createSubmission(submissionData: SubmissionReview) {
  return apiFetch(`${BACKEND_URL}/api/submissions`, {
    method: "POST",
    body: JSON.stringify(submissionData),
  });
}

export async function updateSubmission(id: number, submissionData: SubmissionReview) {
  return apiFetch(`${BACKEND_URL}/api/submissions/${id}`, {
    method: "PUT",
    body: JSON.stringify(submissionData),
  });
}

export async function deleteSubmission(id: number) {
  return apiFetch(`${BACKEND_URL}/api/submissions/${id}`, {
    method: "DELETE",
  });
}
// =============================================================================
// COURSES MANAGEMENT
// =============================================================================

export async function fetchAllCourses() {
  return apiFetch(`${BACKEND_URL}/api/courses`);
}

export async function fetchCoursesById(id: number) {
  return apiFetch(`${BACKEND_URL}/api/courses/${id}`);
}

export async function createCourses(submissionData: SubmissionReview) {
  return apiFetch(`${BACKEND_URL}/api/courses`, {
    method: "POST",
    body: JSON.stringify(submissionData),
  });
}

export async function updateCourses(id: number, submissionData: SubmissionReview) {
  return apiFetch(`${BACKEND_URL}/api/courses/${id}`, {
    method: "PUT",
    body: JSON.stringify(submissionData),
  });
}

export async function deleteCourses(id: number) {
  return apiFetch(`${BACKEND_URL}/api/courses/${id}`, {
    method: "DELETE",
  });
}

// =============================================================================
// VIDEOS MANAGEMENT
// =============================================================================

export async function fetchAllVideos() {
  return apiFetch(`${BACKEND_URL}/api/videos`);
}

export async function fetchVideosById(id: number) {
  return apiFetch(`${BACKEND_URL}/api/videos/${id}`);
}

export async function createVideos(submissionData: Partial<Video>) {
  return apiFetch(`${BACKEND_URL}/api/videos`, {
    method: "POST",
    body: JSON.stringify(submissionData),
  });
}

export async function updateVideos(id: number, submissionData: Partial<Video>) {
  return apiFetch(`${BACKEND_URL}/api/videos/${id}`, {
    method: "PUT",
    body: JSON.stringify(submissionData),
  });
}

export async function deleteVideos(id: number) {
  return apiFetch(`${BACKEND_URL}/api/videos/${id}`, {
    method: "DELETE",
  });
}

// =============================================================================
// GROUP MANAGEMENT
// =============================================================================
const mapGroup = (g: GroupGroups) => ({
  id: g?.id ?? g?.id,
  assignment_id: g?.assignment_id ?? g?.assignment_id ?? 0,
  name: g?.name ?? g?.name ?? "",
  leader_id: g?.leader_id ?? g?.leader_id ?? null,
  created_at: g?.created_at ?? g?.created_at ?? "",
  updated_at: g?.updated_at ?? g?.updated_at ?? "",
});

export async function fetchAllGroups() {
  const data = await apiFetch(`${BACKEND_URL}/api/groups`);
  if (Array.isArray(data)) {
    return data.map(mapGroup);
  }
  return [];
}

export async function fetchGroupById(id: number) {
  const data = await apiFetch<GroupGroups>(`${BACKEND_URL}/api/groups/${id}`);
  return mapGroup(data);
}

export async function createGroup(groupData: Group) {
  return apiFetch(`${BACKEND_URL}/api/groups`, {
    method: "POST",
    body: JSON.stringify(groupData),
  });
}

export async function updateGroup(id: number, groupData: Group) {
  return apiFetch(`${BACKEND_URL}/api/groups/${id}`, {
    method: "PUT",
    body: JSON.stringify(groupData),
  });
}

export async function deleteGroup(id: number) {
  return apiFetch(`${BACKEND_URL}/api/groups/${id}`, {
    method: "DELETE",
  });
}

// =============================================================================
// GROUP MEMBER MANAGEMENT
// =============================================================================

const mapGroupMember = (m: GroupMember) => ({
  group_id: m?.group_id ?? m?.group_id ?? 0,
  user_id: m?.user_id ?? m?.user_id ?? 0,
  joined_at: m?.joined_at ?? m?.created_at ?? "",
  created_at: m?.created_at ?? "",
  updated_at: m?.updated_at ?? "",
  user: m?.user,
});

export async function fetchAllGroupMembers() {
  const data = await apiFetch(`${BACKEND_URL}/api/group_members`);
  if (Array.isArray(data)) {
    return data.map(mapGroupMember);
  }
  return [];
}

export async function addGroupMember(groupMemberData: GroupMember) {
  return apiFetch(`${BACKEND_URL}/api/group_members`, {
    method: "POST",
    body: JSON.stringify(groupMemberData),
  });
}

export async function removeGroupMember(id: number) {
  return apiFetch(`${BACKEND_URL}/api/group_members/${id}`, {
    method: "DELETE",
  });
}

// =============================================================================
// COMMENT MANAGEMENT
// =============================================================================

export async function fetchAllComments() {
  return apiFetch(`${BACKEND_URL}/api/comments`);
}

export async function fetchCommentById(id: number) {
  return apiFetch(`${BACKEND_URL}/api/comments/${id}`);
}

export async function createComment(commentData: Comment) {
  return apiFetch(`${BACKEND_URL}/api/comments`, {
    method: "POST",
    body: JSON.stringify(commentData),
  });
}

export async function updateComment(id: number, commentData: Comment) {
  return apiFetch(`${BACKEND_URL}/api/comments/${id}`, {
    method: "PUT",
    body: JSON.stringify(commentData),
  });
}

export async function deleteComment(id: number) {
  return apiFetch(`${BACKEND_URL}/api/comments/${id}`, {
    method: "DELETE",
  });
}

// =============================================================================
// RATING MANAGEMENT
// =============================================================================

export async function fetchAllRatings() {
  return apiFetch(`${BACKEND_URL}/api/ratings`);
}

export async function fetchRatingById(id: number) {
  return apiFetch(`${BACKEND_URL}/api/ratings/${id}`);
}

export async function createRating(ratingData: Rating) {
  return apiFetch(`${BACKEND_URL}/api/ratings`, {
    method: "POST",
    body: JSON.stringify(ratingData),
  });
}

export async function updateRating(id: number, ratingData: Rating) {
  return apiFetch(`${BACKEND_URL}/api/ratings/${id}`, {
    method: "PUT",
    body: JSON.stringify(ratingData),
  });
}

export async function deleteRating(id: number) {
  return apiFetch(`${BACKEND_URL}/api/ratings/${id}`, {
    method: "DELETE",
  });
}

// =============================================================================
// ROLE MANAGEMENT
// =============================================================================

export async function fetchAllRoles() {
  return apiFetch(`${BACKEND_URL}/api/roles`);
}

// =============================================================================
// STUDENT-SPECIFIC HELPER FUNCTIONS
// =============================================================================

// Helper function to get submissions for a specific assignment
export async function fetchSubmissionsByAssignmentId(assignmentId: number) {
  const allSubmissions = await fetchAllSubmissions();
  return (allSubmissions as SubmissionReview[]).filter(s => s.assignmentId === assignmentId);
}

// Helper function to get user's submission for a specific assignment
export async function fetchUserSubmissionForAssignment(assignmentId: number, userId: number) {
  const submissions = await fetchSubmissionsByAssignmentId(assignmentId);
  return submissions.find(s => s.userId === userId);
}

// Helper function to get group's submission for a specific assignment
export async function fetchGroupSubmissionForAssignment(assignmentId: number, groupId: number) {
  const submissions = await fetchSubmissionsByAssignmentId(assignmentId);
  return submissions.find(s => s.groupId === groupId);
}

// Helper function to get groups for a specific assignment
export async function fetchGroupsByAssignmentId(assignmentId: number) {
  const allGroups = await fetchAllGroups();
  return (allGroups as Group[]).filter(g => g.assignment_id === assignmentId);
}

// Helper function to get group members for a specific group
export async function fetchGroupMembersByGroupId(groupId: number) {
  const allMembers = await fetchAllGroupMembers();
  return (allMembers as GroupMember[]).filter(m => m.group_id === groupId);
}

// Helper function to check if user is in a group for an assignment
export async function fetchUserGroupForAssignment(assignmentId: number, userId: number) {
  const groups = await fetchGroupsByAssignmentId(assignmentId);
  const allMembers = await fetchAllGroupMembers();

  for (const group of groups) {
    const isMember = (allMembers as GroupMember[]).some((m: GroupMember) => m.group_id === group.id && m.user_id === userId);
    if (isMember) {
      return group;
    }
  }
  return null;
}

// Helper function to get comments for a specific submission
export async function fetchCommentsBySubmissionId(submissionId: number) {
  const allComments = await fetchAllComments();
  return (allComments as Comment[]).filter(c => c.submission_id === submissionId);
}

// Helper function to get ratings for a specific submission
export async function fetchRatingsBySubmissionId(submissionId: number) {
  const allRatings = await fetchAllRatings();
  return (allRatings as Rating[]).filter(r => r.submission_id === submissionId);
}

// =============================================================================
// DOCUMENT MANAGEMENT
// =============================================================================

export async function fetchAllDocuments() {
  return apiFetch(`${BACKEND_URL}/api/documents`);
}

export async function fetchDocumentById(id: number) {
  return apiFetch(`${BACKEND_URL}/api/documents/${id}`);
}

export async function uploadDocument(file: File, title: string, courseId: number, description: string = "") {
  const token = getToken();
  const formData = new FormData();
  formData.append("file", file);
  formData.append("title", title);
  formData.append("course_id", courseId.toString());
  formData.append("description", description);

  const response = await fetch(`${BACKEND_URL}/api/documents/upload`, {
    method: "POST",
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: formData,
  });

  if (!response.ok) {
    const errorMessage = await response.text();
    throw new Error(`Request failed (${response.status}): ${errorMessage}`);
  }

  return response.json();
}

export async function createDocumentFromLink(fileLink: string, title: string, courseId: number, description: string = "") {
  return apiFetch(`${BACKEND_URL}/api/documents/link`, {
    method: "POST",
    body: JSON.stringify({ file_link: fileLink, title, course_id: courseId, description }),
  });
}

export async function fetchDocumentsByCourseId(courseId: number) {
  return apiFetch(`${BACKEND_URL}/api/documents/course/${courseId}`);
}

export async function updateDocument(id: number, documentData: Document) {
  return apiFetch(`${BACKEND_URL}/api/documents/${id}`, {
    method: "PUT",
    body: JSON.stringify(documentData),
  });
}

export async function deleteDocument(id: number) {
  return apiFetch(`${BACKEND_URL}/api/documents/${id}`, {
    method: "DELETE",
  });
}

export async function downloadDocument(id: number) {
  const token = getToken();
  const response = await fetch(`${BACKEND_URL}/api/documents/${id}/download`, {
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  if (!response.ok) {
    const errorMessage = await response.text();
    throw new Error(`Request failed (${response.status}): ${errorMessage}`);
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = response.headers.get("Content-Disposition")?.split("filename=")[1]?.replace(/"/g, "") || "document";
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export async function fetchMyDocuments() {
  return apiFetch(`${BACKEND_URL}/api/documents/my-documents`);
}