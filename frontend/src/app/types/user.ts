export interface User {
  id: string;
  username: string;
  email?: string;
  profilePictureUrl?: string;
  bio?: string;
  lastOnline?: string;
  isOnline: boolean;
  createdAt: string;
  updatedAt?: string;
  spotifyDisplayName?: string | null;
  isSystem: boolean;
}
