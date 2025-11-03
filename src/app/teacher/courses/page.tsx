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
    <main className="flex-wrap text-center mt-5 3xl:w-1/2 mx-8 3xl:mx-auto">
      <div className="">
        <h1 className="3xl:text-3xl text-xl leading-relaxed font-bold">Bem-vindo(a)</h1>
        <hr className="my-4 border-t border-gray-300" />
        <p className="3xl:text-2xl text-md leading-relaxed">Este é o Trilha, um projeto de extensão da UFPB criado para ajudar estudantes recém-chegados aos cursos de Tecnologia da Informação a dar seus primeiros passos no universo da programação e do desenvolvimento de software.
          Independentemente da sua experiência prévia.</p>
      </div>
      <hr className="my-8 border-t border-gray-300" />
      <div>
        <h1 className="3xl:text-3xl text-xl leading-relaxed font-bold">Como funciona a dashboard de vídeos:</h1>
        <hr className="my-4 border-t border-gray-300" />
        <p className="3xl:text-2xl text-md leading-relaxed">
          A dashboard de vídeos do Trilha foi desenvolvida para tornar o aprendizado mais organizado e acessível. Nela, os alunos têm acesso a todos os cursos disponíveis através de um menu lateral intuitivo.
        </p>
      </div>
      <hr className="my-4 border-t border-gray-300" />
      <div>
        <h1></h1>
      </div>
    </main>
  );


}