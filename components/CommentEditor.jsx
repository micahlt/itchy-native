import { View, TextInput, TouchableOpacity, useWindowDimensions, Keyboard, Platform } from "react-native"
import ItchyText from "./ItchyText";
import { MaterialIcons } from "@expo/vector-icons"
import { useEffect, useRef, useState } from "react"
import { useTheme } from "../utils/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { useSharedValue, withTiming } from "react-native-reanimated";

export default function CommentEditor({ onSubmit, reply, onClearReply }) {
    const [content, setContent] = useState();
    const { width } = useWindowDimensions();
    const { colors } = useTheme();
    const inputRef = useRef(null);
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const bottomAnim = useSharedValue(0);
    const insets = useSafeAreaInsets();

    useEffect(() => {
        const showSub = Keyboard.addListener('keyboardDidShow', (e) => {
            const height = e.endCoordinates.height;
            setKeyboardHeight(height);
            if (Platform.OS == "ios") {
                bottomAnim.value = withTiming(height - insets.bottom - 1)
            } else {
                bottomAnim.value = withTiming(height - (insets.bottom - 25))
            }
        });

        const hideSub = Keyboard.addListener('keyboardDidHide', () => {
            setKeyboardHeight(0);
            bottomAnim.value = withTiming(0);
        });

        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    useEffect(() => {
        if (!!reply && !!inputRef.current) {
            inputRef.current.focus();
        }
    }, [reply]);

    return <Animated.View style={{ position: 'absolute', bottom: bottomAnim }}>
        {!!reply && <View style={{ paddingHorizontal: 15, paddingTop: 15, marginBottom: -3, zIndex: 1, backgroundColor: colors.backgroundTertiary, flexDirection: "row", justifyContent: "flex-start", gap: 8, alignItems: "center" }}>
            <ItchyText style={{ color: colors.text, fontSize: 12, lineHeight: 12 }}>Replying to <ItchyText style={{ fontWeight: "bold" }}>{reply.author.username}</ItchyText></ItchyText>
            <TouchableOpacity onPress={onClearReply} style={{ marginTop: -2 }}>
                <MaterialIcons name="cancel" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
        </View>}
        <View style={{
            paddingHorizontal: 15, backgroundColor: colors.backgroundTertiary, flexDirection: "row", paddingBottom: insets.bottom, alignItems: "center"
        }}>
            <TextInput
                placeholder="Add a comment..."
                style={{
                    width: width - 66,
                    color: colors.text,
                    marginVertical: 16,
                    minHeight: 20,
                    maxHeight: 100,
                    textAlignVertical: 'top'
                }}
                multiline={true}
                value={content}
                onChangeText={setContent}
                ref={inputRef}
            />
            <TouchableOpacity onPress={() => {
                onSubmit(content);
                setContent("");
                inputRef.current?.blur();
            }} style={{ width: 24, flexGrow: 1, marginLeft: 10 }}>
                <MaterialIcons name="send" size={24} color={colors.accent} />
            </TouchableOpacity>
        </View>
    </Animated.View>
};