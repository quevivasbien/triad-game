"use client";

import { Table } from "@/lib/cards";
import CardView from "./card-view";
import { useEffect, useState } from "react";
import CardStack from "./card-stack";
import OnlyClient from "./only-client";

export default function TableView({ table }: { table: Table }) {
    const [isClient, setIsClient] = useState(false);
 
    useEffect(() => {
        setIsClient(true)
    }, []);


    const [selected, setSelected] = useState<number[]>([]);
    const [flash, setFlash] = useState<number[]>([]);
    const [rotations, setRotations] = useState<number[]>(
        table.cards.map(_ => Math.round(Math.random() * 4 - 2))
    );

    function selectCard(i: number) {
        if (selected.includes(i)) {
            setSelected(selected.filter(x => x !== i));
        } else if (selected.length < 3) {
            const newSelected = [...selected, i];
            if (newSelected.length === 3) {
                const isTriad = table.attemptRemoveTriad(newSelected);
                if (isTriad) {
                    // TODO: add removal animation
                }
                else {
                    setFlash(newSelected);
                    setTimeout(() => {
                        setFlash([]);
                    }, 500);
                }
                setSelected([]);
            }
            else {
                setSelected(newSelected);
            }
        }


    }

    const cards = table.cards.map((card, i) => {
        const flashOverlay = (flash.includes(i)) ? <div className="absolute inset-0 bg-red-200/60" /> : null;
        return (
            <button
                onClick={() => selectCard(i)} style={{ transform: `rotate(${rotations[i]}deg)` }}
                key={card.color + card.number + card.shape + card.pattern + selected}
            >
                <CardView
                    card={card} selected={selected.includes(i)}
                />
                {flashOverlay}
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
                <div className="flex flex-row justify-between gap-4">
                    <CardStack cards={table.deck.cards} />
                    <CardStack cards={table.collected} faceUp={true} />
                </div>
            </div>
        </OnlyClient>
    )
}