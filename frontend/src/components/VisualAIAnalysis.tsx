import { CheckCircle2, XCircle, Target, BrainCircuit, Activity } from 'lucide-react'

export default function VisualAIAnalysis({ summaryText }: { summaryText: string }) {
    if (!summaryText) return null;

    // Split text into sections heuristically
    const hasKeyMetrics = summaryText.includes('Key Metrics Overview');
    const hasStrategic = summaryText.includes('Strategic Performance');
    const hasVerdict = summaryText.includes('Executive Verdict');

    let intro = summaryText;
    let metricsText = '';
    let strategicText = '';
    let verdictText = '';

    if (hasKeyMetrics) {
        intro = summaryText.split('Key Metrics Overview')[0];
        const rest = summaryText.split('Key Metrics Overview')[1];
        if (hasStrategic) {
            metricsText = rest.split('Strategic Performance')[0];
            const strategicRest = rest.split('Strategic Performance')[1];
            if (hasVerdict) {
                strategicText = strategicRest.split('Executive Verdict')[0];
                verdictText = strategicRest.split('Executive Verdict')[1];
            } else {
                strategicText = strategicRest;
            }
        } else {
            metricsText = rest;
        }
    } else {
        // Fallback if structure is missing
        return (
            <div className="prose prose-invert max-w-none text-zinc-300 text-sm whitespace-pre-wrap leading-relaxed">
                {summaryText}
            </div>
        );
    }

    // Parse metrics table
    const metricsLines = metricsText.trim().split('\n').map(l => l.trim()).filter(l => l);
    
    let headers: string[] = [];
    let rows: string[][] = [];
    const tableLines = metricsLines.filter(l => l.includes('|'));
    
    const parseTableRow = (line: string) => {
        let l = line.trim();
        if (l.startsWith('|')) l = l.slice(1);
        if (l.endsWith('|')) l = l.slice(0, -1);
        return l.split('|').map(s => s.trim());
    };

    if (tableLines.length > 0) {
        headers = parseTableRow(tableLines[0]).map(s => s.replace(/\*+/g,''));
        // tableLines[1] is the markdown separator e.g. |---|---|
        rows = tableLines.slice(2).map(parseTableRow).map(row => row.map(cell => cell.replace(/\*+/g, '')));
    } else if (metricsLines.length > 0) {
        // Fallback to tabs
        headers = metricsLines[0].split(/\t| {2,}/).map(s => s.trim().replace(/\*+/g,'')).filter(s => s);
        rows = metricsLines.slice(1).map(line => line.split(/\t| {2,}/).map(s => s.trim().replace(/\*+/g,'')).filter(s => s));
    }

    // Parse strategic performance into candidate pros/cons
    // e.g. "Kinshuk\nPros:\n- ...\nCons:\n- ...\nShrish\n..."
    const candidateBlocks: { name: string, pros: string[], cons: string[] }[] = [];
    
    // Simple heuristic: find lines that don't start with - or Pros or Cons, followed by Pros.
    const strategicLines = strategicText.trim().split('\n').map(l => l.trim());
    let currentCand = '';
    let currentMode = '';
    let currentList: string[] = [];

    const flushList = () => {
        if (currentCand && currentList.length > 0) {
            let block = candidateBlocks.find(b => b.name === currentCand);
            if (!block) {
                block = { name: currentCand, pros: [], cons: [] };
                candidateBlocks.push(block);
            }
            if (currentMode === 'Pros') block.pros = [...currentList];
            if (currentMode === 'Cons') block.cons = [...currentList];
            currentList = [];
        }
    }

    for (let i = 0; i < strategicLines.length; i++) {
        const line = strategicLines[i];
        if (!line) continue;

        if (line.toLowerCase().startsWith('pros:')) {
            flushList();
            currentMode = 'Pros';
            // Wait, what if candidate name was the line above?
            if (i > 0 && !strategicLines[i-1].toLowerCase().includes(':') && !strategicLines[i-1].startsWith('-')) {
                currentCand = strategicLines[i-1].replace(/\*+/g, '').trim(); // Remove bold markers
            }
            continue;
        }

        if (line.toLowerCase().startsWith('cons:')) {
            flushList();
            currentMode = 'Cons';
            continue;
        }

        if (line.startsWith('-') || line.match(/^[a-zA-Z0-9].*:/)) {
            // It's a bullet point, even if no dash but has a colon summarizing the point
            if (currentMode) {
                currentList.push(line.replace(/^- /, '').replace(/^\*+/, '').replace(/\*+$/, ''));
            }
        } else if (currentMode) {
            // Maybe a continuation of bullet
            if (currentList.length > 0) {
                currentList[currentList.length - 1] += ' ' + line.replace(/^\*+/, '').replace(/\*+$/, '');
            } else {
                 // Or a new candidate name? If it's a short line
                 if (line.length < 30) {
                     flushList();
                     currentMode = '';
                 }
            }
        }
    }
    flushList(); // Final flush


    return (
        <div className="space-y-8 animate-in fade-in">
            {intro.trim() && (
                <div className="bg-zinc-900/40 p-5 rounded-xl border border-zinc-800/50">
                    <p className="text-sm text-zinc-300 leading-relaxed font-medium">
                        {intro.replace(/\*+/g, '').trim()}
                    </p>
                </div>
            )}

            {headers.length > 0 && rows.length > 0 && (
                <div className="relative">
                    <h4 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2 mb-4">
                        <Activity className="w-5 h-5 text-accent" />
                        Key Metrics Overview
                    </h4>
                    <div className="overflow-x-auto border border-accent/20 rounded-2xl bg-zinc-950/80 shadow-[0_0_30px_rgba(29,158,117,0.05)] backdrop-blur-xl">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-zinc-900 border-b border-zinc-800/80 text-xs uppercase font-extrabold text-zinc-300">
                                <tr>
                                    {headers.map((h, i) => (
                                        <th key={i} className={`px-6 py-4 ${i > 0 && h.toLowerCase() === 'shrish' ? 'text-accent' : ''}`}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/50">
                                {rows.map((row, i) => (
                                    <tr key={i} className="hover:bg-accent/5 transition-colors duration-300">
                                        {row.map((cell, j) => (
                                            <td key={j} className={`px-6 py-4 align-middle ${j === 0 ? 'font-bold text-zinc-200' : 'text-zinc-400 font-medium'}`}>
                                                {cell}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {candidateBlocks.length > 0 && (
                <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2 mb-4">
                        <BrainCircuit className="w-5 h-5 text-accent" />
                        Candidate Deep Dive
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {candidateBlocks.map((c, i) => {
                            const isPreferred = verdictText.toLowerCase().includes(c.name.toLowerCase()) && c.name.length > 2;
                            return (
                                <div key={i} className={`flex flex-col bg-zinc-950 border ${isPreferred ? 'border-accent ring-1 ring-accent/50 shadow-[0_0_20px_rgba(29,158,117,0.15)]' : 'border-zinc-800 shadow-xl'} rounded-2xl overflow-hidden relative h-full transition-all duration-300 hover:-translate-y-1`}>
                                    {isPreferred && (
                                        <div className="absolute top-0 right-0 bg-accent text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg z-10">RECOMMENDED</div>
                                    )}
                                    <div className="p-5 border-b border-zinc-800/80 bg-zinc-900">
                                        <h5 className="font-extrabold text-xl text-white tracking-tight">{c.name}</h5>
                                    </div>
                                    
                                    <div className="flex-1 flex flex-col p-6 gap-8">
                                        {/* PROS */}
                                        <div className="space-y-4">
                                            <h6 className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-emerald-400">
                                                <CheckCircle2 className="w-4 h-4" /> Professional Strengths
                                            </h6>
                                            <ul className="space-y-3">
                                                {c.pros.map((pro, j) => {
                                                    const [bold, ...rest] = pro.split(':');
                                                    return (
                                                        <li key={j} className="flex items-start gap-3 text-sm text-zinc-300">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                                            <span className="leading-relaxed">
                                                                {rest.length > 0 ? (
                                                                    <><strong className="text-white font-bold">{bold}:</strong> {rest.join(':')}</>
                                                                ) : (
                                                                    <span className="font-medium">{pro}</span>
                                                                )}
                                                            </span>
                                                        </li>
                                                    )
                                                })}
                                            </ul>
                                        </div>

                                        {/* CONS */}
                                        <div className="space-y-4 mt-auto pt-6 border-t border-zinc-800/50">
                                            <h6 className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-red-400">
                                                <XCircle className="w-4 h-4" /> Areas for Growth
                                            </h6>
                                            <ul className="space-y-3">
                                                {c.cons.map((con, j) => {
                                                    const [bold, ...rest] = con.split(':');
                                                    return (
                                                        <li key={j} className="flex items-start gap-3 text-sm text-zinc-400">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
                                                            <span className="leading-relaxed">
                                                                {rest.length > 0 ? (
                                                                    <><strong className="text-zinc-200 font-bold">{bold}:</strong> {rest.join(':')}</>
                                                                ) : (
                                                                    con
                                                                )}
                                                            </span>
                                                        </li>
                                                    )
                                                })}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {verdictText.trim() && (
                <div className="bg-zinc-900 border border-accent/40 rounded-2xl p-8 relative overflow-hidden shadow-[0_0_40px_rgba(29,158,117,0.1)]">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-accent/20 blur-[80px] -mr-16 -mt-16 rounded-full pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 blur-[60px] -ml-16 -mb-16 rounded-full pointer-events-none"></div>
                    
                    <h4 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 mb-6 relative z-10 border-b border-accent/20 pb-4 inline-flex">
                        <Target className="w-5 h-5 text-accent" />
                        Executive Verdict
                    </h4>
                    
                    <p className="text-base text-zinc-200 leading-loose relative z-10 font-medium">
                        {verdictText.replace(/\*+/g, '').trim()}
                    </p>
                </div>
            )}
        </div>
    )
}
