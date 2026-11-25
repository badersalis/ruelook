"use client";

import { Suspense } from "react";
import { AuthForm } from "@/components/store/AuthForm";

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <AuthForm mode="signup" />
    </Suspense>
  );
}
