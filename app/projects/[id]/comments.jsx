import { View } from "react-native";
import { useTheme } from "../../../utils/theme";
import { Stack } from "expo-router/stack";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import ScratchAPIWrapper from "../../../utils/api-wrapper";
import { router } from "expo-router";
import uniqueArray from "../../../utils/uniqueArray";
import { useMMKVObject, useMMKVString } from "react-native-mmkv";
import CommentList from "../../../components/CommentList";

export default function ProjectComments() {
  const { id, comment_id } = useLocalSearchParams();
  const { colors, isDark } = useTheme();
  const [project, setProject] = useState(null);
  const [comments, setComments] = useState([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasScrolledToSelected, setHasScrolledToSelected] = useState(
    !!comment_id ? false : true
  );
  const scrollRef = useRef();
  const [csrf] = useMMKVString("csrfToken");
  const [user] = useMMKVObject("user");
  const [reply, setReply] = useState(undefined);
  const [rerenderComments, setRerenderComments] = useState(true);
  const [commentOptionsObj, setCommentOptionsObj] = useState(undefined);
  const [showMutedDialog, setShowMutedDialog] = useState(false);
  const [muteExpiresAt, setMuteExpiresAt] = useState(null);
  const [isPostingComment, setIsPostingComment] = useState(false);

  useEffect(() => {
    setLoading(true);
    ScratchAPIWrapper.project
      .getProject(id)
      .then((p) => {
        setProject(p);
        ScratchAPIWrapper.project
          .getComments(id, p?.author?.username, 20, offset, true)
          .then((d) => {
            if (offset === 0) {
              setComments(d);
            } else {
              setComments((prev) => uniqueArray([...prev, ...d]));
            }
            setLoading(false);
          })
          .catch(console.error);
      })
      .catch(console.error);
  }, [offset, id]);

  useEffect(() => {
    if (!comment_id || !!hasScrolledToSelected) return;
    const commentID = comment_id.split("comments-")[1];
    const commentIndex = comments.findIndex((c) => {
      if (c.id == commentID) {
        return true;
      } else if (c.replies?.length > 0) {
        return c.replies.findIndex((r) => r.id == commentID) !== -1;
      }
    });
    if (commentIndex === -1) {
      if (!loading) setOffset(comments.length);
    } else if (scrollRef?.current) {
      scrollRef.current.scrollToIndex({ index: commentIndex, animated: true });
      setHasScrolledToSelected(true);
    }
  }, [comments, comment_id]);

  const postComment = (content) => {
    if (isPostingComment) return;
    setIsPostingComment(true);
    let authorID = null,
      parentID = null;
    if (!!reply?.id) {
      // Find the top-level comment ID
      if (reply.parent_id) {
        // If reply has parent_id, use it (this would be for replies from API)
        parentID = reply.parent_id;
      } else {
        // Check if this reply is nested under a top-level comment
        const topLevelComment = comments.find(
          (c) =>
            c.id === reply.id ||
            (c.replies && c.replies.some((r) => r.id === reply.id))
        );
        parentID = topLevelComment?.id || reply.id;
      }
      authorID = reply.author.id;
    }
    ScratchAPIWrapper.project
      .postComment(id, content, csrf, user.token, parentID, authorID)
      .then((postedID) => {
        setRerenderComments(!rerenderComments);
        if (!!postedID) {
          if (!!reply) {
            setComments((prev) =>
              prev.map((c) => {
                // If replying to a top-level comment, add to its replies
                if (c.id === reply.id) {
                  const newReply = {
                    author: {
                      username: user.username,
                      image: `https://cdn2.scratch.mit.edu/get_image/user/${user.id}_60x60.png`,
                    },
                    content,
                    datetime_created: new Date(),
                    id: postedID,
                    parentID: c.id,
                    includesReplies: true,
                    replies: [],
                  };
                  return { ...c, replies: [...c.replies, newReply] };
                }
                // If replying to a reply, find the top-level comment that contains this reply
                else if (
                  c.replies &&
                  c.replies.some((r) => r.id === reply.id)
                ) {
                  const newReply = {
                    author: {
                      username: user.username,
                      image: `https://cdn2.scratch.mit.edu/get_image/user/${user.id}_60x60.png`,
                    },
                    content,
                    datetime_created: new Date(),
                    id: postedID,
                    parentID: c.id,
                    includesReplies: true,
                    replies: [],
                  };
                  return { ...c, replies: [...c.replies, newReply] };
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
                  id: postedID,
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

  const openCommentOptions = useCallback((comment) => {
    setCommentOptionsObj(comment);
    // Vibration is handled in CommentList
  }, []);

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

  const endReached = useCallback(() => {
    if (loading) return;
    setOffset(comments.length);
  }, [loading, offset]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen
        options={{
          title: project ? `Comments on ${project.title}` : "Loading...",
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
        commentOptionContext={{
          type: "project",
          owner: project?.author?.username,
          projectID: id,
        }}
        onDeleteComment={afterDeleteComment}
        showMutedDialog={showMutedDialog}
        setShowMutedDialog={setShowMutedDialog}
        muteExpiresAt={muteExpiresAt}
        selectedCommentId={comment_id ? comment_id.split("comments-")[1] : undefined}
        scrollRef={scrollRef}
      />
    </View>
  );
}
