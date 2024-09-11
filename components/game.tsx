"use client";

import { Deck, Table } from "@/lib/cards";
import { useEffect, useState } from "react";
import TableView from "./table-view";
import { Button } from "./ui/button";

function TimeDisplay({ time }: { time: number }) {
    const seconds = time % 60;
    const minutes = Math.floor(time / 60);
    const hours = Math.floor(minutes / 60);
    const timeString = hours > 0 ? (
        `${hours}:${minutes < 10 ? "0" : ""}${minutes}:${seconds < 10 ? "0" : ""}${seconds}`
    ) : (
        `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`
    );
    return <div className="text-lg">{timeString}</div>;
}

export default function Game() {
    const [table, setTable] = useState(new Table(new Deck()));
    const [showConfirmRestart, setShowConfirmRestart] = useState(false);

    const [time, setTime] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => setTime(time => time + 1), 1000);
        return () => clearInterval(interval);
    }, []);

    function restartGame() {
        setTable(new Table(new Deck()));
        setTime(0);
        setShowConfirmRestart(false);
    }

    return (
        <div className="relative flex flex-col gap-6 sm:gap-12">
            <TableView table={table} />
            <div className="flex flex-row justify-between items-center border-t border-t-foreground/10 p-8">
                <Button onClick={() => setShowConfirmRestart(true)}>Restart</Button>
                <TimeDisplay time={time} />
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
}