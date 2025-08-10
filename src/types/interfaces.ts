// TeacherAssigmentSubmissions
export interface AssignmentTeacher { id: number; title: string }
export interface SubmissionTeacher {
  id: number;
  assignment_id: number;
  user_id?: number;
  group_id?: number;
  submission_link: string;
  submitted_at: string;
  version: number;
  status: string;
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

export interface AssignmentReview {
  id: number;
  title: string;
  description: string;
  github_link: string;
  due_date: string;
  is_group_work: boolean;
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
export interface AssignmentAnalytics { id: number; is_group_work: boolean; due_date?: string }
export interface SubmissionAnalytics { id: number; assignment_id: number; status: string; submitted_at: string }
export interface UserAnalytics { id: number; role: { name: string } }
export interface GroupAnalytics { id: number; assignment_id: number }