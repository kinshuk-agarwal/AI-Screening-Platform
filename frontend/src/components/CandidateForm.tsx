import { useState, useRef } from 'react'
import { UploadCloud, GitBranch, AlertCircle, Mail } from 'lucide-react'

interface CandidateFormProps {
    onAdd: (name: string, github: string, email: string, file: File) => Promise<void>;
    isLoading: boolean;
}

export function CandidateForm({ onAdd, isLoading }: CandidateFormProps) {
    const [name, setName] = useState('')
    const [github, setGithub] = useState('')
    const [email, setEmail] = useState('')
    const [file, setFile] = useState<File | null>(null)
    const [error, setError] = useState('')
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name || !github || !email || !file) {
            setError('All fields are required.')
            return
        }
        setError('')
        try {
            await onAdd(name, github, email, file)
            setName('')
            setGithub('')
            setEmail('')
            setFile(null)
            if (fileInputRef.current) fileInputRef.current.value = ''
        } catch (err: any) {
            setError(err.message || 'Failed to add candidate')
        }
    }

    return (
        <div className="border border-zinc-800 bg-zinc-900/50 rounded-xl p-6 shadow-xl relative overflow-hidden backdrop-blur-sm">
            <div className="absolute top-0 left-0 w-full h-1 bg-accent"></div>
            <h2 className="text-xl font-bold mb-6">Add Candidate</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Full Name</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-accent outline-none" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">GitHub Username</label>
                    <div className="relative">
                        <GitBranch className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                        <input type="text" value={github} onChange={e => setGithub(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-md pl-9 pr-3 py-2 text-sm focus:ring-1 focus:ring-accent outline-none" required />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Email Address</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="candidate@email.com" className="w-full bg-zinc-950 border border-zinc-800 rounded-md pl-9 pr-3 py-2 text-sm focus:ring-1 focus:ring-accent outline-none" required />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Resume (PDF/DOCX)</label>
                    <div className="border border-dashed border-zinc-700 rounded-lg p-4 text-center hover:border-accent transition-colors bg-zinc-950/50">
                        <input type="file" accept=".pdf,.docx,.doc" ref={fileInputRef} onChange={e => setFile(e.target.files?.[0] || null)} className="hidden" id="resume-upload" required />
                        <label htmlFor="resume-upload" className="cursor-pointer flex flex-col items-center gap-2 text-sm text-zinc-400">
                            <UploadCloud className="h-6 w-6 text-accent" />
                            {file ? <span className="text-zinc-200">{file.name}</span> : <span>Upload Document</span>}
                        </label>
                    </div>
                </div>
                {error && <div className="text-red-400 text-sm flex items-center gap-1"><AlertCircle className="w-4 h-4" />{error}</div>}
                <button type="submit" disabled={isLoading} className="w-full bg-zinc-100 hover:bg-white text-zinc-900 font-bold py-2 rounded-md transition-colors disabled:opacity-50 mt-4">
                    {isLoading ? 'Adding...' : 'Add to Pool'}
                </button>
            </form>
        </div>
    )
}
