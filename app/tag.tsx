import {
  TextInput,
  useWindowDimensions,
  RefreshControl,
  View,
} from "react-native";
import { useTheme } from "../utils/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import APIExplore from "../utils/api-wrapper/explore";
import ProjectCard from "../components/ProjectCard";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Stack,
  useFocusEffect,
  useLocalSearchParams,
  useNavigation,
} from "expo-router";
import { FlashList, FlashListRef } from "@shopify/flash-list";
import { useMMKVObject } from "react-native-mmkv";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Project } from "utils/api-wrapper/types/project";

export default function Tag() {
  const local = useLocalSearchParams();
  const { colors, isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [tag, setTag] = useState("");
  const [results, setResults] = useState<Project[]>([]);
  const scrollRef = useRef<FlashListRef<any>>(null);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [searchHistory, setSearchHistory] =
    useMMKVObject<string[]>("searchHistory");
  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribe = (navigation as any).addListener("tabPress", () => {
      setTag("");
      setResults([]);
    });

    return unsubscribe;
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      if (!!scrollRef?.current) {
        scrollRef.current?.scrollToOffset({ offset: 0, animated: false });
      }
      setTag(local.q as string);
      search(local.q as string);
    }, []),
  );

  const search = (searchQuery: string | null = null) => {
    // Only use searchQuery if it's a string, otherwise use current query state
    const queryToSearch = typeof searchQuery === "string" ? searchQuery : tag;
    if (!queryToSearch || !queryToSearch.trim()) return; // Don't search empty queries

    // Update the query state if a search query was provided (from history)
    if (typeof searchQuery === "string") {
      setTag(searchQuery);
    }

    setIsLoading(true);
    setResults([]);

    // Update search history - add new query and keep only last 5
    const currentHistory = searchHistory || [];
    const newHistory = [
      queryToSearch.trim(),
      ...currentHistory.filter((item: string) => item !== queryToSearch.trim()),
    ].slice(0, 5);
    setSearchHistory(newHistory);

    APIExplore.searchForProjects(queryToSearch).then((data) => {
      setResults(data);
      setIsLoading(false);
    });
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: "#" + tag,
        }}
      />
      <FlashList
        data={results}
        renderItem={({ item, index }) => renderProjectCard(item, width, index)}
        keyExtractor={(item) => item.id}
        numColumns={2}
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{
          marginHorizontal: 15,
          gap: 30,
          marginTop: -12,
          marginBottom: 0,
        }}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            tintColor={"white"}
            progressBackgroundColor={colors.accent}
            colors={isDark ? ["black"] : ["white"]}
            onRefresh={search}
          />
        }
      />
    </>
  );
}

function renderProjectCard(item: Project, width: number, index: number) {
  const content = (() => {
    return (
      <ProjectCard
        project={item}
        style={{ marginBottom: 5 }}
        width={(width - 40) / 2}
      />
    );
  })();

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
      {content}
    </Animated.View>
  );
}
