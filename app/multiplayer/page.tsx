"use client";

import { SubmitButton } from "@/components/submit-button";
import { createClient } from "@/utils/supabase/client";
import { RealtimePostgresInsertPayload, RealtimePostgresUpdatePayload } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { createLobbyAction } from "../actions";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface LobbyData {
    host_id: string;
    created_at: Date;
    name: string;
    guest_ids: string[];
}

function Lobby({ lobby, joinFunc }: { lobby: LobbyData, joinFunc: (name: string, password: string) => void }) {
    // TODO: deal with password
    return (
        <div className="flex flex-row justify-between gap-4 items-center p-2">
            {lobby.name}
            <Button onClick={() => joinFunc(lobby.name, "")}>Join</Button>
        </div>
    );
}

function Lobbies({ lobbies, joinFunc }: { lobbies: LobbyData[] | null, joinFunc: (name: string, password: string) => void }) {
    return lobbies ? (
        <div className="flex flex-col mx-4 divide-y">
            {lobbies.map((lobby) => (
                <Lobby key={lobby.name} lobby={lobby} joinFunc={joinFunc} />
            ))}
        </div>
    ) : (
        <div>Loading...</div>
    );
}

export default function MultiplayerPage() {
    const router = useRouter();
    const [lobbyName, setLobbyName] = useState("");
    const [lobbyPassword, setLobbyPassword] = useState("");
    const [lobbies, setLobbies] = useState<LobbyData[] | null>(null);

    const supabase = createClient();

    // Load the initial list of lobbies
    useEffect(() => {
        supabase.from("lobbies").select("*").then(({ data, error }) => {
            if (error) {
                console.error(error);
                return;
            }
            setLobbies(data);
        });
    }, []);

    // Listen to changes to the "lobbies" table
    supabase
        .channel("lobbies")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "lobbies" }, handleLobbyInsert)
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "lobbies" }, handleLobbyUpdate)
        .subscribe();

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
        const error = await createLobbyAction(lobbyName);

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
        router.push(`/multiplayer/lobby/${user.id}`);
    }

    const [lobbyJoinRequested, setLobbyJoinRequested] = useState<string | null>(null);

    async function sendLobbyJoinRequest(lobbyName: string, password: string) {
        const user = (await supabase.auth.getUser())?.data.user;
        if (!user) {
            console.error("User not logged in");
            return;
        }
        const channel = supabase.channel("lobby-" + lobbyName);
        channel.subscribe((status) => {
            if (status !== "SUBSCRIBED") {
                console.error("Failed to subscribe to lobby", lobbyName, status);
                return;
            }
            setLobbyJoinRequested(lobbyName);
            channel.send({
                type: "broadcast",
                event: "join",
                payload: {
                    uid: user.id,
                    password: password.length > 0 ? password : null
                }
            });
        });
    }

    function handleLobbyInsert(payload: RealtimePostgresInsertPayload<LobbyData>) {
        console.log("received Insert payload", payload);
        setLobbies([...(lobbies ?? []), payload.new]);
    }

    function handleLobbyUpdate(payload: RealtimePostgresUpdatePayload<LobbyData>) {
        console.log("received Update payload", payload);
        const newLobbies = lobbies?.map(lobby => {
            if (lobby.host_id === payload.old.host_id) {
                return payload.new;
            }
            return lobby;
        }) ?? [];
        setLobbies(newLobbies);
    }

    return (
        <div className="flex flex-col gap-4 w-full sm:w-1/2 max-w-xl p-4">
            <h2 className="text-lg sm:text-2xl">Lobbies</h2>
            <Lobbies lobbies={lobbies} joinFunc={sendLobbyJoinRequest} />

            <form className="flex flex-col gap-4 p-5 bg-card border rounded" onSubmit={createLobby}>
                <h2 className="text-lg sm:text-2xl">Create a new lobby</h2>
                <label className="flex flex-row flex-wrap justify-between items-center gap-x-4">
                    Lobby name:
                    <input
                        type="text"
                        className="mt-1 rounded-md border border-border px-3 py-2 shadow-sm focus:border-accent focus:ring-accent"
                        required
                        maxLength={16}
                        onChange={e => setLobbyName(e.target.value)}
                    />
                </label>
                <label className="flex flex-row flex-wrap justify-between items-center gap-x-4">
                    Lobby password:
                    <input
                        type="password"
                        className="mt-1 rounded-md border border-border px-3 py-2 shadow-sm focus:border-accent focus:ring-accent"
                        value={lobbyPassword}
                        maxLength={32}
                        onChange={e => setLobbyPassword(e.target.value)}
                        placeholder="Optional"
                    />
                </label>

                <SubmitButton pendingText="Creating...">Create</SubmitButton>

                {createLobbyError ? <p className="text-destructive">{createLobbyError}</p> : null}
            </form>
        </div>
    )
}
