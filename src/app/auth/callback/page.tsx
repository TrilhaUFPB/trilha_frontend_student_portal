"use client";
import { useEffect, useState, useRef } from "react"; // Adicione useRef
import { useRouter } from "next/navigation";
import { setToken } from "@/utils/auth";
import { useAuth } from "@/context/AuthContext";

export default function AuthCallbackPage() {
  const router = useRouter();
  const { refreshAuth } = useAuth();
  const [status, setStatus] = useState("Processing...");

  // Flag para garantir execução única
  const processingRef = useRef(false);

  useEffect(() => {
    // Se já processamos, para tudo (evita loops e execução dupla do React 18)
    if (processingRef.current) return;
    processingRef.current = true;

    // Try to get the token from query string or fragment
    const url = new URL(window.location.href);
    const token = url.searchParams.get("token") || url.hash.replace(/^#?token=/, "");

    if (token) {
      console.log("AuthCallback: Token received, storing...");
      setToken(token);
      setStatus("Authentication successful! Redirecting...");

      refreshAuth(); // Agora é seguro chamar, mesmo se gerar re-render

      setTimeout(() => {
        console.log("AuthCallback: Redirecting to home...");
        router.replace("/");
      }, 100);
    } else {
      setStatus("No token found. Redirecting to login...");
      setTimeout(() => router.replace("/login"), 1000);
    }

    // Podemos manter as dependências ou deixar vazio, 
    // pois a trava do useRef protege a lógica.
  }, [router, refreshAuth]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-2xl font-bold mb-4">Signing you in...</h1>
      <p className="text-gray-500">{status}</p>
    </main>
  );
}