"use client";
import { useContext } from "react";
import { useRouter } from "next/navigation";
import { useConfirm } from "../../hooks/useConfirm/index";
import { AuthContext } from "../AuthProvider";
import { logoutUser } from "../../utils/auth";
import Button from "../Button";

const LogoutButton = () => {
  const { setUser, setToken } = useContext(AuthContext);
  const router = useRouter();
  const confirm = useConfirm();

  const handleLogout = async () => {
    const confirmed = await confirm({
      title: "Confirm Logout",
      message: "Are you sure you want to logout?",
      confirmLabel: "Logout",
      confirmStyle: "danger",
    });

    if (confirmed) {
      logoutUser(setUser, setToken, router);
    }
  };

  return <Button onClick={handleLogout}>Logout</Button>;
};

export default LogoutButton;
