"use client";

import { Button } from '@/components/ui/button';
import { createClient } from '@/utils/supabase/client';
import { RealtimeChannel, RealtimePostgresUpdatePayload, User } from '@supabase/supabase-js';
import { Star } from 'lucide-react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

interface LobbyMemberData {
    host_id: string;
    guests: {
        uid: string;
        name: string;
    }[];
}

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
    const name = searchParams.get("uname") ?? "Anonymous";
    const password = searchParams.get("pwd");
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

    const supabase = createClient();

    const [membersPresent, setMembersPresent] = useState<{ uid: string, name: string }[]>(() => []);
    const [kickedUsers, setKickedUsers] = useState<string[]>(() => []);  // TODO: This doesn't preserve state when rerendering

    // For debugging, print out current state of lobbyState and membersPresent and kickedUsers)
    useEffect(() => {
        console.log("membersPresent", membersPresent);
    }, [membersPresent]);
    useEffect(() => {
        console.log("kickedUsers", kickedUsers);
    }, [kickedUsers]);

    // Create realtime channel to communicate with lobber members / respond to join requests
    const [channel, setChannel] = useState<RealtimeChannel | null>(null);
    useEffect(() => {
        if (!user) {
            return;
        }

        const channel = supabase.channel("lobby-" + host);

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

        if (user.id === host) {
            // Watch for new users trying to join
            channel.on(
                "broadcast",
                { event: "join" },
                async (payload) => {
                    const { uid, name, password } = payload.payload;
                    console.log("Received join message", payload);
                    // Update the lobby
                    // TODO: Deal with password
                    // if (password !== myLobbyPassword) {
                    //     console.log("Wrong password");
                    //     return;
                    // }
                    if (membersPresent.map((m) => m.uid).includes(uid)) {
                        console.error("User already in lobby");
                        informJoiner(uid, false);
                        return;
                    }
                    console.log(kickedUsers, uid);
                    if (kickedUsers.includes(uid)) {
                        console.error("User already kicked");
                        informJoiner(uid, false);
                        return;
                    }
                    // TODO: Add to lobbyMembers table
                    // Inform the new member that they've been admitted
                    informJoiner(uid, true);
                }
            );
        } else {
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
            )
        }

        channel.on(
            "presence",
            { event: "sync" },
            () => {
                const presenceState = channel.presenceState();
                console.log("Received presence sync", presenceState);
                let membersPresent = Object.values(presenceState)
                    .flatMap((entry) => Object.values(entry).map((x) => 'uid' in x && 'name' in x ? { uid: x.uid, name: x.name } : null))
                    .filter(x => x !== null) as { uid: string, name: string }[];
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
            channel.track({ uid: user.id, name });
        });

        setChannel(channel);

        return () => {
            console.log("Leaving lobby channel");
            channel.unsubscribe();
        }
    }, [user]);

    function kickUser(uid: string) {
        if (!channel) {
            console.error("Channel is null when kicking user");
            return;
        }
        // Remove user from lobby
        supabase.from("lobbyMembers")
            .update({ members: membersPresent.filter(m => m.uid !== uid) })
            .eq("host_id", host)
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

    if (!user) {
        return <div>Loading...</div>
    }

    return (
        <div className="flex flex-col gap-8">
            <h1>{user.id === host ? "Hosted lobby" : "Guest lobby"}</h1>
            {password ? <p>Password: {password}</p> : null}
            <div>
                <h2>Members</h2>
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
            <div className="flex flex-row justify-end">
                <Button className="" onClick={() => { router.push("/multiplayer") }}>Exit lobby</Button>
            </div>
        </div>
    );
}