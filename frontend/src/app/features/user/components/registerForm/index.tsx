"use client";
import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../../../shared/context/AuthProvider";
import { useRouter } from "next/navigation";
import Button from "../../../../shared/components/Button";
import AvatarUpload from "../../../../shared/components/AvatarUpload";
import FormInput from "../../../../shared/components/FormInput";
import { useProfileForm } from "../../../../hooks/useProfileForm";

const Register: React.FC = () => {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [profilePictureUrl, setProfilePictureUrl] = useState("");
  const { token } = useContext(AuthContext);
  const { handleSubmit, usernameError, emailError, error } =
    useProfileForm("register");
  const router = useRouter();

  useEffect(() => {
    if (token) {
      router.replace("/dashboard");
    }
  }, [token, router]);

  return (
    <form
      onSubmit={(e) =>
        handleSubmit(e, { email, username, password, profilePictureUrl })
      }
      className="bg-woodsmoke border border-gray-700 rounded-xl shadow-xl w-full max-w-sm p-6 flex flex-col gap-4"
    >
      <h2 className="text-xl font-bold mb-4 text-white">Register</h2>
      <AvatarUpload
        value={profilePictureUrl}
        onChange={setProfilePictureUrl}
        type="register"
      />
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
      <div>
        <FormInput
          label="Password"
          type="password"
          value={password ?? ""}
          autoComplete="current-password"
          onChange={setPassword}
          required
        />
        {error && <div className="text-xs text-red-500 mb-0">{error}</div>}
      </div>
      <Button type="submit" btnStyle="primary" className="w-full">
        Register
      </Button>
      <a
        href="/login"
        className="block mt-4 text-center text-purple hover:underline"
      >
        Already have an account? Login here.
      </a>
    </form>
  );
};

export default Register;
