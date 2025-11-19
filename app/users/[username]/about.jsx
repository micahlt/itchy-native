import { View, ScrollView } from "react-native";
import ItchyText from "../../../components/ItchyText";
import { useTheme } from "../../../utils/theme";
import { Stack } from "expo-router/stack";
import { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import ScratchAPIWrapper from "../../../utils/api-wrapper";
import Card from "../../../components/Card";
import timeago from "time-ago";
import { flag } from "country-emoji";
import LinkifiedText from "../../../utils/regex/LinkifiedText";
import { SafeAreaView } from "react-native-safe-area-context";
import { getLiquidPlusPadding } from "../../../utils/platformUtils";

export default function About() {
  const { username } = useLocalSearchParams();
  const { colors } = useTheme();
  const [profile, setProfile] = useState(null);
  useEffect(() => {
    ScratchAPIWrapper.user
      .getProfile(username)
      .then((d) => {
        setProfile(d);
      })
      .catch(console.error);
  }, [username]);
  return (
    <SafeAreaView
      edges={["bottom"]}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <Stack.Screen
        options={{
          title: `About ${username}`,
        }}
      />
      {!!profile ? (
        <ScrollView
          style={{ padding: 10 }}
          contentContainerStyle={{ paddingTop: getLiquidPlusPadding() }}
        >
          <Card style={{ marginBottom: 10, padding: 16 }}>
            <ItchyText
              style={{
                fontWeight: "bold",
                color: colors.accent,
                fontSize: 16,
                marginBottom: 10,
              }}
            >
              About Me
            </ItchyText>
            <LinkifiedText
              style={{ color: colors.text }}
              text={profile.profile.bio}
            />
          </Card>
          <Card style={{ marginBottom: 10, padding: 16 }}>
            <ItchyText
              style={{
                fontWeight: "bold",
                color: colors.accent,
                fontSize: 16,
                marginBottom: 10,
              }}
            >
              What I'm Working On
            </ItchyText>
            <LinkifiedText
              style={{ color: colors.text }}
              text={profile.profile.status}
            />
          </Card>
          <Card style={{ marginBottom: 10, padding: 16 }}>
            <ItchyText style={{ color: colors.text }}>
              Joined{" "}
              <ItchyText style={{ fontWeight: "bold" }}>
                {timeago.ago(profile.history.joined)}
              </ItchyText>{" "}
              | from{" "}
              <ItchyText style={{ fontWeight: "bold" }}>
                {profile.profile.country} {flag(profile.profile.country)}
              </ItchyText>
            </ItchyText>
          </Card>
        </ScrollView>
      ) : <></>}
    </SafeAreaView>
  );
}
