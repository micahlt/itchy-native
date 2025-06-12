import React, { useEffect, useState } from 'react';
import Stack from 'expo-router/stack';
import { ThemeProvider } from '../utils/theme';
import { Platform, useColorScheme, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { darkColors, lightColors } from '../utils/theme/colors';
import { useMMKVObject, useMMKVString } from 'react-native-mmkv';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import APIAuth from '../utils/api-wrapper/auth';
import storage from '../utils/storage';

export default function App() {
    const theme = useColorScheme();
    const [colors, setColors] = useState(null);
    const [twConfig, setTWConfig] = useMMKVObject("twConfig");
    const [user, setUser] = useMMKVObject("user");
    const [cookieSet, setCookieSet] = useMMKVString("cookieSet");
    useEffect(() => {
        setColors(theme === "dark" ? darkColors : lightColors);
        if (!twConfig) {
            setTWConfig({});
        }
    }, [theme]);
    useEffect(() => {
        if (!!user) {
            APIAuth.getSession(cookieSet).then((d) => {
                if (!!d?.sessionToken && !!d?.csrfToken && !!d?.sessionJSON && !!d?.sessionJSON?.user) {
                    storage.set("sessionID", d.sessionToken)
                    storage.set("csrfToken", d.csrfToken);
                    storage.set("cookieSet", d.cookieSet);
                    storage.set("token", d.sessionJSON.user.token);
                    setUser(d.sessionJSON.user);
                }
            }).catch((e) => {
                console.error("Error getting session data: ", e);
                storage.delete("sessionID");
                storage.delete("csrfToken");
                storage.delete("cookieSet");
                storage.delete("token");
                storage.delete("user");
                setUser(null);
            });
        }
    }, [])
    Image.clearDiskCache();

    if (!!colors) {
        return (
            <ThemeProvider>
                <GestureHandlerRootView>
                    <View style={{ backgroundColor: colors.background, flex: 1 }}>
                        <Stack screenOptions={{
                            contentStyle: {
                                backgroundColor: colors.background,
                                color: colors.text
                            },
                            headerShown: true,
                            headerBackButtonDisplayMode: "default",
                            headerStyle: {
                                backgroundColor: colors.background,
                            },
                            headerTitleStyle: {
                                color: colors.text,
                                fontWeight: "bold",
                            },
                            headerTintColor: colors.text,
                            headerLeft: () => Platform.OS === "ios" ? <></> : <View style={{ width: 4 }}></View>
                        }} >
                            <Stack.Screen name="(tabs)" options={{ headerShown: false, animation: "default" }} />
                            <Stack.Screen name="projects/[id]/index" options={{
                                presentation: "modal",
                                animation: "fade_from_bottom",
                                headerRight: () =>
                                    <MaterialIcons name='question-answer' size={24} color={colors.textSecondary} />
                            }} />
                            <Stack.Screen name="projects/[id]/comments" options={{
                                presentation: "modal",
                                animation: "fade_from_bottom"
                            }} />
                            <Stack.Screen name="studios/[id]/index" options={{
                                presentation: "modal",
                                animation: "fade_from_bottom",
                                headerRight: () =>
                                    <MaterialIcons name='launch' size={24} color={colors.textSecondary} />
                            }} />
                            <Stack.Screen name="studios/[id]/comments" options={{
                                presentation: "modal",
                                animation: "fade_from_bottom"
                            }} />
                            <Stack.Screen name="users/[username]/index" options={{
                                presentation: "modal",
                                animation: "fade_from_bottom",
                                headerRight: () =>
                                    <MaterialIcons name='launch' size={24} color={colors.textSecondary} />
                            }} />
                            <Stack.Screen name="users/[username]/about" options={{
                                presentation: "modal",
                                animation: "fade_from_bottom",
                            }} />
                            <Stack.Screen name="users/[username]/activity" options={{
                                presentation: "modal",
                                animation: "fade_from_bottom",
                                title: "loading...",
                            }} />
                            <Stack.Screen name="users/[username]/comments" options={{
                                presentation: "modal",
                                animation: "fade_from_bottom",
                            }} />
                            <Stack.Screen name="feed" options={{
                                presentation: "modal",
                                animation: "fade_from_bottom",
                                headerTitle: "What's Happening"
                            }} />
                            <Stack.Screen name="settings" options={{
                                presentation: "modal",
                                animation: "fade_from_bottom",
                                headerTitle: "Settings"
                            }} />
                            <Stack.Screen name="login" options={{
                                presentation: "modal",
                                animation: "default",
                                title: "Log In"
                            }} />
                            <Stack.Screen name="error" options={{
                                presentation: "modal",
                                animation: "fade",
                                title: "Error"
                            }} />
                        </Stack>
                    </View>
                </GestureHandlerRootView>
            </ThemeProvider>
        );
    }
}