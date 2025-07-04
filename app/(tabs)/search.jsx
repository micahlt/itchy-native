import {
  View,
  FlatList,
  TextInput,
  useWindowDimensions,
  RefreshControl,
} from "react-native";
import { useTheme } from "../../utils/theme";
import { SafeAreaView } from "react-native-safe-area-context";
import APIExplore from "../../utils/api-wrapper/explore";
import ProjectCard from "../../components/ProjectCard";
import { useEffect, useRef, useState } from "react";
import Chip from "../../components/Chip";
import StudioCard from "../../components/StudioCard";
import { useFocusEffect } from "expo-router";
import searchForUser from "../../utils/searchForUser";
import UserCard from "../../components/UserCard";

export default function Search() {
  const { colors, isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [type, setType] = useState("projects");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const searchBarRef = useRef(null);
  const { width } = useWindowDimensions();

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
      style={{ flex: 1, backgroundColor: colors.background }}
    >
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
          icon="smart-display"
          text="Projects"
          color={colors.accent}
          mode={type == "projects" && "filled"}
          onPress={() => setType("projects")}
        />
        <Chip.Icon
          icon="collections"
          text="Studios"
          color={colors.accent}
          mode={type == "studios" && "filled"}
          onPress={() => setType("studios")}
        />
        <Chip.Icon
          icon="person"
          text="Users"
          color={colors.accent}
          mode={type == "users" && "filled"}
          onPress={() => setType("users")}
        />
      </View>
      <FlatList
        data={results}
        renderItem={({ item }) => renderItem(item, width, type)}
        stickyHeaderIndices={[0]}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 10 }}
        contentContainerStyle={{
          marginHorizontal: 20,
          gap: 10,
          paddingBottom: 100,
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
        ListHeaderComponent={
          <>
            <View
              style={{
                backgroundColor: colors.background,
                zIndex: 0,
                height: 40,
              }}
            ></View>
            <View
              style={{
                backgroundColor: colors.backgroundSecondary,
                paddingVertical: 15,
                paddingLeft: 15,
                paddingRight: 9,
                marginBottom: 5,
                borderRadius: 10,
                marginTop: -30,
                zIndex: 1,
                elevation: 3,
                shadowColor: "#000",
                shadowOffset: {
                    width: 0,
                    height: 2,
                  },
                shadowOpacity: 0.2,
                shadowRadius: 3,
              }}
            >
              <TextInput
                ref={searchBarRef}
                placeholder="Search"
                inputMode="search"
                enterKeyHint="search"
                style={{
                  backgroundColor: "transparent",
                  color: colors.text,
                  fontSize: 18,
                  width: "100%",
                  
                }}
                placeholderTextColor={colors.textSecondary}
                inlineImageLeft={isDark ? "search_24_white" : "search_24_black"}
                inlineImagePadding={28}
                onSubmitEditing={search}
                clearButtonMode="always"
                onChangeText={(t) => setQuery(t)}
              />
            </View>
          </>
        }
      />
    </SafeAreaView>
  );
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
