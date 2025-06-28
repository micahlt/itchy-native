import { useTheme } from "../../../utils/theme";
import { Stack } from "expo-router/stack";
import { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import ScratchAPIWrapper from "../../../utils/api-wrapper";
import { SafeAreaView } from "react-native-safe-area-context";
import InfiniteScrollContentList from "../../../components/InfiniteScrollContentList";

export default function Favorites() {
    const { username } = useLocalSearchParams();
    const { colors } = useTheme();
    const [favorites, setFavorites] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [offset, setOffset] = useState(0);
    useEffect(() => {
        refresh();
    }, [username]);

    const load = () => {
        if (isLoading) return;
        setIsLoading(true);
        ScratchAPIWrapper.user.getFavorites(username, offset).then((d) => {
            setFavorites((prev) => [...prev, ...d]);
            setOffset((prev) => prev + d.length);
            setIsLoading(false);
        }).catch(console.error);
    }

    const refresh = () => {
        setFavorites([]);
        setOffset(0);
        load();
    }

    return (
        <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: colors.background }}>
            <Stack.Screen
                options={{
                    title: `${username}'s Favorites`,
                }}
            />
            <InfiniteScrollContentList data={favorites} itemType="projects" isLoading={isLoading} onRefresh={refresh} onEndReached={load} />
        </SafeAreaView>
    );
}