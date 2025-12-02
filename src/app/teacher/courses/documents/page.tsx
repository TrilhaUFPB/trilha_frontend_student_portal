"use client";

import { useCallback, useState } from "react";
import { uploadDocument, createDocumentFromLink, fetchDocumentsByCourseId, fetchAllCourses } from "@/utils/api";
import { Course, Document } from "@/types/interfaces";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { useEffect } from "react";

export default function DocumentsPage() {
  const allowedRoles = ["admin", "teacher"]
  const router = useRouter();
  const params = useParams();
  const urlCourseId = params.courseId ? parseInt(params.courseId as string) : null;
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<"upload" | "link">("upload");

  // Courses state
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [loadingCourses, setLoadingCourses] = useState(false);

  // Upload form state
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");

  // Link form state
  const [fileLink, setFileLink] = useState("");
  const [linkTitle, setLinkTitle] = useState("");
  const [linkDescription, setLinkDescription] = useState("");
  const [linking, setLinking] = useState(false);
  const [linkMessage, setLinkMessage] = useState("");

  // Documents list
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  if (!loading && !user) {
    router.push("/login");
  } else if (!loading && user && !allowedRoles.includes(user.role.name ?? "")) {
    router.push("/");
  }

  // Load courses
  useEffect(() => {
    async function loadCourses() {
      try {
        setLoadingCourses(true);
        const data = await fetchAllCourses();
        const coursesData = data as Course[];
        setCourses(coursesData);

        // Se tiver courseId na URL, usar ele, senão usar o primeiro curso
        if (urlCourseId && coursesData.some(c => c.id === urlCourseId)) {
          setSelectedCourseId(urlCourseId);
        } else if (coursesData.length > 0) {
          setSelectedCourseId(coursesData[0].id);
        }
      } catch (error) {
        console.error("Error loading courses:", error);
      } finally {
        setLoadingCourses(false);
      }
    }
    loadCourses();
  }, [urlCourseId]);

  // Load documents when course changes

  const loadDocuments = useCallback(async () => {
    if (!selectedCourseId) return;
    try {
      setLoadingDocs(true);
      const data = await fetchDocumentsByCourseId(selectedCourseId);
      setDocuments(data as Document[]);
    } catch (error) {
      console.error("Error loading documents:", error);
    } finally {
      setLoadingDocs(false);
    }
  }, [selectedCourseId]);

  useEffect(() => {
    if (selectedCourseId) {
      loadDocuments();
    }
  }, [selectedCourseId, loadDocuments]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setUploadMessage("");
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId) {
      setUploadMessage("Por favor, selecione um curso");
      return;
    }
    if (!file || !title.trim()) {
      setUploadMessage("Por favor, selecione um arquivo e insira um título");
      return;
    }

    try {
      setUploading(true);
      setUploadMessage("");
      await uploadDocument(file, title, selectedCourseId, description);
      setUploadMessage("Documento enviado com sucesso!");
      setFile(null);
      setTitle("");
      setDescription("");
      // Reset file input
      const fileInput = document.getElementById("file-input") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
      loadDocuments();
    } catch (error) {
      setUploadMessage(`Erro: ${error}`);
    } finally {
      setUploading(false);
    }
  };

  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId) {
      setLinkMessage("Por favor, selecione um curso");
      return;
    }
    if (!fileLink.trim() || !linkTitle.trim()) {
      setLinkMessage("Por favor, preencha o link e o título");
      return;
    }

    try {
      setLinking(true);
      setLinkMessage("");
      await createDocumentFromLink(fileLink, linkTitle, selectedCourseId, linkDescription);
      setLinkMessage("Documento vinculado com sucesso!");
      setFileLink("");
      setLinkTitle("");
      setLinkDescription("");
      loadDocuments();
    } catch (error) {
      setLinkMessage(`Erro: ${error}`);
    } finally {
      setLinking(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Gerenciar Documentos</h1>

      {/* Course Selection */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow-md">
        <label className="block text-sm font-medium mb-2">Selecione o Curso *</label>
        {loadingCourses ? (
          <p className="text-gray-600">Carregando cursos...</p>
        ) : courses.length === 0 ? (
          <p className="text-red-600">Nenhum curso disponível. Por favor, crie um curso primeiro.</p>
        ) : (
          <select
            value={selectedCourseId || ""}
            onChange={(e) => setSelectedCourseId(Number(e.target.value))}
            className="w-full border p-2 rounded"
            required
          >
            <option value="">Selecione um curso</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab("upload")}
          className={`px-4 py-2 font-medium ${activeTab === "upload"
            ? "border-b-2 border-blue-600 text-blue-600"
            : "text-gray-600"
            }`}
        >
          Upload de Arquivo
        </button>
        <button
          onClick={() => setActiveTab("link")}
          className={`px-4 py-2 font-medium ${activeTab === "link"
            ? "border-b-2 border-blue-600 text-blue-600"
            : "text-gray-600"
            }`}
        >
          Vincular por Link
        </button>
      </div>

      {/* Upload Form */}
      {activeTab === "upload" && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Enviar Arquivo</h2>
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Arquivo</label>
              <input
                id="file-input"
                type="file"
                accept=".pdf,.doc,.docx,.txt,.md,.rtf"
                onChange={handleFileChange}
                className="w-full border p-2 rounded"
                required
              />
              {file && (
                <p className="mt-2 text-sm text-gray-600">
                  Arquivo selecionado: {file.name} ({formatFileSize(file.size)})
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Formatos permitidos: PDF, DOC, DOCX, TXT, MD, RTF (máx. 50MB)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Título *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border p-2 rounded"
                placeholder="Digite o título do documento"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Descrição</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border p-2 rounded"
                placeholder="Digite uma descrição (opcional)"
                rows={3}
              />
            </div>

            {uploadMessage && (
              <div
                className={`p-3 rounded ${uploadMessage.includes("sucesso")
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
                  }`}
              >
                {uploadMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={uploading}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              {uploading ? "Enviando..." : "Enviar Arquivo"}
            </button>
          </form>
        </div>
      )}

      {/* Link Form */}
      {activeTab === "link" && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Vincular Documento por Link</h2>
          <form onSubmit={handleLinkSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Link do Documento *</label>
              <input
                type="url"
                value={fileLink}
                onChange={(e) => setFileLink(e.target.value)}
                className="w-full border p-2 rounded"
                placeholder="https://example.com/document.pdf"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Título *</label>
              <input
                type="text"
                value={linkTitle}
                onChange={(e) => setLinkTitle(e.target.value)}
                className="w-full border p-2 rounded"
                placeholder="Digite o título do documento"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Descrição</label>
              <textarea
                value={linkDescription}
                onChange={(e) => setLinkDescription(e.target.value)}
                className="w-full border p-2 rounded"
                placeholder="Digite uma descrição (opcional)"
                rows={3}
              />
            </div>

            {linkMessage && (
              <div
                className={`p-3 rounded ${linkMessage.includes("sucesso")
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
                  }`}
              >
                {linkMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={linking}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              {linking ? "Vinculando..." : "Vincular Documento"}
            </button>
          </form>
        </div>
      )}

      {/* Documents List */}
      <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Documentos Cadastrados</h2>
        {loadingDocs ? (
          <p className="text-gray-600">Carregando...</p>
        ) : documents.length === 0 ? (
          <p className="text-gray-600">Nenhum documento cadastrado ainda.</p>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="border p-4 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{doc.title}</h3>
                    {doc.description && (
                      <p className="text-gray-600 text-sm mt-1">{doc.description}</p>
                    )}
                    <div className="mt-2 flex gap-4 text-sm text-gray-500">
                      <span>
                        Tipo: {doc.type === "upload" ? "📄 Upload" : "🔗 Link"}
                      </span>
                      {doc.type === "upload" && doc.file_size && (
                        <span>Tamanho: {formatFileSize(doc.file_size)}</span>
                      )}
                      {doc.type === "link" && doc.file_link && (
                        <span>
                          Link:{" "}
                          <a
                            href={doc.file_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {doc.file_link.substring(0, 50)}...
                          </a>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      Criado por: {doc.created_by?.name || "N/A"} em{" "}
                      {doc.created_at
                        ? new Date(doc.created_at).toLocaleDateString("pt-br")
                        : "Data indisponível"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

