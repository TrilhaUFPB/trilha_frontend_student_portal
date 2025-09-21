"use client"

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchAllCourses } from "@/utils/api";
import { Course } from "@/types/interfaces";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function CoursesPage() {
    const router = useRouter();
    const { user, loading } = useAuth();
    const [courses, setCourses] = useState<Course[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        if (!loading) {
            if (!user) router.push("/login");
            else if (user.role.name !== "admin") router.push("/");
        }
    }, [loading, user, router]);

    useEffect(() => {
        const loadCourses = async () => {
            try {
                setLoadingData(true);
                const data = await fetchAllCourses(); // your courses API
                setCourses(data as Course[]); // typecast to your Course type
            } catch (e) {
                console.error("Failed to load courses", e);
            } finally {
                setLoadingData(false);
            }
        };

        if (user?.role?.name === "admin") {
            loadCourses();
        }
    }, [user]);


    return (
        <div className="flex">
            {loadingData ? (
                <p>Loading...</p>
            ) : (
                courses.map((course) => (
                    <div key={course.id} className="border-black border-2">
                        <Link href={`courses/${course.id}`}>
                            <h3>{course.title}</h3>
                            <p><strong>ID:</strong> {course.id}</p>
                            <p><strong>Description:</strong> {course.description}</p>
                            <p><strong>Created at:</strong> {course.created_at}</p>
                        </Link>
                    </div>
                ))
            )}
        </div>
    );


}