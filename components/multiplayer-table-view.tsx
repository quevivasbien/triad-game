"use client";

import { MultiplayerAction, Opponents } from "@/lib/types";
import CardStack from "./card-stack";
import { Table } from "@/lib/cards";
import OnlyClient from "./only-client";
import CardView from "./card-view";
import { useEffect, useState } from "react";

function OpponentsView({ opponents }: { opponents: Opponents }) {
    return (
        <div className="flex flex-row lg:flex-col flex-overflow justify-center gap-4 lg:my-auto lg:max-h-96 lg:overflow-y-auto shadow-inner p-4 sm:p-12">
            {Object.entries(opponents).map(([id, { name, collected }]) => (
                <div className="flex flex-col items-center">
                <div className="font-bold">{name}</div>
                <CardStack key={id} cards={collected} faceUp={true} />
                </div>
            ))}
        </div>
    );
}

export default function MultiplayerTableView({
    table,
    actionCallback,
    opponents
} : {
    table: Table,
    actionCallback: (action: MultiplayerAction) => void,
    opponents: Opponents
}) {
    const [selected, setSelected] = useState<number[]>([]);

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

        return (
            <button
                onClick={() => selectCard(i)}
                key={card.color + card.number + card.shape + card.pattern + isSelected}
            >
                <CardView card={card} selected={isSelected} />
            </button>
        );
    })


    return (
        <OnlyClient>
            <div className="flex flex-col lg:flex-row justify-between gap-8 sm:gap-16 lg:gap-32">
                <div className="grid grid-cols-3 gap-4">
                    {cards}
                </div>
                <div className="flex flex-col gap-4 lg:my-auto">
                    <div className="flex flex-row lg:flex-col justify-between gap-4">
                        <CardStack cards={table.deck.cards} />
                        <CardStack cards={table.collected} faceUp={true} />
                    </div>
                </div>
                <OpponentsView opponents={opponents} />
            </div>
        </OnlyClient>
    )
}