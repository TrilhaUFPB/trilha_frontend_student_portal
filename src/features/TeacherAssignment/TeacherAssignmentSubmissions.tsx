import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  fetchAssignmentById, fetchAllSubmissions, createRating,
} from "@/utils/api";
import {AssignmentTeacher, SubmissionTeacher, TeacherAssignmentSubmissionsPageProps} from "@/types/interfaces"

export default function TeacherAssignmentSubmissionsPage({ assignmentId }: TeacherAssignmentSubmissionsPageProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [assignment, setAssignment] = useState<AssignmentTeacher | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionTeacher[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [scoreById, setScoreById] = useState<Record<number, string>>({});
  const [feedbackById, setFeedbackById] = useState<Record<number, string>>({});
  const [submittingId, setSubmittingId] = useState<number | null>(null); 

  useEffect(() => {
    if (!loading) {
      if (!user) router.push("/login");
      else if (user.role.name !== "teacher" && user.role.name !== "admin") router.push("/");
    }
  }, [loading, user, router]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingData(true);
        const [a, subs] = await Promise.all([
          fetchAssignmentById(assignmentId),
          fetchAllSubmissions(),
        ]);
        setAssignment(a as AssignmentTeacher);
        setSubmissions((subs as SubmissionTeacher[]).filter(s => s.assignment_id === assignmentId));
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("Failed to load assignment submissions", e);
      } finally {
        setLoadingData(false);
      }
    };
    if (user && (user.role.name === "teacher" || user.role.name === "admin")) load();
  }, [user, assignmentId]);

  const onRate = async (submissionId: number) => {
    const score = Number(scoreById[submissionId]);
    const feedback = feedbackById[submissionId] || "";
    if (Number.isNaN(score) || score < 0 || score > 100) {
      alert("Score must be between 0 and 100");
      return;
    }
    try {
      setSubmittingId(submissionId);
      await createRating({ submission_id: submissionId, score, feedback });
      alert("Rating saved");
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Failed to rate", e);
      alert("Failed to save rating");
    } finally {
      setSubmittingId(null);
    }
  };

  if (loading || loadingData || !user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8">
        <h1 className="text-2xl font-bold mb-4">Loading...</h1>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Submissions: {assignment?.title || `#${assignmentId}`}</h1>
          <p className="text-gray-600 mt-1">Review and rate student work</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Submissions ({submissions.length})</h2>
          </div>
          {submissions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No submissions for this assignment yet.</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {submissions.map((s) => (
                <div key={s.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-lg font-semibold text-gray-800">Submission #{s.id}</span>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">v{s.version}</span>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 capitalize">{s.status}</span>
                      </div>
                      <p className="text-sm text-gray-500 mb-1">Submitted: {new Date(s.submitted_at).toLocaleString()}</p>
                      <a href={s.submission_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 break-all">
                        {s.submission_link}
                      </a>
                    </div>
                    <div className="ml-4 w-full max-w-sm">
                      <div className="grid grid-cols-1 gap-2">
                        <input
                          type="number"
                          placeholder="Score (0-100)"
                          value={scoreById[s.id] || ""}
                          onChange={(e) => setScoreById(prev => ({ ...prev, [s.id]: e.target.value }))}
                          className="px-3 py-2 border border-gray-300 rounded-lg"
                        />
                        <textarea
                          placeholder="Feedback (optional)"
                          value={feedbackById[s.id] || ""}
                          onChange={(e) => setFeedbackById(prev => ({ ...prev, [s.id]: e.target.value }))}
                          className="px-3 py-2 border border-gray-300 rounded-lg"
                          rows={3}
                        />
                        <button
                          onClick={() => onRate(s.id)}
                          disabled={submittingId === s.id}
                          className={`px-4 py-2 rounded-lg text-white ${submittingId === s.id ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"}`}
                        >
                          {submittingId === s.id ? "Saving..." : "Save Rating"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}