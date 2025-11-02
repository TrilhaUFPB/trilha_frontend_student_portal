"use client"
import { createCourses } from "@/utils/api";
import { useRouter } from "next/navigation";
import { useState } from "react"

export default function CoursePage() {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    
    const router = useRouter();

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        const courseData = {
            title,
            description
        };

        await createCourses(courseData);
        router.push("/admin/courses")
    }
    return (
        <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Create a New Course</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Course Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border p-2 rounded"
          required
        />
        <textarea
          placeholder="Course Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border p-2 rounded"
          required
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Create Course
        </button>
      </form>
    </div>
    )
}