"use client";

import Dialog from "../../../../shared/components/Dialog";
import EditProfileForm from "../EditProfileForm";
import { User } from "../../../../types/user";

type EditProfileDialogProps = {
  open: boolean;
  onClose: () => void;
  initialValues: {
    username: string;
    email: string | undefined;
    bio?: string | null;
    profilePictureUrl?: string | null;
  };
  onSaved: (updatedUser: User) => void;
};

export default function EditProfileDialog({
  open,
  onClose,
  initialValues,
  onSaved,
}: EditProfileDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title="Edit Profile">
      <EditProfileForm
        initialValues={initialValues}
        onCancel={onClose}
        onSaved={onSaved}
      />
    </Dialog>
  );
}
