"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminAssignmentsCreateRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/teacher/assignments/create");
  }, [router]);
  return null;
}


