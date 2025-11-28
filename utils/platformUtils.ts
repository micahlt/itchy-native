import { Platform } from "react-native";

/**
 * Check if the device is running iOS 26 or higher (Liquid Plus)
 * iOS 26+ requires additional top padding for modals and sheets
 * @returns {boolean} True if device is iOS 26+
 */
export const isLiquidPlus = (): boolean => {
  return Platform.OS === "ios" && parseInt(Platform.Version, 10) >= 26;
};

/**
 * Get the appropriate top padding for iOS 26+ screens
 * @param {number} defaultPadding - Padding to use for non-iOS26+ devices (default: 0)
 * @param {number} liquidPlusPadding - Padding to use for iOS 26+ devices (default: 60)
 * @returns {number} The appropriate padding value
 */
export const getLiquidPlusPadding = (
  defaultPadding: number = 0,
  liquidPlusPadding: number = 60
): number => {
  return isLiquidPlus() ? liquidPlusPadding : defaultPadding;
};
