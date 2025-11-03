"use client"

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
const allowedRoles = ["admin", "teacher"]

export default function CoursesPage() {
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
                <h1 className="font-bold text-4xl">Bem-vindo(a)</h1>
                <p className="text-2xl px-20 py-5">Este é o Trilha, um projeto de extensão da UFPB criado para ajudar estudantes recém-chegados aos cursos de Tecnologia da Informação a dar seus primeiros passos no universo da programação e do desenvolvimento de software.

Independentemente da sua experiência prévia, o Trilha oferece um ambiente colaborativo para explorar diferentes áreas da tecnologia — da lógica de programação ao desenvolvimento web, passando por ciência de dados, inteligência artificial e muito mais.

Mais do que ensinar a programar, o projeto busca despertar o pensamento computacional, incentivar a criatividade e promover o aprendizado contínuo, preparando você para enfrentar desafios reais e descobrir qual caminho dentro da TI mais combina com seus interesses.

Com o apoio de mentores e colegas, você participará de atividades práticas, trilhas de aprendizado e projetos que conectam teoria e prática, desenvolvendo habilidades técnicas e pessoais essenciais para sua jornada profissional.

O Trilha é o seu ponto de partida para explorar, aprender e crescer na área de tecnologia — um espaço onde cada passo conta na construção do seu futuro.</p>
            </div>
            <div>
                <h1 className="font-bold text-4xl">Por que Aprender Conosco:</h1>
                <p></p>
            </div>
        </main>
    );


}