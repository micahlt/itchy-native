import { MMKV, Mode } from 'react-native-mmkv'
import DeviceInfo from 'react-native-device-info';

const encryptedStorage = new MMKV({
    encryptionKey: DeviceInfo.getUniqueIdSync(),
    id: 'encryptedStorage',
    mode: Mode.SINGLE_PROCESS
});

export default encryptedStorage;