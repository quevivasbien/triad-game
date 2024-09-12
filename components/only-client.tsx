"use client";

import { useEffect, useState } from "react";

export default function OnlyClient({ children }: { children: React.ReactNode }) {
    const [isClient, setIsClient] = useState(false);
    useEffect(() => {
        setIsClient(true);
    }, []);
    return isClient ? <>{children}</> : null;
}