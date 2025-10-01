import { TextInput, View } from 'react-native';
import ItchyText from '../components/ItchyText';
import Pressable from '../components/Pressable';
import ScratchAPIWrapper from '../utils/api-wrapper';
import { useTheme } from '../utils/theme';
import { useRef, useState } from 'react';
import Card from '../components/Card';
import storage from '../utils/storage';
import { useMMKVObject } from 'react-native-mmkv';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import encryptedStorage from '../utils/encryptedStorage';
import TexturedButton from '../components/TexturedButton';
import linkWithFallback from '../utils/linkWithFallback';
import { opacity } from 'react-native-redash';

export default function LoginScreen() {
    const { colors } = useTheme();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [user, setUser] = useMMKVObject("user");
    const [savedLogins, setSavedLogins] = useMMKVObject("savedLogins", encryptedStorage);
    const passwordInput = useRef(null);

    const logIn = () => {
        ScratchAPIWrapper.auth.login(username, password).then((d) => {
            storage.set("sessionID", d.sessionToken)
            storage.set("csrfToken", d.csrfToken);
            storage.set("username", d.username);
            storage.set("cookieSet", d.cookieSet);
            storage.set("token", d.sessionJSON.user.token);
            setSavedLogins((prev) => {
                const newLogins = [...(prev || []), { username, password }];
                return newLogins;
            });
            setUser(d.sessionJSON.user);
            router.dismissTo("/");
        }).catch((e) => {
            setError(e.message);
            console.error(e);
        });
    };

    return (
        <View style={{ backgroundColor: colors.background }}>
            <Card style={{ padding: 20, margin: 20 }}>
                <View style={{ flexDirection: 'row', justifyContent: "center", alignItems: "center", gap: 20, marginVertical: 20 }}>
                    <Image source={require("../assets/logo.webp")} style={{ width: 65, height: 65, alignSelf: "center", borderRadius: 65 }} />
                    <MaterialIcons name='arrow-forward' size={45} color={"dimgray"} />
                    <Image source={require("../assets/avatar2.png")} style={{ width: 65, height: 65, alignSelf: "center", borderRadius: 65 }} />
                </View>
                <TextInput placeholder="Username" style={{ backgroundColor: colors.backgroundSecondary, color: colors.text, padding: 10, margin: 10, borderBottomColor: "silver", borderBottomWidth: 1, fontFamily: "Inter_400Regular" }} underlineColorAndroid={colors.text} placeholderTextColor={colors.textSecondary} onChangeText={(t) => setUsername(t)} value={username} importantForAutofill='yes' autoComplete="username" autoCapitalize="none" autoCorrect={false} autoFocus={true} returnKeyType="next" onSubmitEditing={() => passwordInput?.current?.focus()} submitBehavior="submit" />
                <TextInput placeholder="Password" ref={passwordInput} style={{ backgroundColor: colors.backgroundSecondary, color: colors.text, padding: 10, margin: 10, borderBottomColor: "silver", borderBottomWidth: 1, fontFamily: "Inter_400Regular" }} underlineColorAndroid={colors.text} placeholderTextColor={colors.textSecondary} secureTextEntry={true} onChangeText={(t) => setPassword(t)} value={password} importantForAutofill='yes' autoComplete="password" autoCapitalize="none" autoCorrect={false} onSubmitEditing={() => logIn()} />
                <TexturedButton style={{ marginVertical: 10, margin: "auto", paddingHorizontal: 10, backgroundColor: colors.accent, outlineColor: colors.accentOverlay, borderTopColor: "rgba(255,255,255,0.2)" }} textStyle={{ color: "white" }} onPress={logIn}>Log In</TexturedButton>
                {error && <ItchyText style={{ color: "#f85a5a", textAlign: "center", fontSize: 16, marginBottom: 5 }}>{error}</ItchyText>}
                <ItchyText style={{ color: colors.text, textAlign: "center", opacity: 0.5, fontSize: 12 }}>Your username and password will be sent directly to Scratch's servers and not shared with any third parties.</ItchyText>
            </Card>
            <Card onPress={() => linkWithFallback("https://itchy.micahlindley.com/privacy")} pressableStyle={{ padding: 20 }} style={{ margin: 20, marginTop: 0 }}>
                <ItchyText style={{ color: colors.textSecondary, textAlign: "center" }}>By logging in, you agree to the <ItchyText style={{ color: colors.accent, textAlign: "center", fontWeight: "bold" }}>Privacy Policy</ItchyText>.</ItchyText>
            </Card>
        </View>
    );
}