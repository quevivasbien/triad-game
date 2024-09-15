"use client";

import { Table } from "@/lib/cards";
import { useEffect, useMemo, useState } from "react";
import TableView from "./table-view";
import { Button } from "./ui/button";
import { GameOverInfo } from "@/lib/types";

function TimeDisplay({ time }: { time: number }) {
    const seconds = time % 60;
    const minutes = Math.floor(time / 60) % 60;
    const hours = Math.floor(time / 3600);
    const timeString = hours > 0 ? (
        `${hours}:${minutes < 10 ? "0" : ""}${minutes}:${seconds < 10 ? "0" : ""}${seconds}`
    ) : (
        `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`
    );
    return <div className="text-lg">{timeString}</div>;
}

export default function Game() {
    useEffect(() => {
        window.onbeforeunload = (event) => {
            event.preventDefault();
        };

        return () => {
            window.onbeforeunload = null;
        };
    }, []);

    const [tableState, setTableState] = useState(0);
    const [showConfirmRestart, setShowConfirmRestart] = useState(false);
    const [gameOverInfo, setGameOverInfo] = useState<GameOverInfo | null>(null);

    const [time, setTime] = useState(0);
    const [timePaused, setTimePaused] = useState(false);

    useEffect(() => {
        if (!timePaused) {
            const timer = setInterval(() => {
                setTime(time => time + 1);
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [timePaused]);

    // Memoize table so its state isn't reset when other state changes
    const table = useMemo(() => new Table(), [tableState]);

    function restartGame() {
        setTableState(tableState + 1);
        setTime(0);
        setTimePaused(false);
        setShowConfirmRestart(false);
        setGameOverInfo(null);
    }

    function gameOver(info: GameOverInfo) {
        setTimePaused(true);
        setGameOverInfo(info);
    }

    return (
        <div className="relative flex flex-col gap-6 sm:gap-12">
            {table ? <TableView table={table} gameoverCallback={gameOver} /> : null}
            <div className="flex flex-row justify-between items-center border-t border-t-foreground/10 p-8">
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
                    <div className="flex flex-row gap-6">
                        <Button onClick={restartGame}>Play Again</Button>
                    </div>
                </div>
            ) : null}
        </div>
    )
};
