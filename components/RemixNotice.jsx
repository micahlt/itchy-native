import { Image } from "expo-image";
import Card from "./Card";
import { View, Text } from "react-native";
import { useEffect, useMemo, useState } from "react";
import APIProject from "../utils/api-wrapper/project";
import { useTheme } from "../utils/theme";
import { router } from "expo-router";

export default function RemixNotice({ originalProjectID }) {
    const { colors, isDark } = useTheme();
    const [originalProject, setOriginalProject] = useState(null);
    useEffect(() => {
        if (!originalProjectID) return;
        APIProject.getProject(originalProjectID).then((d) => {
            if (d.code == "NotFound") return;
            setOriginalProject(d);
        }).catch(console.error);
    })


    if (!originalProject) return null;
    return <Card style={{ margin: 10, padding: 8, flexDirection: "row", backgroundColor: isDark ? "#04361b" : "#cfeedd", alignItems: "center" }} onPress={() => router.push(`/projects/${originalProjectID}`)}>
        <Image placeholder={require("../assets/project.png")} placeholderContentFit="cover" source={{ uri: `https://cdn2.scratch.mit.edu/get_image/project/${originalProjectID}_480x360.png` }} style={{ height: 70, aspectRatio: "4 / 3", borderRadius: 8 }} />
        <View style={{ marginLeft: 14 }}>
            <Text style={{ fontSize: 14, color: isDark ? "#6affad" : "#043319", fontWeight: "bold", marginBottom: 8, lineHeight: 14 }}>This project is a remix of</Text>
            <Text style={{ fontSize: 18, color: colors.text, fontWeight: "bold", lineHeight: 18 }}>{originalProject.title}</Text>
            <Text style={{ color: colors.text, fontWeight: "bold", fontSize: 12, opacity: 0.5, lineHeight: 14 }}><Text style={{ fontWeight: "normal" }}>by </Text>{originalProject.author.username}</Text>
        </View>
    </Card>
}