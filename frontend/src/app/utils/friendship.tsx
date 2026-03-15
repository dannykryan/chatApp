// Check backend to see if user is already a friend or has pending request
const checkFriendStatus = async (friendUsername: string, currentUserId: string) => {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch(
      `http://localhost:4000/api/friends/status/${friendUsername}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    const data = await res.json();
    if (res.ok) {
      const isSender = data.senderId === currentUserId; // true if current user sent the request, false if received
      return { status: data.status, isSender }; // "FRIEND", "PENDING", "DECLINED", or "NONE"
    } else {
      console.error(data.error || "Failed to check friend status.");
      return { status: "NONE", isSender: null };
    }
  } catch (err) {
    console.error(
      "Network error: " +
        (err instanceof Error ? err.message : "Unknown error"),
    );
    return { status: "NONE", isSender: null };
  }
};

// Send friend request to backend
const handleAddFriend = async (friendUsername: string) => {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:4000/api/friends/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ friendUsername }),
    });
    const data = await res.json();
    if (res.ok) {
      alert("Friend request sent!");
    } else {
      alert(data.error || "Failed to send friend request.");
    }
  } catch (err) {
    alert(
      "Network error: " +
        (err instanceof Error ? err.message : "Unknown error"),
    );
  }
};

// Send request to backend to accept or decline friend request
const handleFriendResponse = async (
  senderId: string,
  friendRequestResponse: boolean,
) => {
  console.log(
    `Responding to friend request from ${senderId}: ${friendRequestResponse ? "Accept" : "Decline"}`
  );

  try {
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:4000/api/friends/respond", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ senderId, friendRequestResponse }),
    });

    const data = await res.json();
    if (res.ok) {
      alert(friendRequestResponse ? "Friend request accepted!" : "Friend request declined.");
    } else {
      alert(data.error || "Failed to respond to friend request.");
    }
  } catch (err) {
    alert("Network error: " + (err instanceof Error ? err.message : "Unknown error"));
  }
};

// Send request to backend to remove friend
const handleRemoveFriend = async (friendUsername: string) => {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:4000/api/friends/remove", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ friendUsername }),
    });
    const data = await res.json();
    if (res.ok) {
      alert("Friend removed.");
    } else {      
      alert(data.error || "Failed to remove friend.");
    }
  } catch (err) {
    alert(
      "Network error: " +
        (err instanceof Error ? err.message : "Unknown error"),
    );
  }
};

export { handleAddFriend, handleRemoveFriend, handleFriendResponse, checkFriendStatus };
