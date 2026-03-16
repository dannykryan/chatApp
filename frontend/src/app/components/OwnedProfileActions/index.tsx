"use client";
import { useState, useContext } from "react";
import Button from "../Button";
import { AuthContext } from "../AuthProvider";
import EditProfileDialog from "../EditProfileDialog";
import { User } from "../../types/user";

interface OwnedProfileActionsProps {
  className?: string;
}

export default function OwnedProfileActions({
  className = "",
}: OwnedProfileActionsProps) {
  const [open, setOpen] = useState(false);
  const { user, setUser } = useContext(AuthContext);

  const handleSaved = (updatedUser: User) => {
    setUser(updatedUser);
    setOpen(false);
  };

  if (!user) return null;

  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      <Button btnStyle="greenOutline" onClick={() => setOpen(true)}>
        Edit Profile
      </Button>

      <EditProfileDialog
        open={open}
        onClose={() => setOpen(false)}
        onSaved={handleSaved}
        initialValues={{
          username: user.username,
          email: user.email,
          bio: user.bio,
          profilePictureUrl: user.profilePictureUrl,
        }}
      />
    </div>
  );
}