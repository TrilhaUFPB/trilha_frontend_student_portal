"use client";

import SubmissionReviewPage from "@/features/SubmissionReview/SubmissionReview";
import TeacherAssignmentSubmissionsPage from "@/features/TeacherAssignment/TeacherAssignmentSubmissions";

export default function Page({ params }: { params: { assignmentId: string } }) {
  return (<>
    <TeacherAssignmentSubmissionsPage assignmentId={Number(params.assignmentId)} />
    <SubmissionReviewPage />
  </>
  )
} 