const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function logoutUser(
  setUser: (u: any) => void,
  setToken: (t: string) => void,
  router: any,
) {
  const token = localStorage.getItem("token");
  if (token) {
    await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  }
  localStorage.removeItem("token");
  setUser(null);
  setToken("");
  router.replace("/login");
}
