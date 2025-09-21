"use client"

import { useAuth } from "@/context/AuthContext";
import { Course, Video } from "@/types/interfaces";
import { fetchCoursesById } from "@/utils/api";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function CoursePage() {
    const router = useRouter();
    const params = useParams();
    const { user, loading } = useAuth();
    const courseId = Number(params.courseId);
    const [loadingData, setLoadingData] = useState(true);
    const [course, setCourse] = useState<Course | null>(null);

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
                const data = await fetchCoursesById(courseId); // your courses API
                setCourse(data as Course); // typecast to your Course type
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

    if (loadingData) return <p>Loading</p>;
    if (!course) return <p>Course not found</p>;

    return (
        <div>
            <div>
                <h2>{course.title}</h2>
                <p>{course.description}</p>

                <h3>Videos</h3>
                {course.videos.length > 0 ? (
                    course.videos.map((video) => (
                        <div key={video.id}>
                            <p><strong>{video.title}</strong></p>
                            <p>{video.description}</p>
                            <iframe width="560" height="315" src={`https://www.youtube.com/embed/${video.url}`} title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>
                        </div>
                    ))
                ) : (
                    <p>No videos available.</p>
                )}
            </div>
        </div>
    )
}