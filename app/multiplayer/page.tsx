"use client";

import { SubmitButton } from "@/components/submit-button";
import { createClient } from "@/utils/supabase/client";
import { RealtimeChannel, RealtimePostgresDeletePayload, RealtimePostgresInsertPayload, RealtimePostgresUpdatePayload } from "@supabase/supabase-js";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createLobbyAction } from "../actions";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronUp, Lock } from "lucide-react";

interface LobbyData {
    host_id: string;
    name: string;
    has_password: boolean;
    created_at: string;
}

function LobbyJoinForm({
    lobby,
    joinFunc,
    state,
}: {
    lobby: LobbyData,
    joinFunc: (host_id: string, name: string, password: string) => void,
    state: "pending" | "active" | "disabled",
}) {
    const [myName, setMyName] = useState("");
    const [password, setPassword] = useState("");

    function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        joinFunc(lobby.host_id, myName, password);
    }

    return (
        <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2 items-center">
                <Input
                        type="text"
                        placeholder="Your name"
                        required
                        minLength={3}
                        maxLength={16}
                        onChange={e => setMyName(e.target.value)}
                    />
            
            {lobby.has_password ? (
                <Input
                type="text"
                placeholder="Password"
                required
                maxLength={32}
                onChange={e => setPassword(e.target.value)}
            />
            ) : null}
            <SubmitButton className="w-1/2 sm:w-auto my-2" disabled={state !== "active"}>{state === "pending" ? "Joining..." : "Join"}</SubmitButton>
        </form>
    )
}

function Lobby({
    lobby,
    joinFunc,
    state,
}: {
    lobby: LobbyData,
    joinFunc: (host_id: string, name: string, password: string) => void,
    state: "active" | "pending" | "disabled"
}) {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className={"flex flex-col gap-4 p-4 sm:p-6" + (expanded ? " bg-card" : "")}>
            <button className="flex flex-row gap-2 justify-between items-center" onClick={() => setExpanded(expanded => !expanded)}>
                <div>Host: <span className="mx-2 font-bold">{lobby.name}</span></div>
                <div className="flex flex-row gap-2 items-center">
                    {lobby.has_password ? <Lock /> : null}
                    {expanded ? <ChevronUp /> : <ChevronDown />}
                </div>
            </button>
            {expanded ? (
                <LobbyJoinForm
                    lobby={lobby}
                    joinFunc={joinFunc}
                    state={state}
                />
            ) : null}
        </div>
    );
}

function Lobbies({
    lobbies,
    joinFunc,
    lobbyJoinRequested,
}: {
    lobbies: LobbyData[] | null,
    joinFunc: (host_id: string, name: string, password: string) => void,
    lobbyJoinRequested: string | null
}) {
    if (lobbies === null) {
        return <div className="text-center m-4">Loading...</div>;
    } else if (lobbies.length === 0) {
        return <div className="text-center m-4">No lobbies found</div>;
    }

    return (
        <div className="flex flex-col mx-4 divide-y">
            {lobbies.map((lobby) => {
                let state: "active" | "pending" | "disabled";
                if (lobbyJoinRequested === null) {
                    state = "active";
                } else if (lobbyJoinRequested === lobby.host_id) {
                    state = "pending";
                } else {
                    state = "disabled";
                }
                return <Lobby key={lobby.name} lobby={lobby} joinFunc={joinFunc} state={state} />;
            })}
        </div>
    );
}

