import { View, Text, FlatList } from "react-native";
import { useTheme } from "../../../utils/theme";
import { Stack } from "expo-router/stack";
import { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import ScratchAPIWrapper from "../../../utils/api-wrapper";
import Comment from "../../../components/Comment";

export default function User() {
    const { username } = useLocalSearchParams();
    const { colors } = useTheme();
    const [comments, setComments] = useState([]);
    useEffect(() => {
        ScratchAPIWrapper.user.getComments(username, 1).then((d) => {
            setComments(d);
        }).catch(console.error)
    }, [username]);

    const renderComment = ({ item }) => {
        return <Comment comment={item} />
    }

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <Stack.Screen
                options={{
                    title: `Comments for ${username}`
                }}
            />
            {comments.length > 0 && (
                <FlatList contentContainerStyle={{ padding: 10 }} style={{ flex: 1 }} data={comments} renderItem={renderComment} keyExtractor={(item, i) => item.id + i} />
            )}
        </View>
    );
}