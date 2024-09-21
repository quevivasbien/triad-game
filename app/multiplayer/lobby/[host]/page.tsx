"use client";

import { Button } from '@/components/ui/button';
import { extractValuesFromPresenceState } from '@/lib/utils';
import { createClient } from '@/utils/supabase/client';
import { RealtimeChannel, User } from '@supabase/supabase-js';
import { Star } from 'lucide-react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

function UserEntry(
    {
        uid,
        name,
        myUID,
        host,
        kickFn
    }: {
        uid: string,
        name: string,
        myUID: string,
        host: string,
        kickFn: (uid: string) => void
    }
) {
    const kickButton = myUID === "host" && uid !== myUID ? (
        <Button variant="secondary" onClick={() => kickFn(uid)}>Kick</Button>
    ) : null;
    const presentIcon = uid === host ? <abbr title="Host"><Star /></abbr> : null;
    return (
        <div className="flex flex-row items-center justify-between gap-2 p-2">
            <div className="text-lg">{name}{uid === myUID ? " (you)" : ""}</div>
            <div className="flex flex-row items-center gap-2">
                {kickButton}
                {presentIcon}
            </div>
        </div>
    );
}

export default function Page() {
    const { host } = useParams<{ host: string }>();
    const searchParams = useSearchParams();
    const myName = searchParams.get("uname") ?? "Anonymous";
    const lobbyPassword = searchParams.get("pwd");
    const router = useRouter();

    const [user, setUser] = useState<User | null>(null);
    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (!user) {
                console.error("User not logged in when joining lobby");
                return;
            }
            setUser(user);
        });
    }, []);

    const [errorText, setErrorText] = useState<string | null>(null);

    const supabase = useMemo(() => createClient(), []);

    const [membersPresent, setMembersPresent] = useState<{ uid: string, name: string }[]>(() => []);
    const [kickedUsers, setKickedUsers] = useState<string[]>(() => []);  // TODO: This doesn't preserve state when rerendering

    // For debugging, print out current state of lobbyState and membersPresent and kickedUsers)
    useEffect(() => {
        console.log("membersPresent", membersPresent);
    }, [membersPresent]);
    useEffect(() => {
        console.log("kickedUsers", kickedUsers);
    }, [kickedUsers]);

    // If host, watch the lobby-request channel for new join requests
    useEffect(() => {
        if (!user || user.id !== host) {
            return;
        }

        const channel = supabase.channel("lobby-request:" + host);

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

        // Watch for new users trying to join
        channel.on(
            "broadcast",
            { event: "join" },
            async (payload) => {
                const { uid, name, password } = payload.payload;
                console.log("Received join message", payload);
                if (password !== lobbyPassword) {
                    console.log("Wrong password");
                    informJoiner(uid, false);
                    return;
                }
                if (membersPresent.map((m) => m.uid).includes(uid)) {
                    console.error("User already in lobby");
                    informJoiner(uid, false);
                    return;
                }
                if (kickedUsers.includes(uid)) {
                    console.error("User already kicked");
                    informJoiner(uid, false);
                    return;
                }
                // User is allowed to join
                // Add the user to the lobbyMembers table
                const { error } = await supabase.from("lobbyMembers")
                    .upsert(
                        { guest_id: uid },
                        { onConflict: "host_id,guest_id", ignoreDuplicates: true }
                    );
                if (error) {
                    console.error("Error creating table entry for joiner:", error);
                    informJoiner(uid, false);
                    return;
                }
                // Inform the new member that they've been admitted
                informJoiner(uid, true);
            }
        );

        channel.subscribe((status) => {
            if (status !== "SUBSCRIBED") {
                console.error("Failed to subscribe to joiner's lobby", status);
            }
        });
        
        return () => {
            channel.unsubscribe();
        };
    }, [user]);

    // Create realtime channel to communicate with lobber members / respond to join requests
    const [channel, setChannel] = useState<RealtimeChannel | null>(null);
    useEffect(() => {
        if (!user) {
            return;
        }

        const channel = supabase.channel(
            "lobby:" + host,
            {
                config: { private: true }
            }
        );

        if (user.id !== host) {
            // Watch for kick events
            channel.on(
                "broadcast",
                { event: "kick" },
                async (payload) => {
                    const { uid } = payload.payload;
                    console.log("Received kick message", payload);
                    // Leave page if I've been kicked
                    if (user.id === uid) {
                        // TODO: Tell user what happened
                        router.push("/multiplayer");
                    }
                }
            );

            // Watch for start game events
            channel.on(
                "broadcast",
                { event: "start" },
                async (payload) => {
                    console.log("Received start message", payload);
                    // Go to the game page
                    router.push("/multiplayer/game/" + host);
                }
            );
        }

        channel.on(
            "presence",
            { event: "sync" },
            () => {
                const presenceState = channel.presenceState();
                console.log("Received presence sync", presenceState);
                let membersPresent = extractValuesFromPresenceState(
                    presenceState,
                    ["uid", "name"],
                    "uid"
                ) as { uid: string, name: string }[];
                setMembersPresent(membersPresent);
            }
        );

        channel.subscribe((status) => {
            if (status !== "SUBSCRIBED") {
                console.error("Failed to subscribe to channel", status);
                return;
            }
            console.log("Subscribed to lobby channel");

            // Sync state with other channel members
            channel.track({ uid: user.id, name: myName });
        });

        setChannel(channel);

        return () => {
            console.log("Leaving lobby channel");
            channel.unsubscribe();
        }
    }, [user]);

    function kickUser(uid: string) {
        if (!user || user.id !== host) {
            console.error("User is not host when kicking user");
            return;
        }
        if (!channel) {
            console.error("Channel is null when kicking user");
            return;
        }
        // Remove user from lobby
        supabase.from("lobbyMembers")
            .delete()
            .eq("host_id", host)
            .eq("guest_id", uid)
            .then(({ error }) => {
                if (error) {
                    console.error("Error kicking user", error);
                }
            });
        if (!channel) {
            console.error("Channel is null when kicking user");
            return;
        }
        // Send kick message in channel
        channel.send({
            type: "broadcast",
            event: "kick",
            payload: {
                uid
            }
        }).then((response) => {
            console.log("Sent kick message", response);
        });
        // Add to list of kicked users
        setKickedUsers(kickedUsers => [...kickedUsers, uid]);
    }

    async function startGame() {
        if (!channel) {
            console.error("Channel is null when starting game");
            return;
        }
        // Create game
        await supabase.from("games")
            .upsert(
                {
                    player_ids: membersPresent.map(m => m.uid),
                    player_names: membersPresent.map(m => m.name),
                },
                { ignoreDuplicates: false, onConflict: "host_id" }
            )
            .then(({ error }) => {
                if (error) {
                    console.error("Error creating game", error);
                }
            });

        // Inform users
        channel.send({
            type: "broadcast",
            event: "start",
        }).then((response) => {
            console.log("Sent start message, got response", response);
        });
        // Wait a bit, then delete lobby
        // Wait is necessary, since permission for channel depends on entry in lobbyMembers table still existing
        setTimeout(
            () => {
                supabase.from("lobbies")
                .delete()
                .eq("host_id", host)
                .then(({ error }) => {
                    if (error) {
                        console.error("Error deleting lobby", error);
                    } else {
                        console.log("Deleted lobby");
                    }
                });
            },
            2_500
        );

        router.push("/multiplayer/game/" + host);
    }

    function exitLobby() {
        // Clean up
        if (user && user.id === host) {
            // Delete lobby
            supabase.from("lobbies")
                .delete()
                .eq("host_id", host)
                .then(({ error }) => {
                    if (error) {
                        console.error("Error deleting lobby", error);
                    }
                });
        }
        router.push("/multiplayer");
    }

    if (!user) {
        return <div>Loading...</div>
    }

    return (
        <div className="flex flex-col sm:max-w-3xl mx-auto gap-8">
            <h1 className="text-3xl">Lobby</h1>
            {lobbyPassword ? <p>Password: {lobbyPassword}</p> : null}
            <div>
                <h2 className="text-xl">Members</h2>
                <div className="flex flex-col m-2 divide-y">
                    {membersPresent.map(({ uid, name }) => (
                        <UserEntry
                            key={uid}
                            uid={uid}
                            name={name}
                            myUID={user.id}
                            host={host}
                            kickFn={kickUser}
                        />
                    ))}
                </div>
            </div>
            <div className="flex flex-row justify-between">
                {user.id === host ? <Button className="" onClick={startGame}>Start game</Button> : <div />}
                <Button className="" onClick={exitLobby}>Exit lobby</Button>
            </div>
        </div>
    );
}