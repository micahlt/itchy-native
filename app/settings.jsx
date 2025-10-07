import { ScrollView, Switch, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import Pressable from '../components/Pressable';
import ScratchAPIWrapper from '../utils/api-wrapper';
import { useTheme } from '../utils/theme';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { version } from "../package.json";
import { useMMKVObject, useMMKVString } from 'react-native-mmkv';
import storage from '../utils/storage';
import linkWithFallback from '../utils/linkWithFallback';
import { Platform } from "react-native";
import FastSquircleView from 'react-native-fast-squircle';
import Chip from '../components/Chip';

export default function SettingsScreen() {
    const { colors, dimensions, isDark } = useTheme();
    const router = useRouter();
    const [username] = useMMKVString("username");
    const [twConfig, setTWConfig] = useMMKVObject("twConfig");
    const isLiquidPlus = Platform.OS === "ios" && parseInt(Platform.Version, 10) >= 26;
    // Local state for switches to enable smooth animations
    const [localSwitchState, setLocalSwitchState] = useState({
        interpolate: false,
        autoplay: false,
        fps60: false,
        hqPen: false,
        turbo: false
    });
    const s = useMemo(() => StyleSheet.create({
        sectionHeader: {
            color: colors.textSecondary,
            fontSize: 12,
            paddingVertical: 10,
            paddingHorizontal: 20,
            marginTop: 10
        },
        settingContainer: {
            borderLeftWidth: 1.5,
            borderRightWidth: 1.5,
            backgroundColor: colors.backgroundSecondary,
            flexDirection: 'row',
            justifyContent: "space-between",
            alignItems: 'center',
            borderColor: colors.backgroundTertiary,
            height: 50,
            marginHorizontal: 15,
            paddingHorizontal: 20,
            paddingRight: 8
        },
        topSettingContainer: {
            borderTopLeftRadius: dimensions.mediumRadius,
            borderTopRightRadius: dimensions.mediumRadius,
            borderTopWidth: 1.5
        },
        bottomSettingContainer: {
            borderBottomLeftRadius: dimensions.mediumRadius,
            borderBottomRightRadius: dimensions.mediumRadius,
            borderBottomWidth: 1.5
        },
        settingTitle: {
            color: colors.text,
            fontSize: 16,
        }
    }), [isDark]);

    useEffect(() => {
        if (!twConfig) {
            setTWConfig({})
        } else {
            setLocalSwitchState({
                interpolate: twConfig.interpolate || false,
                autoplay: twConfig.autoplay || false,
                fps60: twConfig.fps60 || false,
                hqPen: twConfig.hqPen || false,
                turbo: twConfig.turbo || false
            });
        }
    }, [twConfig]);

    const handleSwitchToggle = (key, value) => {
        setLocalSwitchState(prev => ({ ...prev, [key]: value }));
        setTWConfig({ ...twConfig, [key]: value });
    };

    return (
        <ScrollView overScrollMode='always' bounces={true}>
            <Text style={s.sectionHeader}>Account</Text>
            <FastSquircleView cornerSmoothing={0.6} style={{ ...s.settingContainer, ...s.topSettingContainer, ...(!username && s.bottomSettingContainer) }}>
                <Text style={s.settingTitle}>{username ? `Signed in as ${username}` : "Signed out"}</Text>
                <Chip.Icon mode="filled" text={username ? 'Log Out' : 'Log In'} icon="key" color={username ? "#ff5555" : colors.accent} style={{ marginTop: 3 }} onPress={() => {
                    if (username) {
                        ScratchAPIWrapper.auth.logout(storage.getString("cookieSet")).then(() => {
                            storage.clearAll();
                        }).catch((e) => {
                            console.error(e);
                            console.error("Proceeding with login anyway.");
                            storage.clearAll();
                        });
                    } else {
                        router.push("/login");
                    }
                }} />
            </FastSquircleView>
            {username && <FastSquircleView cornerSmoothing={0.6} style={{ ...s.settingContainer, ...s.bottomSettingContainer }}>
                <TouchableOpacity onPress={() => router.push(`/users/${username}`)}><Text style={{ color: colors.accent, fontSize: 16, }}>Open your profile</Text>
                </TouchableOpacity>
            </FastSquircleView>}
            <Text style={s.sectionHeader}>Player</Text>
            <FastSquircleView cornerSmoothing={0.6} style={{ ...s.settingContainer, ...s.topSettingContainer, paddingEnd: isLiquidPlus ? 24 : 0 }}>
                <Text style={s.settingTitle}>Frame interpolation</Text>
                <Switch style={{ marginTop: isLiquidPlus ? 3 : 0 }} thumbColor='white' trackColor={{ false: '#686868', true: colors.accent }} onValueChange={(v) => setTWConfig({ ...twConfig, interpolate: v })} value={twConfig?.interpolate} />
            </FastSquircleView>
            <FastSquircleView cornerSmoothing={0.6} style={{ ...s.settingContainer, paddingEnd: isLiquidPlus ? 24 : 0 }}>
                <Text style={s.settingTitle}>Autoplay</Text>
                <Switch style={{ marginTop: isLiquidPlus ? 3 : 0 }} thumbColor='white' trackColor={{ false: '#686868', true: colors.accent }} onValueChange={(v) => setTWConfig({ ...twConfig, autoplay: v })} value={twConfig?.autoplay} />
            </FastSquircleView>
            <FastSquircleView cornerSmoothing={0.6} style={{ ...s.settingContainer, paddingEnd: isLiquidPlus ? 24 : 0 }}>
                <Text style={s.settingTitle}>Force 60 FPS</Text>
                <Switch style={{ marginTop: isLiquidPlus ? 3 : 0 }} thumbColor='white' trackColor={{ false: '#686868', true: colors.accent }} onValueChange={(v) => setTWConfig({ ...twConfig, fps60: v })} value={twConfig?.fps60} />
            </FastSquircleView>
            <FastSquircleView cornerSmoothing={0.6} style={{ ...s.settingContainer, paddingEnd: isLiquidPlus ? 24 : 0 }}>
                <Text style={s.settingTitle}>High-quality pen</Text>
                <Switch style={{ marginTop: isLiquidPlus ? 3 : 0 }} thumbColor='white' trackColor={{ false: '#686868', true: colors.accent }} onValueChange={(v) => setTWConfig({ ...twConfig, hqPen: v })} value={twConfig?.hqPen} />
            </FastSquircleView>
            <FastSquircleView cornerSmoothing={0.6} style={{ ...s.settingContainer, paddingEnd: isLiquidPlus ? 24 : 0 }}>
                <Text style={s.settingTitle}>Turbo mode</Text>
                <Switch style={{ marginTop: isLiquidPlus ? 3 : 0 }} thumbColor='white' trackColor={{ false: '#686868', true: colors.accent }} onValueChange={(v) => setTWConfig({ ...twConfig, turbo: v })} value={twConfig?.turbo} />
            </FastSquircleView>
            <FastSquircleView cornerSmoothing={0.6} style={{ ...s.settingContainer, ...s.bottomSettingContainer, justifyContent: "flex-start" }}>
                <Text style={{ color: colors.text, fontSize: 12, opacity: 0.6 }}>Options provided by </Text><TouchableOpacity onPress={() => linkWithFallback("https://turbowarp.org")}><Text style={{ color: colors.accent, fontSize: 12 }}>TurboWarp</Text></TouchableOpacity>
            </FastSquircleView>
            <Text style={s.sectionHeader}>About</Text>
            <FastSquircleView cornerSmoothing={0.6} style={{ ...s.settingContainer, ...s.topSettingContainer }}>
                <Text style={{ color: colors.text, fontSize: 16 }}>Itchy v{version}</Text>
            </FastSquircleView>
            <FastSquircleView cornerSmoothing={0.6} style={s.settingContainer}>
                <TouchableOpacity onPress={() => router.push("/onboarding")}><Text style={{ color: colors.accent, fontSize: 16, }}>Redo onboarding flow</Text>
                </TouchableOpacity>
            </FastSquircleView>
            <FastSquircleView cornerSmoothing={0.6} style={s.settingContainer}>
                <TouchableOpacity onPress={() => linkWithFallback("https://itchy.micahlindley.com/privacy.html")}><Text style={{ color: colors.accent, fontSize: 16, }}>Privacy Policy</Text>
                </TouchableOpacity>
            </FastSquircleView>
            <FastSquircleView cornerSmoothing={0.6} style={{ ...s.settingContainer, ...s.bottomSettingContainer, justifyContent: "flex-start" }}>
                <Text style={{ color: colors.text, fontSize: 12, opacity: 0.6 }}>Made </Text><TouchableOpacity onPress={() => linkWithFallback("https://github.com/micahlt")}><Text style={{ color: colors.accent, fontSize: 12 }}>open source</Text></TouchableOpacity><Text style={{ color: colors.text, fontSize: 12, opacity: 0.6 }}> with ❤️</Text>
            </FastSquircleView>
            <View style={{ height: 120 }}></View>
        </ScrollView>
    );
}