import { Image } from "expo-image";
import Card from "./Card";
import { View } from "react-native";
import ItchyText from "./ItchyText";
import { useEffect, useState } from "react";
import APIProject from "../utils/api-wrapper/project";
import { useTheme } from "../utils/theme";
import { router } from "expo-router";

export default function RemixNotice({ originalProjectID }) {
    const { colors, isDark, dimensions } = useTheme();
    const [originalProject, setOriginalProject] = useState(null);
    useEffect(() => {
        if (!originalProjectID) return;
        APIProject.getProject(originalProjectID).then((d) => {
            if (d.code == "NotFound") return;
            setOriginalProject(d);
        }).catch(console.error);
    })


    if (!originalProject) return null;
    return <Card style={{ marginHorizontal: 20, marginBottom: 10, backgroundColor: isDark ? "#04361b" : "#cfeedd", alignItems: "center", borderRadius: dimensions.mediumRadius }} pressableStyle={{ width: "100%" }} onPress={() => router.push(`/projects/${originalProjectID}`)}>
        <View style={{ padding: 8, width: "100%", flexDirection: "row", flex: 0 }}>
            <Image placeholder={require("../assets/project.png")} placeholderContentFit="cover" source={{ uri: `https://cdn2.scratch.mit.edu/get_image/project/${originalProjectID}_480x360.png` }} style={{ height: 70, aspectRatio: "4 / 3", borderRadius: dimensions.smallRadius }} />
            <View style={{ marginLeft: 14, flex: 1 }}>
                <ItchyText style={{ fontSize: 14, color: isDark ? "#6affad" : "#043319", fontWeight: "bold", marginBottom: 5, marginTop: 5 }}>This project is a remix of</ItchyText>
                <ItchyText style={{ fontSize: 18, color: colors.text, fontWeight: "bold", lineHeight: 18 }} numberOfLines={1}>{originalProject.title}</ItchyText>
                <ItchyText style={{ color: colors.text, fontWeight: "bold", fontSize: 12, opacity: 0.5, lineHeight: 14 }}><ItchyText style={{ fontWeight: "normal" }}>by </ItchyText>{originalProject.author.username}</ItchyText>
            </View>
        </View>
    </Card>
}