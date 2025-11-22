import { View } from "react-native";
import ItchyText from "./ItchyText";
import { FlatList } from "react-native-gesture-handler";
import { useTheme } from "../utils/theme";
import ProjectCard from "./ProjectCard";
import StudioCard from "./StudioCard";
import { Ionicons } from "@expo/vector-icons";
import TexturedButton from "./TexturedButton";
import Animated, { FadeInRight } from "react-native-reanimated";

export default function HorizontalContentScroller({ data, itemType = "projects", iconName, headerStyle = {}, title = "Projects", onShowMore = null, itemCount = null }) {
    const { colors } = useTheme();
    return <>
        <View
            pointerEvents="box-none"
            style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 20,
                paddingBottom: 0,
                paddingTop: 0,
                gap: 10,
                ...headerStyle
            }}>
            {iconName ? <Ionicons name={iconName} size={24} color={colors.text} /> : null}
            <ItchyText style={{ color: colors.text, fontSize: 20, fontWeight: "bold" }}>{title} {itemCount && <ItchyText style={{ color: colors.textSecondary, fontWeight: "normal" }}>({itemCount == 100 ? "100+" : itemCount})</ItchyText>}</ItchyText>
            <View style={{ flex: 1 }} />
            {!!onShowMore && <TexturedButton onPress={onShowMore} icon="arrow-forward">More</TexturedButton>}
        </View>
        <FlatList
            horizontal
            data={data}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item, index }) => {
                let content = null;
                if (itemType == "projects") {
                    content = <ProjectCard project={item} />;
                } else if (itemType == "studios") {
                    content = <StudioCard studio={item} />;
                }

                if (!content) return null;

                return (
                    <Animated.View entering={FadeInRight.delay(index * 50).springify()}>
                        {content}
                    </Animated.View>
                );
            }}
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled"
            scrollEnabled={!!data?.length}
            contentContainerStyle={{
                padding: 20, paddingTop: 10, paddingBottom: 15
            }}
            ItemSeparatorComponent={() => <View style={{ width: 10 }} />}
            showsHorizontalScrollIndicator={false}
            removeClippedSubviews={false}
        />
    </>
};