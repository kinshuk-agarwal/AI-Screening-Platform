import { useState } from 'react'
import { useRecruitment } from '../hooks/useRecruitment'
import { api } from '../lib/api'
import { CandidateForm } from '../components/CandidateForm'
import { CandidateCard } from '../components/CandidateCard'
import { Users, PlayCircle, AlertCircle } from 'lucide-react'

export function CandidatesPage() {
    const { jdData, jdRawText, candidates, setCandidates, setDashboardData, setCurrentView, pipelineLoading, setPipelineLoading, pipelineStatus, setPipelineStatus } = useRecruitment()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleAddCandidate = async (name: string, github: string, email: string, file: File) => {
        if (candidates.length >= 10) {
            throw new Error('Maximum 10 candidates allowed per screening session')
        }
        setLoading(true)
        try {
            const localCandidate = {
                name,
                github_username: github,
                email,
                file,
                resume_file_local_url: URL.createObjectURL(file)
            }
            setCandidates(prev => [...prev, localCandidate])
        } finally {
            setLoading(false)
        }
    }

    const handleRemove = (index: number) => {
        const candidate = candidates[index]
        if (candidate?.resume_file_local_url) {
            URL.revokeObjectURL(candidate.resume_file_local_url)
        }
        setCandidates(prev => prev.filter((_, i) => i !== index))
    }

    const handleScreenAll = async () => {
        if (candidates.length === 0) return
        setPipelineLoading(true)
        setPipelineStatus('Uploading models to orchestrator queue...')
        setError('')

        try {
            // Initiate async processing
            const res = await api.uploadBatch(jdRawText, candidates)
            const jobId = res.job_id

            // Polling loop
            const interval = setInterval(async () => {
                try {
                    const status = await api.getJobStatus(jobId)
                    
                    setPipelineStatus(
                        `Processing... ${status.completed}/${status.total_candidates} scored (${status.progress_percent}%)`
                    )

                    if (status.job_status === 'completed' || status.job_status === 'failed') {
                        clearInterval(interval)
                        
                        if (status.job_status === 'failed' && status.completed === 0) {
                            setError('Pipeline failed to process any candidates.')
                            setPipelineLoading(false)
                            return
                        }

                        if (status.failed > 0) {
                            setError(`Warning: ${status.failed} candidates failed to process. Continuing with successful ones.`)
                        }

                        setPipelineStatus('Finalizing dashboard logic...')
                        const dashboard = await api.getJobDashboard(jobId)
                        setDashboardData(dashboard)
                        setCurrentView('dashboard')
                        setPipelineLoading(false)
                    }
                } catch (pollErr) {
                    console.error("Polling error", pollErr)
                }
            }, 3000)

        } catch (err: any) {
            setError(err.message || 'Pipeline failed')
            setPipelineLoading(false)
        }
    }

    return (
        <div className="max-w-6xl mx-auto py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">Candidate Pool</h1>
                    <p className="text-zinc-400 mt-2">Add candidates to be screened against the <strong>{jdData?.role}</strong> role.</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <button
                        onClick={handleScreenAll}
                        disabled={candidates.length === 0 || pipelineLoading}
                        className="bg-accent hover:bg-accent/90 text-white px-6 py-3 rounded-lg shadow-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                    >
                        {pipelineLoading ? (
                            <span className="animate-pulse flex items-center gap-2">Screening Pipeline Active...</span>
                        ) : (
                            <><PlayCircle className="w-5 h-5" /> Screen All Candidates</>
                        )}
                    </button>
                    {pipelineLoading && pipelineStatus && (
                        <div className="flex items-center gap-2 text-sm text-zinc-400 animate-in fade-in duration-300">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                            </span>
                            <span>{pipelineStatus}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <CandidateForm onAdd={handleAddCandidate} isLoading={loading} />
                    <p className="text-xs text-zinc-500 text-center mt-2">
                        {candidates.length}/10 candidates added
                    </p>
                </div>
                <div className="lg:col-span-2">
                    {error && <div className="mb-4 text-red-400 bg-red-400/10 p-4 rounded-lg flex items-center gap-2"><AlertCircle className="w-5 h-5" />{error}</div>}
                    {candidates.length === 0 ? (
                        <div className="h-full min-h-[300px] border border-dashed border-zinc-800 bg-zinc-900/20 rounded-xl flex flex-col items-center justify-center p-12 text-zinc-500">
                            <Users className="w-12 h-12 text-zinc-800 mb-4" />
                            <p className="text-lg font-medium text-zinc-400">No candidates queued</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {candidates.map((c, i) => (
                                <CandidateCard key={i} candidate={c} onRemove={() => handleRemove(i)} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
