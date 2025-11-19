import {
  FlatList,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  View,
  Vibration,
} from "react-native";
import { useTheme } from "../../../utils/theme";
import { Stack } from "expo-router/stack";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import ScratchAPIWrapper from "../../../utils/api-wrapper";
import Comment from "../../../components/Comment";
import { useMMKVObject, useMMKVString } from "react-native-mmkv";
import CommentEditor from "../../../components/CommentEditor";
import uniqueArray from "../../../utils/uniqueArray";
import CommentOptionSheet from "../../../components/CommentOptionSheet";
import MutedDialog from "../../../components/MutedDialog";
import { getLiquidPlusPadding } from "../../../utils/platformUtils";

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

  const renderComment = useCallback(
    ({ item }) => {
      return (
        <Comment
          comment={item}
          selected={comment_id || undefined}
          onPress={setReply}
          onLongPress={openCommentOptions}
        />
      );
    },
    [rerenderComments, comments]
  );

  const endReached = useCallback(() => {
    if (loading || !hasScrolledToSelected) return;
    setPage(page + 1);
  }, [loading, page]);

  const refresh = useCallback(() => {
    setComments([]);
    setPage(1);
  }, []);

  const openCommentOptions = useCallback((comment) => {
    setCommentOptionsObj(comment);
    Vibration.vibrate(5);
  }, []);

  const postComment = (content) => {
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
      {comments.length > 0 && (
        <FlatList
          ref={scrollRef}
          contentContainerStyle={{
            padding: 10,
            paddingTop: getLiquidPlusPadding(10, 70),
            paddingBottom: 100,
          }}
          style={{ flex: 1 }}
          data={comments}
          renderItem={renderComment}
          keyExtractor={(item) => item.id}
          onEndReached={endReached}
          onEndReachedThreshold={1.2}
          // onRefresh={refresh}
          // refreshing={loading}
          onScrollToIndexFailed={({ index }) => {
            scrollRef.current?.scrollToOffset({
              offset: index * 1000,
              animated: true,
            });
            const wait = new Promise((resolve) => setTimeout(resolve, 500));
            wait.then(() => {
              scrollRef.current?.scrollToIndex({ index, animated: true });
            });
          }}
        // refreshControl={
        //   <RefreshControl
        //     refreshing={loading}
        //     tintColor={"white"}
        //     progressBackgroundColor={colors.accent}
        //     colors={isDark ? ["black"] : ["white"]}
        //   />
        // }
        />
      )}
      {!!user ? <CommentEditor
        onSubmit={postComment}
        reply={reply}
        onClearReply={() => setReply(undefined)}
      /> : <></>}
      <CommentOptionSheet
        comment={commentOptionsObj}
        setComment={setCommentOptionsObj}
        context={{ type: "user", owner: username }}
        onDeleteCommentID={afterDeleteComment}
      />
      <MutedDialog
        visible={showMutedDialog}
        muteExpiresAt={muteExpiresAt}
        onClose={() => setShowMutedDialog(false)}
      />
    </View>
  );
}
