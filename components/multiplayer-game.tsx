"use client";

import { Card, Table } from "@/lib/cards";
import { useEffect, useState } from "react";
import TableView from "./table-view";
import { MultiplayerAction, Opponents } from "@/lib/types";
import { secondsToTimeString } from "@/utils/utils";
import { useRouter } from "next/navigation";
import MultiplayerTableView from "./multiplayer-table-view";
import { Button } from "./ui/button";
import { createClient } from "@/utils/supabase/client";


function TimeDisplay({ time }: { time: number }) {
    return <div className="text-lg">{secondsToTimeString(time)}</div>;
}

function GameOverInfo({
    time,
    table,
    opponents,
    exitGameCallback
} : {
    time: number,
    table: Table,
    opponents: Opponents,
    exitGameCallback: () => void
}) {
    const collectedCounts = [
        ...Object.values(opponents).map(({ name, collected }) => ({ name, collected: collected.length })),
        { name: "You", collected: table.cards.length }
    ];
    collectedCounts.sort((a, b) => b.collected - a.collected);

    return (
        <div className="absolute inset-0 flex flex-col gap-6 items-center justify-center bg-background/90">
            <div className="text-2xl">All triads found!</div>
            <div className="flex flex-row gap-2 items-center">
                <div>Game time:</div>
                <TimeDisplay time={time} />
            </div>
            <div className="text-2xl">Final ranking:</div>
            <ol className="list-inside list-decimal border-y-2 border-foreground p-2 sm:p-8 sm:text-lg">
                {collectedCounts.slice(0, 3).map(({ name, collected }) => (
                    <li key={name}>{name} collected {collected} cards</li>
                ))}
            </ol>
            <Button onClick={exitGameCallback}>Exit game</Button>
        </div>
    );
}

export default function MultiplayerGame({
    table,
    actionCallback,
    opponents,
    opponentCollectedHighlights,
    showGameOverInfo,
    exitGameCallback
}: {
    table: Table,
    actionCallback: (action: MultiplayerAction) => void,
    opponents: Opponents,
    opponentCollectedHighlights: number[],
    showGameOverInfo: boolean,
    exitGameCallback: () => void
}) {
    const [time, setTime] = useState(0);

    useEffect(() => {
        if (!showGameOverInfo) {
            const timeTicker = setInterval(() => {
                setTime(time => time + 1);
            }, 1_000);
            return () => {
                clearInterval(timeTicker);
            };
        }
    }, [showGameOverInfo]);

    return (
        <div className="relative flex flex-col items-center gap-6 sm:gap-12">
            <MultiplayerTableView table={table} actionCallback={actionCallback} opponents={opponents} opponentCollectedHighlights={opponentCollectedHighlights} />
            <div className="flex flex-row w-full max-w-xl justify-center items-center border-t border-t-foreground/10 p-8 gap-4">
                <TimeDisplay time={time} />
            </div>
            {showGameOverInfo ? (
                <GameOverInfo
                    time={time}
                    table={table}
                    opponents={opponents}
                    exitGameCallback={exitGameCallback}
                />
            ): null}
        </div>
    )
};
