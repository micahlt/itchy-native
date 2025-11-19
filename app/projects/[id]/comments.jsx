import {
  View,
  FlatList,
  RefreshControl,
  Platform,
  KeyboardAvoidingView,
  Vibration,
} from "react-native";
import { useTheme } from "../../../utils/theme";
import { Stack } from "expo-router/stack";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import ScratchAPIWrapper from "../../../utils/api-wrapper";
import Comment from "../../../components/Comment";
import { router } from "expo-router";
import CommentEditor from "../../../components/CommentEditor";
import uniqueArray from "../../../utils/uniqueArray";
import { useMMKVObject, useMMKVString } from "react-native-mmkv";
import CommentOptionSheet from "../../../components/CommentOptionSheet";
import MutedDialog from "../../../components/MutedDialog";
import { getLiquidPlusPadding } from "../../../utils/platformUtils";

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
      });
  };

  const openCommentOptions = useCallback((comment) => {
    setCommentOptionsObj(comment);
    Vibration.vibrate(5);
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

  const renderComment = useCallback(
    ({ item }) => {
      return (
        <Comment
          comment={item}
          selected={comment_id ? comment_id.split("comments-")[1] : undefined}
          onPress={setReply}
          onLongPress={openCommentOptions}
        />
      );
    },
    [comments, rerenderComments]
  );

  const endReached = useCallback(() => {
    if (loading) return;
    setOffset(comments.length);
  }, [loading, offset]);

  const refresh = useCallback(() => {
    setComments([]);
    setOffset(0);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen
        options={{
          title: project ? `Comments on ${project.title}` : "Loading...",
        }}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
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
        {!!user ?
          <CommentEditor
            onSubmit={postComment}
            reply={reply}
            onClearReply={() => setReply(undefined)}
          /> : <></>
        }
        <CommentOptionSheet
          comment={commentOptionsObj}
          setComment={setCommentOptionsObj}
          context={{
            type: "project",
            owner: project?.author?.username,
            projectID: id,
          }}
          onDeleteCommentID={afterDeleteComment}
        />
        <MutedDialog
          visible={showMutedDialog}
          muteExpiresAt={muteExpiresAt}
          onClose={() => setShowMutedDialog(false)}
        />
      </KeyboardAvoidingView>
    </View>
  );
}
