"use client";

import { Deck, Table } from "@/lib/cards";
import { useState } from "react";
import TableView from "./table-view";
import { Button } from "./ui/button";

export default function Game() {
    const [deck, setDeck] = useState(new Deck());
    const [table, setTable] = useState(new Table(deck));

    function restartGame() {
        setDeck(new Deck());
        setTable(new Table(deck));
    }

    return (
        <div className="flex flex-col gap-4">
            <Button onClick={restartGame}>Restart</Button>
            <TableView table={table} />
        </div>
    )
}