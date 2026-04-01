import { Send, Check } from 'lucide-react'

export function EmailPanel({ selectedCount, onSend, isSending, isSent }: { selectedCount: number, onSend: () => void, isSending: boolean, isSent: boolean }) {
    return (
        <div className="border border-zinc-800 bg-zinc-900/50 rounded-xl p-6 flex flex-col justify-between shadow-xl h-full">
            <div>
                <h3 className="text-xl font-bold mb-2">Final Actions</h3>
                <p className="text-zinc-400 text-sm mb-6">Selected {selectedCount} candidates for next rounds.</p>
            </div>

            <button
                onClick={onSend}
                disabled={selectedCount === 0 || isSending || isSent}
                className="w-full bg-accent hover:bg-accent/90 text-white font-bold py-3 rounded-lg shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
                {isSent ? <><Check className="w-5 h-5" /> Emails Sent!</> : isSending ? 'Sending...' : <><Send className="w-5 h-5" /> Send Acceptance Emails</>}
            </button>
        </div>
    )
}
