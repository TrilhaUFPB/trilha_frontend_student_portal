"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Course } from "@/types/interfaces";
import { fetchCoursesById } from "@/utils/api";

export default function CoursePage() {
  const params = useParams();
  const courseId = Number(params.courseId); // get course ID from URL
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCourse() {
      try {
        const data = await fetchCoursesById(courseId) as Course;
        setCourse(data);
      } catch (err) {
        console.error("Error fetching course:", err);
      } finally {
        setLoading(false);
      }
    }

    loadCourse();
  }, [courseId]);

  if (loading) return <div>Loading...</div>;
  if (!course) return <div>Course not found.</div>;

  return (
    <main className="flex-wrap text-center items-center align-middle">
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-4">{course.title}</h1>
        <p className="mb-6">{course.description}</p>

        {/* Example: if course has videos */}
        {course.videos?.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold mb-2">Videos</h2>
            <ul className="list-disc list-inside">
              {course.videos.map((video) => (
                <li key={video.id} className="flex-wrap align-middle text-center items-center">
                  <div className="font-bold text-3xl">{video.title}</div>
                  <div className="text-xl">{video.description}</div>
                  <div className="flex items-center justify-center h-screen">
                    <iframe className="w-full h-full m-32" src={`https://www.youtube.com/embed/${video.url}`}></iframe>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </main>
  );
}
