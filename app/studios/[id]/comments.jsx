import { View, FlatList, RefreshControl } from "react-native";
import { useTheme } from "../../../utils/theme";
import { Stack } from "expo-router/stack";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import ScratchAPIWrapper from "../../../utils/api-wrapper";
import Comment from "../../../components/Comment";

export default function StudioComments() {
    const { id, comment_id } = useLocalSearchParams();
    const { colors, isDark } = useTheme();
    const [studio, setStudio] = useState(null);
    const [comments, setComments] = useState([]);
    const [offset, setOffset] = useState(0);
    const [loading, setLoading] = useState(true);
    const [hasScrolledToSelected, setHasScrolledToSelected] = useState(false);
    const scrollRef = useRef();

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
                setComments([...comments, ...d]);
            }
            setLoading(false);
        }).catch(console.error);
    }, [id, offset]);

    useEffect(() => {
        if (!comment_id || !!hasScrolledToSelected) return;
        const commentIndex = comments.findIndex(c => {
            if (c.id == comment_id) {
                return true;
            } else if (c.replies?.length > 0) {
                return c.replies.findIndex(r => r.id == comment_id) !== -1;
            }
        });
        if (commentIndex === -1) {
            if (!loading) setOffset(comments.length - 1);
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
        setOffset(comments.length - 1);
    }, [loading, offset]);

    const refresh = useCallback(() => {
        setOffset(1);
    }, []);


    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <Stack.Screen
                options={{
                    title: studio ? `Comments in ${studio.title}` : "Loading..."
                }}
            />
            {comments.length > 0 && (
                <FlatList ref={scrollRef} contentContainerStyle={{ padding: 10 }} style={{ flex: 1 }} data={comments} renderItem={renderComment} keyExtractor={item => item.id} onEndReached={endReached} onRefresh={refresh} refreshing={loading} onScrollToIndexFailed={({
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