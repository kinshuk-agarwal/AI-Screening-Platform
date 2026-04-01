import { GitBranch, CheckCircle, X } from 'lucide-react'

export function CandidateCard({ candidate, onRemove }: { candidate: any, onRemove?: () => void }) {
    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex flex-col gap-3 shadow-sm relative">
            {onRemove && (
                <button onClick={onRemove} className="absolute top-3 right-3 text-zinc-500 hover:text-red-400 transition-colors">
                    <X className="w-4 h-4" />
                </button>
            )}
            <div>
                <h3 className="font-bold text-lg">{candidate.name || candidate.original_profile?.name}</h3>
                <div className="text-sm text-zinc-400 flex items-center gap-1 mt-1">
                    <GitBranch className="w-3 h-3 text-zinc-500" /> @{candidate.github_username || candidate.original_profile?.github_username}
                </div>
            </div>
            <div className="flex gap-2 mt-auto">
                <span className="bg-accent/10 text-accent border border-accent/20 text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Document Queued
                </span>
            </div>
        </div>
    )
}
