import { useState, useEffect } from 'react';

interface PanelStyle {
    width: string;
    top: string | number;
    height: string;
}

/**
 * A hook to calculate the dynamic style for the side panel,
 * accounting for fullscreen mode and mobile viewports.
 * @param isPanelFullscreen - Whether the panel is in fullscreen mode.
 * @param panelWidth - The current width of the panel in pixels.
 * @param headerHeightRem - The height of the main application header in rem units.
 * @returns An object with the calculated style and a boolean for mobile state.
 */
export const useDynamicPanelHeight = (
    isPanelFullscreen: boolean,
    panelWidth: number,
    headerHeightRem: number = 4 // Corresponds to h-16 in tailwind
): { style: PanelStyle; isMobile: boolean } => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 768;
            if (mobile !== isMobile) {
                setIsMobile(mobile);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isMobile]);

    const effectiveFullscreen = isPanelFullscreen || isMobile;

    const style: PanelStyle = {
        width: effectiveFullscreen ? '100vw' : `${panelWidth}px`,
        top: effectiveFullscreen ? 0 : `${headerHeightRem}rem`,
        height: effectiveFullscreen ? '100vh' : `calc(100vh - ${headerHeightRem}rem)`,
    };

    return { style, isMobile };
};
