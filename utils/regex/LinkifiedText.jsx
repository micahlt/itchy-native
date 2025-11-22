import { router } from "expo-router";
import ItchyText from "../../components/ItchyText";
import { useTheme } from "../theme";
import { useMemo, memo } from "react";
const username = /(@[\d_\-a-zA-Z]+)/;
const project = /https*:\/\/scratch.mit.edu\/projects\/(\d*) *\/*/
const studio = /https*:\/\/scratch.mit.edu\/studios\/(\d*) *\/*/
const existingLink = /<a href=".+">(.+)<\/a>/g;
const emoji = /<img src="(.+)".*>/g;
const globalRegex = /(https*:\/\/scratch.mit.edu\/(?:(?:projects)|(?:studios)|(?:users))\/[\d_\-A-Za-z]+)\/*|(@[\d_\-a-zA-Z]+)/g;

const emojis = {
    meow: "😺",
    gobo: "👾",
    waffle: "🧇",
    taco: "🌮",
    sushi: "🍣",
    apple: "🍎",
    broccoli: "🥦",
    pizza: "🍕",
    candycorn: "🍬",
    "10mil": "🎉",
    map: "🗺️",
    camera: "📷",
    suitcase: "🧳",
    compass: "🧭",
    binoculars: "🔭",
    cupcake: "🧁",
    "cat": "🐱",
    "aww-cat": "😺",
    "cool-cat": "😎",
    "tongue-out-cat": "😛",
    "wink-cat": "😜",
    "lol-cat": "😹",
    "upside-down-cat": "🤣",
    "huh-cat": "😼",
    "love-it-cat": "😻",
    "fav-it-cat": "🙀",
    "rainbow-cat": "😽",
    "pizza-cat": "😺🍕",
    "pride": "🏳️‍🌈",
    "blm": "✊🏿",
}

export default memo(function LinkifiedText({ text, ...props }) {
    const { colors } = useTheme();

    const textParts = useMemo(() => {
        if (!text) return [];
        const comment = text.replaceAll(existingLink, "$1").replace(/ +(?= )/g, '').replaceAll(emoji, (match, p1) => {
            const emojiName = p1.split("/images/emoji/").pop().split(".")[0];
            return emojis[emojiName] || match;
        });
        const splitLinked = comment.split(globalRegex);
        return splitLinked.filter((part) => !!part);
    }, [text]);

    return (
        <ItchyText {...props}>
            {textParts.map((part, index) => {
                if (part.match(username)) {
                    return <ItchyText style={{ ...props.style, color: colors.accent }} onPress={() => router.push(`/users/${part.split('@')[1]}`)} key={index}>{part}</ItchyText>
                } else if (part.match(project)) {
                    const projectID = part.match(project)[1];
                    return <ItchyText style={{ ...props.style, color: colors.accent }} onPress={() => router.push(`/projects/${projectID}`)} key={index}>project:{projectID}</ItchyText>
                } else if (part.match(studio)) {
                    const studioID = part.match(studio)[1];
                    return <ItchyText style={{ ...props.style, color: colors.accent }} onPress={() => router.push(`/studios/${studioID}`)} key={index}>studio:{studioID}</ItchyText>;
                }
                return <ItchyText key={index}>{part}</ItchyText>
            })}
        </ItchyText>
    );
});