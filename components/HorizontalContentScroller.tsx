import { View, ViewStyle } from "react-native";
import ItchyText from "./ItchyText";
import Reanimated from "react-native-reanimated";
import { useTheme } from "../utils/theme";
import ProjectCard from "./ProjectCard";
import StudioCard from "./StudioCard";
import { Ionicons } from "@expo/vector-icons";
import TexturedButton from "./TexturedButton";
import { memo } from "react";
import Animated, { FadeInRight } from "react-native-reanimated";
import { Project } from "../utils/api-wrapper/types/project";
import { Studio } from "../utils/api-wrapper/types/studio";
import { FlatList } from "react-native-gesture-handler";

type RegularHorizontalContentScrollerProps = {
  data: Project[] | Studio[];
  itemType?: "projects" | "studios";
  iconName?: string;
  headerStyle?: ViewStyle;
  title?: string;
  onShowMore?: () => any;
  itemCount?: number | null;
};

type ItemRendererProps = {
  itemType: "projects" | "studios";
  item: Project | Studio;
  index: number;
};

const ItemRenderer = memo(function ItemRenderer({
  itemType,
  item,
  index,
}: ItemRendererProps) {
  let content = null;
  if (itemType == "projects") {
    content = <ProjectCard project={item} />;
  } else if (itemType == "studios") {
    //  @ts-ignore
    content = <StudioCard studio={item} />;
  }

  if (!content) return null;

  return (
    <Animated.View
      entering={FadeInRight.delay(index * 50).springify()}
      style={{ marginRight: 10 }}
    >
      {content}
    </Animated.View>
  );
});

export default memo(function HorizontalContentScroller({
  data,
  itemType = "projects",
  iconName,
  headerStyle = {},
  title = "Projects",
  onShowMore,
  itemCount = null,
}: RegularHorizontalContentScrollerProps) {
  const { colors } = useTheme();
  return (
    <>
      <View
        pointerEvents="box-none"
        style={{
          flexDirection: "row",
          alignItems: "center",
          padding: 20,
          paddingBottom: 0,
          paddingTop: 0,
          gap: 10,
          ...headerStyle,
        }}
      >
        {iconName ? (
          <Ionicons name={iconName as any} size={24} color={colors.text} />
        ) : null}
        <ItchyText
          style={{ color: colors.text, fontSize: 20, fontWeight: "bold" }}
        >
          {title}{" "}
          {itemCount && (
            <ItchyText
              style={{ color: colors.textSecondary, fontWeight: "normal" }}
            >
              ({itemCount == 100 ? "100+" : itemCount})
            </ItchyText>
          )}
        </ItchyText>
        <View style={{ flex: 1 }} />
        {!!onShowMore && (
          <TexturedButton onPress={onShowMore} icon="arrow-forward">
            More
          </TexturedButton>
        )}
      </View>
      <FlatList
        horizontal
        nestedScrollEnabled={true}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={!!data?.length}
        contentContainerStyle={{
          padding: 20,
          paddingTop: 10,
          paddingBottom: 15,
        }}
        showsHorizontalScrollIndicator={false}
        data={data as any[]}
        keyExtractor={(item, index) =>
          item.id ? String(item.id) : String(index)
        }
        renderItem={({ item, index }) => (
          <ItemRenderer itemType={itemType} item={item} index={index} />
        )}
        initialNumToRender={3}
        windowSize={3}
        maxToRenderPerBatch={3}
        removeClippedSubviews={true}
      />
    </>
  );
});
