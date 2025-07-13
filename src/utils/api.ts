import { getToken } from "./auth";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

export async function apiFetch<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers = {
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    "Content-Type": "application/json",
  };
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  return res.json();
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

export async function createUser(userData: any) {
  return apiFetch(`${BACKEND_URL}/api/users`, {
    method: "POST",
    body: JSON.stringify(userData),
  });
}

export async function updateUser(id: number, userData: any) {
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

export async function fetchAllAssignments() {
  return apiFetch(`${BACKEND_URL}/api/assignments`);
}

export async function fetchAssignmentById(id: number) {
  return apiFetch(`${BACKEND_URL}/api/assignments/${id}`);
}

export async function createAssignment(assignmentData: any) {
  return apiFetch(`${BACKEND_URL}/api/assignments`, {
    method: "POST",
    body: JSON.stringify(assignmentData),
  });
}

export async function updateAssignment(id: number, assignmentData: any) {
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

export async function createSubmission(submissionData: any) {
  return apiFetch(`${BACKEND_URL}/api/submissions`, {
    method: "POST",
    body: JSON.stringify(submissionData),
  });
}

export async function updateSubmission(id: number, submissionData: any) {
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
// GROUP MANAGEMENT
// =============================================================================

export async function fetchAllGroups() {
  return apiFetch(`${BACKEND_URL}/api/groups`);
}

export async function fetchGroupById(id: number) {
  return apiFetch(`${BACKEND_URL}/api/groups/${id}`);
}

export async function createGroup(groupData: any) {
  return apiFetch(`${BACKEND_URL}/api/groups`, {
    method: "POST",
    body: JSON.stringify(groupData),
  });
}

export async function updateGroup(id: number, groupData: any) {
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

export async function fetchAllGroupMembers() {
  return apiFetch(`${BACKEND_URL}/api/group_members`);
}

export async function addGroupMember(groupMemberData: any) {
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

export async function createComment(commentData: any) {
  return apiFetch(`${BACKEND_URL}/api/comments`, {
    method: "POST",
    body: JSON.stringify(commentData),
  });
}

export async function updateComment(id: number, commentData: any) {
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

export async function createRating(ratingData: any) {
  return apiFetch(`${BACKEND_URL}/api/ratings`, {
    method: "POST",
    body: JSON.stringify(ratingData),
  });
}

export async function updateRating(id: number, ratingData: any) {
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