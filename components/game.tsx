"use client";

import { Table } from "@/lib/cards";
import { useEffect, useState } from "react";
import TableView from "./table-view";
import { Button } from "./ui/button";
import { GameOverInfo } from "@/lib/types";
import { secondsToTimeString } from "@/utils/utils";
import { createClient } from "@/utils/supabase/client";
import { Input } from "./ui/input";
import { useRouter } from "next/navigation";
import { MAX_HIGH_SCORE_ENTRIES } from "@/lib/constants";

async function eligibleForHighScore(time: number, info: GameOverInfo) {
    const eligibilityThreshold = MAX_HIGH_SCORE_ENTRIES;  // Must be within top this many to qualify
    const supabase = createClient();
    // Get top completion times
    let result = await supabase
        .from("highScores")
        .select("timeSeconds")
        .order("timeSeconds", { ascending: true })
        .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())  // Within past week
        .limit(eligibilityThreshold);
    if (result.error) {
        console.error(result.error);
        return false;
    }
    // Check if better than the eligibilityThresholdth completion time
    if (
        result.data.length < eligibilityThreshold ||
        time < result.data[eligibilityThreshold - 1].timeSeconds
    ) {
        return true;
    }
    // Now do the same thing, but filtering for no hints
    result = await supabase
        .from("highScores")
        .select("timeSeconds")
        .eq("nHints", 0)
        .order("timeSeconds", { ascending: true })
        .limit(eligibilityThreshold);
    if (result.error) {
        console.error(result.error);
        return false;
    }
    if (
        result.data.length < eligibilityThreshold ||
        time < result.data[eligibilityThreshold - 1].timeSeconds
    ) {
        return true;
    }
    return false;
}

async function submitScore(userName: string, time: number, info: GameOverInfo) {
    const supabase = createClient();
    console.log("Submitting score", userName, time, info);
    const { error } = await supabase.from("highScores").insert({
        userName,
        timeSeconds: time,
        nHints: info.nHints,
        nMistakes: info.nMistakes
    });
    return error;
}

function SubmitScore({ time, info }: { time: number, info: GameOverInfo }) {
    const [name, setName] = useState("");
    const [submitted, setSubmitted] = useState(false);

    function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSubmitted(true);
        submitScore(name, time, info).then((error) => {
            if (error) {
                console.error(error);
            }
        });
    }

    return (
        <div className="flex flex-col gap-4 m-2 p-4 bg-card border rounded shadow">
            <div className="text-lg">You got a top score! You can submit it to the leaderboard.</div>
            <form onSubmit={submit} className="flex flex-row gap-2">
                <Input
                    type="text"
                    placeholder="Your name"
                    required
                    value={name}
                    minLength={3}
                    maxLength={20}
                    onChange={(e) => setName(e.target.value)}
                    disabled={submitted}
                />
                <Button type="submit" disabled={submitted}>{submitted ? "Submitted" : "Submit"} </Button>
            </form>
        </div>
    )
}

function TimeDisplay({ time }: { time: number }) {
    return <div className="text-lg">{secondsToTimeString(time)}</div>;
}

function loadState() {
    // Get table from local storage if it exists, otherwise create new table
    try {
        const data = localStorage.getItem("savedGameState");
        if (data) {
            const { time, table } = JSON.parse(data);
            return {
                time,
                table: Table.fromPlain(table)
            };
        }
    } catch (error) {
        console.error(error);
    }
    return { time: 0, table: new Table() };
}

function saveGameState(time: number, table: Table) {
    const data = {
        time,
        table: table.toPlain()
    }
    localStorage.setItem("savedGameState", JSON.stringify(data));
}

function clearGameState() {
    localStorage.removeItem("savedGameState");
}

export default function Game() {
    const router = useRouter();

    const [table, setTable] = useState<Table | null>(null);
    const [showConfirmRestart, setShowConfirmRestart] = useState(false);
    const [gameOverInfo, setGameOverInfo] = useState<GameOverInfo | null>(null);
    const [showSubmitScore, setShowSubmitScore] = useState(false);
    
    const [time, setTime] = useState(0);
    const [timePaused, setTimePaused] = useState(false);
    const [saveState, setSaveState] = useState(0);

    useEffect(() => {
        const { time, table } = loadState();
        setTime(time);
        setTable(table);
    }, [])

    useEffect(() => {
        if (table) {
            saveGameState(time, table);
        }
    }, [saveState]);
    useEffect(() => {
        if (!timePaused) {
            const timeTicker = setInterval(() => {
                setTime(time => time + 1);
            }, 1_000);
            const saveStateTicker = setInterval(() => {
                setSaveState(saveState => saveState + 1);
            }, 5_000);
            return () => {
                clearInterval(timeTicker);
                clearInterval(saveStateTicker);
            };
        }
    }, [timePaused]);

    function restartGame() {
        setTable(new Table());
        setTime(0);
        setTimePaused(false);
        setShowConfirmRestart(false);
        setGameOverInfo(null);
    }

    function gameOver(info: GameOverInfo) {
        setTimePaused(true);
        setGameOverInfo(info);  
        clearGameState();
        eligibleForHighScore(time, info).then((eligible) => {
            if (eligible) {
                setShowSubmitScore(true);
            }
        });
    }

    return (
        <div className="relative flex flex-col items-center gap-6 sm:gap-12">
            {table ? <TableView table={table} gameoverCallback={gameOver} /> : <div className="text-center text-lg">Loading...</div>}
            <div className="flex flex-row w-full max-w-xl justify-between items-center border-t border-t-foreground/10 p-8 gap-4">
                <Button onClick={() => setShowConfirmRestart(true)}>Restart</Button>
                <TimeDisplay time={time} />
            </div>
            {showConfirmRestart ? (
                <div className="absolute inset-0 flex flex-col gap-6 items-center justify-center bg-background/90" onClick={() => setShowConfirmRestart(false)}>
                    <div className="text-2xl">Are you sure you want to restart?</div>
                    <div className="flex flex-row gap-6">
                        <Button onClick={() => setShowConfirmRestart(false)}>Cancel</Button>
                        <Button onClick={restartGame}>Restart</Button>
                    </div>
                </div>
            ) : null}
            {gameOverInfo ? (
                <div className="absolute inset-0 flex flex-col gap-6 items-center justify-center bg-background/90">
                    <div className="text-2xl">All triads found!</div>
                    <div className="flex flex-row gap-2 items-center">
                        <div>Final time:</div>
                        <TimeDisplay time={time} />
                    </div>
                    <div className="flex flex-row gap-2 items-center">
                        <div>Number of hints:</div>
                        <div className="text-lg">{gameOverInfo.nHints}</div>
                    </div>
                    <div className="flex flex-row gap-2 items-center">
                        <div>Number of mistakes:</div>
                        <div className="text-lg">{gameOverInfo.nMistakes}</div>
                    </div>
                    {showSubmitScore ? <SubmitScore time={time} info={gameOverInfo} /> : null}
                    <Button onClick={() => router.push("/high-scores")}>View High Scores</Button>
                    <Button onClick={restartGame}>Play Again</Button>
                </div>
            ) : null}
        </div>
    )
};
