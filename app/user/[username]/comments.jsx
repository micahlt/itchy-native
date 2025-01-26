import { View, Text, FlatList, RefreshControl } from "react-native";
import { useTheme } from "../../../utils/theme";
import { Stack } from "expo-router/stack";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import ScratchAPIWrapper from "../../../utils/api-wrapper";
import Comment from "../../../components/Comment";

export default function User() {
    const { username } = useLocalSearchParams();
    const { colors, isDark } = useTheme();
    const [comments, setComments] = useState([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);

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

    const renderComment = useCallback(({ item }) => {
        return <Comment comment={item} />
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
                <FlatList contentContainerStyle={{ padding: 10 }} style={{ flex: 1 }} data={comments} renderItem={renderComment} keyExtractor={(item, i) => item.id + i} onEndReached={endReached} onRefresh={refresh} refreshing={loading} refreshControl={<RefreshControl refreshing={loading} tintColor={"white"} progressBackgroundColor={colors.accent} colors={isDark ? ["black"] : ["white"]} />} />
            )}
        </View>
    );
}