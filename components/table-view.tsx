"use client";

import { Table } from "@/lib/cards";
import CardView from "./card-view";
import { useState } from "react";
import CardStack from "./card-stack";
import OnlyClient from "./only-client";
import { Button } from "./ui/button";
import { GameOverInfo } from "@/lib/types";

function getRotations(cards: any[]) {
    return cards.map(_ => Math.round(Math.random() * 4 - 2));
}

export default function TableView({ table, gameoverCallback }: { table: Table, gameoverCallback: (info: GameOverInfo) => void }) {
    const [selected, setSelected] = useState<number[]>([]);
    const [redFlash, setRedFlash] = useState<number[]>([]);
    const [greenFlash, setGreenFlash] = useState<number[]>([]);
    const [rotations, setRotations] = useState<number[]>(getRotations(table.cards));
    const [nHints, setNHints] = useState(0);

    function selectCard(i: number) {
        if (selected.includes(i)) {
            setSelected(selected.filter(x => x !== i));
        } else if (selected.length < 3) {
            const newSelected = [...selected, i];
            if (newSelected.length === 3) {
                const { success: isTriad, gameIsOver } = table.attemptRemoveTriad(newSelected);
                if (isTriad) {
                    setGreenFlash(newSelected);
                    setTimeout(() => {
                        setGreenFlash([]);
                    }, 500);
                }
                else {
                    setRedFlash(newSelected);
                    setTimeout(() => {
                        setRedFlash([]);
                    }, 500);
                }
                setSelected([]);
                if (gameIsOver) {
                    gameoverCallback({ nHints });
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
            setGreenFlash([...greenFlash, hint]);
            setTimeout(() => {
                setGreenFlash([]);
            }, 2000);
        }
    }

    function shuffle() {
        table.shuffleVisible();
        setRotations(getRotations(table.cards));
    }

    const cards = table.cards.map((card, i) => {
        const redFlashOverlay = (redFlash.includes(i)) ? <div className="absolute inset-0 bg-red-200/60 rounded" /> : null;
        const greenFlashOverlay = (greenFlash.includes(i)) ? <div className="absolute inset-0 bg-green-200/60 rounded" /> : null;
        return (
            <button
                onClick={() => selectCard(i)} style={{ transform: `rotate(${rotations[i]}deg)` }}
                key={card.color + card.number + card.shape + card.pattern + selected}
            >
                <CardView
                    card={card} selected={selected.includes(i)}
                />
                {redFlashOverlay}
                {greenFlashOverlay}
            </button>
        );
    });

    // Only allow rendering on the client, to avoid issues with failed hydration since cards are dynamic
    return (
        <OnlyClient>
            <div className="flex flex-col gap-8 sm:gap-16">
                <div className="grid grid-cols-3 gap-4">
                    {cards}
                </div>
                <div className="flex flex-col gap-4">
                    <div className="sm:hidden flex flex-row justify-center gap-2">
                        <Button variant="secondary" className="text-xs" onClick={getHint}>Hint</Button>
                        <Button variant="secondary" className="text-xs" onClick={shuffle}>Shuffle</Button>
                    </div>
                    <div className="flex flex-row justify-between gap-4">
                        <CardStack cards={table.deck.cards} />
                        <div className="hidden sm:flex flex-col gap-2 justify-center">
                            <Button variant="secondary" onClick={getHint}>Hint</Button>
                            <Button variant="secondary" onClick={shuffle}>Shuffle</Button>
                        </div>
                        <CardStack cards={table.collected} faceUp={true} />
                    </div>
                </div>
            </div>
        </OnlyClient>
    )
}