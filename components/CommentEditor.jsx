import { View, TextInput, TouchableOpacity, useWindowDimensions, Keyboard, Platform } from "react-native"
import ItchyText from "./ItchyText";
import { MaterialIcons } from "@expo/vector-icons"
import { useEffect, useRef, useState } from "react"
import { useTheme } from "../utils/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { useSharedValue, withTiming } from "react-native-reanimated";
import FastSquircleView from "react-native-fast-squircle";

export default function CommentEditor({ onSubmit, reply, onClearReply }) {
    const [content, setContent] = useState();
    const { width } = useWindowDimensions();
    const { colors, dimensions } = useTheme();
    const inputRef = useRef(null);
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const bottomAnim = useSharedValue(-3);
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
            bottomAnim.value = withTiming(-3);
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
        <FastSquircleView cornerSmoothing={0.6} style={{ borderTopLeftRadius: dimensions.largeRadius, borderTopRightRadius: dimensions.largeRadius, borderWidth: 0.1, borderTopWidth: 3, borderColor: colors.backgroundTertiary, backgroundColor: colors.backgroundSecondary, paddingTop: 5, width: "100%", outlineColor: colors.ripple, outlineWidth: dimensions.outlineWidth }}>
            {!!reply && <View style={{ paddingHorizontal: 15, paddingTop: 15, marginBottom: -3, zIndex: 1, flexDirection: "row", justifyContent: "flex-start", gap: 8, alignItems: "center" }}>
                <ItchyText style={{ color: colors.text, fontSize: 12, lineHeight: 12 }}>Replying to <ItchyText style={{ fontWeight: "bold" }}>{reply.author.username}</ItchyText></ItchyText>
                <TouchableOpacity onPress={onClearReply} style={{ marginTop: -2 }}>
                    <MaterialIcons name="cancel" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
            </View>}
            <View style={{
                paddingHorizontal: 15, flexDirection: "row", paddingBottom: insets.bottom, alignItems: "center"
            }}>
                <TextInput
                    placeholder="Add a comment..."
                    style={{
                        width: width - 66,
                        color: colors.text,
                        marginVertical: 16,
                        minHeight: 20,
                        maxHeight: 100,
                        textAlignVertical: 'top',
                        fontFamily: Platform.select({
                            android: 'Inter_400Regular',
                            ios: 'Inter-Regular',
                        }),
                        letterSpacing: -0.4,
                        paddingBottom: 20
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
        </FastSquircleView>
    </Animated.View>
};