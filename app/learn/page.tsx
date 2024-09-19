import CardView from "@/components/card-view";

export default function LearnPage() {
    return (
        <div className="flex-1 flex flex-col gap-6 max-w-4xl mx-auto">
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
                    <CardView card={{ number: 3, color: "red", pattern: "striped", shape: "circle" }} />
                </div>
                <p className="text-sm sm:text-base">
                    These cards form a triad, since they all have the same number (3), same color (red), and same shape (circle); they do not share the same pattern but each have a unique pattern (colored-in, empty, and filled with gray).
                </p>
            </div>
            <div className="flex flex-col gap-4">
                <div className="flex flex-row gap-4">
                    <CardView card={{ number: 3, color: "red", pattern: "solid", shape: "circle" }} />
                    <CardView card={{ number: 2, color: "red", pattern: "outlined", shape: "circle" }} />
                    <CardView card={{ number: 3, color: "red", pattern: "striped", shape: "circle" }} />
                </div>
                <p className="text-sm sm:text-base">
                    These cards do <em>not</em> form a triad. Their colors, shapes, and patterns are okay, but the number is neither the same nor unique among all cards.
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
        </div>
    )
}