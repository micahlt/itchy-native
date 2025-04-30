import { View, FlatList, RefreshControl } from "react-native";
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

export default function ProjectComments() {
    const { id, comment_id } = useLocalSearchParams();
    const { colors, isDark } = useTheme();
    const [project, setProject] = useState(null);
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

    useEffect(() => {
        setLoading(true);
        ScratchAPIWrapper.project.getProject(id).then((p) => {
            setProject(p);
            ScratchAPIWrapper.project.getComments(id, p?.author?.username, 20, offset, true).then((d) => {
                if (offset === 0) {
                    setComments(d);
                } else {
                    setComments([...comments, ...d]);
                }
                setLoading(false);
            }).catch(console.error);
        }).catch(console.error);
    }, [offset]);

    useEffect(() => {
        if (!comment_id || !!hasScrolledToSelected) return;
        const commentID = comment_id.split("comments-")[1];
        const commentIndex = comments.findIndex(c => {
            if (c.id == commentID) {
                return true;
            } else if (c.replies?.length > 0) {
                return c.replies.findIndex(r => r.id == commentID) !== -1;
            }
        });
        if (commentIndex === -1) {
            if (!loading) setOffset(comments.length);
        } else if (scrollRef?.current) {
            scrollRef.current.scrollToIndex({ index: commentIndex, animated: true });
            setHasScrolledToSelected(true);
        }
    }, [comments])

    const postComment = (content) => {
        let authorID = null, parentID = null;
        if (!!reply?.id) {
            parentID = reply.id;
            authorID = reply.author.id;
        }
        ScratchAPIWrapper.project.postComment(id, content, csrf, user.token, parentID, authorID).then((postedID) => {
            setRerenderComments(!rerenderComments);
            if (!!postedID) {
                if (!!reply) {
                    setComments((prev) => prev.map(c => {
                        if (c.id === reply.id) {
                            c.replies.push({ author: { username: user.username, image: `https://cdn2.scratch.mit.edu/get_image/user/${user.id}_60x60.png`, id: user.id }, content, datetime_created: new Date(), id: postedID, parentID: reply.id, includesReplies: true, replies: [] });
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
                alert("Comment failed to post. Please try again later.");
            }
        }).catch(console.error);
    };

    const deleteComment = useCallback((obj) => {
        if (!obj) return;
        if (obj.author.id !== user.id) return;
        ScratchAPIWrapper.project.deleteComment(id, obj.id, csrf, user.token).then(() => {
            setComments((prev) => prev.filter(c => c.id !== obj.id));
        }).catch(console.error);
    }, []);

    const renderComment = useCallback(({ item }) => {
        return <Comment comment={item} selected={comment_id ? comment_id.split("comments-")[1] : undefined} onPress={setReply} onLongPress={deleteComment} />;
    }, [project, rerenderComments]);

    const endReached = useCallback(() => {
        if (loading) return;
        setOffset(comments.length);
    }, [loading, offset]);

    const refresh = useCallback(() => {
        setOffset(0);
    }, []);


    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <Stack.Screen
                options={{
                    title: project ? `Comments on ${project.title}` : "Loading..."
                }}
            />

            <FlatList ref={scrollRef} contentContainerStyle={{ padding: 10 }} style={{ flex: 1 }} data={comments} renderItem={renderComment} keyExtractor={(item) => item.id} onEndReached={endReached} onEndReachedThreshold={1.2} onRefresh={refresh} refreshing={loading} onScrollToIndexFailed={({
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
            <CommentEditor onSubmit={postComment} reply={reply} onClearReply={() => setReply(undefined)} />
        </View>
    );
}