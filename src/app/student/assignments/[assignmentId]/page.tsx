import { 
  fetchAssignmentById, 
  fetchAllAssignments,
} from "@/utils/api";
import StudentAssignmentDetailsClient from "./StudentAssignmentDetailsClient";

interface Assignment {
  id: number;
  title: string;
  description: string;
  github_link: string;
  due_date: string;
  is_group_work: boolean;
}

export async function generateStaticParams() {
  // During static generation, we can't authenticate with the backend
  // Return empty array to make this a dynamic route
  // This is appropriate since student assignment pages require user-specific data
  return [];
}

export default async function StudentAssignmentDetailsPage({
  params,
}: {
  params: { assignmentId: string };
}) {
  const assignmentId = parseInt(params.assignmentId);
  
  try {
    const assignment = await fetchAssignmentById(assignmentId) as Assignment;
    
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
          <a
            href="/student/assignments"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Assignments
          </a>
        </div>
      </div>
    );
  }
} 