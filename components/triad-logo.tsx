const size = 90;
const elemSize = size / 3;
const triBottomLeftX = (size / 3).toPrecision(3);
const triBottomRightX = (size * 2 / 3).toPrecision(3);
const triBottomY = (size / 2 + size / (6 * Math.sqrt(3))).toPrecision(3);
const triTopX = (size / 2).toPrecision(3);
const triTopY = (size / 2 - size * Math.sqrt(3) / 9).toPrecision(3);

export default function TriadLogo({ color, width = "100%" }: { color: string, width?: string }) {
    return (
        <svg width={width} viewBox={`0 0 ${size} ${size}`}>
            <rect x={elemSize * 0.1} y={elemSize * 0.1} width={elemSize * 0.8} height={elemSize * 0.8} fill={color} />
            <polygon points={`${triBottomLeftX},${triBottomY} ${triTopX},${triTopY} ${triBottomRightX},${triBottomY}`} fill={color} />
            <circle cx={size - elemSize / 2} cy={size - elemSize / 2} r={elemSize / 2.1} fill={color} />
        </svg>
    );
}