import { View, TextInput, TouchableOpacity, useWindowDimensions, Keyboard, Platform, ActivityIndicator } from "react-native"
import ItchyText from "./ItchyText";
import { MaterialIcons } from "@expo/vector-icons"
import { useCallback, useEffect, useRef, useState } from "react"
import { useTheme } from "../utils/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { useSharedValue, withTiming } from "react-native-reanimated";
import SquircleView from "../components/SquircleView";
import { useFocusEffect } from "expo-router";

export default function CommentEditor({ onSubmit, reply, onClearReply, loading, commentsOpen = true }) {
    const [content, setContent] = useState();
    const { width } = useWindowDimensions();
    const { colors, dimensions } = useTheme();
    const inputRef = useRef(null);
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const insets = useSafeAreaInsets();
    const bottomAnim = useSharedValue(Platform.OS === 'android' ? 0 : -3);
    const [isMounted, setIsMounted] = useState(false);

    useFocusEffect(
        useCallback(() => {
            if (Platform.OS === 'android') {
                bottomAnim.value = -3;
            }
        }, [])
    );

    useEffect(() => {
        const showSub = Keyboard.addListener('keyboardDidShow', (e) => {
            const height = e.endCoordinates.height;
            setKeyboardHeight(height);
            if (Platform.OS == "ios") {
                bottomAnim.value = withTiming(height + 5)
            } else {
                bottomAnim.value = withTiming(height + 10)
            }
        });

        const hideSub = Keyboard.addListener('keyboardDidHide', () => {
            setKeyboardHeight(0);
            if (Platform.OS === 'android') {
                bottomAnim.value = withTiming(0);
            } else {
                bottomAnim.value = withTiming(0);
            }
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

    const onPressSubmit = () => {
        if (loading) return;
        if (!content?.trim()) return;

        onSubmit(content.trim());
        setContent("");
        inputRef.current?.blur();
    };

    return <Animated.View style={{ position: 'absolute', bottom: bottomAnim, paddingBottom: insets.bottom }}>
        <SquircleView cornerSmoothing={0.6} style={{
            borderRadius: dimensions.largeRadius, backgroundColor: colors.backgroundSecondary, paddingTop: 5, width: width - 15, marginLeft: 7.5,
            boxShadow:
                "0px -2px 16px rgba(0,94,185,0.15),0px 40px 25px rgba(0,0,0,0.5), 0px 4px 5px 0px #ffffff15 inset, 0px 3px 0px 0px #FFFFFF11 inset",
        }}>
            {!!reply && <View style={{ paddingHorizontal: 15, paddingTop: 15, marginBottom: 0, zIndex: 1, flexDirection: "row", justifyContent: "flex-start", gap: 8, alignItems: "center" }}>
                <ItchyText style={{ color: colors.text, fontSize: 12, lineHeight: 14 }}>Replying to <ItchyText style={{ fontWeight: "bold" }}>{reply.author.username}</ItchyText></ItchyText>
                <TouchableOpacity onPress={onClearReply} style={{ marginTop: -2 }}>
                    <MaterialIcons name="cancel" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
            </View>}
            <View style={{
                paddingHorizontal: 15, flexDirection: "row", alignItems: "center"
            }}>
                <TextInput
                    placeholder={commentsOpen ? "Add a comment..." : "Comments are disabled."}
                    style={{
                        width: width - 80,
                        color: colors.text,
                        marginBottom: 5,
                        minHeight: 20,
                        maxHeight: 100,
                        textAlignVertical: 'top',
                        fontFamily: Platform.select({
                            android: 'Inter_400Regular',
                            ios: 'Inter-Regular',
                        }),
                        letterSpacing: -0.4,
                        borderColor: 'transparent',
                        borderWidth: 1
                    }}
                    multiline={true}
                    value={content}
                    onChangeText={setContent}
                    ref={inputRef}
                    readOnly={!commentsOpen}
                />
                <TouchableOpacity onPress={onPressSubmit} disabled={loading || !commentsOpen} style={{ width: 24, flexGrow: 1, marginLeft: 10, marginRight: 20, marginBottom: 8, opacity: loading ? 0.5 : 1 }}>
                    {loading ?
                        <ActivityIndicator color={colors.accent} />
                        : <MaterialIcons name="send" size={24} color={commentsOpen ? colors.accent : colors.outline} />
                    }
                </TouchableOpacity>
            </View>
        </SquircleView>
    </Animated.View>
};