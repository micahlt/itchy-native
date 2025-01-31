import { Pressable, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import ScratchAPIWrapper from '../../utils/api-wrapper';
import { useTheme } from '../../utils/theme';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { version } from "../../package.json";
import { useMMKVObject, useMMKVString } from 'react-native-mmkv';
import storage from '../../utils/storage';
import linkWithFallback from '../../utils/linkWithFallback';

export default function SettingsScreen() {
    const { colors } = useTheme();
    const router = useRouter();
    const [username] = useMMKVString("username");
    const [twConfig, setTWConfig] = useMMKVObject("twConfig");
    useEffect(() => {
        if (!twConfig) {
            setTWConfig({})
        }
    }, []);
    return (
        <ScrollView style={{ backgroundColor: colors.background, flex: 1 }}>
            <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 24, padding: 10 }}>Settings</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12, padding: 10 }}>Account</Text>
            <View style={{ backgroundColor: colors.backgroundSecondary, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderColor: colors.backgroundTertiary, borderBottomWidth: username ? 0 : 0.5, borderTopWidth: 0.5 }}>
                <Text style={{ color: colors.text, fontSize: 16, paddingVertical: 15, paddingLeft: 10 }}>{username ? `Signed in as ${username}` : "Signed out"}</Text>
                <View style={{ borderRadius: 10, overflow: 'hidden', backgroundColor: colors.accent, elevation: 5, marginRight: 10, }}>
                    <Pressable onPress={() => {
                        if (username) {
                            ScratchAPIWrapper.auth.logout(storage.getString("csrfToken"), storage.getString("cookieSet")).then(() => {
                                storage.clearAll();
                            }).catch(console.error);
                        } else {
                            router.push("/login");
                        }
                    }} style={{ paddingVertical: 5, paddingHorizontal: 10 }} android_ripple={{ color: colors.ripple, borderless: false, foreground: true }}>
                        <Text style={{ color: "white", fontWeight: 'bold', fontSize: 12 }}>{username ? "LOG OUT" : "LOG IN"}</Text>
                    </Pressable>
                </View>
            </View>
            {username && <View style={{ backgroundColor: colors.backgroundSecondary, flexDirection: 'row', justifyContent: "flex-start", alignItems: 'center', borderColor: colors.backgroundTertiary, borderTopWidth: 0.5, borderBottomWidth: 0.5 }}>
                <TouchableOpacity onPress={() => router.push(`/users/${username}`)}><Text style={{ color: colors.accent, fontSize: 16, paddingVertical: 15, paddingLeft: 10 }}>Open your profile</Text>
                </TouchableOpacity>
            </View>}
            <Text style={{ color: colors.textSecondary, fontSize: 12, padding: 10, marginTop: 10 }}>Player</Text>
            <View style={{ backgroundColor: colors.backgroundSecondary, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderColor: colors.backgroundTertiary, borderBottomWidth: 0.5, borderTopWidth: 0.5 }}>
                <Text style={{ color: colors.text, fontSize: 16, paddingVertical: 15, paddingLeft: 10 }}>Frame interpolation</Text>
                <Switch thumbColor={twConfig.interpolate ? colors.accent : colors.backgroundTertiary} trackColor={{ false: '#686868', true: '#93b5f1' }} onValueChange={(v) => setTWConfig({ ...twConfig, interpolate: v })} style={{ marginRight: 5 }} value={twConfig.interpolate} />
            </View>
            <View style={{ backgroundColor: colors.backgroundSecondary, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderColor: colors.backgroundTertiary, borderBottomWidth: 0.5, borderTopWidth: 0.5 }}>
                <Text style={{ color: colors.text, fontSize: 16, paddingVertical: 15, paddingLeft: 10 }}>Autoplay</Text>
                <Switch thumbColor={twConfig.autoplay ? colors.accent : colors.backgroundTertiary} trackColor={{ false: '#686868', true: '#93b5f1' }} onValueChange={(v) => setTWConfig({ ...twConfig, autoplay: v })} style={{ marginRight: 5 }} value={twConfig.autoplay} />
            </View>
            <View style={{ backgroundColor: colors.backgroundSecondary, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderColor: colors.backgroundTertiary, borderBottomWidth: 0.5, borderTopWidth: 0.5 }}>
                <Text style={{ color: colors.text, fontSize: 16, paddingVertical: 15, paddingLeft: 10 }}>Force 60 FPS</Text>
                <Switch thumbColor={twConfig.fps60 ? colors.accent : colors.backgroundTertiary} trackColor={{ false: '#686868', true: '#93b5f1' }} onValueChange={(v) => setTWConfig({ ...twConfig, fps60: v })} style={{ marginRight: 5 }} value={twConfig.fps60} />
            </View>
            <View style={{ backgroundColor: colors.backgroundSecondary, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderColor: colors.backgroundTertiary, borderBottomWidth: 0.5, borderTopWidth: 0.5 }}>
                <Text style={{ color: colors.text, fontSize: 16, paddingVertical: 15, paddingLeft: 10 }}>High-quality pen</Text>
                <Switch thumbColor={twConfig.hqPen ? colors.accent : colors.backgroundTertiary} trackColor={{ false: '#686868', true: '#93b5f1' }} onValueChange={(v) => setTWConfig({ ...twConfig, hqPen: v })} style={{ marginRight: 5 }} value={twConfig.hqPen} />
            </View>
            <View style={{ backgroundColor: colors.backgroundSecondary, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderColor: colors.backgroundTertiary, borderBottomWidth: 0.5, borderTopWidth: 0.5 }}>
                <Text style={{ color: colors.text, fontSize: 16, paddingVertical: 15, paddingLeft: 10 }}>Turbo mode</Text>
                <Switch thumbColor={twConfig.turbo ? colors.accent : colors.backgroundTertiary} trackColor={{ false: '#686868', true: '#93b5f1' }} onValueChange={(v) => setTWConfig({ ...twConfig, turbo: v })} style={{ marginRight: 5 }} value={twConfig.turbo} />
            </View>
            <View style={{ backgroundColor: colors.backgroundSecondary, flexDirection: 'row', justifyContent: "flex-start", alignItems: 'center', borderColor: colors.backgroundTertiary, borderBottomWidth: 0.5, }}>
                <Text style={{ color: colors.text, fontSize: 12, paddingVertical: 15, paddingLeft: 10, opacity: 0.6 }}>Options provided by </Text><TouchableOpacity onPress={() => linkWithFallback("https://turbowarp.org")}><Text style={{ color: colors.accent, fontSize: 12 }}>TurboWarp</Text></TouchableOpacity>
            </View>
            <Text style={{ color: colors.textSecondary, fontSize: 12, padding: 10, marginTop: 10 }}>About</Text>
            <View style={{ backgroundColor: colors.backgroundSecondary, borderColor: colors.backgroundTertiary, borderBottomWidth: 0.5, borderTopWidth: 0.5 }}>
                <Text style={{ color: colors.text, fontSize: 16, paddingVertical: 15, paddingHorizontal: 10 }}>Itchy v{version}</Text>
            </View>
            <View style={{ backgroundColor: colors.backgroundSecondary, flexDirection: 'row', justifyContent: "flex-start", alignItems: 'center', borderColor: colors.backgroundTertiary, borderBottomWidth: 0.5 }}>
                <TouchableOpacity onPress={() => linkWithFallback("https://itchy.micahlindley.com/privacy.html")}><Text style={{ color: colors.accent, fontSize: 16, paddingVertical: 15, paddingLeft: 10 }}>Privacy Policy</Text>
                </TouchableOpacity>
            </View>
            <View style={{ backgroundColor: colors.backgroundSecondary, flexDirection: 'row', justifyContent: "flex-start", alignItems: 'center', borderColor: colors.backgroundTertiary, borderBottomWidth: 0.5, }}>
                <Text style={{ color: colors.text, fontSize: 12, paddingVertical: 15, paddingLeft: 10, opacity: 0.6 }}>Made </Text><TouchableOpacity onPress={() => linkWithFallback("https://github.com/micahlt")}><Text style={{ color: colors.accent, fontSize: 12 }}>open source</Text></TouchableOpacity><Text style={{ color: colors.text, fontSize: 12, paddingVertical: 15, opacity: 0.6 }}> with ❤️</Text>
            </View>
        </ScrollView>
    );
}