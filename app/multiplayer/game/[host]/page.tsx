"use client";

import MultiplayerGame from "@/components/multiplayer-game";
import { Table } from "@/lib/cards";
import { TRIAD_HIGHLIGHT_TIMEOUT_MS } from "@/lib/constants";
import { MultiplayerAction, Opponents } from "@/lib/types";
import { extractValuesFromPresenceState } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";
import { RealtimeChannel, User } from "@supabase/supabase-js";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

interface Player {
    id: string;
    name: string;
}

export default function Page() {
    const router = useRouter();
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
    const [opponents, setOpponents] = useState<Opponents | null>(null);
    const [errorText, setErrorText] = useState<string | null>(null);

    useEffect(() => {
        console.log("opponents", opponents)
    }, [opponents]);

    // Get list of players
    useEffect(() => {
        if (!user) {
            return;
        }
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
                }) as Player[];
                setPlayers(players);
                setOpponents(Object.fromEntries(
                    players
                        .filter(({ id }) => id !== user.id)
                        .map(({ id, name }: Player) => [id, { name, collected: [] }])
                ));
            });
    }, [user]);

    const [exitGameCallback, setExitGameCallback] = useState<() => void>(() => (
        () => {
            router.push("/multiplayer");
        }
    ));
    // When host exits game, it should be removed from the database
    useEffect(() => {
        if (!user || user.id !== host) {
            return;
        }
        setExitGameCallback(() => (() => {
            supabase.from("games")
                .delete()
                .eq("host_id", host)
                .then(({ error }) => {
                    if (error) {
                        console.error("Error deleting game", error);
                    }
                });
            router.push("/multiplayer");
        }));
    }, [user])

    const [channel, setChannel] = useState<RealtimeChannel | null>(null);
    const [table, setTable] = useState<Table | null>(null);

    // Initialize game communication channel
    useEffect(() => {
        if (user === null || players === null || opponents === null) {
            return;
        }

        const channel = supabase.channel(
            `game:${host}`,
            {
                config: { private: true }
            }
        );

        // Track who's present
        channel.on(
            "presence",
            { event: "sync" },
            () => {
                const state = channel.presenceState();
                console.log("presence state", state);
                const playersPresent = extractValuesFromPresenceState(state, ["uid"]).map(({ uid }) => uid);
                setPlayersPresent(playersPresent as string[]);
            }
        );

        // If not host, listen for initial table state
        if (user.id !== host) {
            channel.on(
                "broadcast",
                { event: "table" },
                (payload) => {
                    const initialTable = Table.fromPlain(payload.payload);
                    setTable(initialTable);
                }
            );
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
    }, [user, players, opponents]);

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
        setTable(initialTable);
    }, [user, players, playersPresent, channel]);

    // Action callback is called when you do something on the table
    // It will send that action to the other players
    const [actionCallback, setActionCallback] = useState<((action: MultiplayerAction) => void) | null>(null);
    const [opponentCollectedHighlights, setOpponentCollectedHighlights] = useState<number[]>(() => []);
    const [gameIsOver, setGameIsOver] = useState<boolean>(false);
    useEffect(() => {
        if (user === null || channel === null || table === null) {
            return;
        }
        console.log("Called action callback effect");

        setActionCallback(() => ((action: MultiplayerAction) => {
            // Instead of sending gameover action, just set gameIsOver = true.
            // Other players will figure out for themselves that the game is over
            if (action.type === "gameover") {
                setGameIsOver(true);
                return;
            }
            console.log("Sending action", action);
            channel.send({
                type: "broadcast",
                event: "action",
                payload: {
                    sender: user.id,
                    action
                }
            });
        }));

        // Also respond to any actions received
        channel.on(
            "broadcast",
            { event: "action" },
            (payload) => {
                console.log("Received action payload", payload);
                const { sender, action } = payload.payload as { sender: string, action: MultiplayerAction };
                if (sender === user.id) {
                    // No need to do anything if we're the sender
                    return;
                }
                if (action.type === "triad") {
                    const cards = [
                        table.cards[action.triad[0]],
                        table.cards[action.triad[1]],
                        table.cards[action.triad[2]],
                    ];
                    const { success, gameIsOver } = table.attemptRemoveTriad(action.triad, false);
                    if (!success) {
                        throw new Error("User reported invalid triad");
                    }
                    // Highlight triad
                    setOpponentCollectedHighlights(action.triad);
                    setTimeout(() => {
                        setOpponentCollectedHighlights([]);
                    }, TRIAD_HIGHLIGHT_TIMEOUT_MS);
                    // Add to opponent's collected cards
                    if (opponents === null) {
                        throw new Error("opponents not initialized");
                    }
                    opponents[sender].collected = [...opponents[sender].collected, ...cards];
                    if (gameIsOver) {
                        setGameIsOver(true);
                    }
                } else {
                    console.log("Received action", action);
                }
            }
        );
    }, [user, channel, table]);

    if (errorText) {
        return (
            <p className="text-center">{errorText}</p>
        );
    }

    if (opponents === null || table === null || actionCallback === null) {
        return <p className="text-lg text-center">Loading...</p>;
    }

    return (
        <MultiplayerGame
            table={table}
            actionCallback={actionCallback}
            opponents={opponents}
            opponentCollectedHighlights={opponentCollectedHighlights}
            showGameOverInfo={gameIsOver}
            exitGameCallback={exitGameCallback}
        />
    );
}