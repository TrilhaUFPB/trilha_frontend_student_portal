"use client";

import { useAuth } from "@/context/AuthContext";
import { BookOpen } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Course } from "@/types/interfaces";
import { fetchAllCourses } from "@/utils/api";

const allowedRoles = ["admin", "teacher"];
export default function CoursesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    } else if (!loading && user && !allowedRoles.includes(user.role.name ?? "")) {
      router.push("/");
    }
  }, [loading, user, router]);

  useEffect(() => {
    let mounted = true;
    async function loadCourses() {
      setLoadingData(true);
      setError(null);
      try {
        const res = await fetchAllCourses();
        // res pode ser Course[] ou { data: Course[] } dependendo da API — normalizamos:
        const list = Array.isArray(res) ? res : (res && typeof res === "object" && "data" in res ? (res as { data: Course[] }).data : []);
        if (!mounted) return;
        setCourses(list as Course[]);
      } catch (err) {
        console.error("Failed to load courses:", err);
        setError("Erro ao carregar cursos. Tente novamente mais tarde.");
      } finally {
        if (mounted) setLoadingData(false);
      }
    }

    // só carrega se user está definido e tem permissão
    if (user && allowedRoles.includes(user.role.name ?? "")) {
      loadCourses();
    } else {
      setLoadingData(false);
    }

    return () => { mounted = false; };
  }, [user]);

  if (loading || loadingData) {
    return (
      <main className="flex-wrap text-center mt-5 3xl:w-1/2 mx-8 3xl:mx-auto">
        <div className="min-h-screen flex items-center justify-center p-8">
          <div>Carregando cursos...</div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex-wrap text-center mt-5 3xl:w-1/2 mx-8 3xl:mx-auto">
        <div className="min-h-screen p-8">
          <div className="text-red-600">{error}</div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-wrap text-center mt-5 3xl:w-1/2 mx-8 3xl:mx-auto">
      <div className="min-h-screen bg-white">
        <div className="max-w-6xl mx-auto px-8 py-20">
          <div className="mb-20 text-left">
            <h1 className="text-6xl font-bold text-slate-900 mb-6">Portal Trilhete</h1>
            <p className="text-xl text-slate-700 font-light leading-relaxed max-w-3xl">
              Lista de cursos disponíveis atualmente.
            </p>
          </div>

          <div className="mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-8">Cursos</h2>

            {courses.length === 0 ? (
              <div className="text-gray-600">Nenhum curso encontrado.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {courses.map((c) => (
                  <Link
                    key={c.id}
                    href={`/teacher/courses/${c.id}`}
                    className="group p-6 border border-slate-200 rounded-lg hover:border-slate-400 hover:bg-slate-50 transition-all duration-200 flex flex-col justify-between h-56"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 flex-shrink-0 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                        <BookOpen className="w-6 h-6 text-slate-700" strokeWidth={2} />
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <h3 className="text-2xl font-bold text-slate-900 mb-1 truncate">
                          {c.title}
                        </h3>
                        <p className="text-lg font-semibold text-slate-800 mb-2 line-clamp-2">
                          {c.description ?? ""}
                        </p>
                        <p className="text-sm text-slate-600 leading-relaxed">
                          ID: {c.id} • {c.created_at ? new Date(c.created_at).toLocaleDateString() : "—"}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
