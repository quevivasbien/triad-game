export type Color = "red" | "green" | "blue";
export type Number = 1 | 2 | 3;
export type Shape = "circle" | "triangle" | "square";
export type Pattern = "solid" | "striped" | "outlined";

/**
 * Computes the Cartesian product of the given arrays.
 * @param args The arrays to take the product of.
 * @returns An array of arrays, where each inner array is an element of the Cartesian product.
 * @example
 * product([1, 2], ['a', 'b']) // [[1, 'a'], [1, 'b'], [2, 'a'], [2, 'b']]
 */
function product(...args: any[][]): any[][] {
    return args.reduce((a, b) => a.flatMap((d: any) => b.map((e: any) => [d, e].flat())));
}

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

export class Card {
    constructor(
        public readonly color: Color,
        public readonly number: Number,
        public readonly shape: Shape,
        public readonly pattern: Pattern
    ) { }
}

export class Deck {
    cards: Card[];

    constructor() {
        this.cards = (product(
            ["red", "green", "blue"],
            [1, 2, 3],
            ["circle", "triangle", "square"],
            ["solid", "striped", "outlined"],
        ) as [Color, Number, Shape, Pattern][]).map(features => new Card(...features));

        shuffle(this.cards);
    }

    draw(n: number = 1): Card[] {
        return this.cards.splice(0, n);
    }

    reinsert(card: Card) {
        this.cards.push(card);
    }
}

export class Table {
    deck: Deck;
    cards: Card[];
    collected: Card[] = [];
    
    constructor(private nCards: number = 12) {
        console.log("Creating table with", nCards, "cards");
        this.deck = new Deck();
        this.cards = this.deck.draw(nCards);

        // Make sure a triad is possible
        while (this.findAllTriads().length === 0) {
            this.deck = new Deck();
            this.cards = this.deck.draw(nCards);
        }
        // this.deck.cards.splice(0, 66);
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
        console.log("Looking for triads with cards", this.cards);
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
     * @returns An object with a boolean property `success` indicating whether
     * the triad was successfully removed, and a boolean property `gameIsOver`
     * indicating whether the game is over after attempting to remove the triad.
     */
    attemptRemoveTriad(cardIndices: [number, number, number]) {
        let gameIsOver = false;
        const success =  isTriad(this.cards[cardIndices[0]], this.cards[cardIndices[1]], this.cards[cardIndices[2]]);

        if (success) {
            this.collected = [
                ...this.collected,
                this.cards[cardIndices[0]],
                this.cards[cardIndices[1]],
                this.cards[cardIndices[2]],
            ];
            gameIsOver = !this.drawNewCards(...cardIndices);
        }

        return {  success, gameIsOver };
    }
}