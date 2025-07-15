import { Text, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { useTheme } from "../utils/theme";
import ProjectCard from "./ProjectCard";
import StudioCard from "./StudioCard";
import Pressable from "./Pressable";
import { MaterialIcons } from "@expo/vector-icons";

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
            <Text style={{ color: colors.text, fontSize: 20, fontWeight: "bold" }}>{title} {itemCount && <Text style={{ color: colors.textSecondary, fontWeight: "normal" }}>({itemCount == 100 ? "100+" : itemCount})</Text>}</Text>
            <View style={{ flex: 1 }} />
            {!!onShowMore && <View style={{ flexDirection: "row", alignItems: "center", borderColor: colors.textSecondary, borderWidth: 1, borderRadius: 16, overflow: "hidden", height: 30, opacity: 0.7 }}>
                <Pressable onPress={onShowMore} android_ripple={{ color: colors.ripple }} style={{ alignItems: 'center', flexDirection: 'row', gap: 4, height: 32, paddingVertical: 4, paddingHorizontal: 10, }}>
                    <Text style={{ color: colors.textSecondary, fontSize: 14 }}>More</Text>
                    <MaterialIcons name='arrow-forward' size={14} color={colors.textSecondary} />
                </Pressable>
            </View>}
        </View>
        <ScrollView
            horizontal
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled"
            scrollEnabled={!!data?.length}
            contentContainerStyle={{
                padding: 20, paddingTop: 10, paddingBottom: 10, columnGap: 10
            }}
            showsHorizontalScrollIndicator={false}
        >
            {itemType == "projects" && data?.map((item, index) => (<ProjectCard key={index} project={item} />))}
            {itemType == "studios" && data?.map((item, index) => (<StudioCard key={index} studio={item} />))}
        </ScrollView>
    </>
};