"use client"

import { useEffect, useState } from "react";

export const useBreakpoint = (threshold: number) => {
    const [deviceSize, setDeviceSize] = useState<"sm" | "lg">("sm");

    useEffect(() => {
        const handleResize = () => {
            setDeviceSize((window.innerWidth > threshold) ? "lg" : "sm");
        };
        window.addEventListener('resize', handleResize);
        handleResize();

        return () => {
            window.removeEventListener('resize', handleResize);
        }
    }, [threshold]);

    return deviceSize;
};