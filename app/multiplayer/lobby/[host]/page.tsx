"use client";

import { Button } from '@/components/ui/button';
import { createClient } from '@/utils/supabase/client';
import { RealtimePostgresUpdatePayload, User } from '@supabase/supabase-js';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

interface LobbyMemberData {
    host_id: string;
    members: {
        uid: string;
        name: string;
    }[];
}

function UserList({ myUID, initialLobbyState, isHost }: { myUID: string, initialLobbyState: LobbyMemberData, isHost: boolean }) {
    const searchParams = useSearchParams();
    const password = searchParams.get("pwd");   

    const supabase = createClient();

    // Load the initial lobby state, only on initial render
    const [lobbyState, setLobbyState] = useState<LobbyMemberData>(() => initialLobbyState);
    const [membersPresent, setMembersPresent] = useState<string[]>([]);

    // Listen for changes to the lobby state
    supabase.channel("lobbyMembers")
        .on(
            "postgres_changes",
            { event: "UPDATE", schema: "public", table: "lobbyMembers", filter: `host_id=eq.${myUID}` },
            (payload: RealtimePostgresUpdatePayload<LobbyMemberData>) => {
                console.log("received Update payload", payload);
                setLobbyState(payload.new);
            }
        )
        .subscribe();

    // Create realtime channel to communicate with lobber members / respond to join requests
    // Memoize so it's only initialized once
    const channel = useMemo(() => {
        const channel = supabase.channel("lobby-" + initialLobbyState.host_id);

        function informJoiner(recipientUID: string, admitted: boolean) {
            channel.send({
                type: "broadcast",
                event: "joinResponse",
                payload: {
                    uid: recipientUID,
                    admitted
                }
            });
        }

        if (isHost) {
            // Watch for new users trying to join
            channel.on(
                "broadcast",
                { event: "join" },
                async (payload) => {
                    if (!lobbyState) {
                        console.error("lobbyState is undefined");
                        return;
                    }
                    const { uid, name, password } = payload.payload;
                    console.log("Received join message", payload);
                    // Update the lobby
                    // TODO: Deal with password
                    // if (password !== myLobbyPassword) {
                    //     console.log("Wrong password");
                    //     return;
                    // }
                    if (lobbyState.members.map((m) => m.uid).includes(uid)) {
                        console.error("User already in lobby");
                        informJoiner(uid, false);
                        return;
                    }
                    const newMember = {
                        uid: uid as string,
                        name: name as string,
                    };
                    const members = [...lobbyState.members, newMember];
                    console.log("members", members);
                    const { error } = await supabase.from("lobbyMembers").update(
                        { members }
                    ).eq('host_id', myUID);
                    if (error) {
                        console.error(error);
                        return;
                    }
                    // Inform the new member that they've been admitted
                    informJoiner(uid, true);
                }
            );
        }

        // Keep track of who's currently in the lobby
        channel
            .on(
                "presence",
                { event: "sync" },
                () => {
                    const presenceState = channel.presenceState();
                    console.log("Received presence sync", presenceState);
                    let membersPresent = Object.values(presenceState)
                        .flatMap((entry) => Object.values(entry).map((x) => 'uid' in x ? x.uid : null))
                        .filter(x => x !== null) as string[];
                    setMembersPresent(membersPresent);
                }
            )
            .on(
                "presence",
                { event: "join" },
                ({ key, newPresences }) => {
                    console.log("Received presence join", key, newPresences);
                    setMembersPresent((members) => {
                        const newMembers: string[] = [];
                        Object.values(newPresences).forEach((value) => {
                            const uid = value.uid;
                            if (!uid || members.includes(uid)) {
                                return;
                            }
                            newMembers.push(uid);
                        });
                        return [...members, ...newMembers];
                    });
                }
            )
            .on(
                "presence",
                { event: "leave" },
                ({ key, leftPresences }) => {
                    console.log("Received presence leave", key, leftPresences);
                    const leftMembers: string[] = [];
                    Object.values(leftPresences).forEach((value) => {
                        const uid = value.uid;
                        if (!uid) {
                            return;
                        }
                        leftMembers.push(uid);
                    });
                    setMembersPresent(members => members.filter(x => !leftMembers.includes(x)));
                }
            );

        channel.subscribe(async (status) => {   
                if (status !== "SUBSCRIBED") {
                    console.error("Failed to subscribe to channel", status);
                    return;
                }

                const presenceTrackStatus = await channel.track({
                    uid: myUID,
                    online_at: new Date().toISOString(),
                });
                console.log("Got status from presence tracker", presenceTrackStatus);
            });

            return channel;
        },
        []
    );

    return (
        <div className="flex flex-col gap-8">
            <h1>{isHost ? "Hosted lobby" : "Guest lobby"}</h1>
            {password ? <p>Password: {password}</p> : null}
            <div>
            <h2>Members</h2>
                <div className="flex flex-col m-2 gap-4">
                    {lobbyState?.members.map(({ uid, name }) => (
                        <div key={uid}>{name}{uid === myUID ? " (you)" : ""}{membersPresent.includes(uid) ? " (present)" : ""}</div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function Page() {
    console.log("Loading page");
    const { host } = useParams<{ host: string }>();
    const router = useRouter();

    const [user, setUser] = useState<User | null>(null);

    const supabase = createClient();

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (!user) {
                console.error("User not logged in when joining lobby");
                return;
            }
            setUser(user);
        });
    }, []);

    const [initialLobbyState, setInitialLobbyState] = useState<LobbyMemberData | null>(null);
    const [errorText, setErrorText] = useState<string | null>(null);

    // Get initial lobby data
    useEffect(() => {
        // Get lobby with host_id = uid
        supabase.from("lobbyMembers")
            .select("*")
            .eq("host_id", host)
            .single()
            .then(({ data, error }) => {
                if (error) {
                    console.error(error);
                    switch (error.code) {
                        case "PGRST116":
                            setErrorText("Lobby not found. It may exist, but you have not received an invite.");
                            break;
                        default:
                            setErrorText("An error occurred while joining the lobby");
                            break;
                    }
                    return;
                }
                setInitialLobbyState(data);
            });
    }, []);

    if (errorText) {
        return (
            <div className="text-center">
                <div className="m-4">
                    {errorText}
                </div>
                <Button onClick={() => router.push("/multiplayer")}>Go back</Button>
            </div>
        );
    }

    if (user === null || initialLobbyState === null) {
        return (
            <div>
                Loading...
            </div>
        );
    }

    return (
        <UserList myUID={user.id} initialLobbyState={initialLobbyState} isHost={user.id === host} />
    );
}