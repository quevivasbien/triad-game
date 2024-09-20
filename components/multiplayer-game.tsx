"use client";

import { Card, Table } from "@/lib/cards";
import { useEffect, useState } from "react";
import TableView from "./table-view";
import { GameOverInfo, MultiplayerAction, Opponents } from "@/lib/types";
import { secondsToTimeString } from "@/utils/utils";
import { useRouter } from "next/navigation";
import MultiplayerTableView from "./multiplayer-table-view";


function TimeDisplay({ time }: { time: number }) {
    return <div className="text-lg">{secondsToTimeString(time)}</div>;
}

export default function MultiplayerGame({
    table,
    actionCallback,
    opponents
}: {
    table: Table,
    actionCallback: (action: MultiplayerAction) => void,
    opponents: Opponents
}) {
    const router = useRouter();

    const [gameOverInfo, setGameOverInfo] = useState<GameOverInfo | null>(null);
    
    const [time, setTime] = useState(0);
    const [timePaused, setTimePaused] = useState(false);

    useEffect(() => {
        if (!timePaused) {
            const timeTicker = setInterval(() => {
                setTime(time => time + 1);
            }, 1_000);
            return () => {
                clearInterval(timeTicker);
            };
        }
    }, [timePaused]);

    return (
        <div className="relative flex flex-col items-center gap-6 sm:gap-12">
            <MultiplayerTableView table={table} actionCallback={actionCallback} opponents={opponents} />
            <div className="flex flex-row w-full max-w-xl justify-center items-center border-t border-t-foreground/10 p-8 gap-4">
                <TimeDisplay time={time} />
            </div>
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
                </div>
            ) : null}
        </div>
    )
};
