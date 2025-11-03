"use client";
import add from "@/../public/add.png"
import home from "@/../public/home.png"
import upload from "@/../public/upload.png"
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Course } from "@/types/interfaces";
import { fetchAllCourses } from "@/utils/api";
import Link from "next/link";
import type { UserRole } from "@/context/AuthContext";
import Image from "next/image";

interface RoleNavBarProps {
    role: UserRole;
}

export default function Sidebar({ role }: RoleNavBarProps) {
    const router = useRouter();
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadCourses() {
            try {
                // Tell TypeScript that `data` is Course[]
                const data = await fetchAllCourses();

                if (!data) {
                    router.replace("/admin/courses/create")
                    return;
                }
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
                <Link href={`/${role}/dashboard`}><h2 className="text-xl font-bold mb-4">Dashboard</h2></Link>
                {role === "admin" && (
                    <>
                        <div className="grid gap-y-2">
                            <div className="flex">
                                <Image src={home} alt="home" width={24} height={24}></Image>
                                <Link href={"/admin/courses"}>Home</Link>
                            </div>
                            <div className="flex">
                                <Image src={add} width={24} height={24} alt="add"></Image>
                                <Link href={"/admin/courses/create"}>Create</Link>
                            </div>
                            <div className="flex">
                                <Image src={upload} alt="upload" width={24} height={24}></Image>
                                <Link href={"/admin/courses/upload"}>Upload</Link>
                            </div>
                        </div>
                    </>
                )}
                <hr className="my-2 border-t border-gray-300" />
                {role === "teacher" && (
                    <>
                        <div className="grid gap-y-2">
                            <div className="flex gap-x-1">
                                <Image src={home} alt="home" width={24} height={24}></Image>
                                <Link href={"/teacher/courses"}>Home</Link>
                            </div>
                            <div className="flex gap-x-1">
                                <Image src={add} width={24} height={24} alt="add"></Image>
                                <Link href={"/teacher/courses/create"}>Create</Link>
                            </div>
                            <div className="flex gap-x-1">
                                <Image src={upload} alt="upload" width={24} height={24}></Image>
                                <Link href={"/teacher/courses/upload"}>Upload</Link>
                            </div>
                        </div>
                    </>
                )}
                <hr className="my-4 border-t border-gray-300" />
                {role === "student" && (
                    <>
                        <Link href={"/student/courses"}>
                            <h2 className="text-xl font-bold mb-4">Home</h2>
                        </Link>
                        <Link href={"/student/dashboard"}>Dashboard</Link></>
                )}
                <div className="flex flex-col gap-2">
                    <h1 className="text-xl font-bold mb-2">Cursos</h1>
                    {courses.map((course) => (
                        <button
                            key={course.id}
                            onClick={() => router.push(`/${role}/courses/${course.id}`)}
                            className=" hover:bg-gray-600 px-4 py-2 rounded-xl text-left transition"
                        >
                            {course.title}
                        </button>
                    ))}
                    <hr className="my-4 border-t border-gray-300" />
                </div>
            </aside>
        </main>
    );
}
