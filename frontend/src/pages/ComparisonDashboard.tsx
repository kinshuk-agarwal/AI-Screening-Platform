import { useState } from 'react'
import { useRecruitment } from '../hooks/useRecruitment'
import { api } from '../lib/api'
import SkillRadarChart from '../components/SkillRadarChart'
import ComparisonRadarChart from '../components/ComparisonRadarChart'
import CandidateInsightsModal from '../components/CandidateInsightsModal'
import { Sparkles, Mail, Send, Check, Trophy } from 'lucide-react'
import VisualAIAnalysis from '../components/VisualAIAnalysis'


export default function ComparisonDashboard() {
    const { jdData, dashboardData } = useRecruitment()
    const [viewCand, setViewCand] = useState<any>(null)
    const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set())
    const [comparisonSummary, setComparisonSummary] = useState<any>(null)
    const [loadingSummary, setLoadingSummary] = useState(false)
    const [sending, setSending] = useState(false)
    const [sent, setSent] = useState(false)

    const scoredCandidates = dashboardData?.scoredCandidates || []
    const initialSummary = dashboardData?.comparisonSummary || null

    const top6Skills = jdData?.must_have_skills?.slice(0, 6).map((s: any) => s.skill) || []

    const sortedCandidates = [...scoredCandidates].sort((a: any, b: any) => {
        const scoreA = a.weighted_score ?? a.overall_match_percent ?? 0
        const scoreB = b.weighted_score ?? b.overall_match_percent ?? 0
        return scoreB - scoreA
    })
    const bestFit = sortedCandidates.length > 0 ? sortedCandidates[0] : null

    const generateComparison = async () => {
        setLoadingSummary(true)
        try {
            const res = await api.compareCandidates(sortedCandidates, jdData)
            setComparisonSummary(res)
        } catch (e) {
            console.error(e)
        } finally {
            setLoadingSummary(false)
        }
    }

    const toggleSelected = (id: string) => {
        const next = new Set(selectedEmails)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        setSelectedEmails(next)
    }

    const handleSendEmails = async () => {
        if (selectedEmails.size === 0) return
        setSending(true)
        try {
            const payload = sortedCandidates
                .filter((c: any) => selectedEmails.has(c.original_profile?.github_username))
                .map((c: any) => ({ name: c.name, email: c.original_profile?.email || '' }))
                .filter((c: { name: string; email: string }) => c.email)
            await api.sendEmails(payload)
            setSent(true)
        } catch (e) {
            console.error(e)
        } finally {
            setSending(false)
        }
    }

    const activeSummary = comparisonSummary || initialSummary

    const getScore = (cand: any) => cand.weighted_score ?? cand.overall_match_percent ?? 0

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 py-8">

            <div className="bg-accent/10 border border-accent/30 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                    <p className="text-accent text-sm font-semibold uppercase tracking-wider">Job Requirement</p>
                    <h2 className="text-2xl font-bold text-white">{jdData?.role} <span className="text-zinc-400 font-medium">({jdData?.seniority})</span></h2>
                </div>
                <div className="flex gap-2 flex-wrap">
                    {top6Skills.map((sk: string, i: number) => (
                        <span key={i} className="bg-accent/20 text-accent px-3 py-1 rounded-full text-xs font-bold uppercase">{sk}</span>
                    ))}
                </div>
            </div>

            <div className="flex flex-wrap items-stretch gap-6 pb-6 pt-4">
                {sortedCandidates.map((cand: any, i: number) => (
                    <div key={i} className={`flex-1 min-w-[340px] max-w-[500px] bg-zinc-900 border ${cand.name === bestFit?.name ? 'border-accent ring-1 ring-accent/50 shadow-[0_0_20px_rgba(29,158,117,0.15)]' : 'border-zinc-800'} rounded-2xl flex flex-col overflow-hidden relative`}>
                        {cand.name === bestFit?.name && (
                            <div className="absolute top-0 right-0 bg-accent text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg z-10">BEST FIT</div>
                        )}

                        <div className="p-5 border-b border-zinc-800 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-lg">{cand.name}</h3>
                                <p className="text-zinc-400 text-xs">@{cand.original_profile?.github_username}</p>
                            </div>
                            <div className="text-right">
                                <p className={`text-4xl font-black ${getScore(cand) > 75 ? 'text-accent' : getScore(cand) > 50 ? 'text-amber-400' : 'text-red-400'}`}>
                                    {getScore(cand)}%
                                </p>
                                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mt-1">Match</p>
                            </div>
                        </div>

                        <div className="p-4 bg-zinc-950">
                            <SkillRadarChart
                                skills={top6Skills}
                                data={top6Skills.map((sk: string) => {
                                    const found = cand.skill_scores?.find((ss: any) => ss.skill.toLowerCase() === sk.toLowerCase())
                                    let score = 0;
                                    if (found) {
                                        if (found.proficiency === 'Expert') score = 9;
                                        else if (found.proficiency === 'Intermediate') score = 6;
                                        else if (found.proficiency === 'Beginner') score = 3;
                                    }
                                    return { skill: sk, score }
                                })}
                            />
                        </div>

                        <div className="p-5 flex-1 flex flex-col gap-4">
                            <div>
                                <p className="text-xs text-zinc-500 uppercase font-bold mb-2">Evaluated Skills</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {cand.skill_scores?.slice(0, 8).map((ss: any, idx: number) => (
                                        <div key={idx} className="relative group inline-block">
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border cursor-default ${ss.proficiency === 'Expert' ? 'bg-accent/10 border-accent/30 text-accent' : ss.proficiency === 'Intermediate' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : ss.proficiency === 'Beginner' ? 'bg-zinc-800 border-zinc-700 text-zinc-300' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                                                {ss.skill}
                                            </span>
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-xs text-zinc-300 hidden group-hover:block z-50 shadow-xl pointer-events-none">
                                                <p className="font-bold text-white mb-1">{ss.proficiency || 'Unknown'}</p>
                                                <p>FAISS score: {ss.faiss_score ? (ss.faiss_score * 100).toFixed(0) : '0'}%</p>
                                                <p>Sources: {ss.source?.join(', ') || 'resume'}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-auto grid grid-cols-2 gap-2">
                                <button onClick={() => setViewCand(cand)} className="bg-zinc-800 hover:bg-accent hover:text-white hover:border-accent text-zinc-100 border border-zinc-700 text-sm font-bold py-2.5 rounded-lg transition-all flex items-center justify-center gap-2">
                                    View Deep Insights
                                </button>
                                <label className={`flex items-center justify-center gap-2 border text-sm font-medium py-2.5 rounded-lg cursor-pointer transition-colors ${selectedEmails.has(cand.original_profile?.github_username) ? 'bg-accent/10 border-accent text-accent' : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'}`}>
                                    <input type="checkbox" className="hidden" checked={selectedEmails.has(cand.original_profile?.github_username)} onChange={() => toggleSelected(cand.original_profile?.github_username)} />
                                    {selectedEmails.has(cand.original_profile?.github_username) ? <Check className="w-4 h-4" /> : <Mail className="w-4 h-4" />} {selectedEmails.has(cand.original_profile?.github_username) ? 'Selected' : 'Select'}
                                </label>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 border border-zinc-800 bg-zinc-900/50 rounded-xl p-6 shadow-xl relative overflow-hidden">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold flex items-center gap-2"><Sparkles className="w-5 h-5 text-amber-400" /> AI Comparison Summary</h3>
                        {!activeSummary && (
                            <button onClick={generateComparison} disabled={loadingSummary} className="text-sm bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-md disabled:opacity-50">
                                {loadingSummary ? 'Generating...' : 'Generate Analysis'}
                            </button>
                        )}
                    </div>
                    {sortedCandidates.length > 1 && (
                        <div className="border border-zinc-800 bg-zinc-950 p-4 rounded-xl mt-2 mb-6">
                           <h4 className="text-sm font-bold text-zinc-400 mb-4 px-2 uppercase tracking-wider text-center">Side-by-Side Skill Overlap</h4>
                           <ComparisonRadarChart skills={top6Skills} candidates={sortedCandidates.slice(0, 3)} />
                        </div>
                    )}

                    {activeSummary ? (
                        <VisualAIAnalysis summaryText={activeSummary.summary} />
                    ) : (
                        <div className="text-zinc-500 text-sm italic">Click generate to have the AI write a comprehensive summary of all candidates identifying strengths and differentiators.</div>
                    )}
                </div>

                <div className="lg:col-span-1 space-y-6 relative">
                    <div className="border border-zinc-800 bg-zinc-900/50 rounded-xl p-6 flex flex-col shadow-xl sticky top-6">
                        <div className="mb-4 pb-4">
                            <h3 className="text-xl font-bold mb-2 flex items-center gap-2"><Trophy className="w-5 h-5 text-amber-400" /> Executive Dashboard</h3>
                            <p className="text-zinc-400 text-sm">Review metrics before sending acceptance emails.</p>
                        </div>
                        
                        <div className="space-y-6 mb-8 flex-1">
                            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Score Leaderboard</h4>
                            <div className="space-y-4">
                                {sortedCandidates.map((cand: any, i: number) => (
                                    <div key={i} className="space-y-2">
                                        <div className="flex justify-between items-end">
                                            <span className="font-bold text-sm text-zinc-200">{cand.name}</span>
                                            <span className={`text-xs font-black ${i === 0 ? 'text-accent' : 'text-zinc-400'}`}>{getScore(cand)}%</span>
                                        </div>
                                        <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full transition-all duration-1000 ${i === 0 ? 'bg-accent shadow-[0_0_10px_rgba(29,158,117,0.5)]' : 'bg-zinc-600'}`}
                                                style={{ width: `${getScore(cand)}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-6 border-t border-zinc-800/50">
                                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Top Skills Competency</h4>
                                <div className="space-y-3">
                                    {top6Skills.slice(0,3).map((sk: string, i: number) => {
                                        const highestCand = sortedCandidates.reduce((prev: any, current: any) => {
                                            const prevScore = prev.skill_scores?.find((s: any) => s.skill.toLowerCase() === sk.toLowerCase())?.faiss_score || 0;
                                            const currScore = current.skill_scores?.find((s: any) => s.skill.toLowerCase() === sk.toLowerCase())?.faiss_score || 0;
                                            return (currScore > prevScore) ? current : prev;
                                        }, sortedCandidates[0]);
                                        
                                        return (
                                            <div key={i} className="bg-zinc-950/50 rounded-lg p-3 border border-zinc-800/50 flex align-center justify-between">
                                                <span className="text-xs font-medium text-zinc-300 flex items-center">{sk}</span>
                                                <span className="text-[10px] bg-zinc-800 px-2 py-1 rounded text-zinc-300 border border-zinc-700">Top: <span className="font-bold text-white">{highestCand?.name || 'N/A'}</span></span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="mt-auto pt-6 border-t border-zinc-800/50">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-sm font-bold">Selected</span>
                                <span className="bg-accent/20 text-accent font-black px-2 py-0.5 rounded text-xs">{selectedEmails.size} Candidate{selectedEmails.size !== 1 ? 's' : ''}</span>
                            </div>
                            <button
                                onClick={handleSendEmails}
                                disabled={selectedEmails.size === 0 || sending || sent}
                                className="w-full bg-accent hover:bg-accent/90 text-white font-bold py-3 rounded-lg shadow-[0_0_15px_rgba(29,158,117,0.2)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                {sent ? <><Check className="w-5 h-5" /> Sent!</> : sending ? 'Sending...' : <><Send className="w-5 h-5" /> Send Emails ({selectedEmails.size})</>}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {viewCand && <CandidateInsightsModal candidate={viewCand} jdData={jdData} onClose={() => setViewCand(null)} />}
        </div>
    )
}
