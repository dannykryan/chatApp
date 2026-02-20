export interface User {
  id?: string;
  username?: string;
  email?: string;
  profilePictureUrl?: string;
  bio?: string;
  lastOnline?: string;
  createdAt?: string;
  updatedAt?: string;
  spotifyDisplayName?: string | null;
}