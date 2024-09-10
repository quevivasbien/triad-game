"use client";

import { Deck, Table } from "@/lib/cards";
import { useState } from "react";
import TableView from "./table-view";

export default function Game() {
    const [deck, setDeck] = useState(new Deck());
    const [table, setTable] = useState(new Table(deck));

    return (
        <div>
            <TableView table={table} />
        </div>
    )
}