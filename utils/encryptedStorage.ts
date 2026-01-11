import { MMKV, Mode } from "react-native-mmkv";
import DeviceInfo from "react-native-device-info";

const encryptionKey: string = DeviceInfo.getUniqueIdSync();

const encryptedStorage: MMKV = new MMKV({
  encryptionKey: encryptionKey,
  id: "encryptedStorage",
  mode: Mode.SINGLE_PROCESS,
});

export default encryptedStorage;
