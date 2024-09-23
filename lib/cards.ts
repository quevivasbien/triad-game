import { product } from "./utils";

type Color = "red" | "green" | "blue";
type CardNumber = 1 | 2 | 3;
type Shape = "circle" | "triangle" | "square";
type Pattern = "solid" | "muted" | "outlined";

function shuffle<T>(array: T[]) {
    for (let i = array.length - 1; i >= 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function isTriad(c1: Card, c2: Card, c3: Card) {
    if (c1.color !== c2.color) {
        if (c1.color === c3.color || c2.color === c3.color) {
            return false;
        }
    } else if (c1.color !== c3.color) {
        return false;
    }

    if (c1.number !== c2.number) {
        if (c1.number === c3.number || c2.number === c3.number) {
            return false;
        }
    } else if (c1.number !== c3.number) {
        return false;
    }

    if (c1.shape !== c2.shape) {
        if (c1.shape === c3.shape || c2.shape === c3.shape) {
            return false;
        }
    } else if (c1.shape !== c3.shape) {
        return false;
    }

    if (c1.pattern !== c2.pattern) {
        if (c1.pattern === c3.pattern || c2.pattern === c3.pattern) {
            return false;
        }
    } else if (c1.pattern !== c3.pattern) {
        return false;
    }

    return true;
}

export interface Card {
    color: Color,
    number: CardNumber,
    shape: Shape,
    pattern: Pattern
}

export function compressCard(card: Card) {
    return card.color[0] + card.number + card.shape[0] + card.pattern[0];
}

export function decompressCard(card: string) {
    let color: Color;
    switch (card[0]) {
        case "r": color = "red"; break;
        case "g": color = "green"; break;
        case "b": color = "blue"; break;
        default: throw new Error("Invalid card");
    }

    let number = parseInt(card[1]) as CardNumber;

    let shape: Shape;
    switch (card[2]) {
        case "c": shape = "circle"; break;
        case "t": shape = "triangle"; break;
        case "s": shape = "square"; break;
        default: throw new Error("Invalid card");
    }

    let pattern: Pattern;
    switch (card[3]) {
        case "s": pattern = "solid"; break;
        case "m": pattern = "muted"; break;
        case "o": pattern = "outlined"; break;
        default: throw new Error("Invalid card");
    }

    return { color, number, shape, pattern };
}

export class Deck {
    cards: Card[];

    constructor(cards?: Card[]) {
        if (cards) {
            this.cards = cards;
            return;
        }
        this.cards = (product(
            ["red", "green", "blue"],
            [1, 2, 3],
            ["circle", "triangle", "square"],
            ["solid", "muted", "outlined"],
        ) as [Color, CardNumber, Shape, Pattern][])
            .map(([ color, number, shape, pattern ]) => {
                return {
                    color, number, shape, pattern
                };
            });

        shuffle(this.cards);
    }

    draw(n: number = 1): Card[] {
        return this.cards.splice(0, n);
    }

    reinsert(card: Card) {
        this.cards.push(card);
    }
}

export type PlainTable = { deck: string[], cards: string[], collected: string[] };

export class Table {
    deck: Deck;
    cards: Card[];
    collected: Card[] = [];
    
    constructor(components?: { deck: Deck, cards: Card[], collected: Card[] }) {
        if (components) {
            this.deck = components.deck;
            this.cards = components.cards;
            this.collected = components.collected;
            return;
        }
        this.deck = new Deck();
        this.cards = this.deck.draw(12);

        // Make sure a triad is possible
        while (this.findAllTriads().length === 0) {
            this.deck = new Deck();
            this.cards = this.deck.draw(12);
        }
        this.deck.cards.splice(0, 66);
    }

    toPlain(): PlainTable {
        return {
            deck: this.deck.cards.map(compressCard),
            cards: this.cards.map(compressCard),
            collected: this.collected.map(compressCard),
        };
    }

    static fromPlain(plain: PlainTable) {
        const deck = new Deck(plain.deck.map(decompressCard));
        const cards = plain.cards.map(decompressCard);
        const collected = plain.collected.map(decompressCard);
        return new Table({ deck, cards, collected });
    }

    shuffleVisible() {
        shuffle(this.cards);
    }
    
    /**
     * Finds all triads in the table.
     *
     * @returns An array of arrays of indices of the cards that form a triad.
     *          Each subarray contains 3 indices, and the indices are sorted
     *          in ascending order.
     */
    findAllTriads() {
        // console.log("Looking for triads with cards", this.cards);
        const triads = [];
        for (let i = 0; i < this.cards.length; i++) {
            for (let j = i + 1; j < this.cards.length; j++) {
                for (let k = j + 1; k < this.cards.length; k++) {
                    if (isTriad(this.cards[i], this.cards[j], this.cards[k])) {
                        triads.push([i, j, k]);
                    }
                }
            }
        }
        console.log(`found ${triads.length} triads`);
        triads.forEach(t => console.log(t));
        return triads;
    }

    /**
     * Returns a random index of a card that is part of a triad, or null if no triad is possible.
     * 
     * @returns A random index of a card that is part of a triad, or null if no triad is possible.
     */
    getHint() {
        const triads = this.findAllTriads();
        if (triads.length > 0) {
            const i = Math.floor(Math.random() * triads.length);
            const j = Math.floor(Math.random() * 3);
            return triads[i][j];
        }
        return null;
    }

    /**
     * Draws 3 new cards from the deck and replaces the cards at `idx1`, `idx2`, and `idx3` with them.
     * If at least one triad is possible with the new cards, returns true.
     * Otherwise, redraws until a triad is possible or the deck is exhausted,
     * returning true if a triad is found, or false if the deck is exhausted and no triads are found.
     */
    drawNewCards(idx1: number, idx2: number, idx3: number): boolean {
        // console.log("drawNewCards");
        const newCards = this.deck.draw(3);
        this.cards[idx1] = newCards[0];
        this.cards[idx2] = newCards[1];
        this.cards[idx3] = newCards[2];
        if (newCards.length < 3) {
            // Special case: The deck is exhausted, so we just need to check if we can make a triad with these cards, and report game over if not.
            this.cards = this.cards.filter(c => c !== undefined);
            return this.findAllTriads().length !== 0;
        }
        // Check if at least one triad is possible with the new cards
        const possibleTriads = this.findAllTriads();
        if (possibleTriads.length > 0) {
            return true;
        }

        // console.log("Redrawing...");
        // Redraw until a triad is possible, or the deck is exhausted
        const maxRedraws = this.deck.cards.length;
        for (let i = 0; i < maxRedraws; i++) {
            let otherCard = this.deck.draw(1)[0];
            for (let j = 0; j < 3; j++) {
                // Replace one of the new cards with the other card
                newCards.push(otherCard);
                otherCard = newCards.shift()!;  
                this.cards[idx1] = newCards[0];
                this.cards[idx2] = newCards[1];
                this.cards[idx3] = newCards[2];
                if (this.findAllTriads().length > 0) {
                    // Put the other card back on the bottom of the deck
                    this.deck.reinsert(otherCard);
                    return true;
                }
            }
            this.deck.reinsert(otherCard);
        }
        return false;
    }

    /**
     * Attempt to remove a triad from the table, then draw new cards to replace
     * the removed cards.
     *
     * @param cardIndices Indices of the cards to attempt to remove.
     * @param collect Whether to add the removed cards to the `collected` cards list. Defaults to true.
     * @returns An object with a boolean property `success` indicating whether
     * the triad was successfully removed, and a boolean property `gameIsOver`
     * indicating whether the game is over after attempting to remove the triad.
     */
    attemptRemoveTriad(cardIndices: [number, number, number], collect: boolean = true) {
        let gameIsOver = false;
        const success =  isTriad(this.cards[cardIndices[0]], this.cards[cardIndices[1]], this.cards[cardIndices[2]]);

        if (success) {
            if (collect) {
                this.collected = [
                    ...this.collected,
                    this.cards[cardIndices[0]],
                    this.cards[cardIndices[1]],
                    this.cards[cardIndices[2]],
                ];
            }
            gameIsOver = !this.drawNewCards(...cardIndices);
        }

        return { success, gameIsOver };
    }
}