import { FlatList, RefreshControl, useWindowDimensions } from "react-native";
import { useTheme } from "../utils/theme";
import ProjectCard from "./ProjectCard";
import StudioCard from "./StudioCard";
import UserCard from "./UserCard";

export default function InfiniteScrollContentList({ data = [], itemType = "projects", isLoading = false, onRefresh = () => { }, onEndReached = () => { } }) {
    const { colors, isDark } = useTheme();
    const { width } = useWindowDimensions();

    return <FlatList
        data={data}
        renderItem={({ item }) => renderItem(item, width, itemType)}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 10 }}
        contentContainerStyle={{
            marginHorizontal: 20,
            gap: 10,
            paddingBottom: 100,
        }}
        style={{ flex: 1 }}
        refreshing={isLoading}
        refreshControl={
            <RefreshControl
                refreshing={isLoading}
                tintColor={"white"}
                progressBackgroundColor={colors.accent}
                colors={isDark ? ["black"] : ["white"]}
            />
        }
        onRefresh={onRefresh}
        onEndReached={onEndReached}
    />
}

function renderItem(item, width, type) {
    if (type === "projects") {
        return <ProjectCard project={item} width={(width - 50) / 2} />;
    }
    if (type === "studios") {
        return <StudioCard studio={item} width={(width - 50) / 2} />;
    }
    if (type === "users") {
        return <UserCard user={item} width={(width - 50) / 2} />;
    }
}