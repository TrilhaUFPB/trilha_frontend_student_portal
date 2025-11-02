import { getToken } from "./auth";

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

type RawAssignment = any;
const mapAssignment = (a: RawAssignment) => ({
  id: a?.id ?? a?.ID,
  title: a?.title ?? a?.Title,
  description: a?.description ?? a?.Description ?? "",
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
  const data = await apiFetch(`${BACKEND_URL}/api/assignments/${id}`, options);
  return mapAssignment(data);
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
// COURSES MANAGEMENT
// =============================================================================

export async function fetchAllCourses() {
  return apiFetch(`${BACKEND_URL}/api/courses`);
}

export async function fetchCoursesById(id: number) {
  return apiFetch(`${BACKEND_URL}/api/courses/${id}`);
}

export async function createCourses(submissionData: any) {
  return apiFetch(`${BACKEND_URL}/api/courses`, {
    method: "POST",
    body: JSON.stringify(submissionData),
  });
}

export async function updateCourses(id: number, submissionData: any) {
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

export async function createVideos(submissionData: any) {
  return apiFetch(`${BACKEND_URL}/api/videos`, {
    method: "POST",
    body: JSON.stringify(submissionData),
  });
}

export async function updateVideos(id: number, submissionData: any) {
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
const mapGroup = (g: any) => ({
  id: g?.id ?? g?.ID,
  assignment_id: g?.assignment_id ?? g?.AssignmentID ?? 0,
  name: g?.name ?? g?.Name ?? "",
  leader_id: g?.leader_id ?? g?.LeaderID ?? null,
  created_at: g?.created_at ?? g?.CreatedAt ?? "",
  updated_at: g?.updated_at ?? g?.UpdatedAt ?? "",
});

export async function fetchAllGroups() {
  const data = await apiFetch(`${BACKEND_URL}/api/groups`);
  if (Array.isArray(data)) {
    return data.map(mapGroup);
  }
  return [];
}

export async function fetchGroupById(id: number) {
  const data = await apiFetch(`${BACKEND_URL}/api/groups/${id}`);
  return mapGroup(data);
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

const mapGroupMember = (m: any) => ({
  id: m?.id ?? m?.ID,
  group_id: m?.group_id ?? m?.GroupID ?? 0,
  user_id: m?.user_id ?? m?.UserID ?? 0,
  created_at: m?.created_at ?? m?.CreatedAt ?? "",
});

export async function fetchAllGroupMembers() {
  const data = await apiFetch(`${BACKEND_URL}/api/group_members`);
  if (Array.isArray(data)) {
    return data.map(mapGroupMember);
  }
  return [];
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

// =============================================================================
// STUDENT-SPECIFIC HELPER FUNCTIONS
// =============================================================================

// Helper function to get submissions for a specific assignment
export async function fetchSubmissionsByAssignmentId(assignmentId: number) {
  const allSubmissions = await fetchAllSubmissions();
  return (allSubmissions as any[]).filter(s => s.assignment_id === assignmentId);
}

// Helper function to get user's submission for a specific assignment
export async function fetchUserSubmissionForAssignment(assignmentId: number, userId: number) {
  const submissions = await fetchSubmissionsByAssignmentId(assignmentId);
  return submissions.find(s => s.user_id === userId);
}

// Helper function to get group's submission for a specific assignment
export async function fetchGroupSubmissionForAssignment(assignmentId: number, groupId: number) {
  const submissions = await fetchSubmissionsByAssignmentId(assignmentId);
  return submissions.find(s => s.group_id === groupId);
}

// Helper function to get groups for a specific assignment
export async function fetchGroupsByAssignmentId(assignmentId: number) {
  const allGroups = await fetchAllGroups();
  return (allGroups as any[]).filter(g => g.assignment_id === assignmentId);
}

// Helper function to get group members for a specific group
export async function fetchGroupMembersByGroupId(groupId: number) {
  const allMembers = await fetchAllGroupMembers();
  return (allMembers as any[]).filter(m => m.group_id === groupId);
}

// Helper function to check if user is in a group for an assignment
export async function fetchUserGroupForAssignment(assignmentId: number, userId: number) {
  const groups = await fetchGroupsByAssignmentId(assignmentId);
  const allMembers = await fetchAllGroupMembers();
  
  for (const group of groups) {
    const isMember = (allMembers as any[]).some((m: any) => m.group_id === group.id && m.user_id === userId);
    if (isMember) {
      return group;
    }
  }
  return null;
}

// Helper function to get comments for a specific submission
export async function fetchCommentsBySubmissionId(submissionId: number) {
  const allComments = await fetchAllComments();
  return (allComments as any[]).filter(c => c.submission_id === submissionId);
}

// Helper function to get ratings for a specific submission
export async function fetchRatingsBySubmissionId(submissionId: number) {
  const allRatings = await fetchAllRatings();
  return (allRatings as any[]).filter(r => r.submission_id === submissionId);
} 