import { View, Text, FlatList, RefreshControl } from "react-native";
import { useTheme } from "../../../utils/theme";
import { Stack } from "expo-router/stack";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import ScratchAPIWrapper from "../../../utils/api-wrapper";
import Comment from "../../../components/Comment";

export default function UserComments() {
    const { username, comment_id } = useLocalSearchParams();
    const { colors, isDark } = useTheme();
    const [comments, setComments] = useState([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [hasScrolledToSelected, setHasScrolledToSelected] = useState(false);
    const scrollRef = useRef();

    useEffect(() => {
        if (!username) return;
        setLoading(true);
        ScratchAPIWrapper.user.getComments(username, page).then((d) => {
            if (page === 1) {
                setComments(d);
            } else {
                setComments([...comments, ...d]);
            }
            setLoading(false);
        }).catch(console.error);
    }, [username, page]);

    useEffect(() => {
        if (!comment_id || !!hasScrolledToSelected) return;
        const commentIndex = comments.findIndex(c => {
            if (c.id === comment_id) {
                return true;
            } else if (c.replies) {
                return c.replies.findIndex(r => r.id === comment_id) !== -1;
            }
        });
        if (commentIndex === -1) {
            if (!loading) setPage(page + 1);
        } else if (scrollRef?.current) {
            scrollRef.current.scrollToIndex({ index: commentIndex, animated: true });
            setHasScrolledToSelected(true);
        }
    }, [comments, comment_id])

    const renderComment = useCallback(({ item }) => {
        return <Comment comment={item} selected={comment_id || undefined} />
    }, []);

    const endReached = useCallback(() => {
        if (loading) return;
        setPage(page + 1);
    }, [loading, page]);

    const refresh = useCallback(() => {
        setPage(1);
    }, []);


    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <Stack.Screen
                options={{
                    title: `Comments for ${username}`
                }}
            />
            {comments.length > 0 && (
                <FlatList ref={scrollRef} contentContainerStyle={{ padding: 10 }} style={{ flex: 1 }} data={comments} renderItem={renderComment} keyExtractor={(item, i) => item.id + i} onEndReached={endReached} onRefresh={refresh} refreshing={loading} onScrollToIndexFailed={({
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
        </View>
    );
}