"use client";

import { Table } from "@/lib/cards";
import { useEffect, useMemo, useState } from "react";
import TableView from "./table-view";
import { Button } from "./ui/button";

function TimeDisplay() {
    const [time, setTime] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => {
            setTime(time => time + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

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
    const [tableState, setTableState] = useState(0);
    const [timerKey, setTimerKey] = useState(0);
    const [showConfirmRestart, setShowConfirmRestart] = useState(false);

    const table = useMemo(() => new Table(), [tableState]);

    function restartGame() {
        setTableState(tableState + 1);
        setTimerKey(timerKey + 1);
        setShowConfirmRestart(false);
    }

    return (
        <div className="relative flex flex-col gap-6 sm:gap-12">
            {table ? <TableView table={table} /> : null}
            <div className="flex flex-row justify-between items-center border-t border-t-foreground/10 p-8">
                <Button onClick={() => setShowConfirmRestart(true)}>Restart</Button>
                <TimeDisplay key={timerKey} />
            </div>
            {showConfirmRestart ? (
                <div className="absolute inset-0 flex flex-col gap-6 items-center justify-center bg-background/90">
                    <div className="text-2xl">Are you sure you want to restart?</div>
                    <div className="flex flex-row gap-6">
                        <Button onClick={() => setShowConfirmRestart(false)}>Cancel</Button>
                        <Button onClick={restartGame}>Restart</Button>
                    </div>
                </div>
            ) : null}
        </div>
    )
};
