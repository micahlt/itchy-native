import { ScrollView, Switch, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import Pressable from '../../components/Pressable';
import ScratchAPIWrapper from '../../utils/api-wrapper';
import { useTheme } from '../../utils/theme';
import { useEffect, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { version } from "../../package.json";
import { useMMKVObject, useMMKVString } from 'react-native-mmkv';
import storage from '../../utils/storage';
import linkWithFallback from '../../utils/linkWithFallback';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
    const { colors, isDark } = useTheme();
    const router = useRouter();
    const [username] = useMMKVString("username");
    const [twConfig, setTWConfig] = useMMKVObject("twConfig");
    const s = useMemo(() => StyleSheet.create({
        sectionHeader: {
            color: colors.textSecondary,
            fontSize: 12,
            paddingVertical: 10,
            paddingHorizontal: 10,
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
            paddingHorizontal: 15
        },
        topSettingContainer: {
            borderTopWidth: 0.5,
        },
        settingTitle: {
            color: colors.text,
            fontSize: 16,
        }
    }), [isDark]);

    useEffect(() => {
        if (!twConfig) {
            setTWConfig({})
        }
    }, []);

    return (
        <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
            <ScrollView>
                <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 24, padding: 10, paddingBottom: 0 }}>Settings</Text>
                <Text style={s.sectionHeader}>Account</Text>
                <View style={{ ...s.settingContainer, ...s.topSettingContainer }}>
                    <Text style={s.settingTitle}>{username ? `Signed in as ${username}` : "Signed out"}</Text>
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
                            <Text style={{ color: "white", fontWeight: 'bold', fontSize: 12 }}>{username ? "LOG OUT" : "LOG IN"}</Text>
                        </Pressable>
                    </View>
                </View>
                {username && <View style={{ ...s.settingContainer }}>
                    <TouchableOpacity onPress={() => router.push(`/users/${username}`)}><Text style={{ color: colors.accent, fontSize: 16, }}>Open your profile</Text>
                    </TouchableOpacity>
                </View>}
                <Text style={s.sectionHeader}>Player</Text>
                <View style={{ ...s.settingContainer, ...s.topSettingContainer }}>
                    <Text style={s.settingTitle}>Frame interpolation</Text>
                    <Switch thumbColor={twConfig?.interpolate ? colors.accent : colors.backgroundTertiary} trackColor={{ false: '#686868', true: '#93b5f1' }} onValueChange={(v) => setTWConfig({ ...twConfig, interpolate: v })} value={twConfig?.interpolate} />
                </View>
                <View style={s.settingContainer}>
                    <Text style={s.settingTitle}>Autoplay</Text>
                    <Switch thumbColor={twConfig?.autoplay ? colors.accent : colors.backgroundTertiary} trackColor={{ false: '#686868', true: '#93b5f1' }} onValueChange={(v) => setTWConfig({ ...twConfig, autoplay: v })} value={twConfig?.autoplay} />
                </View>
                <View style={s.settingContainer}>
                    <Text style={s.settingTitle}>Force 60 FPS</Text>
                    <Switch thumbColor={twConfig?.fps60 ? colors.accent : colors.backgroundTertiary} trackColor={{ false: '#686868', true: '#93b5f1' }} onValueChange={(v) => setTWConfig({ ...twConfig, fps60: v })} value={twConfig?.fps60} />
                </View>
                <View style={s.settingContainer}>
                    <Text style={s.settingTitle}>High-quality pen</Text>
                    <Switch thumbColor={twConfig?.hqPen ? colors.accent : colors.backgroundTertiary} trackColor={{ false: '#686868', true: '#93b5f1' }} onValueChange={(v) => setTWConfig({ ...twConfig, hqPen: v })} value={twConfig?.hqPen} />
                </View>
                <View style={s.settingContainer}>
                    <Text style={s.settingTitle}>Turbo mode</Text>
                    <Switch thumbColor={twConfig?.turbo ? colors.accent : colors.backgroundTertiary} trackColor={{ false: '#686868', true: '#93b5f1' }} onValueChange={(v) => setTWConfig({ ...twConfig, turbo: v })} value={twConfig?.turbo} />
                </View>
                <View style={{ ...s.settingContainer, justifyContent: "flex-start" }}>
                    <Text style={{ color: colors.text, fontSize: 12, opacity: 0.6 }}>Options provided by </Text><TouchableOpacity onPress={() => linkWithFallback("https://turbowarp.org")}><Text style={{ color: colors.accent, fontSize: 12 }}>TurboWarp</Text></TouchableOpacity>
                </View>
                <Text style={s.sectionHeader}>About</Text>
                <View style={{ ...s.settingContainer, ...s.topSettingContainer }}>
                    <Text style={{ color: colors.text, fontSize: 16 }}>Itchy v{version}</Text>
                </View>
                <View style={s.settingContainer}>
                    <TouchableOpacity onPress={() => linkWithFallback("https://itchy.micahlindley.com/privacy.html")}><Text style={{ color: colors.accent, fontSize: 16, }}>Privacy Policy</Text>
                    </TouchableOpacity>
                </View>
                <View style={{ ...s.settingContainer, justifyContent: "flex-start" }}>
                    <Text style={{ color: colors.text, fontSize: 12, opacity: 0.6 }}>Made </Text><TouchableOpacity onPress={() => linkWithFallback("https://github.com/micahlt")}><Text style={{ color: colors.accent, fontSize: 12 }}>open source</Text></TouchableOpacity><Text style={{ color: colors.text, fontSize: 12, opacity: 0.6 }}> with ❤️</Text>
                </View>
                <View style={{ height: 120 }}></View>
            </ScrollView>
        </SafeAreaView>
    );
}
