"use client";
import { useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthContext } from "../../context/AuthProvider";
import Login from "../../../features/user/components/LoginForm";

export default function HomeRedirect() {
  const { token } = useContext(AuthContext);
  const router = useRouter();

  useEffect(() => {
    if (token) {
      router.replace("/dashboard");
    }
  }, [token, router]);

  if (token) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-charade">
      <Login />
    </div>
  );
}
