"use client";

import MultiplayerGame from "@/components/multiplayer-game";
import { compressCard, decompressCard, Table } from "@/lib/cards";
import { TRIAD_HIGHLIGHT_TIMEOUT_MS } from "@/lib/constants";
import { MultiplayerAction, Opponents } from "@/lib/types";
// import { extractValuesFromPresenceState } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";
import { RealtimeChannel, User } from "@supabase/supabase-js";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

interface Player {
    id: string;
    name: string;
}

interface GameState {
    collected: Record<string, string[]>;
    deck: string[];
    inPlay: string[];
    gameOver: boolean;
}

export default function Page() {
    const router = useRouter();
    const host = useParams<{ host: string }>().host;
    const supabase = useMemo(() => createClient(), []);

    // // Warn user before leaving page
    // useEffect(() => {
    //     const beforeunload = (e: BeforeUnloadEvent) => {
    //         e.preventDefault();
    //         return "Are you sure you want to leave the game?";
    //     };
    //     window.addEventListener("beforeunload", beforeunload);
        
    //     return () => {
    //         window.removeEventListener("beforeunload", beforeunload);
    //     }
    // }, []);

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
    const [startTime, setStartTime] = useState<Date | null>(null);
    // const [playersPresent, setPlayersPresent] = useState<string[]>(() => []);
    const [errorText, setErrorText] = useState<string | null>(null);

    // Get list of players
    useEffect(() => {
        if (!user) {
            return;
        }
        supabase.from("games")
            .select("created_at, player_ids, player_names")
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
                console.log("Received data", data);
                const players = data.player_ids.map((id: string, index: number) => {
                    return { id, name: data.player_names[index] };
                }) as Player[];
                setStartTime(new Date(data.created_at));
                setPlayers(players);
                setOpponents(Object.fromEntries(
                    players
                        .filter(({ id }) => id !== user.id)
                        .map(({ id, name }: Player) => [id, { name, collected: [] }])
                ));
            });
    }, [user]);

    const [table, setTable] = useState<Table | null>(null);
    const [opponents, setOpponents] = useState<Opponents | null>(null);
    const [gameIsOver, setGameIsOver] = useState<boolean>(false);

    function setGameState(user: User, players: Player[], gameState: GameState) {
        const opponents: Opponents = {};
        for (const { id, name } of players) {
            if (id !== user.id) {
                opponents[id] = { name, collected: gameState.collected[id].map(decompressCard) };
            }
        }
        setOpponents(opponents);
        const plainTable = {
            cards: gameState.inPlay,
            deck: gameState.deck,
            collected: gameState.collected[user.id]
        };
        const table = Table.fromPlain(plainTable);
        setTable(table);
        setGameIsOver(gameState.gameOver);
    }

    function getGameState(user: User, opponents: Opponents, table: Table, gameIsOver: boolean) {
        const gameState: GameState = {
            inPlay: table.cards.map(compressCard),
            deck: table.deck.cards.map(compressCard),
            collected: Object.fromEntries(Object.entries(opponents).map(([id, { collected }]) => [id, collected.map(compressCard)])),
            gameOver: gameIsOver,
        };
        gameState.collected[user.id] = table.collected.map(compressCard);
        return gameState;
    }

    useEffect(() => {
        if (!user || !players) {
            return;
        }
        (async () => {
            // Check if game state is already available on DB
            const { data, error } = await supabase
                .from("games")
                .select("game_state")
                .eq("host_id", host)
                .single();
            if (error) {
                throw new Error(`Error getting game state: ${error}`);
            }
            if (data?.game_state) {
                // If game state is available, set it
                setGameState(user, players, data.game_state);
            } else if (user.id === host) {
                // If not, and user is host, initialize it
                const table = new Table();
                const opponents = Object.fromEntries(
                    players
                        .filter(({ id }) => id !== user.id)
                        .map(({ id, name }: Player) => [id, { name, collected: [] }])
                );
                const gameState = getGameState(user, opponents, table, false);
                setGameState(user, players, gameState);

                console.log("Uploading game state to DB", gameState);

                // Upload to DB
                await supabase
                    .from("games")
                    .update({ game_state: gameState })
                    .eq("host_id", host)
                    .select("host_id")
                    .single()
                    .then(({ error }) => {
                        if (error) {
                            throw new Error(`Error uploading game state: ${error}`);
                        }
                    });
            }
        })();
    }, [user, players])

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
    }, [user]);

    const [channel, setChannel] = useState<RealtimeChannel | null>(null);

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

        // // Track who's present
        // channel.on(
        //     "presence",
        //     { event: "sync" },
        //     () => {
        //         const state = channel.presenceState();
        //         const playersPresent = extractValuesFromPresenceState(state, ["uid"], "uid").map(({ uid }) => uid);
        //         setPlayersPresent(playersPresent as string[]);
        //     }
        // );

        // If not host, listen for game state updates
        if (user.id !== host) {
            channel.on(
                "postgres_changes",
                { event: "UPDATE", schema: "public", table: "games", filter: `host_id=eq.${host}` },
                (payload) => {
                    if (!payload.new["game_state"]) {
                        return;
                    }
                    console.log("Received game state update", payload.new["game_state"]);
                    setGameState(user, players, payload.new["game_state"]);
                }
            );
        }

        channel.subscribe((status) => {
            if (status !== "SUBSCRIBED") {
                console.error(`Failed to subscribe to game channel: ${status}`);
                return;
            }

            // // Send presence status
            // channel.track({ uid: user.id });
        });

        setChannel(channel);
        return () => {
            channel.unsubscribe();
        };
    }, [user, players, opponents]);

    // Action callback is called when you do something on the table
    // It will send that action to the other players
    const [actionCallback, setActionCallback] = useState<((action: MultiplayerAction) => void) | null>(null);
    const [opponentCollectedHighlights, setOpponentCollectedHighlights] = useState<number[]>(() => []);
    useEffect(() => {
        if (user === null || opponents === null || channel === null || table === null) {
            return;
        }
        
        const handleActionAsHost = (sender: string, action: MultiplayerAction) => {
            let gameOver = false;
            if (user.id === sender && action.type === "gameover") {
                gameOver = true;
            } else if (user.id !== sender && action.type === "triad") {
                const cards = [
                    table.cards[action.triad[0]],
                    table.cards[action.triad[1]],
                    table.cards[action.triad[2]],
                ];
                const { success, gameIsOver } = table.attemptRemoveTriad(action.triad, false);
                if (!success) {
                    throw new Error("User reported invalid triad");
                }
                gameOver = gameIsOver;
                // Add to opponent's collected cards
                opponents[sender].collected = [...opponents[sender].collected, ...cards];
            }
            setGameIsOver(gameOver);
            // Push game state update to database
            const gameState = getGameState(user, opponents, table, gameOver);
            supabase
                .from("games")
                .update({ game_state: gameState })
                .eq("host_id", host)
                .select("host_id")  // For some reason, when updating JSON data, we need to select afterward
                .single()
                .then(({ error }) => {
                    if (error) {
                        console.error("Error updating game state", error);
                    }
                });
        }

        setActionCallback(() => ((action: MultiplayerAction) => {
            if (user.id === host) {
                // Handle own actions here, since we won't see the channel messages we send ourselves
                handleActionAsHost(user.id, action);
            }
            if (action.type === "triad") {
                console.log("Sending action", action);
                channel.send({
                    type: "broadcast",
                    event: "action",
                    payload: {
                        sender: user.id,
                        action
                    }
                });
            }
        }));

        // Also respond to any actions received
        channel.on(
            "broadcast",
            { event: "action" },
            (payload) => {
                console.log("Received action payload", payload);
                const { sender, action } = payload.payload as { sender: string, action: MultiplayerAction };

                if (action.type === "triad") {
                    // Highlight triad
                    setOpponentCollectedHighlights(action.triad);
                    setTimeout(() => {
                        setOpponentCollectedHighlights([]);
                    }, TRIAD_HIGHLIGHT_TIMEOUT_MS);
    
                    // Host will check that triad is valid and update game state
                    // Others don't need to do anything after this stage
                    if (user.id !== host) {
                        return;
                    }
                    handleActionAsHost(sender, action);
                }
            }
        );
    }, [user, opponents, channel, table]);

    if (errorText) {
        return (
            <p className="text-center">{errorText}</p>
        );
    }

    if (startTime === null || opponents === null || table === null || actionCallback === null) {
        return <p className="text-lg text-center">Loading...</p>;
    }

    return (
        <MultiplayerGame
            table={table}
            startTime={startTime}
            actionCallback={actionCallback}
            opponents={opponents}
            opponentCollectedHighlights={opponentCollectedHighlights}
            showGameOverInfo={gameIsOver}
            exitGameCallback={exitGameCallback}
        />
    );
}