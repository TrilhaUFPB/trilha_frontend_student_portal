"use client"
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation"
import { Course } from "@/types/interfaces";
import { useAuth } from "@/context/AuthContext";
import { fetchCoursesById, updateCourses } from "@/utils/api";

export default function EditCoursePage() {
    const router = useRouter();
    const params = useParams();
    const courseId = Number(params.courseId);
    const { user, loading } = useAuth();
    const [loadingData, setLoadingData] = useState(true);
    const [course, setCourse] = useState<Course | null>(null);

    useEffect(() => {
        if (!loading) {
            if (!user) router.push("/login");
            else if (user.role.name !== "admin") router.push("/");
        }
    }, [loading, user, router]);
    useEffect(() => {
        const loadCourse = async () => {
            try {
                setLoadingData(true);
                const data = await fetchCoursesById(courseId); // ✅ fetch, not update
                setCourse(data as Course);
            } catch (e) {
                console.error("Failed to load course", e);
            } finally {
                setLoadingData(false);
            }
        };

        if (user) {
            loadCourse();
        }
    }, [user, courseId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (!course) return;
        const { name, value } = e.target;
        setCourse({ ...course, [name]: value });
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!course) return;

        const courseData = {
            title: course.title,
            description: course.description,
        };

        try {
            await updateCourses(courseId, courseData); // ✅ send update to backend
            router.push(`/admin/courses/${courseId}`); // go back or show success
        } catch (e) {
            console.error("Failed to update course", e);
        }
    };



    return (
        <div className="max-w-xl mx-auto p-6 bg-white shadow rounded-xl">
            <h1 className="text-2xl font-bold mb-4">Edit Course</h1>

            {course && (
                <form onSubmit={handleUpdate} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium">Title</label>
                        <input
                            type="text"
                            name="title"
                            value={course.title}
                            onChange={handleChange}
                            className="w-full p-2 border rounded"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium">Description</label>
                        <textarea
                            name="description"
                            value={course.description}
                            onChange={handleChange}
                            className="w-full p-2 border rounded"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Save Changes
                    </button>
                </form>
            )}
        </div>
    )
}