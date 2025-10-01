import { View } from "react-native";
import ItchyText from "./ItchyText";
import { FlatList } from "react-native-gesture-handler";
import { useTheme } from "../utils/theme";
import ProjectCard from "./ProjectCard";
import StudioCard from "./StudioCard";
import Pressable from "./Pressable";
import { MaterialIcons } from "@expo/vector-icons";
import TexturedButton from "./TexturedButton";

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
                paddingTop: 5,
                gap: 10,
                ...headerStyle
            }}>
            {iconName ? <MaterialIcons name={iconName} size={24} color={colors.text} /> : null}
            <ItchyText style={{ color: colors.text, fontSize: 20, fontWeight: "bold" }}>{title} {itemCount && <ItchyText style={{ color: colors.textSecondary, fontWeight: "normal" }}>({itemCount == 100 ? "100+" : itemCount})</ItchyText>}</ItchyText>
            <View style={{ flex: 1 }} />
            {!!onShowMore && <TexturedButton onPress={onShowMore}>More</TexturedButton>}
        </View>
        <FlatList
            horizontal
            data={data}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item, index }) => {
                if (itemType == "projects") {
                    return <ProjectCard project={item} />;
                }
                if (itemType == "studios") {
                    return <StudioCard studio={item} />;
                }
                return null;
            }}
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled"
            scrollEnabled={!!data?.length}
            contentContainerStyle={{
                padding: 20, paddingTop: 10, paddingBottom: 10
            }}
            ItemSeparatorComponent={() => <View style={{ width: 10 }} />}
            showsHorizontalScrollIndicator={false}
        />
    </>
};