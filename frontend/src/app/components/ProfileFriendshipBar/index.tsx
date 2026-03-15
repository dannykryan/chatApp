"use client";
import { useEffect, useState, useContext, useCallback } from "react";
import Button from "../Button";
import {
  handleAddFriend,
  handleRemoveFriend,
  handleFriendResponse,
  checkFriendStatus,
} from "../../utils/friendship";
import { AuthContext } from "../AuthProvider";
import { SocketContext } from "../SocketContext";
import { FaUserPlus, FaCheck, FaTimes } from "react-icons/fa";
import { FaUserXmark } from "react-icons/fa6";

interface ProfileFriendshipBarProps {
  friendUsername: string;
  friendId?: string;
}

const ProfileFriendshipBar = ({
  friendUsername,
  friendId,
}: ProfileFriendshipBarProps) => {
  const [friendCheck, setFriendCheck] = useState<{
    status: string;
    isSender: boolean | null;
  } | null>(null);
  const { user: authUser } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);

  const refreshFriendStatus = useCallback(async () => {
    if (!authUser) return;
    const updated = await checkFriendStatus(friendUsername, authUser.id);
    setFriendCheck(updated);
  }, [authUser, friendUsername]);

  useEffect(() => {
    if (!socket || !authUser) return;

    const onFriendRequestUpdated = () => {
      // only affected users receive this, so just refresh
      refreshFriendStatus();
    };

    socket.on("friendRequestUpdated", onFriendRequestUpdated);
    return () => {
      socket.off("friendRequestUpdated", onFriendRequestUpdated);
    };
  }, [socket, authUser, refreshFriendStatus]);

  useEffect(() => {
    refreshFriendStatus();
  }, [refreshFriendStatus]);

  useEffect(() => {
    if (!authUser) return;
    checkFriendStatus(friendUsername, authUser.id).then(setFriendCheck);
  }, [friendUsername, authUser]);

  const onSendFriendRequest = async () => {
    await handleAddFriend(friendUsername);
    await refreshFriendStatus();
  };

  const onRemoveFriend = async () => {
    await handleRemoveFriend(friendUsername);
    await refreshFriendStatus();
  };

  const onRespondToRequest = async (accept: boolean) => {
    if (!friendId || !authUser) return;
    await handleFriendResponse(friendId, accept);
    const updated = await checkFriendStatus(friendUsername, authUser.id);
    setFriendCheck(updated);
  };

  if (!friendCheck) return null;

  // TODO: Add error handling and loading states for better UX, currently it just won't show any buttons until the check is done. Also consider using a library like react-query for better data fetching management.
  // TODO: Add real-time updates using WebSockets so that if the other user accepts/declines the request, the UI updates immediately without needing a refresh. This would involve emitting events from the backend when friend requests are accepted/declined and listening for those events in this component to update the state accordingly.
  // TODO: Add confirmation modals for actions like removing a friend or accepting/declining requests to prevent accidental clicks.
  // TODO: Reduce code duplication by creating a reusable FriendRequestCard component for the pending request UI, since it has similar structure for both sent and received requests.
  return (
    <>
      {friendCheck.status === "ACCEPTED" && (
        <Button onClick={onRemoveFriend}>
          <span className="flex items-center gap-3">
            <FaUserXmark /> Remove Friend
          </span>
        </Button>
      )}

      {friendCheck.status === "NONE" && (
        <Button onClick={onSendFriendRequest} btnStyle="green">
          <FaUserPlus /> Send Friend Request
        </Button>
      )}
      {friendCheck.status === "PENDING" && friendCheck.isSender === true && (
        <Button btnStyle="green" disabled>
          Friend Request Sent
        </Button>
      )}
      {friendCheck.status === "PENDING" &&
        friendCheck.isSender === false &&
        friendId && (
          <div className="gap-2 flex">
            <Button onClick={() => onRespondToRequest(true)} btnStyle="primary">
              <span className="flex items-center gap-3">
                <FaCheck /> Accept Friend Request
              </span>
            </Button>
            <Button
              onClick={() => onRespondToRequest(false)}
              btnStyle="decline"
            >
              <span className="flex items-center gap-3">
                <FaTimes /> Decline Friend Request
              </span>
            </Button>
          </div>
        )}
    </>
  );
};

export default ProfileFriendshipBar;
