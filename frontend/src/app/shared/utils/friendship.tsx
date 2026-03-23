import { API_URL } from "./api";

interface FriendStatusResponse {
  status: "FRIENDS" | "PENDING" | "NONE";
  isSender: boolean | null; // null = no active request exists
}

interface CheckFriendStatusResult {
  status: FriendStatusResponse["status"];
  isSender: FriendStatusResponse["isSender"];
}

/**
 * Checks the friendship status between current user and target username.
 *
 * @throws {Error} if the request fails (network error, unauthorized, server error, invalid json, etc.)
 */
const checkFriendStatus = async (
  friendUsername: string,
  currentUserId: string,
): Promise<CheckFriendStatusResult> => {
  if (!friendUsername?.trim()) {
    return { status: "NONE", isSender: null };
  }

  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("No authentication token found");
  }

  const res = await fetch(`${API_URL}/friends/status/${friendUsername}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 404) {
      return { status: "NONE", isSender: null };
    }
    throw new Error(
      data?.error || `Failed to check friend status (${res.status})`,
    );
  }

  const status = data.status as CheckFriendStatusResult["status"];
  const isSender = data.userId1 === currentUserId;
  return { status, isSender };
};

const handleAddFriend = async (friendUsername: string): Promise<void> => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}/friends/add`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ friendUsername }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Failed to send friend request.");
};

const handleFriendResponse = async (
  senderId: string,
  friendRequestResponse: boolean,
): Promise<void> => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}/friends/respond`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ senderId, friendRequestResponse }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok)
    throw new Error(data.error || "Failed to respond to friend request.");
};

const handleRemoveFriend = async (username: string): Promise<void> => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}/friends/remove`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ username }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Failed to remove friend.");
};

export {
  handleAddFriend,
  handleRemoveFriend,
  handleFriendResponse,
  checkFriendStatus,
};
