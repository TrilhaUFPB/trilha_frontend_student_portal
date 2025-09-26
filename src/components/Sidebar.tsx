"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Course } from "@/types/interfaces";
import { fetchAllCourses } from "@/utils/api";
import Link from "next/link";

export default function Sidebar() {
    const router = useRouter();
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadCourses() {
            try {
                // Tell TypeScript that `data` is Course[]
                const data = await fetchAllCourses();
                setCourses(data as Course[]);
            } catch (err) {
                console.error("Error fetching courses:", err);
            } finally {
                setLoading(false);
            }
        }

        loadCourses();
    }, []);


    if (loading) return <div className="p-4">Loading...</div>;

    return (
        <main className="min-h-screen flex">
            <aside className="h-full w-64 bg-gray-900 text-white p-4 overflow-y-auto">
                <Link href={"/admin/courses"}><h2 className="text-xl font-bold mb-4">Courses</h2></Link>
                <Link href={"/admin/courses/create"}>Create</Link>
                <Link href={"/admin/courses/upload"}>Upload</Link>
                <div className="flex flex-col gap-2">
                    {courses.map((course) => (
                        <button
                            key={course.id}
                            onClick={() => router.push(`/admin/courses/${course.id}`)}
                            className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-left transition"
                        >
                            {course.title}
                        </button>
                    ))}
                </div>
            </aside>
        </main>
    );
}
