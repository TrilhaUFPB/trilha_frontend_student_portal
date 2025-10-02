"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Course } from "@/types/interfaces";
import { fetchCoursesById } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export default function CoursePage() {
  const params = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const courseId = Number(params.courseId); // get course ID from URL
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const allowedRoles = ["admin", "teacher"]
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    } else if (!loading && user && !allowedRoles.includes(user.role.name ?? "")) {
      router.push("/");
    }
  }, [loading, user, router]);

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
        <div className="flex justify-between">
          <a href=""></a>
          <h1 className="text-3xl font-bold mb-4">{course.title}</h1>
          <Link href={`/teacher/courses/${courseId}/edit`}><h2 className="text-xl font-semibold bg-gray-400 p-2 rounded-xl">Edit</h2></Link>
        </div>
        <p className="mb-6">{course.description}</p>
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
