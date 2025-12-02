import {
  fetchAssignmentById
} from "@/utils/api";
import StudentAssignmentDetailsClient from "./StudentAssignmentDetailsClient";
import { AssignmentReview3 } from "@/types/interfaces";
import { cookies } from "next/headers";
import Link from "next/link";

type Props = {
  params: Promise<{ assignmentId: string }>
}

export default async function StudentAssignmentDetailsPage({
  params,
}: Props) {
  const resolvedParams = await params;
  const assignmentId = parseInt(resolvedParams.assignmentId);

  try {

    const cookieStore = await cookies()
    const tokenCookie = cookieStore.get('jwt')
    const token = tokenCookie?.value

    if (!token) {
      throw new Error("Não autorizado: Token de autenticação não encontrado.")
    }
    const headersParaBackend = {
      'Authorization': `Bearer ${token}`,
    };

    const assignment = await fetchAssignmentById(assignmentId, {
      headers: headersParaBackend
    }) as AssignmentReview3;

    return (
      <StudentAssignmentDetailsClient
        assignment={assignment}
        assignmentId={assignmentId}
      />
    );
  } catch (error) {
    console.error("Error loading assignment:", error);
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600 mb-4">Assignment not found</p>
          <Link
            href="/student/assignments"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Assignments
          </Link>
        </div>
      </div>
    );
  }
} 