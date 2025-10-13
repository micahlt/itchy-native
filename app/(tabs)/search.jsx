import {
  View,
  TextInput,
  useWindowDimensions,
  RefreshControl,
  Platform,
} from "react-native";
import { useTheme } from "../../utils/theme";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import APIExplore from "../../utils/api-wrapper/explore";
import ProjectCard from "../../components/ProjectCard";
import { useEffect, useRef, useState } from "react";
import Chip from "../../components/Chip";
import StudioCard from "../../components/StudioCard";
import { useFocusEffect } from "expo-router";
import searchForUser from "../../utils/searchForUser";
import UserCard from "../../components/UserCard";
import { FlashList } from "@shopify/flash-list";
import FastSquircleView from "react-native-fast-squircle";
import Animated from "react-native-reanimated";
import ItchyText from "../../components/ItchyText";
import { Ionicons } from "@expo/vector-icons";
import { opacity } from "react-native-redash";

export default function Search() {
  const { colors, dimensions, isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [type, setType] = useState("projects");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const searchBarRef = useRef(null);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const AniamtedSquircleView =
    Animated.createAnimatedComponent(FastSquircleView);

  useFocusEffect(() => {
    if (searchBarRef.current) {
      searchBarRef.current.focus();
    }
  });

  const search = () => {
    setIsLoading(true);
    setResults([]);
    switch (type) {
      case "projects":
        APIExplore.searchForProjects(query).then((data) => {
          setResults(data);
          setIsLoading(false);
        });
        break;
      case "studios":
        APIExplore.searchForStudios(query).then((data) => {
          setResults(data);
          setIsLoading(false);
        });
        break;
      case "users":
        searchForUser(query).then((data) => {
          setResults(data);
          setIsLoading(false);
        });
        break;
    }
  };

  useEffect(() => {
    search();
  }, [type]);

  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: colors.accentTransparent }}
    >
      <TextInput
        ref={searchBarRef}
        placeholder="Find projects, users..."
        inputMode="search"
        enterKeyHint="search"
        style={{
          backgroundColor: "transparent",
          color: colors.text,
          fontSize: 18,
          fontFamily: Platform.select({
            android: "Inter_400Regular",
            ios: "Inter-Regular",
          }),
          letterSpacing: -0.4,
          fontSize: 22,
          marginHorizontal: 24,
          marginTop: 10,
          marginBottom: 2,
        }}
        placeholderTextColor={colors.textSecondary}
        onSubmitEditing={search}
        clearButtonMode="always"
        onChangeText={(t) => setQuery(t)}
      />
      <View
        style={{
          flexDirection: "row",
          gap: 5,
          marginTop: 10,
          marginBottom: 5,
          marginHorizontal: 20,
        }}
      >
        <Chip.Icon
          icon="play"
          text="Projects"
          color={type == "projects" ? colors.accent : colors.textSecondary}
          mode={type == "projects" && "filled"}
          onPress={() => setType("projects")}
        />
        <Chip.Icon
          icon="albums"
          text="Studios"
          color={type == "studios" ? colors.accent : colors.textSecondary}
          mode={type == "studios" && "filled"}
          onPress={() => setType("studios")}
        />
        <Chip.Icon
          icon="person"
          text="Users"
          color={type == "users" ? colors.accent : colors.textSecondary}
          mode={type == "users" && "filled"}
          onPress={() => setType("users")}
        />
      </View>
      <FastSquircleView
        cornerSmoothing={0.6}
        style={{
          backgroundColor: colors.background,
          marginTop: 8,
          paddingTop: 4,
          marginHorizontal: 1.5,
          paddingBottom: Platform.OS == "ios" ? 60 : 0,
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
          outlineColor: colors.outlineCard,
          outlineStyle: "solid",
          outlineWidth: dimensions.outlineWidth,
          borderTopColor: colors.highlight,
          flex: 1,
          overflow: "visible",
          boxShadow:
            "0px -2px 16px rgba(0,94,185,0.15), 0px 6px 8px 0px #ffffff15 inset, 0px 3px 0px 0px #FFFFFF11 inset",
        }}
      >
        <FastSquircleView
          style={{
            flex: 1,
            overflow: "hidden",
            borderTopLeftRadius: dimensions.largeRadius,
            borderTopRightRadius: dimensions.largeRadius,
            marginTop: -4,
          }}
        >
          <FlashList
            data={results}
            renderItem={({ item }) => renderItem(item, width, type)}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={{ gap: 10 }}
            contentContainerStyle={{
              marginHorizontal: 15,
              paddingTop: 0,
              gap: 30,
              marginTop: -12,
              paddingBottom: 100,
              borderRadius: 32,
              overflow: "hidden",
            }}
            refreshing={isLoading}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                tintColor={"white"}
                progressBackgroundColor={colors.accent}
                colors={isDark ? ["black"] : ["white"]}
              />
            }
            onRefresh={search}
            ListEmptyComponent={
              <View
                style={{
                  alignItems: "center",
                  flex: 1,
                  justifyContent: "center",
                }}
              >
                <Ionicons
                  name="search-circle"
                  size={128}
                  color={colors.backgroundTertiary}
                />
                <ItchyText
                  style={{
                    textAlign: "center",
                    fontWeight: "bold",
                    color: colors.textSecondary,
                    opacity: 0.6,
                  }}
                >
                  Search for something to get started
                </ItchyText>
              </View>
            }
          />
        </FastSquircleView>
      </FastSquircleView>
    </SafeAreaView>
  );
}

function renderItem(item, width, type) {
  if (type === "projects") {
    return (
      <ProjectCard
        project={item}
        style={{ marginBottom: 5 }}
        width={(width - 40) / 2}
      />
    );
  }
  if (type === "studios") {
    return (
      <StudioCard
        studio={item}
        style={{ marginBottom: 5 }}
        width={(width - 40) / 2}
      />
    );
  }
  if (type === "users") {
    return (
      <UserCard
        user={item}
        style={{ marginBottom: 5 }}
        width={(width - 40) / 2}
      />
    );
  }
}
