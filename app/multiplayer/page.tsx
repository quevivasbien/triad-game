"use client";

import { SubmitButton } from "@/components/submit-button";
import { createClient } from "@/utils/supabase/client";
import { RealtimePostgresInsertPayload } from "@supabase/supabase-js";
import { useState } from "react";

interface LobbyData {
    created_at: Date;
    name: string;
    password: string;
    guest_ids: string[];
}

export default function MultiplayerPage() {
    const supabase = createClient();
    // Listen to changes to the "lobbies" table
    supabase
        .channel("lobbies")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "lobbies" }, handleLobbyInsert)
        .subscribe();

    const [lobbyName, setLobbyName] = useState("");
    const [lobbyPassword, setLobbyPassword] = useState("");
    const activeLobbies = [<div key="1">Lobby</div>];

    async function createLobby(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        console.log("createLobby", lobbyName, lobbyPassword);
        // Form validation

        // Create lobby
        const { data, error } = await supabase.from("lobbies").upsert<LobbyData>(  
            {
                created_at: new Date(),
                name: lobbyName,
                password: lobbyPassword,
                guest_ids: [],
            },
            {
                ignoreDuplicates: false,
                onConflict: "host_id",
            }
    );

        console.log(data, error);
    }

    function handleLobbyInsert(payload: RealtimePostgresInsertPayload<LobbyData>) {
        console.log("received payload", payload);
    }
    
    return (
        <div className="flex flex-col gap-4">
            <h2 className="text-lg sm:text-2xl">Current lobbies</h2>
            <div className="flex flex-col mx-4 gap-2">
                {activeLobbies}
            </div>
            <form className="flex flex-col gap-4 p-5 bg-card border rounded" onSubmit={createLobby}>
                <h2 className="text-lg sm:text-2xl">Create lobby</h2>
                <label className="flex flex-row justify-between items-center gap-4">
                    Lobby name:
                    <input
                        type="text"
                        className="mt-1 rounded-md border border-border px-3 py-2 shadow-sm focus:border-accent focus:ring-accent"
                        required
                        maxLength={16}
                        onChange={e => setLobbyName(e.target.value)}
                    />
                </label>
                <label className="flex flex-row justify-between items-center gap-4">
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
            </form>
        </div>
    )
}
