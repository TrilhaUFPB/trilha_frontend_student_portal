"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Course, Document } from "@/types/interfaces";
import { fetchCoursesById, fetchDocumentsByCourseId, downloadDocument } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";

const allowedRoles = ["admin", "teacher"];
export default function CoursePage() {
  const params = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const courseId = Number(params.courseId);

  const [course, setCourse] = useState<Course | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [docsLoading, setDocsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  // Redirect logic (keep your existing behavior)
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    } else if (!loading && user && !allowedRoles.includes(user.role.name ?? "")) {
      router.push("/");
    }
  }, [loading, user, router]);

  // Load course
  useEffect(() => {
    let mounted = true;
    async function loadCourse() {
      try {
        const data = (await fetchCoursesById(courseId)) as Course;
        if (!mounted) return;
        setCourse(data);
      } catch (err) {
        console.error("Error fetching course:", err);
        setError("Erro ao carregar o curso.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadCourse();
    return () => { mounted = false; };
  }, [courseId]);

  // Load documents for this course
  useEffect(() => {
    let mounted = true;
    async function loadDocs() {
      setDocsLoading(true);
      try {
        const docs = (await fetchDocumentsByCourseId(courseId)) as Document[];
        if (!mounted) return;
        setDocuments(docs ?? []);
      } catch (err) {
        console.error("Error fetching documents:", err);
        setError("Erro ao carregar os materiais do curso.");
      } finally {
        if (mounted) setDocsLoading(false);
      }
    }
    if (!Number.isNaN(courseId)) loadDocs();
    return () => { mounted = false; };
  }, [courseId]);

  // download helper
  async function handleDownload(id: number) {
    try {
      await downloadDocument(id);
    } catch (err) {
      console.error("Erro ao baixar documento:", err);
      setError("Não foi possível baixar o documento.");
    }
  }

  if (loading) return <div>Loading...</div>;
  if (!course) return <div>Course not found.</div>;

  return (
    <main className="flex-wrap text-center mt-5 3xl:w-1/2 mx-8 3xl:mx-auto">
      <div className="flex justify-between items-center">
        <Link href={`/teacher/courses/${course.id}`} className="flex items-center gap-2">
          <ArrowLeft />
          <span>Voltar</span>
        </Link>
        <Link href={`/teacher/courses/${courseId}/materials/edit`} className="flex items-center gap-2">
          <Pencil />
          Edit
        </Link>
      </div>

      <section className="mt-6 text-left">
        <h2 className="text-lg font-semibold">Curso: {course.title}</h2>
        <p className="text-sm text-muted-foreground">{course.description}</p>
      </section>

      <section className="mt-6">
        {docsLoading ? (
          <div>Carregando documentos...</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : documents.length === 0 ? (
          <div>Não há materiais vinculados a este curso.</div>
        ) : (
          <ul className="mt-4 space-y-3">
            {documents.map((doc) => (
              <li key={doc.id} className="flex justify-between items-center border p-3 rounded">
                <div className="text-left">
                  <div className="font-medium">{doc.title}</div>
                  {doc.description && <div className="text-sm text-muted-foreground">{doc.description}</div>}
                  <div className="text-xs text-muted-foreground">Enviado por: {doc.created_by?.name}</div>
                  <div className="text-xs text-muted-foreground">Entregue: {doc.created_at}</div>
                </div>
                <div className="flex items-center gap-2">
                  {doc.type === "upload" ? (
                    // Se for um arquivo enviado (upload), mostra botão de download
                    <button
                      onClick={() => handleDownload(doc.id)}
                      className="px-3 py-1 border rounded hover:bg-gray-100"
                    >
                      Baixar
                    </button>
                  ) : (
                    // Se for um link, mostra botão para abrir
                    <a
                      href={doc.file_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 border rounded hover:bg-gray-100 text-blue-600"
                    >
                      Acessar Link
                    </a>
                  )}

                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
