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
    }

    if (c1.number !== c2.number) {
        if (c1.number === c3.number || c2.number === c3.number) {
            return false;
        }
    }

    if (c1.shape !== c2.shape) {
        if (c1.shape === c3.shape || c2.shape === c3.shape) {
            return false;
        }
    }

    if (c1.pattern !== c2.pattern) {
        if (c1.pattern === c3.pattern || c2.pattern === c3.pattern) {
            return false;
        }
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
}

export class Table {
    cards: Card[];
    collected: Card[] = [];
    
    constructor(public deck: Deck, private nCards: number = 12) {
        this.cards = deck.draw(nCards);
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
            this.cards = [
                ...this.cards.filter((card, i) => !cardIndices.includes(i)),
                ...this.deck.draw(3)
            ];
        }

        return triad;
    }
}