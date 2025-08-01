import { View, FlatList, RefreshControl, KeyboardAvoidingView, Platform } from "react-native";
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

export default function StudioComments() {
    const { id, comment_id } = useLocalSearchParams();
    const { colors, isDark } = useTheme();
    const [studio, setStudio] = useState(null);
    const [comments, setComments] = useState([]);
    const [offset, setOffset] = useState(0);
    const [loading, setLoading] = useState(true);
    const [hasScrolledToSelected, setHasScrolledToSelected] = useState(!!comment_id ? false : true);
    const scrollRef = useRef();
    const [csrf] = useMMKVString("csrfToken");
    const [user] = useMMKVObject("user");
    const [reply, setReply] = useState(undefined);
    const [commentContent, setCommentContent] = useState("");
    const [rerenderComments, setRerenderComments] = useState(true);
    const [commentOptionsObj, setCommentOptionsObj] = useState(undefined);

    useEffect(() => {
        if (!id) return;
        ScratchAPIWrapper.studio.getStudio(id).then(setStudio).catch(console.error);
    }, [id]);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        ScratchAPIWrapper.studio.getComments(id, offset).then((d) => {
            if (offset === 0) {
                setComments(d);
            } else {
                setComments((prev) => [...prev, ...d]);
            }
            setLoading(false);
        }).catch(console.error);
    }, [id, offset]);

    useEffect(() => {
        if (!comment_id || !!hasScrolledToSelected) return;
        const commentIndex = comments.findIndex(c => {
            if (c.id == comment_id) {
                return true;
            } else if (!!c?.replies && c?.replies?.length > 0) {
                return c.replies.findIndex(r => r.id == comment_id) !== -1;
            }
        });
        if (commentIndex === -1) {
            if (!loading) setOffset(comments.length);
        } else if (scrollRef?.current) {
            scrollRef.current.scrollToIndex({ index: commentIndex, animated: true });
            setHasScrolledToSelected(true);
        }
    }, [comments, comment_id])

    const postComment = (content) => {
        let authorID = null, parentID = null;
        console.log("Studio comment - Replying to:", reply);
        if (!!reply?.id) {
            // Find the top-level comment ID (similar to project comments)
            if (reply.parent_id) {
                // If reply has parent_id, use it (this would be for replies from API)
                parentID = reply.parent_id;
                console.log("Using reply.parent_id:", parentID);
            } else {
                // Check if this reply is nested under a top-level comment
                const topLevelComment = comments.find(c =>
                    c.id === reply.id || (c.replies && c.replies.some(r => r.id === reply.id))
                );
                parentID = topLevelComment?.id || reply.id;
                console.log("Found top-level comment:", topLevelComment?.id, "using parentID:", parentID);
            }
            authorID = reply.author.id;
        }
        console.log("Posting studio comment with parentID:", parentID, "commentee:", authorID);
        console.log("Comment content:", id, content, csrf, user.token, parentID, authorID);
        ScratchAPIWrapper.studio.postComment(id, content, csrf, user.token, parentID, authorID).then((postedID) => {
            console.log("Studio comment response:", postedID);
            setRerenderComments(!rerenderComments);
            if (!!postedID) {
                if (!!reply) {
                    setComments((prev) => prev.map(c => {
                        // If replying to a top-level comment, add to its replies
                        if (c.id === reply.id) {
                            const newReply = { author: { username: user.username, image: `https://cdn2.scratch.mit.edu/get_image/user/${user.id}_60x60.png`, id: user.id }, content, datetime_created: new Date(), id: postedID, parentID: c.id, includesReplies: true, replies: [] };
                            return { ...c, replies: [...c.replies, newReply] };
                        }
                        // If replying to a reply, find the top-level comment that contains this reply
                        else if (c.replies && c.replies.some(r => r.id === reply.id)) {
                            const newReply = { author: { username: user.username, image: `https://cdn2.scratch.mit.edu/get_image/user/${user.id}_60x60.png`, id: user.id }, content, datetime_created: new Date(), id: postedID, parentID: c.id, includesReplies: true, replies: [] };
                            return { ...c, replies: [...c.replies, newReply] };
                        }
                        return c;
                    }));
                    router.setParams({ comment_id: postedID });
                    setCommentContent("");
                    setReply(undefined);
                } else {
                    setComments((prev) => {
                        const c = [{ author: { username: user.username, image: `https://cdn2.scratch.mit.edu/get_image/user/${user.id}_60x60.png`, id: user.id }, content, datetime_created: new Date(), id: postedID, replies: [], includesReplies: true }, ...prev];
                        return uniqueArray(c);
                    });
                    router.setParams({ comment_id: postedID });
                    setCommentContent("");
                }
            } else {
                console.log("Studio comment posting failed, postedID:", postedID);
                alert("Comment failed to post. Please try again later.");
            }
        }).catch((error) => {
            console.error("Studio comment posting error:", error);
            alert("Comment failed to post. Please try again later.");
        });
    };

    const openCommentOptions = useCallback((comment) => {
        setCommentOptionsObj(comment);
    }, []);

    const afterDeleteComment = useCallback((obj) => {
        if (!obj) return;
        setComments((prev) => prev.map(c => {
            if (c.id === obj.id) {
                return null; // Remove the main comment
            }
            if (c.replies) {
                return {
                    ...c,
                    replies: c.replies.filter(r => r.id !== obj.id) // Remove the reply immutably
                };
            }
            return c;
        }).filter(Boolean)); // Filter out null values
    }, [comments]);

    const renderComment = useCallback(({ item }) => {
        return <Comment comment={item} selected={comment_id || undefined} onPress={setReply} onLongPress={openCommentOptions} />;
    }, [rerenderComments]);

    const endReached = useCallback(() => {
        if (loading || !hasScrolledToSelected) return;
        setOffset(comments.length);
    }, [loading, offset, hasScrolledToSelected]);

    const refresh = useCallback(() => {
        setComments([]);
        setOffset(0);
    }, []);


    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <Stack.Screen
                options={{
                    title: studio ? `Comments in ${studio.title}` : "Loading..."
                }}
            />
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
                {comments.length > 0 && (
                    <FlatList ref={scrollRef} contentContainerStyle={{ padding: 10, paddingBottom: 100 }} style={{ flex: 1 }} data={comments} renderItem={renderComment} keyExtractor={item => item.id} onEndReached={endReached} onEndReachedThreshold={1.2} onRefresh={refresh} refreshing={loading} onScrollToIndexFailed={({
                        index,
                    }) => {
                        scrollRef.current?.scrollToOffset({
                            offset: index * 1000,
                            animated: true,
                        });
                        const wait = new Promise((resolve) => setTimeout(resolve, 500));
                        wait.then(() => {
                            scrollRef.current?.scrollToIndex({ index, animated: true });
                        });
                    }} refreshControl={<RefreshControl refreshing={loading} tintColor={"white"} progressBackgroundColor={colors.accent} colors={isDark ? ["black"] : ["white"]} />} />
                )}
                <CommentEditor onSubmit={postComment} reply={reply} onClearReply={() => setReply(undefined)} />
                <CommentOptionSheet comment={commentOptionsObj} setComment={setCommentOptionsObj} context={{ type: "studio", studioID: id }} onDeleteCommentID={afterDeleteComment} />
            </KeyboardAvoidingView>
        </View>
    );
}