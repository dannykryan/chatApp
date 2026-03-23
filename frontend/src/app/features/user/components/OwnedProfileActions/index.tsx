"use client";
import { useState, useContext } from "react";
import Button from "../../../../shared/components/Button";
import { AuthContext } from "../../../../shared/context/AuthProvider";
import EditProfileDialog from "../EditProfileDialog";
import { User } from "../../../../types/user";
import { FaPencilAlt } from "react-icons/fa";

interface EditButtonProps {
  className?: string;
}

export default function EditButton({ className = "" }: EditButtonProps) {
  const [open, setOpen] = useState(false);
  const { user, setUser } = useContext(AuthContext);

  const handleSaved = (updatedUser: User) => {
    setUser(updatedUser);
    setOpen(false);
  };

  if (!user) return null;

  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      <Button onClick={() => setOpen(true)}>
        <div className="flex items-center gap-1">
          <FaPencilAlt className="text-sm mr-2" />
          Edit Profile
        </div>
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
