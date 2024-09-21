// "use client";

import CardView from "@/components/card-view";
// import { Card } from "@/lib/cards";
// import { sample } from "@/lib/utils";
import { useState } from "react";

// function getDemoCards() {
//     const colors = sample(["red", "green", "blue"], 3);
//     const shapes = sample(["circle", "triangle", "square"], 3);
//     const patterns = sample(["solid", "muted", "outlined"], 3);
//     const numbers = sample([1, 2, 3], 3);
//     return Array.from({ length: 3 }).map((_, i) => ({
//         color: colors[i],
//         shape: shapes[i],
//         pattern: patterns[i],
//         number: numbers[i],
//     })) as [Card, Card, Card];
// }

export default function LearnPage() {
    // const [demoCards, setDemoCards] = useState(getDemoCards());
    return (
        <div className="flex-1 flex flex-col gap-6 max-w-4xl">
            <h1 className="text-xl sm:text-3xl">Learn to Play</h1>
            <p className="text-sm sm:text-base">
                The objective of the game is to make <em>triads</em> of cards.
            </p>
            <p className="text-sm sm:text-base">
                Each card on the table has a unique combination of each of four features: <em>number</em>, <em>color</em>, <em>pattern</em>, and <em>shape</em>.
            </p>
            <p className="text-sm sm:text-base">
                A triad is a set of three cards where, for each feature, either all three cards have the <em>same</em> value of that feature, or all three cards have <em>different</em> values of that feature.
            </p>
            <p className="text-sm sm:text-base">
                Some examples:
            </p>
            <div className="flex flex-col gap-4">
                <div className="flex flex-row gap-4">
                    <CardView card={{ number: 3, color: "red", pattern: "solid", shape: "circle" }} />
                    <CardView card={{ number: 3, color: "red", pattern: "outlined", shape: "circle" }} />
                    <CardView card={{ number: 3, color: "red", pattern: "muted", shape: "circle" }} />
                </div>
                <p className="text-sm sm:text-base">
                    These cards form a triad, since they all have the same number (3), same color (red), and same shape (circle); they do not share the same pattern but each have a unique pattern (colored-in, empty, and filled with lighter colors).
                </p>
            </div>
            <div className="flex flex-col gap-4">
                <div className="flex flex-row gap-4">
                    <CardView card={{ number: 3, color: "red", pattern: "solid", shape: "circle" }} />
                    <CardView card={{ number: 2, color: "red", pattern: "outlined", shape: "circle" }} />
                    <CardView card={{ number: 3, color: "red", pattern: "muted", shape: "circle" }} />
                </div>
                <p className="text-sm sm:text-base">
                    These cards do <em>not</em> form a triad. Their colors, shapes, and patterns are okay, but the number is neither the same nor unique among all cards (both of the outer cards have numbers of three, but the inner card has a number of two).
                </p>
            </div>
            <div className="flex flex-col gap-4">
                <div className="flex flex-row gap-4">
                    <CardView card={{ number: 2, color: "green", pattern: "solid", shape: "circle" }} />
                    <CardView card={{ number: 1, color: "red", pattern: "solid", shape: "square" }} />
                    <CardView card={{ number: 3, color: "blue", pattern: "solid", shape: "triangle" }} />
                </div>
                <p className="text-sm sm:text-base">
                    These cards form a triad, since their patterns are all the same (colored-in), and their numbers, colors, and shapes are all different.
                </p>
            </div>
            {/* <div className="flex flex-col gap-4">
                <p className="text-sm sm:text-base">
                    Try it out by checking whether these cards form a triad:
                </p>
                <div className="flex flex-row gap-4">
                    <CardView card={demoCards[0]} />
                    <CardView card={demoCards[1]} />
                    <CardView card={demoCards[2]} />
                </div>
            </div> */}
        </div>
    )
}