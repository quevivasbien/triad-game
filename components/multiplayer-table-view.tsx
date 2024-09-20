"use client";

import { MultiplayerAction, Opponents } from "@/lib/types";
import CardStack from "./card-stack";
import { Table } from "@/lib/cards";
import OnlyClient from "./only-client";
import CardView from "./card-view";
import { useState } from "react";
import { TRIAD_HIGHLIGHT_TIMEOUT_MS } from "@/lib/constants";
import { getRotations } from "@/lib/utils";

function OpponentsView({ opponents }: { opponents: Opponents }) {
    return (
        <div className="lg:my-auto">
            <div className="text-lg font-bold text-center m-1">Opponents</div>
            <div className="flex flex-row lg:flex-col flex-overflow justify-center gap-4 lg:max-h-96 lg:overflow-y-auto shadow-inner p-4 sm:p-12">
                {Object.entries(opponents).map(([id, { name, collected }]) => (
                    <div className="flex flex-col items-center">
                    <div className="font-bold">{name}</div>
                    <CardStack key={id} cards={collected} faceUp={true} />
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function MultiplayerTableView({
    table,
    actionCallback,
    opponents,
    opponentCollectedHighlights
} : {
    table: Table,
    actionCallback: (action: MultiplayerAction) => void,
    opponents: Opponents,
    opponentCollectedHighlights: number[]
}) {
    const [selected, setSelected] = useState<number[]>([]);
    const [greenHighlights, setGreenHighlights] = useState<number[]>([]);
    const [redHighlights, setRedHighlights] = useState<number[]>([]);

    const [rotations, setRotations] = useState<number[]>(() => getRotations(table.cards.length));

    function selectCard(i: number) {
        if (selected.includes(i)) {
            setSelected(selected.filter(x => x !== i));
        } else if (selected.length < 3) {
            const newSelected = [...selected, i];
            if (newSelected.length === 3) {
                const { success: isTriad, gameIsOver } = table.attemptRemoveTriad(newSelected as [number, number, number]);
                if (isTriad) {
                    actionCallback({
                        type: "triad",
                        triad: newSelected as [number, number, number],
                    });
                    setGreenHighlights(newSelected);
                    setTimeout(() => {
                        setGreenHighlights([]);
                    }, TRIAD_HIGHLIGHT_TIMEOUT_MS);
                } else {
                    setRedHighlights(newSelected);
                    setTimeout(() => {
                        setRedHighlights([]);
                    }, TRIAD_HIGHLIGHT_TIMEOUT_MS);
                }
                setSelected([]);
                if (gameIsOver) {
                    actionCallback({ type: "gameover" });
                }
            } else {
                setSelected(newSelected);
            }
        }
    }

    const cards = table.cards.map((card, i) => {
        const isSelected = selected.includes(i);

        const purpleHighlight = opponentCollectedHighlights.includes(i) ? <div className="absolute inset-0 bg-purple-200/60 rounded" /> : null;
        const greenHighlight = greenHighlights.includes(i) ? <div className="absolute inset-0 bg-green-200/60 rounded" /> : null;
        const redHighlight = redHighlights.includes(i) ? <div className="absolute inset-0 bg-red-200/60 rounded" /> : null;

        return (
            <button
                className="relative"
                style={{ transform: `rotate(${rotations[i]}deg)` }}
                onClick={() => selectCard(i)}
                key={card.color + card.number + card.shape + card.pattern + isSelected}
            >
                <CardView card={card} selected={isSelected} />
                {purpleHighlight}
                {greenHighlight}
                {redHighlight}
            </button>
        );
    })


    return (
        <OnlyClient>
            <div className="flex flex-col lg:flex-row justify-between gap-8 sm:gap-16 lg:gap-24">
                <div className="grid grid-cols-3 gap-4">
                    {cards}
                </div>
                <div className="flex flex-col gap-4 lg:my-auto">
                    <div className="flex flex-row lg:flex-col justify-between gap-4 sm:gap-12">
                        <CardStack cards={table.deck.cards} />
                        <CardStack cards={table.collected} faceUp={true} />
                    </div>
                </div>
                <OpponentsView opponents={opponents} />
            </div>
        </OnlyClient>
    )
}