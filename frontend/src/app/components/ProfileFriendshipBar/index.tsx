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

  const refreshFriendStatus = useCallback(async () => {
    if (!authUser) return;
    const updated = await checkFriendStatus(friendUsername, authUser.id);
    setFriendCheck(updated);
  }, [authUser, friendUsername]);

  useEffect(() => {
    refreshFriendStatus();
  }, [refreshFriendStatus]);

  useEffect(() => {
    if (!authUser) return;
    checkFriendStatus(friendUsername, authUser.id).then(setFriendCheck);
  }, [friendUsername, authUser])

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
        <Button onClick={onRemoveFriend}>Remove Friend</Button>
      )}

      {friendCheck.status === "NONE" && (
        <Button onClick={onSendFriendRequest} btnStyle="green">
          Send Friend Request
        </Button>
      )}
      {friendCheck.status === "PENDING" && friendCheck.isSender === true && (
        <Button btnStyle="green" disabled>
          Request Sent
        </Button>
      )}
      {friendCheck.status === "PENDING" &&
        friendCheck.isSender === false &&
        friendId && (
          <div className="border-2 border-gray-400 p-4 rounded-lg bg-gray-100">
            <p className="mb-2 font-bold">
              {friendUsername} wants to be your friend:
            </p>
            <div className="gap-2 flex">
              <Button
                onClick={() => onRespondToRequest(true)}
                btnStyle="primary"
              >
                Accept Friend Request
              </Button>
              <Button
                onClick={() => onRespondToRequest(false)}
                btnStyle="decline"
              >
                Decline Friend Request
              </Button>
            </div>
          </div>
        )}
    </>
  );
};

export default ProfileFriendshipBar;
