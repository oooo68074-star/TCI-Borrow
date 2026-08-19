'use client';

import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext({
    theme: 'dark',
    toggleTheme: () => { },
    glassOpacity: 0.35,
    changeGlassOpacity: () => { }
});

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState('dark');
    const [glassOpacity, setGlassOpacity] = useState(0.35);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
        const storedTheme = localStorage.getItem('borrowhub_theme') || 'dark';
        setTheme(storedTheme);
        document.documentElement.setAttribute('data-theme', storedTheme);

        const storedOpacity = localStorage.getItem('borrowhub_glass_opacity');
        if (storedOpacity) {
            setGlassOpacity(parseFloat(storedOpacity));
        }
    }, []);

    useEffect(() => {
        if (mounted) {
            document.documentElement.style.setProperty('--bg-glass-opacity', glassOpacity);

            // Auto-calculate panel opacity (Sidebar/Navbar) to be slightly more opaque than cards for readability
            // But if user forces it very low, it will still follow
            document.documentElement.style.setProperty('--bg-panel-opacity', Math.min(glassOpacity + 0.3, 0.95));
        }
    }, [glassOpacity, mounted]);

    const changeGlassOpacity = (val) => {
        setGlassOpacity(val);
        localStorage.setItem('borrowhub_glass_opacity', val);
    };

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        localStorage.setItem('borrowhub_theme', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
    };

    if (!mounted) return <>{children}</>;

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, glassOpacity, changeGlassOpacity }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);
