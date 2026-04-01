import { useState } from 'react'
import { useRecruitment } from '../hooks/useRecruitment'
import { api } from '../lib/api'
import { JDInput } from '../components/JDInput'

export function JDPage() {
    const { setJdData, setJdRawText, setCurrentView } = useRecruitment()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleAnalyze = async (text: string) => {
        setLoading(true)
        setError('')
        try {
            const res = await api.analyzeJD(text)
            setJdData(res)
            setJdRawText(text)
            setCurrentView('candidates')
        } catch (err: any) {
            setError(err.message || 'Failed to analyze JD')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 py-12">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-4">Define the Role</h1>
                <p className="text-zinc-400">Paste your job description to extract required skills automatically.</p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 shadow-2xl">
                <JDInput onSubmit={handleAnalyze} isLoading={loading} />
                {error && <p className="text-red-400 mt-4 text-sm text-center">{error}</p>}
            </div>
        </div>
    )
}
