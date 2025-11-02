"use client"

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function CoursesPage() {
    const allowedRoles = ["admin", "teacher"]
    const { user, loading } = useAuth();
    const router = useRouter();
    useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    } else if (!loading && user && !allowedRoles.includes(user.role.name ?? "")) {
      router.push("/");
    }
  }, [loading, user, router]);

    return (
        <main className="flex-wrap text-center mt-5">
            <div>
                <h1 className="font-bold text-4xl">Aumente o seu potencial com os nossos cursos</h1>
                <p className="text-2xl px-20 py-5">Bem-vindo à nossa plataforma de aprendizado! Explore uma ampla variedade de cursos projetados para ajudar você a desenvolver suas habilidades, expandir seus conhecimentos e alcançar seus objetivos. Seja você iniciante ou buscando avançar em sua carreira, temos algo para todos.</p>
            </div>
            <div>
                <h1 className="font-bold text-4xl">Por que Aprender Conosco:</h1>
                <p></p>
            </div>
        </main>
    );


}