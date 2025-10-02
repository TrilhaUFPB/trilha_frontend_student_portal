"use client"
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation"
import { Course, Video } from "@/types/interfaces";
import { useAuth } from "@/context/AuthContext";
import { deleteVideos, fetchAllVideos, fetchCoursesById, updateCourses } from "@/utils/api";

export default function EditCoursePage() {
    const router = useRouter();
    const params = useParams();
    const courseId = Number(params.courseId);
    const { user, loading } = useAuth();

    const [loadingData, setLoadingData] = useState(true);
    const [course, setCourse] = useState<Course | null>(null);

    const [videos, setVideos] = useState<Video[]>([]);
    const [loadingVideos, setLoadingVideos] = useState(true);

    // ✅ Auth check
    useEffect(() => {
        if (!loading) {
            if (!user) router.push("/login");
            else if (user.role.name !== "admin" && user.role.name !== "teacher") {
                router.push("/");
            }
        }
    }, [loading, user, router]);

    // ✅ Load course
    useEffect(() => {
        const loadCourse = async () => {
            try {
                setLoadingData(true);
                const data = await fetchCoursesById(courseId);
                setCourse(data as Course);
            } catch (e) {
                console.error("Failed to load course", e);
            } finally {
                setLoadingData(false);
            }
        };

        if (user) loadCourse();
    }, [user, courseId]);

    // ✅ Load videos
    useEffect(() => {
        const loadVideos = async () => {
            try {
                setLoadingVideos(true);
                const allVideos = await fetchAllVideos();
                const filtered = (allVideos as Video[]).filter(v => v.CourseId === courseId);
                setVideos(filtered);
            } catch (e) {
                console.error("Failed to load videos", e);
            } finally {
                setLoadingVideos(false);
            }
        };

        if (user) loadVideos();
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
            id: course.id,
            title: course.title,
            description: course.description,
        };

        try {
            await updateCourses(courseId, courseData);
            router.push(`/admin/courses/${courseId}`);
        } catch (e) {
            console.error("Failed to update course", e);
        }
    };

    const handleDeleteVideo = async (videoId: number) => {
        try {
            await deleteVideos(videoId);
            setVideos(videos.filter(v => v.id !== videoId));
        } catch (e) {
            console.error("Failed to delete video", e);
        }
    };

    return (
        <div className="max-w-3xl mx-auto p-6 bg-white shadow rounded-xl space-y-8">
            <h1 className="text-2xl font-bold mb-4">Edit Course</h1>

            {/* Edit Course Form */}
            {course && (
                <form onSubmit={handleUpdate} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium">Course ID</label>
                        <input
                            type="number"
                            name="id"
                            value={course.id}
                            onChange={handleChange}
                            className="w-full p-2 border rounded"
                            required
                        />
                    </div>

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

            {/* Linked Videos */}
            <div>
                <h2 className="text-xl font-semibold mb-2">Course Videos</h2>
                {loadingVideos ? (
                    <p>Loading videos...</p>
                ) : videos.length === 0 ? (
                    <p>No videos linked to this course.</p>
                ) : (
                    <ul className="space-y-2">
                        {videos.map(video => (
                            <li
                                key={video.id}
                                className="flex justify-between items-center bg-gray-100 p-3 rounded"
                            >
                                <span>{video.title}</span>
                                <div className="space-x-2">
                                    <button
                                        onClick={() => router.push(`/admin/videos/edit/${video.id}`)}
                                        className="px-3 py-1 bg-blue-500 text-white rounded"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDeleteVideo(video.id)}
                                        className="px-3 py-1 bg-red-500 text-white rounded"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
