"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Course } from "@/types/interfaces";
import { fetchCoursesById } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";
import { useParams, useRouter } from "next/navigation";
import { BookOpen, PlayCircle, GraduationCap } from 'lucide-react';

const allowedRoles = ["admin", "teacher"]
export default function CoursePage() {
  const params = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const courseId = Number(params.courseId); // get course ID from URL
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
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
    <main className="flex text-center mt-5 3xl:w-1/2 mx-8 3xl:mx-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-full mb-6">
            <GraduationCap className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Bem-vindo ao Curso de {course.title}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {course.description}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto my-6">
          <Link href={`${course.id}/materials`}>
            <button
              className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 text-left overflow-hidden transform hover:-translate-y-1"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-150 transition-transform duration-500" />
              <div className="relative z-10">
                <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-3">
                  Materiais
                </h2>
                <p className="text-gray-600 text-lg mb-4">
                  Acesse PDFs, documentos e todo o material escrito do curso
                </p>
                <span className="inline-flex items-center text-blue-600 font-semibold group-hover:gap-2 transition-all">
                  Acessar materiais
                  <span className="ml-2 group-hover:ml-0 transition-all">→</span>
                </span>
              </div>
            </button>
          </Link>

          <Link href={`${course.id}/videos`}>
            <button
              className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 text-left overflow-hidden transform hover:-translate-y-1"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-100 rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-150 transition-transform duration-500" />
              <div className="relative z-10">
                <div className="w-16 h-16 bg-green-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <PlayCircle className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-3">
                  Vídeos
                </h2>
                <p className="text-gray-600 text-lg mb-4">
                  Assista às aulas em vídeo e aprenda de forma interativa
                </p>
                <span className="inline-flex items-center text-green-600 font-semibold group-hover:gap-2 transition-all">
                  Acessar vídeos
                  <span className="ml-2 group-hover:ml-0 transition-all">→</span>
                </span>
              </div>
            </button>
          </Link>
        </div>
      </div>
    </main>
  );
}