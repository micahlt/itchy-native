import { ScrollView, TextInput, Platform, Alert, View } from "react-native";
import ItchyText from "../../../components/ItchyText";
import { useTheme } from "../../../utils/theme";
import { useEffect, useState } from "react";
import { useLocalSearchParams, router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import ScratchAPIWrapper from "../../../utils/api-wrapper";
import Card from "../../../components/Card";
import { SafeAreaView } from "react-native-safe-area-context";
import { getLiquidPlusPadding } from "../../../utils/platformUtils";
import TexturedButton from "components/TexturedButton";
import { useMMKVString } from "react-native-mmkv";
import { Image } from "expo-image";

export default function Edit() {
  const { username } = useLocalSearchParams();
  const { colors, dimensions } = useTheme();
  const [aboutMe, setAboutMe] = useState<string>("");
  const [wiwo, setWIWO] = useState<string>("");
  const [userID, setUserID] = useState<number>();
  const [saving, setSaving] = useState<boolean>(false);
  const [didGetProfile, setDidGetProfile] = useState<boolean>(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [pendingImage, setPendingImage] = useState<{
    uri: string;
    type: string;
    fileName: string;
  } | null>(null);
  const [csrf] = useMMKVString("csrfToken");

  useEffect(() => {
    ScratchAPIWrapper.user
      .getProfile(username as string)
      .then((d) => {
        setAboutMe(d.profile.bio);
        setWIWO(d.profile.status);
        setUserID(d.id);
        setDidGetProfile(true);
      })
      .catch(console.error);
  }, [username]);

  const uploadImage = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert(
          "Permission Required",
          "You've refused to allow Itchy to access your photos.",
        );
        return;
      }

      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
        exif: false,
      });

      if (
        !pickerResult.canceled &&
        pickerResult.assets &&
        pickerResult.assets.length > 0
      ) {
        const asset = pickerResult.assets[0];
        let uri = asset.uri;

        if (asset.width > 500 || asset.height > 500) {
          console.log("Downsizing image to 500x500");
          const context = ImageManipulator.ImageManipulator.manipulate(
            asset.uri,
          );
          context.resize({ width: 500, height: 500 });
          const renderedImage = await context.renderAsync();
          const manipResult = await renderedImage.saveAsync({
            compress: 1,
            format: ImageManipulator.SaveFormat.PNG,
          });
          uri = manipResult.uri;
        }

        const type = asset.mimeType || "image/png";
        const fileName =
          asset.fileName || uri.split("/").pop() || "profile.png";

        setImageUri(uri);
        setPendingImage({ uri, type, fileName });
      }
    } catch (e: any) {
      console.error(e);
      Alert.alert(
        "Error",
        "Failed to select and process the image: " + e.message,
      );
    }
  };

  const saveChanges = async () => {
    setSaving(true);
    try {
      const contentSuccess = await ScratchAPIWrapper.user.setProfileContent(
        username as string,
        aboutMe,
        wiwo,
        csrf as string,
      );

      if (!contentSuccess) {
        throw new Error("Failed to save profile text.");
      }

      if (pendingImage) {
        const picSuccess = await ScratchAPIWrapper.user.setProfilePicture(
          username as string,
          pendingImage.uri,
          pendingImage.type,
          pendingImage.fileName,
          csrf as string,
        );

        if (!picSuccess) {
          throw new Error("Failed to upload profile picture.");
        }
        setPendingImage(null);
      }
      await Image.clearDiskCache();
      await Image.clearMemoryCache();
      router.replace({
        pathname: `/users/${username}`,
      });
    } catch (e: any) {
      console.error(e);
      Alert.alert(
        "Error saving profile",
        e.message || "An unknown error occurred.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView
      edges={["bottom"]}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      {!!didGetProfile ? (
        <ScrollView
          style={{ padding: 10 }}
          contentContainerStyle={{ paddingTop: getLiquidPlusPadding() }}
        >
          <Card
            style={{
              marginBottom: 10,
              padding: 16,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "flex-start",
            }}
          >
            <Image
              source={{
                uri:
                  imageUri ||
                  `https://uploads.scratch.mit.edu/get_image/user/${userID}_500x500.png`,
              }}
              style={{
                width: 100,
                height: 100,
                borderRadius: dimensions.smallRadius,
              }}
            />
            <TexturedButton
              loading={saving}
              icon="image"
              iconSide="left"
              style={{
                marginHorizontal: "auto",
                paddingHorizontal: 10,
              }}
              size={14}
              onPress={uploadImage}
            >
              Upload new...
            </TexturedButton>
          </Card>
          <Card style={{ marginBottom: 10, padding: 16 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <ItchyText
                style={{
                  fontWeight: "bold",
                  color: colors.accent,
                  fontSize: 16,
                }}
              >
                About Me
              </ItchyText>
              <ItchyText
                style={{
                  fontSize: 12,
                  color: colors.chipColor,
                  marginRight: 12,
                }}
              >
                {aboutMe.length}/200
              </ItchyText>
            </View>
            <TextInput
              multiline={true}
              maxLength={200}
              style={{
                color: colors.text,
                backgroundColor: colors.backgroundTertiary,
                borderRadius: dimensions.smallRadius,
                borderWidth: dimensions.outlineWidth,
                borderColor: colors.outline,
                fontFamily: Platform.select({
                  android: "Inter_400Regular",
                  ios: "Inter-Regular",
                }),
              }}
              value={aboutMe}
              onChangeText={(v) => setAboutMe(v)}
            />
          </Card>
          <Card style={{ marginBottom: 10, padding: 16 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <ItchyText
                style={{
                  fontWeight: "bold",
                  color: colors.accent,
                  fontSize: 16,
                }}
              >
                What I'm Working On
              </ItchyText>
              <ItchyText
                style={{
                  fontSize: 12,
                  color: colors.chipColor,
                  marginRight: 12,
                }}
              >
                {wiwo.length}/200
              </ItchyText>
            </View>
            <TextInput
              multiline={true}
              maxLength={200}
              style={{
                color: colors.text,
                backgroundColor: colors.backgroundTertiary,
                borderRadius: dimensions.smallRadius,
                borderWidth: dimensions.outlineWidth,
                borderColor: colors.outline,
                fontFamily: Platform.select({
                  android: "Inter_400Regular",
                  ios: "Inter-Regular",
                }),
              }}
              value={wiwo}
              onChangeText={(v) => setWIWO(v)}
            />
          </Card>
          <TexturedButton
            loading={saving}
            icon="save"
            iconSide="left"
            style={{
              marginLeft: "auto",
              paddingHorizontal: 10,
              backgroundColor: colors.accent,
            }}
            onPress={saveChanges}
            textStyle={{ color: "white" }}
          >
            Save Changes
          </TexturedButton>
        </ScrollView>
      ) : (
        <></>
      )}
    </SafeAreaView>
  );
}
