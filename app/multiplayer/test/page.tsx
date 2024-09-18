"use client";

import { createClient } from "@/utils/supabase/client";
import { RealtimeChannel, User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

export default function Page() {
    const supabase = createClient();

    const [user, setUser] = useState<User | null>(null);
    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (!user) {
                console.error("User not logged in when joining lobby");
                return;
            }
            setUser(user);
        });
    }, [])

    const [channel, setChannel] = useState<RealtimeChannel | null>(null);

    useEffect(() => {
        if (!user) {
            return;
        }
        const channel = supabase.channel("test-lobby");
        channel.subscribe((status) => {
            if (status !== "SUBSCRIBED") {
                console.error("Failed to subscribe to lobby", status);
                return;
            }
            channel.track({ uid: user.id });
            console.log("Subscribed to lobby channel");
        });

        channel.on(
            "presence",
            { event: "join" },
            ({ key, newPresences }) => {
                console.log("Received presence join", key, newPresences);
            }
        );

        channel.on(
            "presence",
            { event: "leave" },
            ({ key, leftPresences }) => {
                console.log("Received presence leave", key, leftPresences);
            }
        );

        channel.on(
            "presence",
            { event: "sync" },
            () => {
                console.log("Received presence sync", channel.presenceState());
            }
        );

        setChannel(channel);

        return () => {
            channel.unsubscribe();
            setChannel(null);
        };
    }, [user]);

    return <div>Page</div>;
}