"use client";

import { useParams } from "next/navigation";
import SubmissionReviewPage from "@/features/SubmissionReview/SubmissionReview";
import TeacherAssignmentSubmissionsPage from "@/features/TeacherAssignment/TeacherAssignmentSubmissions";

export default function Page() {

  const params = useParams()

  const assignmentId = Number(params.assignmentId)
  //loader para o usuário
  if (isNaN(assignmentId)) {
    return <div>Carregando...</div>
  }
  
  return (<>
    <TeacherAssignmentSubmissionsPage assignmentId={assignmentId} />
    <SubmissionReviewPage />
  </>
  )
} 