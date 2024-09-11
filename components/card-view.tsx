import { Card } from "@/lib/cards";

const svgSize = 100;
const svgStrokeWidth = 10;

const hueBase = 20;
const saturation = 60;
const lightness = 35;

const red = `hsl(${hueBase}, ${saturation}%, ${lightness}%)`;
const green = `hsl(${hueBase + 120}, ${saturation}%, ${lightness}%)`;
const blue = `hsl(${hueBase + 240}, ${saturation}%, ${lightness}%)`;
const gray = `hsl(0, 0%, 75%)`;

export default function CardView({ card, selected }: { card: Card, selected: boolean }) {
    const className = `flex items-center justify-center bg-card border rounded-lg w-40 h-48 p-4 ${selected ? "border-accent shadow-lg shadow-accent/80" : "shadow-md"}`;

    const size = Math.ceil(svgSize / card.number);
    const strokeWidth = Math.ceil(svgStrokeWidth / card.number);

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
            shape = <circle cx={size / 2} cy={size / 2} r={size / 2 -strokeWidth} stroke={color}
                stroke-width={strokeWidth} fill={fillColor} />;
            break;
        case "triangle":
            shape = <polygon points={`${size / 2},${strokeWidth} ${size-strokeWidth},${size-strokeWidth} ${strokeWidth},${size-strokeWidth}`} stroke={color} stroke-width={strokeWidth} fill={fillColor} />;
            break;
        case "square":
            shape = <rect x={strokeWidth} y={strokeWidth} width={size-2*strokeWidth} height={size-2*strokeWidth} stroke={color} stroke-width={strokeWidth} fill={fillColor} />;
            break;
    }

    // One svg for each number
    const svgs = [];
    for (let i = 0; i < card.number; i++) {
        svgs.push(<svg width={size} height={size}>
            {shape}
        </svg>);
    }

    return (
        <div className={className}>
            <div className="flex flex-col items-center justify-center gap-1">
                {svgs}
            </div>
            {/* <div className="absolute inset-0">
                {card.number} {card.shape} {card.pattern} {card.color}
            </div> */}
        </div>
    );
}