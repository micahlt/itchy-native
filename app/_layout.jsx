import React, { useEffect, useMemo, useState } from 'react';
import Stack from 'expo-router/stack';
import { ThemeProvider, useTheme } from '../utils/theme';
import { Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { darkColors, lightColors } from '../utils/theme/colors';
import { useMMKVObject, useMMKVString } from 'react-native-mmkv';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import APIAuth from '../utils/api-wrapper/auth';
import storage from '../utils/storage';
import encryptedStorage from '../utils/encryptedStorage';
import { router } from 'expo-router';
import { SWRConfig } from 'swr';

export default function App() {
    const [twConfig, setTWConfig] = useMMKVObject("twConfig");
    const [user, setUser] = useMMKVObject("user");
    const [cookieSet, setCookieSet] = useMMKVString("cookieSet");
    const [localControllerMappings, setLocalControllerMappings] = useMMKVObject("localControllerMappings");
    const [savedLogins, setSavedLogins] = useMMKVObject("savedLogins", encryptedStorage);
    const isLiquidPlus = useMemo(() => Platform.OS === "ios" && parseInt(Platform.Version, 10) >= 26, [Platform]);
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
                if (!d.isLoggedIn) {
                    storage.delete("sessionID");
                    storage.delete("csrfToken");
                    storage.delete("cookieSet");
                    storage.delete("token");
                    storage.delete("user");
                    setUser(null);
                    APIAuth.logout().finally(async () => {
                        if (!savedLogins) return;
                        const currentLogin = savedLogins.find((o) => o.username === storage.getString("username"));
                        if (!currentLogin) return;
                        APIAuth.login(currentLogin.username, currentLogin.password).then((d) => {
                            storage.set("sessionID", d.sessionToken)
                            storage.set("csrfToken", d.csrfToken);
                            storage.set("username", d.username);
                            storage.set("cookieSet", d.cookieSet);
                            storage.set("token", d.sessionJSON.user.token);
                            setUser(d.sessionJSON.user);
                            router.dismissTo("/");
                        }).catch((e) => {
                            storage.delete("username");
                        });
                    })
                }
            }).catch(() => {
                storage.delete("sessionID");
                storage.delete("csrfToken");
                storage.delete("cookieSet");
                storage.delete("token");
                storage.delete("user");
                APIAuth.logout().finally(async () => {
                    if (!savedLogins) { return storage.delete("username"); }
                    const currentLogin = savedLogins.find((o) => o.username === storage.getString("username"));
                    if (!currentLogin) { return storage.delete("username"); }
                    APIAuth.login(currentLogin.username, currentLogin.password).then((d) => {
                        storage.set("sessionID", d.sessionToken)
                        storage.set("csrfToken", d.csrfToken);
                        storage.set("username", d.username);
                        storage.set("cookieSet", d.cookieSet);
                        storage.set("token", d.sessionJSON.user.token);
                        setUser(d.sessionJSON.user);
                        router.dismissTo("/");
                    }).catch((e) => {
                        storage.delete("username");
                        console.log("DELETING UNAME")
                    });
                })
            });
        }
        if (!localControllerMappings) {
            setLocalControllerMappings({});
        }
    }, [])
    Image.clearDiskCache();
    return (
        <SWRConfig
            value={{
                dedupingInterval: 2000,
                revalidateOnFocus: false,
                revalidateOnReconnect: false,
                errorRetryCount: 2,
            }}
        >
            <ThemeProvider>
                <GestureHandlerRootView>
                    {/* Inner component consumes theme after ThemeProvider mounts */}
                    <ThemeConsumerInner twConfig={twConfig} />
                </GestureHandlerRootView>
            </ThemeProvider>
        </SWRConfig>
    );
}

function ThemeConsumerInner({ twConfig }) {
    const { colors, isDark } = useTheme();
    const isLiquidPlus = Platform.OS === "ios" && parseInt(Platform.Version, 10) >= 26;

    // If colors aren't ready yet, render nothing (prevents flash)
    if (!colors) return null;

    console.log("isDark:", isDark);

    return (
        <View style={{ backgroundColor: colors.background, flex: 1 }}>
            <Stack screenOptions={{
                contentStyle: {
                    backgroundColor: colors.background,
                    color: colors.text
                },
                headerShown: true,
                headerBackButtonDisplayMode: "default",
                headerTitleStyle: {
                    color: colors.text,
                    fontWeight: "bold",
                },
                headerTintColor: colors.text,
                // fixes back button artifact for iOS, check how it impacts android
                headerLeft: () => null,
                headerTransparent: isLiquidPlus,
                headerStyle: {
                    backgroundColor: isLiquidPlus ? "transparent" : colors.background, // no fallback bg
                }
            }}>
                <Stack.Screen name="(tabs)" options={{ headerShown: false, animation: "default" }} />
                <Stack.Screen name="projects/[id]/index" options={{
                    animation: "fade_from_bottom",
                    headerBackButtonDisplayMode: "minimal",
                    headerBackVisible: Platform.OS === "ios" ? true : false,
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
                <Stack.Screen name="onboarding" options={{
                    animation: "fade_from_bottom",
                    headerShown: false
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
                <Stack.Screen name="multiplay" options={{
                    animation: "fade_from_bottom",
                    title: "MultiPlay"
                }} />
                <Stack.Screen name="projects/[id]/controls/find" options={{
                    presentation: "modal",
                    animation: "fade_from_bottom",
                    title: "Find Controller Setups"
                }} />
                <Stack.Screen name="projects/[id]/controls/config" options={{
                    presentation: "modal",
                    animation: "fade_from_bottom",
                    title: "Controller Config"
                }} />
                <Stack.Screen name="error" options={{
                    presentation: "modal",
                    animation: "fade",
                    title: "Error"
                }} />
            </Stack>
        </View>
    )
}