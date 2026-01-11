import { View } from "react-native";
import { useTheme } from "../../../utils/theme";
import { Stack } from "expo-router/stack";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import ScratchAPIWrapper from "../../../utils/api-wrapper";
import { useMMKVObject, useMMKVString } from "react-native-mmkv";
import uniqueArray from "../../../utils/uniqueArray";
import CommentList from "../../../components/CommentList";

export default function UserComments() {
  const { username, comment_id } = useLocalSearchParams();
  const { colors, isDark } = useTheme();
  const [comments, setComments] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasScrolledToSelected, setHasScrolledToSelected] = useState(
    !!comment_id ? false : true
  );
  const scrollRef = useRef();
  const [user] = useMMKVObject("user");
  const [csrf] = useMMKVString("csrfToken");
  const [reply, setReply] = useState(undefined);
  const [rerenderComments, setRerenderComments] = useState(true);
  const [commentOptionsObj, setCommentOptionsObj] = useState(undefined);
  const [showMutedDialog, setShowMutedDialog] = useState(false);
  const [muteExpiresAt, setMuteExpiresAt] = useState(null);
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [areCommentsEnabled, setAreCommentsEnabled] = useState(true);

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    ScratchAPIWrapper.user
      .getComments(username, page)
      .then((d) => {
        if (page === 1) {
          setComments(d);
        } else {
          setComments((prev) => uniqueArray([...prev, ...d]));
        }
        setLoading(false);
      })
      .catch(console.error);
    ScratchAPIWrapper.user.areCommentsOpen(username).then((open) => {
      setAreCommentsEnabled(open);
    })
  }, [username, page]);

  useEffect(() => {
    if (!comment_id || !!hasScrolledToSelected) return;
    const commentIndex = comments.findIndex((c) => {
      if (c.id == comment_id) {
        return true;
      } else if (c.replies) {
        return c.replies.findIndex((r) => r.id == comment_id) !== -1;
      }
    });
    if (commentIndex === -1) {
      if (!loading) setPage(page + 1);
    } else if (scrollRef?.current) {
      scrollRef.current.scrollToIndex({ index: commentIndex, animated: true });
      setHasScrolledToSelected(true);
    }
  }, [comments, comment_id]);

  const endReached = useCallback(() => {
    if (loading || !hasScrolledToSelected) return;
    setPage(page + 1);
  }, [loading, page]);

  const refresh = useCallback(() => {
    setComments([]);
    setPage(1);
  }, []);

  const postComment = (content) => {
    if (isPostingComment) return;
    setIsPostingComment(true);
    let parentID = null;
    if (!!reply?.id) {
      // For user comments, replies have a parentID field
      if (reply.parentID) {
        // This is a reply to a reply, use the parentID (top-level comment ID)
        parentID = reply.parentID.includes("comments-")
          ? reply.parentID.split("comments-")[1]
          : reply.parentID;
      } else {
        // This is a reply to a top-level comment, use the comment's ID
        parentID = reply.id.includes("comments-")
          ? reply.id.split("comments-")[1]
          : reply.id;
      }
    }
    ScratchAPIWrapper.user
      .postComment(username, content, csrf, parentID, reply?.author?.id)
      .then((postedID) => {
        setRerenderComments(!rerenderComments);
        if (!!postedID) {
          if (!!reply) {
            setComments((prev) =>
              prev.map((c) => {
                // If replying to a top-level comment, add to its replies
                if (c.id === reply.id) {
                  return {
                    ...c,
                    replies: [
                      ...c.replies,
                      {
                        author: {
                          username: user.username,
                          image: `https://cdn2.scratch.mit.edu/get_image/user/${user.id}_60x60.png`,
                        },
                        content,
                        datetime_created: new Date(),
                        id: `comments-${postedID}`,
                        parentID: c.id,
                        includesReplies: true,
                        replies: [],
                      },
                    ],
                  };
                }
                // If replying to a reply, find the top-level comment that contains this reply
                else if (
                  c.replies &&
                  c.replies.some((r) => r.id === reply.id)
                ) {
                  return {
                    ...c,
                    replies: [
                      ...c.replies,
                      {
                        author: {
                          username: user.username,
                          image: `https://cdn2.scratch.mit.edu/get_image/user/${user.id}_60x60.png`,
                        },
                        content,
                        datetime_created: new Date(),
                        id: `comments-${postedID}`,
                        parentID: c.id,
                        includesReplies: true,
                        replies: [],
                      },
                    ],
                  };
                }
                return c;
              })
            );
            router.setParams({ comment_id: `comments-${postedID}` });
            setReply(undefined);
          } else {
            setComments((prev) => {
              const c = [
                {
                  author: {
                    username: user.username,
                    image: `https://cdn2.scratch.mit.edu/get_image/user/${user.id}_60x60.png`,
                  },
                  content,
                  datetime_created: new Date(),
                  id: `comments-${postedID}`,
                  replies: [],
                  includesReplies: true,
                },
                ...prev,
              ];
              return uniqueArray(c);
            });
            router.setParams({ comment_id: `comments-${postedID}` });
          }
        } else {
          alert("Comment failed to post. Please try again later.");
        }
      })
      .catch((error) => {
        console.error(error);
        // Check if the error is a mute error
        try {
          const errorMessage = error.message || error.toString();
          const errorData = JSON.parse(errorMessage);
          if (errorData.rejected === "isMuted" && errorData.status?.mute_status?.muteExpiresAt) {
            setMuteExpiresAt(errorData.status.mute_status.muteExpiresAt);
            setShowMutedDialog(true);
          } else {
            const rejectionReason = errorData.rejected ? ` (${errorData.rejected})` : '';
            alert(`Comment failed to post. Please try again later.${rejectionReason}`);
          }
        } catch (parseError) {
          alert("Comment failed to post. Please try again later.");
        }
      })
      .finally(() => {
        setIsPostingComment(false);
      });
  };

  const afterDeleteComment = useCallback(
    (obj) => {
      if (!obj) return;
      setComments((prev) =>
        prev
          .map((c) => {
            if (c.id === obj.id) {
              return null; // Remove the main comment
            }
            if (c.replies) {
              return {
                ...c,
                replies: c.replies.filter((r) => r.id !== obj.id), // Remove the reply immutably
              };
            }
            return c;
          })
          .filter(Boolean)
      ); // Filter out null values
    },
    [comments]
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen
        options={{
          title: `Comments for ${username}`,
        }}
      />
      <CommentList
        comments={comments}
        loading={loading}
        onEndReached={endReached}
        user={user}
        reply={reply}
        setReply={setReply}
        isPostingComment={isPostingComment}
        onPostComment={postComment}
        commentOptionsObj={commentOptionsObj}
        setCommentOptionsObj={setCommentOptionsObj}
        commentOptionContext={{ type: "user", owner: username }}
        onDeleteComment={afterDeleteComment}
        showMutedDialog={showMutedDialog}
        setShowMutedDialog={setShowMutedDialog}
        muteExpiresAt={muteExpiresAt}
        selectedCommentId={comment_id || undefined}
        scrollRef={scrollRef}
        commentsOpen={areCommentsEnabled}
      />
    </View>
  );
}
