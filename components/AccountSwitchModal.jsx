import { Modal, View, Animated, Easing } from 'react-native';
import React, { useEffect, useRef } from 'react';
import ItchyText from './ItchyText';

export default function AccountSwitchModal({ visible }) {
    const spinValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            spinValue.setValue(0);

            Animated.loop(
                Animated.timing(spinValue, {
                    toValue: 1,
                    duration: 1000,
                    easing: Easing.linear,
                    useNativeDriver: true,
                })
            ).start();
        } else {
            spinValue.stopAnimation();
        }
    }, [visible]);

    const spin = spinValue.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", "360deg"],
    });

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
        >
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
                <Animated.Image
                    source={require('../assets/logo-transparent.png')}
                    style={{
                        width: 100,
                        height: 100,
                        transform: [
                            { rotate: spin }
                        ]
                    }}
                />
                <ItchyText style={{ color: 'white', marginTop: 20, fontSize: 18, fontWeight: 'bold' }}>Switching accounts...</ItchyText>
            </View>
        </Modal>
    );
}