export default function MultiplayerPage() {
    const router = useRouter();
    const [lobbyName, setLobbyName] = useState("");
    const [lobbyPassword, setLobbyPassword] = useState("");
    const [lobbies, setLobbies] = useState<LobbyData[] | null>(null);

    const supabase = useMemo(() => createClient(), []);

    // Load the initial list of lobbies
    const twoHoursBefore = new Date();
    twoHoursBefore.setHours(twoHoursBefore.getHours() - 2);
    useEffect(() => {
        supabase.from("lobbies")
            .select("*")
            .gte("created_at", twoHoursBefore.toISOString())
            .then(({ data, error }) => {
                if (error) {
                    console.error(error);
                    return;
                }
                setLobbies(data);
            });
    }, []);

    // Listen to changes to the "lobbies" table
    // Unsubscribe when the component unmounts
    useEffect(() => {
        const channel = supabase
            .channel("lobbies")
            .on("postgres_changes", { event: "INSERT", schema: "public", table: "lobbies" }, handleLobbyInsert)
            .on("postgres_changes", { event: "DELETE", schema: "public", table: "lobbies" }, handleLobbyDelete)
            .on("postgres_changes", { event: "UPDATE", schema: "public", table: "lobbies" }, handleLobbyUpdate)
            .subscribe();

        return () => {
            channel.unsubscribe();
        };
    }, []);

    const [createLobbyError, setCreateLobbyError] = useState<string | null>(null);

    async function createLobby(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        console.log("createLobby", lobbyName, lobbyPassword);

        const user = (await supabase.auth.getUser())?.data.user;
        if (!user) {
            console.error("No user when creating lobby.");
            return;
        }

        // Form validation
        // TODO

        // Create lobby
        const error = await createLobbyAction(lobbyName, lobbyPassword !== "");

        if (error) {
            console.error(error);
            switch (error.code) {
                case "23505":
                    setCreateLobbyError("A lobby with this name already exists. Choose a unique lobby name.");
                    break;
                default:
                    setCreateLobbyError("An error occurred while creating the lobby");
                    break;
            }
            return;
        }
        // Go to lobby
        const lobbyPath = `/multiplayer/lobby/${user.id}?uname=${lobbyName}${lobbyPassword ? `&pwd=${lobbyPassword}` : ""}`;
        router.push(lobbyPath);
    }

    const [lobbyJoinRequested, setLobbyJoinRequested] = useState<{ hostID: string, channel: RealtimeChannel } | null>(null);

    // Clean up join request channel when component unmounts
    useEffect(() => {
        return () => {
            if (lobbyJoinRequested) {
                lobbyJoinRequested.channel.unsubscribe();
            }
        };
    }, [lobbyJoinRequested]);

    async function sendLobbyJoinRequest(hostID: string, name: string, password: string) {
        const user = (await supabase.auth.getUser())?.data.user;
        if (!user) {
            console.error("User not logged in when sending lobby join request");
            return;
        }

        // TODO: Form validation

        const channel = supabase.channel("lobby-request:" + hostID);
        channel.subscribe((status) => {
            if (status !== "SUBSCRIBED") {
                console.error("Failed to subscribe to lobby", hostID, status);
                return;
            }
            setLobbyJoinRequested({ hostID, channel });
            channel.send({
                type: "broadcast",
                event: "join",
                payload: {
                    uid: user.id,
                    name,
                    password: password.length > 0 ? password : null
                }
            });
            // Listen for an admission response
            channel.on(
                "broadcast",
                { event: "joinResponse" },
                (payload) => {
                    const { uid, admitted } = payload.payload;
                    console.log("Received join response", payload);
                    if (uid !== user.id) {
                        // Not for me!
                        return;
                    }
                    // Unsubscribe whether admitted or rejected
                    channel.unsubscribe();
                    if (admitted) {
                        // Go to the lobby
                        router.push(`/multiplayer/lobby/${hostID}?uname=${name}`);
                        return;
                    }
                    setLobbyJoinRequested(null);
                }
            );

            // Unsubscribe if timed out
            const timeoutMilliseconds = 5_000;
            setTimeout(() => {
                channel.unsubscribe();
                setLobbyJoinRequested(null);
            }, timeoutMilliseconds);
        });
    }

    function handleLobbyInsert(payload: RealtimePostgresInsertPayload<LobbyData>) {
        console.log("received Insert payload", payload);
        setLobbies(lobbies => [...(lobbies ?? []), payload.new]);
    }

    function handleLobbyDelete(payload: RealtimePostgresDeletePayload<LobbyData>) {
        console.log("received Delete payload", payload);
        setLobbies(lobbies => lobbies?.filter(lobby => lobby.host_id !== payload.old.host_id) ?? []);
    }

    function handleLobbyUpdate(payload: RealtimePostgresUpdatePayload<LobbyData>) {
        console.log("received Update payload", payload);
        setLobbies(lobbies => {
            return lobbies?.map(lobby => {
                if (lobby.host_id === payload.old.host_id) {
                    return payload.new;
                }
                return lobby;
            }) ?? [];
        });
    }

    return (
        <div className="flex flex-col gap-8 sm:gap-16 w-full sm:max-w-3xl p-4">
            <form className="flex flex-col sm:max-w-xl self-center gap-4 p-5 bg-card border rounded" onSubmit={createLobby}>
                <h2 className="text-lg sm:text-2xl">Create a new lobby</h2>
                <label className="flex flex-row flex-wrap justify-between items-center gap-x-4">
                    Your name:
                    <Input
                        type="text"
                        className=""
                        required
                        maxLength={16}
                        onChange={e => setLobbyName(e.target.value)}
                    />
                </label>
                <label className="flex flex-row flex-wrap justify-between items-center gap-x-4">
                    Lobby password:
                    <Input
                        type="text"
                        className=""
                        value={lobbyPassword}
                        maxLength={32}
                        onChange={e => setLobbyPassword(e.target.value)}
                        placeholder="Optional"
                    />
                </label>

                <SubmitButton pendingText="Creating...">Create</SubmitButton>

                {createLobbyError ? <p className="text-destructive">{createLobbyError}</p> : null}
            </form>

            <div>
                <h2 className="text-lg sm:text-2xl border-b border-border">Lobbies</h2>
                <div className="m-2">
                    <Lobbies lobbies={lobbies} joinFunc={sendLobbyJoinRequest} lobbyJoinRequested={lobbyJoinRequested?.hostID ?? null} />
                </div>
            </div>
        </div>
    )
}
