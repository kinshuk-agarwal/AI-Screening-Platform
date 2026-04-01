import { Sparkles } from 'lucide-react'

export function ComparisonSummary({ summary, loading, onGenerate }: { summary: string | null, loading: boolean, onGenerate?: () => void }) {
    return (
        <div className="border border-zinc-800 bg-zinc-900/50 rounded-xl p-6 shadow-xl relative overflow-hidden flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold flex items-center gap-2"><Sparkles className="w-5 h-5 text-amber-400" /> AI Comparison Summary</h3>
                {!summary && onGenerate && (
                    <button onClick={onGenerate} disabled={loading} className="text-sm border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-md disabled:opacity-50 transition-colors">
                        {loading ? 'Generating...' : 'Analyze Pool'}
                    </button>
                )}
            </div>
            <div className="flex-1 overflow-y-auto">
                {summary ? (
                    <div className="prose prose-invert prose-p:text-zinc-300 max-w-none text-sm leading-relaxed whitespace-pre-wrap">
                        {summary}
                    </div>
                ) : (
                    <div className="text-zinc-500 text-sm italic py-4">
                        Generate to have AI write a comprehensive summary of all candidates identifying strengths and differentiators.
                    </div>
                )}
            </div>
        </div>
    )
}
