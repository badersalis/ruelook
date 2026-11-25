"use client";

import { Suspense } from "react";
import { AuthForm } from "@/components/store/AuthForm";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <AuthForm mode="login" />
    </Suspense>
  );
}
