"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  fetchDocumentsByCourseId,
  fetchAllCourses,
  updateDocument,
  deleteDocument,
  uploadDocument,
} from "@/utils/api";
import { Document, Course } from "@/types/interfaces";

/**
 * EditMaterialsPage
 * - Inline editing of documents tied to a course
 * - Replace file (optional, depends on backend)
 */
export default function EditMaterialsPage() {
  const params = useParams();
  const router = useRouter();
  const rawCourseId = params.courseId;
  const courseId = Number(rawCourseId);

  const { user, loading } = useAuth();

  const [documents, setDocuments] = useState<Document[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Inline edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<Partial<Document>>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Auth guard
  useEffect(() => {
    if (!loading) {
      if (!user) router.push("/login");
      else if (user.role?.name !== "admin" && user.role?.name !== "teacher") router.push("/");
    }
  }, [loading, user, router]);

  // Load documents and courses
  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoadingData(true);
      setError(null);

      if (!rawCourseId || Number.isNaN(courseId)) {
        setError("Invalid courseId in route.");
        setLoadingData(false);
        return;
      }

      try {
        const [docsRes, coursesRes] = await Promise.all([
          fetchDocumentsByCourseId(courseId),
          fetchAllCourses(),
        ]);

        if (!mounted) return;

        setDocuments(Array.isArray(docsRes) ? (docsRes as Document[]) : []);
        setAllCourses(Array.isArray(coursesRes) ? (coursesRes as Course[]) : []);
      } catch (err) {
        console.error("Error loading materials or courses:", err);
        setError("Erro ao carregar materiais do curso.");
      } finally {
        if (mounted) setLoadingData(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [rawCourseId, courseId]);

  // Start editing inline
  function startEditing(doc: Document) {
    setEditingId(doc.id);
    setEditingData({
      title: doc.title,
      description: doc.description,
      type: doc.type,
      file_link: (doc as any).file_link,
      course_id: doc.course_id,
    });
    setSelectedFile(null);
  }

  function cancelEditing() {
    setEditingId(null);
    setEditingData({});
    setSelectedFile(null);
  }

  function handleEditingChange<K extends keyof Document>(key: K, value: Document[K] | undefined) {
    setEditingData(prev => ({ ...prev, [key]: value }));
  }

  // Save document (metadata + optional file replacement)
  async function handleSave(id: number) {
    setSavingId(id);
    setError(null);

    try {
      // 1) If user selected a file and backend supports file replacement via a dedicated endpoint,
      //    you can either:
      //    - send a FormData to updateDocument (if server accepts multipart PUT), or
      //    - call uploadDocument to upload new file and then update the document metadata with the returned file info.
      //
      // Here we'll try a simple approach:
      // - If selectedFile exists -> attempt to upload it via uploadDocument and then update metadata with the returned file info.
      // - If no file -> update metadata only.
      //
      // IMPORTANT: adapt this logic if your backend has a different contract.

      let updatedFields: any = {
        title: editingData.title ?? "",
        description: editingData.description ?? "",
        type: editingData.type ?? "upload",
        course_id: editingData.course_id ?? courseId,
      };

      // if it's a link type, include file_link
      if (updatedFields.type === "link") {
        updatedFields.file_link = editingData.file_link ?? "";
      }

      // If user selected a file, try to upload it first
      if (selectedFile) {
        // uploadDocument(file: File, title: string, courseId: number, description?: string)
        console.log("Uploading new file for document", id, selectedFile);
        const uploadResult = await uploadDocument(
          selectedFile,
          String(editingData.title ?? "") || selectedFile.name,
          Number(updatedFields.course_id),
          String(editingData.description ?? "")
        );
        // uploadResult should contain file_path/file_name/mime_type etc.
        // Merge returned file info into updatedFields if present
        if (uploadResult && typeof uploadResult === "object") {
          if ((uploadResult as any).file_path) updatedFields.file_path = (uploadResult as any).file_path;
          if ((uploadResult as any).file_name) updatedFields.file_name = (uploadResult as any).file_name;
          if ((uploadResult as any).mime_type) updatedFields.mime_type = (uploadResult as any).mime_type;
          if ((uploadResult as any).file_link) updatedFields.file_link = (uploadResult as any).file_link;
        }
      }

      console.log("Updating document:", id, updatedFields);
      await updateDocument(id, updatedFields);

      // update local list optimistically
      setDocuments(prev => prev.map(d => (d.id === id ? { ...d, ...updatedFields } as Document : d)));
      cancelEditing();
    } catch (err) {
      console.error("Failed to save document", err);
      setError("Erro ao salvar o material. Veja console para mais detalhes.");
    } finally {
      setSavingId(null);
    }
  }

  // Delete document
  async function handleDelete(id: number) {
    if (!confirm("Tem certeza que deseja apagar este material?")) return;
    setDeletingId(id);
    setError(null);
    try {
      await deleteDocument(id);
      setDocuments(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      console.error("Failed to delete document", err);
      setError("Erro ao apagar o material.");
    } finally {
      setDeletingId(null);
    }
  }

  // Quick UI helpers
  const uploaderName = (doc: Document) => doc.created_by?.name ?? (doc as any).uploader_name ?? `#${doc.created_by_id ?? "?"}`;

  if (loadingData) return <div className="p-6">Carregando materiais...</div>;
  if (error) return <div className="p-6 text-red-600">Erro: {error}</div>;

  return (
    <main className="max-w-4xl mx-auto p-6 bg-white rounded shadow">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-semibold">Editar Materiais do curso #{courseId}</h1>
          <p className="text-sm text-muted-foreground">Edite título, descrição, tipo, curso e substitua arquivo quando necessário.</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/teacher/courses/${courseId}`} className="px-3 py-1 border rounded">Voltar ao curso</Link>
        </div>
      </div>

      <div className="space-y-4">
        {documents.length === 0 && <div>Nenhum material vinculado a este curso.</div>}

        <ul className="space-y-3">
          {documents.map(doc => (
            <li key={doc.id} className="border p-4 rounded flex flex-col md:flex-row md:justify-between gap-3">
              <div className="flex-1">
                {editingId === doc.id ? (
                  <>
                    <input
                      type="text"
                      value={(editingData.title as string) ?? ""}
                      onChange={(e) => handleEditingChange("title", e.target.value)}
                      className="w-full p-2 border rounded mb-2"
                      placeholder="Título"
                    />
                    <textarea
                      value={(editingData.description as string) ?? ""}
                      onChange={(e) => handleEditingChange("description", e.target.value)}
                      className="w-full p-2 border rounded mb-2"
                      rows={3}
                      placeholder="Descrição"
                    />
                    <div className="flex gap-2 mb-2">
                      <select
                        value={(editingData.type as any) ?? "upload"}
                        onChange={(e) => handleEditingChange("type", e.target.value as "upload" | "link")}
                        className="p-2 border rounded"
                      >
                        <option value="upload">Upload</option>
                        <option value="link">Link</option>
                      </select>

                      <select
                        value={(editingData.course_id as number) ?? doc.course_id}
                        onChange={(e) => handleEditingChange("course_id", Number(e.target.value))}
                        className="p-2 border rounded"
                      >
                        {allCourses.map(c => (
                          <option key={c.id} value={c.id}>{c.title}</option>
                        ))}
                      </select>
                    </div>

                    { (editingData.type as any) === "link" ? (
                      <input
                        type="text"
                        value={(editingData.file_link as string) ?? ""}
                        onChange={(e) => handleEditingChange("file_link", e.target.value)}
                        placeholder="https://..."
                        className="w-full p-2 border rounded mb-2"
                      />
                    ) : (
                      <div className="mb-2">
                        <div className="text-sm mb-1">Arquivo atual: {doc.file_name ?? (doc.file_path ? doc.file_path.split("\\").pop() : "—")}</div>
                        <input
                          type="file"
                          accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                          onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                          className="w-full"
                        />
                        {selectedFile && <div className="text-xs mt-1">Arquivo selecionado: {selectedFile.name}</div>}
                      </div>
                    ) }

                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleSave(doc.id)}
                        disabled={savingId === doc.id}
                        className="px-3 py-1 bg-green-600 text-white rounded"
                      >
                        {savingId === doc.id ? "Salvando..." : "Salvar"}
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="px-3 py-1 bg-gray-500 text-white rounded"
                      >
                        Cancelar
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-lg">{doc.title}</div>
                        <div className="text-sm text-muted-foreground">{doc.description}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Tipo: {doc.type} • {doc.mime_type ?? ""} • Enviado por: {uploaderName(doc)}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="flex flex-col gap-2 items-start md:items-end">
                <div className="flex gap-2">
                  <Link href={`/teacher/documents/${doc.id}`} className="px-3 py-1 border rounded">Ver</Link>
                  <button
                    onClick={() => startEditing(doc)}
                    className="px-3 py-1 border rounded bg-blue-600 text-white"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    disabled={deletingId === doc.id}
                    className="px-3 py-1 border rounded bg-red-600 text-white"
                  >
                    {deletingId === doc.id ? "Removendo..." : "Remover"}
                  </button>
                </div>

                <div className="text-xs text-muted-foreground">
                  <div>Arquivo: {doc.file_name ?? doc.file_path?.split("\\").pop() ?? "—"}</div>
                  {doc.type === "link" && doc.file_link && (
                    <a href={doc.file_link} target="_blank" rel="noreferrer" className="underline text-sm">Abrir link</a>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
