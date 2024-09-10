"use client";

import { Table } from "@/lib/cards";
import CardView from "./card-view";
import { useState } from "react";

export default function TableView({ table }: { table: Table }) {
    const [selected, setSelected] = useState<number[]>([]);
    const [rotations, setRotations] = useState<number[]>(
        table.cards.map(_ => Math.round(Math.random() * 4 - 2))
    );

    function selectCard(i: number) {
        if (selected.includes(i)) {
            setSelected(selected.filter(x => x !== i));
        } else if (selected.length < 3) {
            setSelected([...selected, i]);
        }
    }

    const cards = table.cards.map((card, i) => {
        return (
            <button onClick={() => selectCard(i)} style={{ transform: `rotate(${rotations[i]}deg)` }}>
                <CardView
                    key={card.color + card.number + card.shape + card.pattern + selected}
                    card={card} selected={selected.includes(i)}
                />
            </button>
        );
    });

    return (
        <div className="grid grid-cols-3 gap-4">
            {cards}
        </div>
    );
}