import React, { useEffect, useState } from 'react';
import Stack from 'expo-router/stack';
import { ThemeProvider } from '../utils/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Linking, Pressable, useColorScheme, View } from 'react-native';
import { darkColors, lightColors } from '../utils/theme/colors';
import { useMMKVObject } from 'react-native-mmkv';
import { MaterialIcons } from '@expo/vector-icons';

export default function App() {
    const theme = useColorScheme();
    const [colors, setColors] = useState(null);
    const [twConfig, setTWConfig] = useMMKVObject("twConfig");
    useEffect(() => {
        setColors(theme === "dark" ? darkColors : lightColors);
        if (!twConfig) {
            setTWConfig({});
        }
    }, [theme]);

    if (!!colors) {
        return (
            <ThemeProvider>
                <SafeAreaView style={{ backgroundColor: colors.background, flex: 1 }}>
                    <Stack screenOptions={{
                        contentStyle: {
                            backgroundColor: colors.background,
                            color: colors.text
                        },
                    }} >
                        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                        <Stack.Screen name="project/[id]" options={{
                            headerShown: true, presentation: "modal", animation: "fade_from_bottom", headerBackButtonDisplayMode: "default", headerStyle: {
                                backgroundColor: colors.background,
                            },
                            headerTitleStyle: {
                                color: colors.text,
                                fontWeight: "bold"
                            },
                            headerTintColor: colors.text,
                        }} />
                        <Stack.Screen name="user/[username]/profile" options={{
                            headerShown: true, presentation: "modal", animation: "fade_from_bottom", headerBackButtonDisplayMode: "default", headerStyle: {
                                backgroundColor: colors.background,
                            },
                            headerTitleStyle: {
                                color: colors.text,
                                fontWeight: "bold"
                            },
                            headerTintColor: colors.text,
                            headerRight: (e) => <View style={{ overflow: 'hidden', height: 36, width: 36, borderRadius: 20 }}>
                                <Pressable onPress={() => { }} style={{ padding: 6 }}>
                                    <MaterialIcons name='launch' size={24} color={colors.textSecondary} />
                                </Pressable></View>
                        }} />
                        <Stack.Screen name="user/[username]/about" options={{
                            headerShown: true, presentation: "modal", animation: "fade_from_bottom", headerBackButtonDisplayMode: "default", headerStyle: {
                                backgroundColor: colors.background,
                            },
                            headerTitleStyle: {
                                color: colors.text,
                                fontWeight: "bold"
                            },
                            headerTintColor: colors.text
                        }} />
                        <Stack.Screen name="login" options={{
                            headerShown: true, presentation: "modal", animation: "fade_from_bottom", headerBackButtonDisplayMode: "default", headerStyle: {
                                backgroundColor: colors.background,
                            },
                            headerTitleStyle: {
                                color: colors.text,
                                fontWeight: "bold"
                            },
                            headerTintColor: colors.text,
                            title: "Log In"
                        }} />
                    </Stack>
                </SafeAreaView>
            </ThemeProvider >
        );
    }
}