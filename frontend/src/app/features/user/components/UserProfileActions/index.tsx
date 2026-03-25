"use client";
import { useEffect, useState, useContext, useCallback } from "react";
import { useConfirm } from "../../../../hooks/useConfirm";
import Button from "../../../../shared/components/Button";
import ButtonRound from "../../../../shared/components/ButtonRound";
import {
  handleAddFriend,
  handleRemoveFriend,
  handleFriendResponse,
  checkFriendStatus,
} from "../../../../shared/utils/friendship";
import { AuthContext } from "../../../../shared/context/AuthProvider";
import { SocketContext } from "../../../../shared/context/SocketProvider";
import { FaUserPlus, FaCheck, FaTimes } from "react-icons/fa";
import { FaUserCheck, FaEnvelope } from "react-icons/fa6";

interface UserProfileActionsProps {
  friendUsername: string;
  friendId?: string;
  openDirectMessage: (friendId: string, friendUsername: string) => void;
}

const UserProfileActions = ({
  friendUsername,
  friendId,
  openDirectMessage,
}: UserProfileActionsProps) => {
  const [friendCheck, setFriendCheck] = useState<{
    status: string;
    isSender: boolean | null;
  } | null>(null);
  const { user: authUser } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);
  const confirm = useConfirm();

  const refreshFriendStatus = useCallback(async () => {
    if (!authUser || !friendUsername) return;
    try {
      const updated = await checkFriendStatus(friendUsername, authUser.id);
      setFriendCheck(updated);
    } catch (err) {
      console.error("Failed to refresh friend status:", err);
      setFriendCheck({ status: "NONE", isSender: null });
    }
  }, [authUser, friendUsername]);

  useEffect(() => {
    setFriendCheck(null);
  }, [friendUsername]);

  useEffect(() => {
    if (!socket || !authUser) return;

    const onFriendRequestUpdated = () => {
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

  // Immediately update UI when user takes an action
  // If the backend call fails, revert to previous state to prevent showing incorrect status
  const optimisticUpdate = async (
    newStatus: { status: string; isSender: boolean | null },
    action: () => Promise<void>,
  ) => {
    // Store previous state to revert in case of failure
    const previous = friendCheck;
    setFriendCheck(newStatus);
    try {
      await action();
    } catch {
      // Revert to previous state on failure
      setFriendCheck(previous);
    }
  };

  const onSendFriendRequest = () =>
    confirm({
      title: "Send Friend Request",
      message: `Are you sure you want to send a friend request to ${friendUsername}?`,
      confirmLabel: "Send",
    }).then((result) => {
      if (result) {
        optimisticUpdate({ status: "PENDING", isSender: true }, () =>
          handleAddFriend(friendUsername),
        );
      }
    });

  const onRemoveFriend = () =>
    confirm({
      title: "Remove Friend",
      message: `Are you sure you want to remove ${friendUsername} from your friends?`,
      confirmLabel: "Remove",
    }).then((result) => {
      if (result) {
        optimisticUpdate({ status: "NONE", isSender: null }, () =>
          handleRemoveFriend(friendUsername),
        );
      }
    });

  const onRespondToRequest = (accept: boolean) => {
    confirm({
      title: accept ? "Accept Friend Request" : "Decline Friend Request",
      message: `Are you sure you want to ${accept ? "accept" : "decline"} the friend request from ${friendUsername}?`,
      confirmLabel: accept ? "Accept" : "Decline",
    }).then((result) => {
      if (result) {
        if (!friendId || !authUser) return;
        optimisticUpdate(
          { status: accept ? "FRIENDS" : "NONE", isSender: null },
          () => handleFriendResponse(friendId, accept),
        );
      }
    });
  };

  const onMessageUser = () => {
    if (friendId) {
      openDirectMessage(friendId, friendUsername);
    }
  };

  console.log("Friend check status:", friendCheck);

  if (!friendCheck) return null;

  // TODO: Add error handling for better UX, currently it just won't show any buttons until the check is done. Consider using a library like react-query for better data fetching management.
  // TODO: Reduce code duplication by creating a reusable FriendRequestCard component for the pending request UI, since it has similar structure for both sent and received requests.
  return (
    <>
      {friendCheck.status === "FRIENDS" && (
        <ButtonRound onClick={onRemoveFriend} title="Remove friend">
          <span className="flex items-center gap-3">
            <FaUserCheck size={20} />
          </span>
        </ButtonRound>
      )}

      {friendCheck.status === "NONE" && (
        <ButtonRound onClick={onSendFriendRequest} title="Send friend request">
          <span className="flex items-center gap-3">
            <FaUserPlus size={20}/>
          </span>
        </ButtonRound>
      )}
      {friendCheck.status === "PENDING" && friendCheck.isSender === true && (
        <ButtonRound disabled title="Friend request sent">
          <span className="flex items-center gap-3">
            <FaUserPlus size={20}/>
          </span>
        </ButtonRound>
      )}
      {/* Show accept/decline buttons if the current user is the recipient of the friend request */}
      {friendCheck.status === "PENDING" &&
        friendCheck.isSender === false &&
        friendId && (
          <div>
            <p className="text-sm text-gray-400 mb-2">
              {friendUsername} wants to be your friend
            </p>
            <div className="gap-2 flex">
              <Button onClick={() => onRespondToRequest(false)} btnStyle="gray">
                <span className="flex items-center gap-3">
                  <FaTimes /> Decline
                </span>
              </Button>
              <Button
                onClick={() => onRespondToRequest(true)}
                btnStyle="primary"
              >
                <span className="flex items-center gap-3">
                  <FaCheck /> Accept
                </span>
              </Button>
            </div>
          </div>
        )}
        <ButtonRound onClick={onMessageUser} title="Send message">
          <span className="flex items-center gap-3">
            <FaEnvelope size={20} />
          </span>
        </ButtonRound>
    </>
  );
};

export default UserProfileActions;
