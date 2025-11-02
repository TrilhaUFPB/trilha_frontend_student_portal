"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Video, Course } from "@/types/interfaces";
import { createVideos, fetchAllCourses } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";

export default function UploadVideoPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);

  useEffect(() => {
        if (!loading) {
            if (!user) router.push("/login");
            else if (user.role.name !== "admin") router.push("/");
        }
    }, [loading, user, router]);
  // Load courses when page mounts
  useEffect(() => {
    async function loadCourses() {
      const data = await fetchAllCourses();
      const coursesData = data as Course[];
      setCourses(coursesData);
      if (coursesData.length > 0) setSelectedCourseId(coursesData[0].id); // default selection
    }
    loadCourses();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId) return;

    const videoData: Partial<Video> = {
      title,
      description,
      url,
      CourseId: selectedCourseId, // <-- match your TS type / backend field
    };

    await createVideos(videoData);
    router.push("/admin/courses"); // redirect after adding video
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Add Video</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Video Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border p-2 rounded"
          required
        />
        <textarea
          placeholder="Video Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border p-2 rounded"
        />
        <input
          type="text"
          placeholder="Video URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full border p-2 rounded"
          required
        />

        {/* Course selection dropdown */}
        <select
          value={selectedCourseId ?? ""}
          onChange={(e) => setSelectedCourseId(Number(e.target.value))}
          className="w-full border p-2 rounded"
          required
        >
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.title} {/* show title instead of just ID */}
            </option>
          ))}
        </select>

        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
          Add Video
        </button>
      </form>
    </div>
  );
}
