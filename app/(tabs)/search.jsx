import { FlatList, TextInput, useWindowDimensions } from "react-native";
import { useTheme } from "../../utils/theme";
import { SafeAreaView } from "react-native-safe-area-context";
import APIExplore from "../../utils/api-wrapper/explore";
import ProjectCard from "../../components/ProjectCard";
import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";

export default function Search() {
    const { colors, isDark } = useTheme();
    const [shouldHide, setShouldHide] = useState(false);
    const [projects, setProjects] = useState([]);
    const { width } = useWindowDimensions();

    const search = (e) => {
        const query = e.nativeEvent.text;
        APIExplore.searchForProjects(query).then((data) => {
            setProjects(data);
        });
    }

    if (!shouldHide) {
        return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} >
            <FlatList data={projects} renderItem={({ item }) => <ProjectCard project={item} width={(width / 2) - 20} />} stickyHeaderIndices={[0]} keyExtractor={(item) => item.id} numColumns={2} columnWrapperStyle={{ gap: 10 }} contentContainerStyle={{ paddingHorizontal: 15, gap: 10 }} ListHeaderComponent={<TextInput placeholder="Search" inputMode="search" enterKeyHint="search" style={{
                backgroundColor: colors.backgroundSecondary, color: colors.text, padding: 15, marginBottom: 5, marginTop: 10,
                fontSize: 18, borderRadius: 10
            }} placeholderTextColor={colors.textSecondary} inlineImageLeft={isDark ? "search_24_white" : "search_24_black"} inlineImagePadding={28} onSubmitEditing={search} clearButtonMode="always" />} />
        </SafeAreaView>
    }
}