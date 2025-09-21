// app/admin/courses/[courseId]/[videoId]/page.tsx
export default function VideoPage({
  params,
}: {
  params: { courseId: string; videoId: string };
}) {
  return (
    <div>
      <h1>Course ID: {params.courseId}</h1>
      <h2>Video ID: {params.videoId}</h2>
    </div>
  );
}
