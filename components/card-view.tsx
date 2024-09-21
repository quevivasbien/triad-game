"use client";

import { Card } from "@/lib/cards";

const svgSize = 100;
const svgViewBox = `0 0 ${svgSize} ${svgSize}`;
const svgStrokeWidth = 10;

const hueBase = 20;
const saturation = 100;
const lightness = 30;

const red = `hsl(${hueBase}, ${saturation}%, ${lightness}%)`;
const mutedRed = `hsl(${hueBase}, ${Math.round(saturation / 2)}%, ${Math.round(lightness * 2.5)}%)`;
const green = `hsl(${(hueBase + 120) % 360}, ${saturation}%, ${lightness}%)`;
const mutedGreen = `hsl(${(hueBase + 120) % 360}, ${Math.round(saturation / 2)}%, ${Math.round(lightness * 2.5)}%)`;
const blue = `hsl(${(hueBase + 240) % 360}, ${saturation}%, ${lightness}%)`;
const mutedBlue = `hsl(${(hueBase + 240) % 360}, ${Math.round(saturation / 2)}%, ${Math.round(lightness * 2.5)}%)`;

function Circle({ color, fillColor }: { color: string, fillColor: string }) {
    const svgProps = {
        cx: svgSize / 2,
        cy: svgSize / 2,
        r: svgSize / 2 - svgStrokeWidth,
        fill: fillColor,
        stroke: color,
        strokeWidth: svgStrokeWidth,
    };
    return <circle {...svgProps} />
}

function Triangle({ color, fillColor }: { color: string, fillColor: string }) {
    const svgProps = {
        points: `${svgSize / 2},${svgStrokeWidth} ${svgSize - svgStrokeWidth},${svgSize - svgStrokeWidth} ${svgStrokeWidth},${svgSize - svgStrokeWidth}`,
        stroke: color,
        fill: fillColor,
        strokeWidth: svgStrokeWidth,
    };
    return <polygon {...svgProps} />
}

function Square({ color, fillColor }: { color: string, fillColor: string }) {
    const svgProps = {
        x: svgStrokeWidth,
        y: svgStrokeWidth,
        width: svgSize - 2 * svgStrokeWidth,
        height: svgSize - 2 * svgStrokeWidth,
        fill: fillColor,
        stroke: color,
        strokeWidth: svgStrokeWidth,
    };
    return <rect {...svgProps} />
}

export default function CardView({ card, selected = false }: { card: Card, selected?: boolean }) {
    const className = `flex items-center justify-center bg-card border rounded-lg w-20 h-24 sm:w-40 sm:h-48 p-4 ${selected ? "border-accent shadow-lg shadow-accent/80" : "shadow-md"}`;

    let color: string;
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

    let fillColor: string;
    switch (card.pattern) {
        case "solid":
            fillColor = color;
            break;
        case "muted":
            switch (card.color) {
                case "red":
                    fillColor = mutedRed;
                    break;
                case "green":
                    fillColor = mutedGreen;
                    break;
                case "blue":
                    fillColor = mutedBlue;
                    break;
            }
            break;
        case "outlined":
            fillColor = "none";
            break;
    }

    let shape: JSX.Element;
    switch (card.shape) {
        case "circle":
            shape = <Circle color={color} fillColor={fillColor} />;
            break;
        case "triangle":
            shape = <Triangle color={color} fillColor={fillColor} />;
            break;
        case "square":
            shape = <Square color={color} fillColor={fillColor} />;
            break;
    }

    // One svg for each number
    const svgs = [];
    for (let i = 0; i < card.number; i++) {
        svgs.push(
            <svg width={`${Math.round(80 / Math.pow(card.number, 0.8))}%`} viewBox={svgViewBox} key={i}>
                {shape}
            </svg>
        );
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