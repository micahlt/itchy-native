import React, { useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { useMMKVBoolean } from 'react-native-mmkv';
import { lightColors, darkColors } from './colors';
import { dimensions } from './dimensions';

export const ThemeContext = React.createContext({
    isDark: false,
    colors: lightColors,
    dimensions: dimensions,
    setScheme: () => { },
});

export const ThemeProvider = (props) => {
    const colorScheme = useColorScheme(); // Can be dark | light | no-preference

    // Allow a persistent override to force dark mode even if the OS isn't dark.
    const [forceDark] = useMMKVBoolean('forceDark');

    const [isDark, setIsDark] = React.useState(undefined);

    // Listening to changes of device appearance or the stored override while in run-time
    React.useEffect(() => {
        // If the user has explicitly forced dark, respect that and do not follow the OS.
        if (forceDark === true) {
            setIsDark(true);
            return;
        } else {
            setIsDark(colorScheme == 'dark');
        }
    }, [colorScheme, forceDark]);

    const defaultTheme = useMemo(() => {
        return {
            isDark,
            // Chaning color schemes according to theme
            colors: isDark ? darkColors : lightColors,
            dimensions: dimensions,
            // Overrides the isDark value will cause re-render inside the context.  
            setScheme: (scheme) => setIsDark(scheme === "dark"),
        }
    }, [isDark])

    return (
        <ThemeContext.Provider value={defaultTheme}>
            {props.children}
        </ThemeContext.Provider>
    );
};

// Custom hook to get the theme object returns {isDark, colors, setScheme}
export const useTheme = () => React.useContext(ThemeContext);