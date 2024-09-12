export type Color = "red" | "green" | "blue";
export type Number = 1 | 2 | 3;
export type Shape = "circle" | "triangle" | "square";
export type Pattern = "solid" | "striped" | "outlined";

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
    }
    
    findAllTriads(extraCards: Card[] = []) {
        // console.log("Looking for triads with cards", this.cards, "and", extraCards);
        const cards = [...this.cards, ...extraCards];
        const triads = [];
        for (let i = 0; i < cards.length; i++) {
            for (let j = i + 1; j < cards.length; j++) {
                for (let k = j + 1; k < cards.length; k++) {
                    if (isTriad(cards[i], cards[j], cards[k])) {
                        triads.push([i, j, k]);
                    }
                }
            }
        }
        console.log(`found ${triads.length} triads`);
        return triads;
    }

    /**
     * Draws three new cards and checks if at least one triad is possible with the new cards.
     * If a triad is possible, adds the new cards to the table and returns true.
     * If no triad is possible, redraws from the deck until a triad is possible or the deck is exhausted.
     * @returns Whether or not it is possible to create a triad with the new cards.
     */
    drawNewCards() {
        // console.log("drawNewCards");
        const newCards = this.deck.draw(3);
        // Check if at least one triad is possible with the new cards
        const possibleTriads = this.findAllTriads(newCards);
        if (possibleTriads.length > 0) {
            this.cards = [...this.cards, ...newCards];
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
                if (this.findAllTriads(newCards).length > 0) {
                    this.cards = [...this.cards, ...newCards];
                    // Put the other card back on the bottom of the deck
                    this.deck.reinsert(otherCard);
                    return true;
                }
            }
            this.deck.reinsert(otherCard);
        }
        return false;
    }

    attemptRemoveTriad(cardIndices: number[]) {
        if (cardIndices.length !== 3) {
            return false;
        }
        const triad =  isTriad(this.cards[cardIndices[0]], this.cards[cardIndices[1]], this.cards[cardIndices[2]]);

        if (triad) {
            this.collected = [
                ...this.collected,
                this.cards[cardIndices[0]],
                this.cards[cardIndices[1]],
                this.cards[cardIndices[2]],
            ];
            this.cards = this.cards.filter((card, i) => !cardIndices.includes(i));
            const gameIsOver = !this.drawNewCards();
            // console.log("gameIsOver", gameIsOver);
        }

        return triad;
    }
}