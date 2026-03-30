import { FlatList, RefreshControl, useWindowDimensions } from "react-native";
import { useTheme } from "../utils/theme";
import ProjectCard from "./ProjectCard";
import StudioCard from "./StudioCard";
import UserCard from "./UserCard";
import { getLiquidPlusPadding } from "../utils/platformUtils";
import { useIsTablet } from "utils/hooks/useIsTablet";
import { useMemo } from "react";

export default function InfiniteScrollContentList({
  data = [],
  itemType = "projects",
  isLoading = false,
  onRefresh = () => {},
  onEndReached = () => {},
  disablePTR = false,
}) {
  const { colors, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const isTablet = useIsTablet();

  const itemWidth = useMemo(() => {
    if (isTablet) {
      return width / 2;
    } else {
      return width;
    }
  }, [isTablet, width]);

  return (
    <FlatList
      data={data}
      renderItem={({ item }) => renderItem(item, itemWidth, itemType)}
      keyExtractor={(item) => item.id}
      numColumns={isTablet ? 4 : 2}
      columnWrapperStyle={{ gap: isTablet ? 18 : 10 }}
      contentContainerStyle={{
        marginHorizontal: 20,
        gap: 10,
        paddingTop: disablePTR ? getLiquidPlusPadding() : 0,
        paddingBottom: 100,
      }}
      style={{ flex: 1 }}
      // refreshing={isLoading}
      // refreshControl={
      //     <RefreshControl
      //         refreshing={isLoading}
      //         tintColor={"white"}
      //         progressBackgroundColor={colors.accent}
      //         colors={isDark ? ["black"] : ["white"]}
      //     />
      // }
      // onRefresh={onRefresh}
      {...(!disablePTR && {
        refreshing: isLoading,
        refreshControl: (
          <RefreshControl
            refreshing={isLoading}
            tintColor={"white"}
            progressBackgroundColor={colors.accent}
            colors={isDark ? ["black"] : ["white"]}
            onRefresh={onRefresh}
          />
        ),
      })}
      onEndReached={onEndReached}
    />
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
