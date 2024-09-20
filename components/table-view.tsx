"use client";

import { Table } from "@/lib/cards";
import CardView from "./card-view";
import { useState } from "react";
import CardStack from "./card-stack";
import OnlyClient from "./only-client";
import { Button } from "./ui/button";
import { GameOverInfo } from "@/lib/types";
import { HINT_HIGHLIGHT_TIMEOUT_MS, TRIAD_HIGHLIGHT_TIMEOUT_MS } from "@/lib/constants";
import { getRotations } from "@/lib/utils";

export default function TableView({
    table,
    gameoverCallback,
}: {
    table: Table,
    gameoverCallback: (info: GameOverInfo) => void,
}) {
    const [selected, setSelected] = useState<number[]>([]);
    const [redHighlights, setRedHighlights] = useState<number[]>([]);
    const [greenHighlights, setGreenHighlights] = useState<number[]>([]);
    const [rotations, setRotations] = useState<number[]>(getRotations(table.cards.length));
    const [nHints, setNHints] = useState(0);
    const [nMistakes, setNMistakes] = useState(0);

    function selectCard(i: number) {
        if (selected.includes(i)) {
            setSelected(selected.filter(x => x !== i));
        } else if (selected.length < 3) {
            const newSelected = [...selected, i];
            if (newSelected.length === 3) {
                const { success: isTriad, gameIsOver } = table.attemptRemoveTriad(newSelected as [number, number, number]);
                if (isTriad) {
                    setGreenHighlights(newSelected);
                    setTimeout(() => {
                        setGreenHighlights([]);
                    }, TRIAD_HIGHLIGHT_TIMEOUT_MS);
                }
                else {
                    setRedHighlights(newSelected);
                    setTimeout(() => {
                        setRedHighlights([]);
                    }, TRIAD_HIGHLIGHT_TIMEOUT_MS);
                    setNMistakes(nMistakes + 1);
                }
                setSelected([]);
                if (gameIsOver) {
                    gameoverCallback({ nHints, nMistakes });
                }
            }
            else {
                setSelected(newSelected);
            }
        }
    }

    function getHint() {
        setNHints(nHints + 1);
        const hint = table.getHint();
        console.log("Got hint", hint);
        if (hint !== null) {
            setGreenHighlights([...greenHighlights, hint]);
            setTimeout(() => {
                setGreenHighlights([]);
            }, HINT_HIGHLIGHT_TIMEOUT_MS);
        }
    }

    function shuffle() {
        table.shuffleVisible();
        setRotations(getRotations(table.cards.length));
    }

    const cards = table.cards.map((card, i) => {
        const redHighlight = (redHighlights.includes(i)) ? <div className="absolute inset-0 bg-red-200/60 rounded" /> : null;
        const greenHighlight = (greenHighlights.includes(i)) ? <div className="absolute inset-0 bg-green-200/60 rounded" /> : null;
        const isSelected = selected.includes(i);
        return (
            <button
                className="relative"
                onClick={() => selectCard(i)} style={{ transform: `rotate(${rotations[i]}deg)` }}
                key={card.color + card.number + card.shape + card.pattern + isSelected}
            >
                <CardView
                    card={card} selected={isSelected}
                />
                {redHighlight}
                {greenHighlight}
            </button>
        );
    });

    // Only allow rendering on the client, to avoid issues with failed hydration since cards are dynamic
    return (
        <OnlyClient>
            <div className="flex flex-col lg:flex-row justify-between gap-8 sm:gap-16 lg:gap-32">
                <div className="grid grid-cols-3 gap-4">
                    {cards}
                </div>
                <div className="flex flex-col gap-4 lg:my-auto">
                    <div className="flex flex-row justify-center gap-2">
                        <Button variant="secondary" className="text-xs sm:text-base" onClick={getHint}>Hint</Button>
                        <Button variant="secondary" className="text-xs sm:text-base" onClick={shuffle}>Shuffle</Button>
                    </div>
                    <div className="flex flex-row lg:flex-col justify-between gap-4 sm:gap-12">
                        <CardStack cards={table.deck.cards} />
                        <CardStack cards={table.collected} faceUp={true} />
                    </div>
                </div>
            </div>
        </OnlyClient>
    )
}