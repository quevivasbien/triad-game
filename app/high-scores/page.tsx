"use client";

import { MAX_HIGH_SCORE_ENTRIES } from "@/lib/constants";
import { createClient } from "@/utils/supabase/client";
import { secondsToTimeString } from "@/utils/utils";
import { Trophy } from "lucide-react";
import { useEffect, useState } from "react";

interface Score {
    userName: string,
    timeSeconds: number,
    nHints: number,
    nMistakes: number
}

async function fetchHighScores(mode: "all" | "past-week", filterNoHints: boolean) {
    const supabase = createClient();
    const query = supabase
        .from("highScores")
        .select("userName, timeSeconds, nHints, nMistakes")
        .order("timeSeconds", { ascending: true })
        .order("nHints", { ascending: true })
        .order("nMistakes", { ascending: true });
    if (mode === "past-week") {
        query.gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
    }
    if (filterNoHints) {
        query.eq("nHints", 0);
    }
    const { data, error } = await query.limit(MAX_HIGH_SCORE_ENTRIES);
    if (error) {
        return { scores: null, error };
    }
    return { scores: data, error };
}

function HighScoreTable({ highScores }: { highScores: Score[] }) {
    if (highScores.length === 0) {
        return <div className="text-center text-lg">No high scores yet</div>
    }
    return (
        <div className="overflow-x-auto shadow-inner p-2 sm:p-4">
            <table className="table-auto w-full border-separate border-spacing-0 text-base sm:text-lg">
                <thead>
                    <tr>
                        <th className="px-4 py-2 border-b-2 border-border"></th>
                        <th className="px-4 py-2 border-b-2 border-border">User</th>
                        <th className="px-4 py-2 border-b-2 border-border">Time</th>
                        <th className="px-4 py-2 border-b-2 border-border">Hints</th>
                        <th className="px-4 py-2 border-b-2 border-border">Mistakes</th>
                    </tr>
                </thead>
                <tbody>
                    {highScores.map((score, i) => (
                        <tr key={score.userName + i + score.timeSeconds}>
                            <td className="px-4 py-2 border-b border-border">{i+1}</td>
                            <td className="px-4 py-2 border-b border-border">{score.userName}</td>
                            <td className="px-4 py-2 border-b border-border">{secondsToTimeString(score.timeSeconds)}</td>
                            <td className="px-4 py-2 border-b border-border">{score.nHints}</td>
                            <td className="px-4 py-2 border-b border-border">{score.nMistakes}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

export default function HighScoresPage() {
    const [highScores, setHighScores] = useState<Score[] | null>(null);
    const [mode, setMode] = useState<"all" | "past-week">("past-week");
    const [filterNoHints, setFilterNoHints] = useState(false);

    useEffect(() => {
        fetchHighScores(mode, filterNoHints).then(({ scores, error }) => {
            if (error) {
                console.error(error);
            } else {
                setHighScores(scores);
            }
        });
    }, [mode, filterNoHints]);

    return (
        <div className="flex flex-col gap-4 max-w-5xl mx-auto">
            <h1 className="text-xl sm:text-3xl">High Scores</h1>
            <div className="flex flex-row m-2 gap-2">
                <Trophy />
                <div className="flex flex-row items-center divide-x-2 divide-foreground">
                    <label className="px-2">
                        <input type="radio" className="peer hidden" name="mode" value="all" checked={mode === "all"} onChange={() => setMode("all")}></input>
                        <div className="text-lg sm:text-2xl peer-checked:font-bold hover:underline cursor-pointer">All time</div>
                    </label>
                    <label className="px-2">
                        <input type="radio" className="peer hidden" name="mode" value="past-week" checked={mode === "past-week"} onChange={() => setMode("past-week")}></input>
                        <div className="text-lg sm:text-2xl peer-checked:font-bold hover:underline cursor-pointer">Past week</div>
                    </label>
                </div>
            </div>
            <label className="flex flex-row gap-2">
                <input type="checkbox" checked={filterNoHints} onChange={() => setFilterNoHints(!filterNoHints)} />
                <div className="text-sm sm:text-base">Don't show scores for games with hints</div>
            </label>
            {highScores === null ? <div className="text-lg">Loading...</div> : <HighScoreTable highScores={highScores} />}
        </div>
    );
}