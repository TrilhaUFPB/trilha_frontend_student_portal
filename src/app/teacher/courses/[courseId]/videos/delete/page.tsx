// components/DeleteCourseButton.tsx
"use client";

import { useState } from "react";
import {
  fetchDocumentsByCourseId,
  deleteDocument,
  fetchAllVideos,
  deleteVideos,
  deleteCourses, // sua função existente
} from "@/utils/api";

type Props = {
  courseId: number;
  onDeleted: () => void;
};

export default function DeleteCourseButton({ courseId, onDeleted }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("Tem certeza que quer apagar este curso e todo o conteúdo vinculado? Esta ação é irreversível.")) return;
    setLoading(true);

    try {
      // 1) Tenta apagar o curso direto (espera que backend faça cascade)
      try {
        await deleteCourses(courseId);
        onDeleted();
        return;
      } catch (errCascade) {
        console.warn("deleteCourses falhou (tentando fallback):", errCascade);
      }

      // 2) Fallback: apagar documentos vinculados (em paralelo)
      try {
        const docs = await fetchDocumentsByCourseId(courseId);
        if (Array.isArray(docs) && docs.length > 0) {
          const docPromises = docs.map(d => deleteDocument(d.id).catch(e => ({ ok: false, id: d.id, e })));
          await Promise.allSettled(docPromises);
        }
      } catch (errDocs) {
        console.warn("fetch/delete documents fallback falhou:", errDocs);
      }

      // 3) Fallback: apagar vídeos vinculados (não existe fetchVideosByCourseId, então usamos fetchAllVideos e filtramos)
      try {
        const allVideos = await fetchAllVideos();
        if (Array.isArray(allVideos) && allVideos.length > 0) {
          const videosToDelete = (allVideos as any[]).filter(v => Number(v.course_id) === Number(courseId) || Number(v.CourseId) === Number(courseId));
          if (videosToDelete.length > 0) {
            const vidPromises = videosToDelete.map(v => deleteVideos(v.id).catch(e => ({ ok: false, id: v.id, e })));
            await Promise.allSettled(vidPromises);
          }
        }
      } catch (errVids) {
        console.warn("fetch/delete videos fallback falhou:", errVids);
      }

      // 4) tenta apagar o curso novamente
      await deleteCourses(courseId);
      onDeleted();
    } catch (err) {
      console.error("Erro ao apagar curso (total):", err);
      alert("Erro ao apagar o curso. Veja o console para detalhes.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className={`px-3 py-1 border rounded ${loading ? "opacity-60 cursor-not-allowed" : "bg-red-600 text-white"}`}
    >
      {loading ? "Removendo..." : "Remover"}
    </button>
  );
}
