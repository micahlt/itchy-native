import { View, Text, FlatList, RefreshControl } from "react-native";
import { useTheme } from "../../../utils/theme";
import { Stack } from "expo-router/stack";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import ScratchAPIWrapper from "../../../utils/api-wrapper";
import Comment from "../../../components/Comment";

export default function ProjectComments() {
    const { id, comment_id } = useLocalSearchParams();
    const { colors, isDark } = useTheme();
    const [project, setProject] = useState(null);
    const [comments, setComments] = useState([]);
    const [offset, setOffset] = useState(0);
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef();

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
        console.log("Comments updating")
        if (!comment_id) {
            console.log("No comment id")
            return;
        }
        const commentIndex = comments.findIndex(c => {
            if (c.id === comment_id) {
                return true;
            } else if (c.replies) {
                console.log(c.replies[0]?.id);
                console.log(comment_id);
                return c.replies.findIndex(r => r.id === comment_id) !== -1;
            }
        });
        if (commentIndex === -1) {
            console.log("Comment not found")
            if (!loading) {
                console.log("Not currently loading")
                setOffset(comments.length);
            }
        } else if (scrollRef?.current) {
            scrollRef.current.scrollToIndex({ index: commentIndex, animated: true });
        }
    }, [comments])

    const renderComment = useCallback(({ item }) => {
        return <Comment comment={item} parentMetadata={{
            author: project?.author?.username,
            project: project?.id
        }} selected={comment_id.split("comments-")[1]} />
    }, [project]);

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

            <FlatList contentContainerStyle={{ padding: 10 }} style={{ flex: 1 }} data={comments} renderItem={renderComment} keyExtractor={(item, i) => item.id + Math.random()} onEndReached={endReached} onRefresh={refresh} refreshing={loading} onScrollToIndexFailed={({
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

        </View>
    );
}