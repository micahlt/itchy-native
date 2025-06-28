import { useTheme } from "../../../utils/theme";
import { Stack } from "expo-router/stack";
import { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import ScratchAPIWrapper from "../../../utils/api-wrapper";
import { SafeAreaView } from "react-native-safe-area-context";
import InfiniteScrollContentList from "../../../components/InfiniteScrollContentList";

export default function Projects() {
    const { id } = useLocalSearchParams();
    const { colors } = useTheme();
    const [projects, setProjects] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [offset, setOffset] = useState(0);
    useEffect(() => {
        refresh();
    }, [id]);

    const load = () => {
        if (isLoading) return;
        setIsLoading(true);
        ScratchAPIWrapper.studio.getProjects(id, offset).then((d) => {
            setProjects((prev) => [...prev, ...d]);
            setOffset((prev) => prev + d.length);
            setIsLoading(false);
        }).catch(console.error);
    }

    const refresh = () => {
        setProjects([]);
        setOffset(0);
        load();
    }

    return (
        <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: colors.background }}>
            <Stack.Screen
                options={{
                    title: "Projects in studio",
                }}
            />
            <InfiniteScrollContentList data={projects} itemType="projects" isLoading={isLoading} onRefresh={refresh} onEndReached={load} />
        </SafeAreaView>
    );
}