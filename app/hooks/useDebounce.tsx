import { useEffect, useState } from "react";

export default function useDebounce<T>(initialValue: T, delay?: number) {
    const [debouncedValue, setDebouncedValue]= useState<T>(initialValue);
    const [realTimeValue, setRealTimeValue]= useState<T>(initialValue);

    useEffect(()=> {
        const timeout= setTimeout(()=> {
            setDebouncedValue(realTimeValue);
        }, delay||1500);

        return ()=> {
            clearTimeout(timeout);
        }
    }, [realTimeValue]);

    return {debouncedValue, setRealTimeValue};
};