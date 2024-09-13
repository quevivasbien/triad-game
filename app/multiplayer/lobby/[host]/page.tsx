"use client";

import { createClient } from '@/utils/supabase/client';
import { RealtimePostgresUpdatePayload, User } from '@supabase/supabase-js';
import { useParams, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

interface LobbyData {
    host_id: string;
    created_at: Date;
    name: string;
    guest_ids: string[];
}

function HostPage({ myUID, initialLobbyState }: { myUID: string, initialLobbyState: LobbyData }) {
    console.log("loading host page");
    const searchParams = useSearchParams();
    const password = searchParams.get("pwd");   

    const supabase = createClient();

    // Load the initial lobby state, only on initial render
    const [lobbyState, setLobbyState] = useState<LobbyData>(() => initialLobbyState);

    // Listen for changes to the lobby state
    supabase.channel("lobbies")
        .on(
            "postgres_changes",
            { event: "UPDATE", schema: "public", table: "lobbies", filter: `host_id=eq.${myUID}` },
            (payload: RealtimePostgresUpdatePayload<LobbyData>) => {
                console.log("received Update payload", payload);
                setLobbyState(payload.new);
            }
        )
        .subscribe();

    // Watch for new users trying to join
    supabase.channel("lobby-" + initialLobbyState.name)
        .on(
            "broadcast",
            { event: "join" },
            async (payload) => {
                if (!lobbyState) {
                    console.error("lobbyState is undefined");
                    return;
                }
                const { uid, password } = payload.payload;
                console.log("Received join message", payload);
                // Update the lobby
                // TODO: Deal with password
                // if (password !== myLobbyPassword) {
                //     console.log("Wrong password");
                //     return;
                // }
                if (lobbyState.guest_ids.includes(uid as string)) {
                    console.error("User already in lobby");
                    return;
                }
                const guest_ids = [...lobbyState.guest_ids, uid as string];
                console.log("guest_ids", guest_ids);
                const { error } = await supabase.from("lobbies").update(
                    { guest_ids }
                ).eq('host_id', myUID);
                console.log("error", error);
                if (error) {
                    console.error(error);
                    return;
                }
            }
        )
        .subscribe();

    return (
        <div className="flex flex-col gap-8">
            <h1>Hosted lobby</h1>
            {lobbyState?.name}
            {password ? <p>Password: {password}</p> : null}
            <div className="flex flex-col gap-4">
                {lobbyState?.guest_ids.map((uid) => (
                    <div key={uid}>{uid}</div>
                ))}
            </div>
        </div>
    )
}

function GuestPage({ myUID, lobbyData }: { myUID: string, lobbyData: LobbyData }) {
    console.log("loading guest page");
    return (
        <div>
            <h1>Guest lobby</h1>
        </div>
    )
}

export default function Page() {
    console.log("Loading page");
    const { host } = useParams<{ host: string }>();

    const [user, setUser] = useState<User | null>(null);

    const supabase = createClient();

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (!user) {
                console.error("User not logged in");
                return;
            }
            setUser(user);
        });
    }, []);

    const [initialLobbyState, setInitialLobbyState] = useState<LobbyData | null>(null);

    // Get initial lobby data
    useEffect(() => {
        // Get lobby with host_id = uid
        supabase.from("lobbies")
            .select("*")
            .eq("host_id", host)
            .single()
            .then(({ data, error }) => {
                if (error) {
                    console.error(error);
                    return;
                }
                setInitialLobbyState(data);
            });
    }, []);

    if (user === null || initialLobbyState === null) {
        return (
            <div>
                Loading...
            </div>
        );
    }

    return (
        (user.id === host) ? (
            <HostPage myUID={user.id} initialLobbyState={initialLobbyState} /> 
        ) : (
            <GuestPage myUID={user.id} lobbyData={initialLobbyState} />
        )
    );
}