"use client";

import MultiplayerGame from "@/components/multiplayer-game";
import { Table } from "@/lib/cards";
import { extractValuesFromPresenceState } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";
import { RealtimeChannel, User } from "@supabase/supabase-js";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

interface Player {
    id: string;
    name: string;
}

export default function Page() {
    console.log("rerendering")
    const host = useParams<{ host: string }>().host;
    const supabase = useMemo(() => createClient(), []);

    // Warn user before leaving page
    useEffect(() => {
        window.addEventListener("beforeunload", (e) => {
            e.preventDefault();
            return "Are you sure you want to leave the game?";
        });
    }, []);

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

    const [players, setPlayers] = useState<Player[] | null>(null);
    const [playersPresent, setPlayersPresent] = useState<string[]>(() => []);
    const [errorText, setErrorText] = useState<string | null>(null);

    // Get list of players
    useEffect(() => {
        supabase.from("games")
            .select("player_ids, player_names")
            .eq("host_id", host)
            .single()
            .then(({ data, error }) => {
                if (error) {
                    if (error.code === "PGRST116") {
                        setErrorText("Game not found. The game may exist, but you have not been invited.");
                    } else {
                        setErrorText(`Failed to get list of players. ${error.code}: ${error.message}`);
                    }
                    return;
                }
                const players = data.player_ids.map((id: string, index: number) => {
                    return { id, name: data.player_names[index] };
                })
                setPlayers(players);
            });
    }, []);

    const [channel, setChannel] = useState<RealtimeChannel | null>(null);
    const [initialTable, _setInitialTable] = useState<Table | null>(null);

    function setInitialTable(table: Table, players: Player[], myUID: string) {
        table.setOpponents(players.filter(p => p.id !== myUID).map(({ id, name }) => ({ id, name })));
        _setInitialTable(table);
    }

    // Initialize game communication channel
    useEffect(() => {
        if (user === null || players === null) {
            return;
        }

        const channel = supabase.channel(`game:${host}`);

        // Track who's present
        channel.on(
            "presence",
            { event: "sync" },
            () => {
                const state = channel.presenceState();
                console.log("presence state", state);
                const playersPresent = extractValuesFromPresenceState(state, ["uid"]).map(({ uid }) => uid) ;
                setPlayersPresent(playersPresent as string[]);
            }
        );

        // If not host, listen for initial table state
        if (user.id !== host) {
            channel.on(
                "broadcast",
                { event: "table" },
                (payload) => {
                    console.log("Got payload", payload);
                    const initialTable = Table.fromPlain(payload.payload);
                    console.log("Received table", initialTable);
                    setInitialTable(initialTable, players, user.id);
                }
            )
        }

        channel.subscribe((status) => {
            if (status !== "SUBSCRIBED") {
                console.error(`Failed to subscribe to game channel: ${status}`);
                return;
            }

            // Send presence status
            channel.track({ uid: user.id });
        });

        setChannel(channel);
        return () => {
            channel.unsubscribe();
        };
    }, [user, players])

    useEffect(() => {
        // Wait for user, players, and channel to be initialized
        // If not host, table will be received from host on channel
        if (user === null || players === null || channel === null || user.id !== host) {
            return;
        }
        // Don't send out table until all players are present
        if (!players.reduce((acc, p) => acc && playersPresent.includes(p.id), true)) {
            return;
        }
        // Create table
        const initialTable = new Table();
        // Send to other players
        channel?.send({
            type: "broadcast",
            event: "table",
            payload: initialTable.toPlain(),
        });
        // Set opponents and set for self
        initialTable.setOpponents(players.filter(p => p.id !== user.id).map(({ id, name }) => ({ id, name })));
        setInitialTable(initialTable, players, user.id);
    }, [user, players, playersPresent, channel]);

    if (errorText) {
        return (
            <p className="text-center">{errorText}</p>
        );
    }

    if (players === null || initialTable === null) {
        return <p className="text-center">Loading...</p>;
    }

    return (
        <div>
            {players ? <p>Players: {JSON.stringify(players)}</p> : null}
            <MultiplayerGame initialTable={initialTable} />
        </div>
    );
}