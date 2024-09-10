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
    
    constructor(private deck: Deck, private nCards: number = 12) {
        this.cards = deck.draw(nCards);
    }
}