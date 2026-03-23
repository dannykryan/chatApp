import { useState, useContext } from "react";
import { API_URL } from "../../shared/utils/api";
import { ConfirmContext } from "../../shared/context/ConfirmProvider";
import { useRouter } from "next/navigation";

const validateEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export function useProfileForm(mode: "register" | "edit") {
  const [usernameError, setUsernameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [error, setError] = useState("");
  const confirm = useContext(ConfirmContext);
  const router = useRouter();

  const handleSubmit = async (
    e: React.SubmitEvent,
    {
      email,
      username,
      password,
      profilePictureUrl,
      bio,
    }: {
      email: string;
      username: string;
      password?: string;
      profilePictureUrl: string;
      bio?: string;
    },
  ) => {
    e.preventDefault();
    setEmailError("");
    setUsernameError("");
    setError("");

    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address");
      return false;
    }

    let endpoint = "";
    let method = "POST";
    let body: any = { email, username, profilePictureUrl };

    if (mode === "register") {
      endpoint = "/auth/register";
      body.password = password;
    } else {
      endpoint = "/user/me";
      method = "PUT";
      body.bio = bio;
    }

    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;

    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (mode === "edit" && token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_URL}${endpoint}`, {
        method,
        headers,
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.error === "Username already taken") {
          setUsernameError("Username is already taken");
        } else if (data.error === "Email already taken") {
          setEmailError("Email is already registered");
        } else {
          setError(
            data.error ||
              (mode === "register" ? "Registration failed" : "Update failed"),
          );
        }
        return false;
      }

      if (mode === "register") {
        await confirm({
          title: "Registration Successful",
          message: "Please log in to continue.",
          confirmLabel: "Go to Login",
        });
        router.push("/login");
      } else {
        await confirm({
          title: "Profile Updated",
          message: "Your profile was updated successfully.",
          confirmLabel: "OK",
        });
      }
      return true;
    } catch (err: unknown) {
      setError(
        "Network error: " +
          (err instanceof Error ? err.message : "Unknown error"),
      );
      return false;
    }
  };

  return {
    handleSubmit,
    usernameError,
    emailError,
    error,
  };
}
