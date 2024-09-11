import { Card } from "@/lib/cards";
import CardView from "./card-view";
import TriadLogo from "./triad-logo";

function FaceDownCard({ index, stackSize }: { index: number, stackSize: number }) {
    const rotate = Math.round(index * 8 / stackSize - 6);
    const translateX = Math.round(index * 10 / stackSize);
    const translateY = Math.round(index * 8 / stackSize);
    return <div
        className="absolute top-0 left-0 flex flex-col gap-2 items-center justify-center bg-card-foreground text-card rounded w-40 h-48 shadow-sm"
        style={{ transform: `rotate(${rotate}deg) translateX(${translateX}px) translateY(-${translateY}px)` }}
    >
        <div className="text-xl">Triad</div>
        <TriadLogo size={90} color="gray" />
    </div>;
}

function FaceUpCard({ card, index, stackSize }: { card: Card, index: number, stackSize: number }) {
    const rotate = Math.round(index * 10 / stackSize - 8);
    const translateX = Math.round(index * 10 / stackSize);
    const translateY = Math.round(index * 8 / stackSize);
    return <div
        className="absolute top-0 right-0"
        style={{ transform: `rotate(${rotate}deg) translateX(-${translateX}px) translateY(-${translateY}px)` }}
    >
        <CardView card={card} selected={false} />
    </div>;
}

export default function CardStack({ cards, faceUp = false }: { cards: Card[], faceUp?: boolean }) {
    const cardViews = faceUp ?
        cards.map((card, i) => <FaceUpCard key={i} card={card} index={i} stackSize={cards.length} />) :
        cards.map((card, i) => <FaceDownCard key={i} index={i} stackSize={cards.length} />);
    return (
        <div className="flex flex-col gap-4">
            <div className="text-center">
                { faceUp ? `${cards.length} cards collected` : `${cards.length} cards remaining` }
            </div>
            <div className="relative w-40 h-48 border rounded" key={cards.length}>
                {cardViews}
            </div>
        </div>
    );
}
