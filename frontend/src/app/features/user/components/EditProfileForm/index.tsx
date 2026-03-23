"use client";
import { useState } from "react";
import Button from "../../../../shared/components/Button";
import AvatarUpload from "../../../../shared/components/AvatarUpload";
import { User } from "../../../../types/user";
import FormInput from "../../../../shared/components/FormInput";
import { useProfileForm } from "../../../../hooks/useProfileForm";

type EditProfileFormProps = {
  initialValues: {
    username: string;
    email: string | undefined;
    bio?: string | null;
    profilePictureUrl?: string | null;
  };
  onCancel: () => void;
  onSaved: (updatedUser: User) => void;
};

export default function EditProfileForm({
  initialValues,
  onCancel,
  onSaved,
}: EditProfileFormProps) {
  const [username, setUsername] = useState(initialValues.username ?? "");
  const [email, setEmail] = useState(initialValues.email ?? "");
  const [password, setPassword] = useState("");
  const [bio, setBio] = useState(initialValues.bio ?? "");
  const [profilePictureUrl, setProfilePictureUrl] = useState(
    initialValues.profilePictureUrl ?? "",
  );
  const [uploadingImage, setUploadingImage] = useState(false);
  const { handleSubmit, usernameError, emailError, error } =
    useProfileForm("edit");

  const token = localStorage.getItem("token") ?? undefined;

  const handleFormSubmit = async (e: React.SubmitEvent) => {
    const result = await handleSubmit(e, {
      email,
      username,
      password,
      bio,
      profilePictureUrl,
    });

    if (result === true) {
      onSaved({
        username,
        email,
        bio,
        profilePictureUrl,
      } as User);
    }
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-5">
      {/* Avatar upload */}
      <AvatarUpload
        value={profilePictureUrl}
        onChange={setProfilePictureUrl}
        token={token}
        onUploadingChange={setUploadingImage}
      />

      {/* Username */}
      <div>
        <FormInput
          label="Username"
          type="text"
          value={username}
          autoComplete="username"
          onChange={setUsername}
          required
        />
        {usernameError && (
          <div className="text-xs text-red-500 mb-0">{usernameError}</div>
        )}
      </div>

      {/* Email */}
      <div>
        <FormInput
          label="Email"
          type="email"
          value={email ?? ""}
          autoComplete="email"
          onChange={setEmail}
          required
        />
        {emailError && (
          <div className="text-xs text-red-500 mb-0">{emailError}</div>
        )}
      </div>

      {/* Bio */}
      <div>
        <FormInput label="Bio" type="text" value={bio} onChange={setBio} />
        {error && <div className="text-xs text-red-500 mb-0">{error}</div>}
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <Button btnStyle="gray" onClick={onCancel}>
          Cancel
        </Button>
        <Button btnStyle="primary" disabled={uploadingImage}>
          {uploadingImage ? "Uploading..." : "Save"}
        </Button>
      </div>
    </form>
  );
}
