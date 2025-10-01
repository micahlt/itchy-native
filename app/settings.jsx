import { ScrollView, Switch, TouchableOpacity, View, StyleSheet } from 'react-native';
import ItchyText from '../components/ItchyText';
import Pressable from '../components/Pressable';
import ScratchAPIWrapper from '../utils/api-wrapper';
import { useTheme } from '../utils/theme';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { version } from "../package.json";
import { useMMKVObject, useMMKVString } from 'react-native-mmkv';
import storage from '../utils/storage';
import linkWithFallback from '../utils/linkWithFallback';

export default function SettingsScreen() {
    const { colors, isDark } = useTheme();
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
            backgroundColor: colors.backgroundSecondary,
            flexDirection: 'row',
            justifyContent: "space-between",
            alignItems: 'center',
            borderColor: colors.backgroundTertiary,
            borderBottomWidth: 0.5,
            height: 50,
            marginHorizontal: 15,
            paddingHorizontal: 20,
            paddingRight: 8
        },
        topSettingContainer: {
            borderTopLeftRadius: 10,
            borderTopRightRadius: 10,
        },
        bottomSettingContainer: {
            borderBottomLeftRadius: 10,
            borderBottomRightRadius: 10,
            borderBottomWidth: 0,
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
            <ItchyText style={s.sectionHeader}>Account</ItchyText>
            <View style={{ ...s.settingContainer, ...s.topSettingContainer }}>
                <ItchyText style={s.settingTitle}>{username ? `Signed in as ${username}` : "Signed out"}</ItchyText>
                <View style={{ borderRadius: 10, overflow: 'hidden', backgroundColor: colors.accent, elevation: 5, marginRight: 10, }}>
                    <Pressable onPress={() => {
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
                    }} style={{ paddingVertical: 5, paddingHorizontal: 10 }} android_ripple={{ color: colors.ripple, borderless: false, foreground: true }}>
                        <ItchyText style={{ color: "white", fontWeight: 'bold', fontSize: 12 }}>{username ? "LOG OUT" : "LOG IN"}</ItchyText>
                    </Pressable>
                </View>
            </View>
            {username && <View style={{ ...s.settingContainer, ...s.bottomSettingContainer }}>
                <TouchableOpacity onPress={() => router.push(`/users/${username}`)}><ItchyText style={{ color: colors.accent, fontSize: 16, }}>Open your profile</ItchyText>
                </TouchableOpacity>
            </View>}
            <ItchyText style={s.sectionHeader}>Player</ItchyText>
            <View style={{ ...s.settingContainer, ...s.topSettingContainer }}>
                <ItchyText style={s.settingTitle}>Frame interpolation</ItchyText>
                <Switch thumbColor={twConfig?.interpolate ? colors.accent : colors.backgroundTertiary} trackColor={{ false: '#686868', true: '#93b5f1' }} onValueChange={(v) => setTWConfig({ ...twConfig, interpolate: v })} value={twConfig?.interpolate} />
            </View>
            <View style={s.settingContainer}>
                <ItchyText style={s.settingTitle}>Autoplay</ItchyText>
                <Switch thumbColor={twConfig?.autoplay ? colors.accent : colors.backgroundTertiary} trackColor={{ false: '#686868', true: '#93b5f1' }} onValueChange={(v) => setTWConfig({ ...twConfig, autoplay: v })} value={twConfig?.autoplay} />
            </View>
            <View style={s.settingContainer}>
                <ItchyText style={s.settingTitle}>Force 60 FPS</ItchyText>
                <Switch thumbColor={twConfig?.fps60 ? colors.accent : colors.backgroundTertiary} trackColor={{ false: '#686868', true: '#93b5f1' }} onValueChange={(v) => setTWConfig({ ...twConfig, fps60: v })} value={twConfig?.fps60} />
            </View>
            <View style={s.settingContainer}>
                <ItchyText style={s.settingTitle}>High-quality pen</ItchyText>
                <Switch thumbColor={twConfig?.hqPen ? colors.accent : colors.backgroundTertiary} trackColor={{ false: '#686868', true: '#93b5f1' }} onValueChange={(v) => setTWConfig({ ...twConfig, hqPen: v })} value={twConfig?.hqPen} />
            </View>
            <View style={s.settingContainer}>
                <ItchyText style={s.settingTitle}>Turbo mode</ItchyText>
                <Switch thumbColor={twConfig?.turbo ? colors.accent : colors.backgroundTertiary} trackColor={{ false: '#686868', true: '#93b5f1' }} onValueChange={(v) => setTWConfig({ ...twConfig, turbo: v })} value={twConfig?.turbo} />
            </View>
            <View style={{ ...s.settingContainer, ...s.bottomSettingContainer, justifyContent: "flex-start" }}>
                <ItchyText style={{ color: colors.text, fontSize: 12, opacity: 0.6 }}>Options provided by </ItchyText><TouchableOpacity onPress={() => linkWithFallback("https://turbowarp.org")}><ItchyText style={{ color: colors.accent, fontSize: 12 }}>TurboWarp</ItchyText></TouchableOpacity>
            </View>
            <ItchyText style={s.sectionHeader}>About</ItchyText>
            <View style={{ ...s.settingContainer, ...s.topSettingContainer }}>
                <ItchyText style={{ color: colors.text, fontSize: 16 }}>Itchy v{version}</ItchyText>
            </View>
            <View style={s.settingContainer}>
                <TouchableOpacity onPress={() => router.push("/onboarding")}><ItchyText style={{ color: colors.accent, fontSize: 16, }}>Redo onboarding flow</ItchyText>
                </TouchableOpacity>
            </View>
            <View style={s.settingContainer}>
                <TouchableOpacity onPress={() => router.push("/rtctest")}><ItchyText style={{ color: colors.accent, fontSize: 16, }}>RTC test</ItchyText>
                </TouchableOpacity>
            </View>
            <View style={s.settingContainer}>
                <TouchableOpacity onPress={() => linkWithFallback("https://itchy.micahlindley.com/privacy.html")}><ItchyText style={{ color: colors.accent, fontSize: 16, }}>Privacy Policy</ItchyText>
                </TouchableOpacity>
            </View>
            <View style={{ ...s.settingContainer, ...s.bottomSettingContainer, justifyContent: "flex-start" }}>
                <ItchyText style={{ color: colors.text, fontSize: 12, opacity: 0.6 }}>Made </ItchyText><TouchableOpacity onPress={() => linkWithFallback("https://github.com/micahlt")}><ItchyText style={{ color: colors.accent, fontSize: 12 }}>open source</ItchyText></TouchableOpacity><ItchyText style={{ color: colors.text, fontSize: 12, opacity: 0.6 }}> with ❤️</ItchyText>
            </View>
            <View style={{ height: 120 }}></View>
        </ScrollView>
    );
}
