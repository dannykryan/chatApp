"use client";
import { useContext } from "react";
import { useRouter } from "next/navigation";
import { AuthContext } from "../AuthProvider";

const LogoutButton = () => {
  const { setUser, setToken } = useContext(AuthContext);
  const router = useRouter();

  const handleLogout = async () => {
    // Optionally call backend logout endpoint
    const token = localStorage.getItem("token");
    if (token) {
      await fetch("http://localhost:4000/api/auth/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    }
    localStorage.removeItem("token");
    setUser(null);
    setToken("");
    router.replace("/login");
  };

  return (
    <button
      onClick={handleLogout}
      className="bg-red-600 text-white px-4 py-2 rounded hover:cursor-pointer hover:bg-red-700"
    >
      Logout
    </button>
  );
};

export default LogoutButton;