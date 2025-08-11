// TeacherAssigmentSubmissions
export interface AssignmentTeacher {
  id: number;
  title: string
}
export interface AssignmentSubmissions extends AssignmentTeacher {
  due_date?: string;
}

export interface SubmissionTeacher {
  id: number;
  assignment_id: number;
  submission_link: string;
  submitted_at: string;
  version: number;
  status: string;
  user_id?: number;
  group_id?: number;
}
export interface TeacherAssignmentSubmissionsPageProps {
  assignmentId: number;
}

//SubmissionReview

export interface SubmissionReview {
  id: number;
  assignmentId: number;
  userId?: number;
  groupId?: number;
  submissionLink: string;
  submittedAt: string;
  version: number;
  status: string;
  UserReview?: UserReview;
  GroupReview?: GroupReview;
}

export interface SubmissionReview2 extends SubmissionReview {
  id: number;
  assignmentId: number;
  userId?: number;
  groupId?: number;
  submissionLink: string;
  submittedAt: string;
  version: number;
  status: string;
}

export interface AssignmentReview {
  id: number;
  title: string;
  description: string;
  is_group_work: boolean;
}

export interface AssignmentTeacherDashboard extends AssignmentReview {
  github_link?: string;
  due_date: string;
}
export interface AssignmentReview3 extends AssignmentReview {
  github_link: string;
  due_date: string;
}
export interface AssignmentSubmission extends AssignmentReview {
  due_date?: string;
}


export interface UserReview {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface GroupReview {
  id: number;
  name: string;
  assignmentId: number;
  maxMembers: number;
}


export interface CommentReview {
  id: number;
  submissionId: number;
  userId: number;
  CommentReview: string;
  commentedAt: string;
  UserReview: UserReview;
}

export interface RatingReview {
  id: number;
  submissionId: number;
  raterId: number;
  score: number;
  feedback: string;
  ratedAt: string;
  rater: UserReview;
}

//analytics
export interface AssignmentAnalytics {
  id: number;
  is_group_work: boolean;
  due_date?: string
}
export interface AssignmentGroups extends AssignmentAnalytics {
  title: string;
}
export interface SubmissionAnalytics {
  id: number;
  assignment_id: number;
  status: string;
  submitted_at: string
}
export interface UserAnalytics {
  id: number;
  role: { name: string }
}
export interface GroupAnalytics {
  id: number;
  assignment_id: number
}

// User

export interface User {
  id: number;
  name: string;
  email: string;
  role_id: number;
  role: { id: number; name: string };
  created_at: string;
  updated_at: string;
}

//Teacher Dashboard

export interface SubmissionTeacherDashboard {
  id: number;
  assignment_id: number;
  github_link: string;
  submitted_at: string;
  user_id?: number;
  group_id?: number;
}

export interface UserTeacherDashboard {
  id: number;
  name: string;
  email: string;
  role: { id: number; name: string };
}

// Gerais
export interface Group {
  id: number;
  assignment_id: number;
  name: string;
  created_at: string;
}

export interface GroupGroups extends Group {
  leader_id?: number;
}
export interface GroupStudent extends Group {
  maxMembers: number;
}

export interface GroupMember {
  group_id: number;
  user_id: number;
  joined_at: string;
  user?: any;
}

export interface GroupMember3 extends GroupMember {
  id: number;
  group_id: number;
  user_id: number;
  joined_at: string;
  user: User;
}
export interface GroupMember2 extends GroupMember {
  group_id: number;
  user_id: number;
  joined_at: string;
  user?: { id: number; name: string; email: string };
}
export interface UserGroups {
  id: number;
  name: string;
  email: string;
  role: { name: string };
  leader_id: number;
}

export interface GroupWithDetails extends GroupAssignment {
  members: GroupMember[];
  memberCount: number;
  isUserMember: boolean;
  isUserLeader: boolean;
  submission?: SubmissionTeacher;
}

export interface AssignmentWithStatus extends AssignmentTeacherDashboard {
  hasSubmission: boolean;
  submission?: SubmissionTeacher;
  userGroup?: any;
  isOverdue: boolean;
  daysUntilDue?: number;
  canSubmit: boolean;
}

export interface GroupAssignment extends Group {
  leader_id: number;
  assignment?: AssignmentTeacherDashboard
}

export interface Comment {
  id: number;
  submission_id: number;
  user_id: number;
  comment: string;
  commented_at: string;
}
export interface CommentStudent extends Comment {
  user: User;
}

export interface Rating {
  id: number;
  submission_id: number;
  rater_id: number;
  score: number;
  feedback: string;
  rated_at: string;
}
export interface Rating2 extends Rating {
  rater: User;
}
export interface Role {
  id: number;
  name: string;
}
export interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role_id: number;
}