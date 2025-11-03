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
    <main className="flex text-center align-middle 3xl:w-1/2 mx-auto">
      <div className="p-6">
        <div className="flex justify-between">
          <h1 className="3xl:text-3xl text-xl font-bold mb-4">{course.title}</h1>
          <Link href={`/teacher/courses/${courseId}/edit`}>
            <h2 className="text-md 3xl:text-xl font-semibold bg-gray-900 p-2 rounded-xl text-white">Edit</h2>
          </Link>
        </div>
        <p className="mb-6">{course.description}</p>
        {course.videos?.length > 0 && (
          <div>
            <h2 className="3xl:text-3xl text-xl font-semibold mb-2">Videos</h2>
            <ul>
              {course.videos.map((video) => (
                <li key={video.id} className="mb-6">
                  <div className="font-bold 3xl:text-3xl text-xl">{video.title}</div>
                  <div className="3xl:text-xl text-sm mb-2">{video.description}</div>
                  <div className="w-full aspect-video">
                    <iframe
                      className="w-full h-full"
                      src={`https://www.youtube.com/embed/${video.url}`}
                      allowFullScreen
                    ></iframe>
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
