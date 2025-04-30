import { View, TextInput, TouchableOpacity, useWindowDimensions, Text, Keyboard, Animated, Platform } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import * as NavigationBar from 'expo-navigation-bar';
import { useEffect, useMemo, useRef, useState } from "react"
import { useTheme } from "../utils/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function CommentEditor({ onSubmit, reply, onClearReply }) {
    const [content, setContent] = useState();
    const { width } = useWindowDimensions();
    const { colors } = useTheme();
    const inputRef = useRef(null);
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const bottomAnim = useRef(new Animated.Value(0)).current;
    const insets = useSafeAreaInsets();

    useEffect(() => {
        const showSub = Keyboard.addListener('keyboardDidShow', (e) => {
            const height = e.endCoordinates.height;
            setKeyboardHeight(height);
            Animated.timing(bottomAnim, {
                toValue: height,
                duration: 250,
                useNativeDriver: false,
            }).start();
        });

        const hideSub = Keyboard.addListener('keyboardDidHide', () => {
            setKeyboardHeight(0);
            Animated.timing(bottomAnim, {
                toValue: 0,
                duration: 250,
                useNativeDriver: false,
            }).start();
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

    return <Animated.View style={{ position: 'fixed', bottom: Platform.OS === 'android' ? bottomAnim : 0 }}>
        {!!reply && <View style={{ paddingHorizontal: 15, paddingTop: 15, marginBottom: -3, zIndex: 1, backgroundColor: colors.backgroundTertiary, flexDirection: "row", justifyContent: "flex-start", gap: 8, alignItems: "center" }}>
            <Text style={{ color: colors.text, fontSize: 12, lineHeight: 12 }}>Replying to <Text style={{ fontWeight: "bold" }}>{reply.author.username}</Text></Text>
            <TouchableOpacity onPress={onClearReply} style={{ marginTop: -2 }}>
                <MaterialIcons name="cancel" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
        </View>}
        <View style={{ padding: 15, backgroundColor: colors.backgroundTertiary, flexDirection: "row", paddingBottom: insets.bottom + 15 }}>
            <TextInput placeholder="Add a comment..." style={{ width: width - 66, color: colors.text }} multiline={true} value={content} onChangeText={setContent} ref={inputRef} />
            <TouchableOpacity onPress={() => {
                onSubmit(content);
                setContent("");
            }} style={{ width: 24, flexGrow: 1, marginLeft: 10 }}>
                <MaterialIcons name="send" size={24} color={colors.accent} />
            </TouchableOpacity>
        </View>
    </Animated.View>
};