import { useState } from 'react'

interface JDInputProps {
    onSubmit: (text: string) => Promise<void>;
    isLoading: boolean;
}

export function JDInput({ onSubmit, isLoading }: JDInputProps) {
    const [text, setText] = useState('')

    const handleSubmit = () => {
        if (text.trim()) onSubmit(text);
    }

    return (
        <div className="space-y-4">
            <label className="text-sm font-medium leading-none text-zinc-300">Job Description (Raw Text)</label>
            <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste the raw job description here..."
                className="flex w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent min-h-[300px] resize-y"
            />
            <button
                onClick={handleSubmit}
                disabled={isLoading || !text}
                className="inline-flex items-center justify-center rounded-md text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent disabled:pointer-events-none disabled:opacity-50 bg-accent text-white shadow hover:bg-accent/90 h-10 px-6 py-2 w-full"
            >
                {isLoading ? 'Analyzing with AI...' : 'Analyze Requirements'}
            </button>
        </div>
    )
}
