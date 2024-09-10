import { Card } from "@/lib/cards";

const svgSize = 100;
const strokeWidth = 10;

const hueBase = 20;
const saturation = 60;
const lightness = 30;

const red = `hsl(${hueBase}, ${saturation}%, ${lightness}%)`;
const green = `hsl(${hueBase + 120}, ${saturation}%, ${lightness}%)`;
const blue = `hsl(${hueBase + 240}, ${saturation}%, ${lightness}%)`;
const gray = `hsl(0, 0%, 85%)`;

export default function CardView({ card, selected }: { card: Card, selected: boolean }) {
    const className = `flex items-center justify-center border rounded-lg w-40 h-60 p-4 ${selected ? "border-blue-500 shadow-lg shadow-blue-500/80" : "shadow-md"}`

    let color;
    switch (card.color) {
        case "red":
            color = red;
            break;
        case "green":
            color = green;
            break;
        case "blue":
            color = blue;
            break;
    }

    let fillColor;
    switch (card.pattern) {
        case "solid":
            fillColor = color;
            break;
        case "striped":
            fillColor = gray;
            break;
        case "outlined":
            fillColor = "none";
            break;
    }

    let shape;
    switch (card.shape) {
        case "circle":
            shape = <circle cx={svgSize / 2} cy={svgSize / 2} r={50-strokeWidth} stroke={color}
                stroke-width={strokeWidth} fill={fillColor} />;
            break;
        case "triangle":
            shape = <polygon points={`${svgSize / 2},${strokeWidth} ${svgSize-strokeWidth},${svgSize-strokeWidth} ${strokeWidth},${svgSize-strokeWidth}`} stroke={color} stroke-width={strokeWidth} fill={fillColor} />;
            break;
        case "square":
            shape = <rect x={strokeWidth} y={strokeWidth} width={svgSize-2*strokeWidth} height={svgSize-2*strokeWidth} stroke={color} stroke-width={strokeWidth} fill={fillColor} />;
            break;
    }

    return (
        <div className={className}>
            <svg height={svgSize} width={svgSize}>
                {shape}
            </svg>
        </div>
    );
}