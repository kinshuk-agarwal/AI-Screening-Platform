import { X, ZoomIn, ZoomOut, ArrowUpCircle, GitPullRequest, GitBranch, Activity, FileText, Code2, Star, GitMerge, Award, CheckCircle } from 'lucide-react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { useState } from 'react'
import SkillRadarChart from './SkillRadarChart'

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

const activityIconMap: Record<string, React.ElementType> = {
    Push: ArrowUpCircle,
    PushEvent: ArrowUpCircle,
    PullRequest: GitPullRequest,
    PullRequestEvent: GitPullRequest,
    Create: GitBranch,
    CreateEvent: GitBranch,
    Watch: Star,
    WatchEvent: Star,
    Public: Award,
    PublicEvent: Award,
    Release: CheckCircle,
    ReleaseEvent: CheckCircle,
}

function formatDate(dateStr: string) {
    try {
        return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    } catch {
        return dateStr
    }
}

export default function CandidateInsightsModal({ candidate, jdData, onClose }: { candidate: any, jdData: any, onClose: () => void }) {
    const [numPages, setNumPages] = useState<number>()
    const [scale, setScale] = useState(1.0)
    const [activeTab, setActiveTab] = useState<'overview' | 'skills' | 'github'>('overview')

    const resumeUrl =
        candidate?.original_profile?.resume_file_local_url ||
        candidate?.resume_file_local_url ||
        null

    const filename =
        candidate?.original_profile?.file?.name ||
        candidate?.file?.name ||
        ''

    const isPDF = filename.toLowerCase().endsWith('.pdf')
    const recentActivity: any[] = candidate?.github_stats?.recent_activity || []
    
    // Derived values
    const score = candidate?.weighted_score ?? candidate?.overall_match_percent ?? 0
    const top6Skills = jdData?.must_have_skills?.slice(0, 6).map((s: any) => s.skill) || []

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200">
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full h-full max-w-[1400px] shadow-2xl flex flex-col md:flex-row overflow-hidden animate-in zoom-in-95 duration-200">
                
                {/* LEFT DASHBOARD PANEL */}
                <div className="w-full md:w-[55%] flex flex-col h-full bg-zinc-950 relative overflow-hidden">
                    <div className="flex items-center justify-between p-6 border-b border-zinc-800 shrink-0">
                        <div>
                            <h2 className="text-2xl font-black">{candidate?.original_profile?.name || candidate?.name}</h2>
                            <p className="text-zinc-400 font-medium">@{candidate?.original_profile?.github_username || candidate?.github_username}</p>
                        </div>
                        <div className="text-right">
                            <div className={`text-3xl font-black ${score > 75 ? 'text-accent' : score > 50 ? 'text-amber-400' : 'text-red-400'}`}>
                                {score}%
                            </div>
                            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mt-1">Overall Match</p>
                        </div>
                    </div>

                    {/* TABS */}
                    <div className="flex border-b border-zinc-800 bg-zinc-900/50 shrink-0">
                        <button onClick={() => setActiveTab('overview')} className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider ${activeTab === 'overview' ? 'text-accent border-b-2 border-accent bg-accent/5' : 'text-zinc-500 hover:text-zinc-300'}`}>Overview</button>
                        <button onClick={() => setActiveTab('skills')} className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider ${activeTab === 'skills' ? 'text-accent border-b-2 border-accent bg-accent/5' : 'text-zinc-500 hover:text-zinc-300'}`}>Skills Deep Dive</button>
                        <button onClick={() => setActiveTab('github')} className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider ${activeTab === 'github' ? 'text-accent border-b-2 border-accent bg-accent/5' : 'text-zinc-500 hover:text-zinc-300'}`}>GitHub Analytics</button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-zinc-800">
                        
                        {activeTab === 'overview' && (
                            <div className="space-y-8 animate-in fade-in">
                                <div>
                                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Award className="w-5 h-5 text-accent"/> Foundation Breakdown</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl">
                                            <p className="text-xs text-zinc-500 uppercase font-bold tracking-wide">Resume Match Score</p>
                                            <p className="text-2xl font-black mt-1 text-zinc-200">{candidate?.resume_score ?? 0}%</p>
                                        </div>
                                        <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl">
                                            <p className="text-xs text-zinc-500 uppercase font-bold tracking-wide">GitHub Match Score</p>
                                            <p className="text-2xl font-black mt-1 text-zinc-200">{candidate?.github_score ?? 0}%</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-4">
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-4">Core Competency Radar</h3>
                                    <div className="h-[250px]">
                                        <SkillRadarChart
                                            skills={top6Skills}
                                            data={top6Skills.map((sk: string) => {
                                                const found = candidate.skill_scores?.find((ss: any) => ss.skill.toLowerCase() === sk.toLowerCase())
                                                let sc = 0;
                                                if (found) {
                                                    if (found.proficiency === 'Expert') sc = 9;
                                                    else if (found.proficiency === 'Intermediate') sc = 6;
                                                    else if (found.proficiency === 'Beginner') sc = 3;
                                                }
                                                return { skill: sk, score: sc }
                                            })}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'skills' && (
                            <div className="space-y-6 animate-in fade-in">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><CheckCircle className="w-5 h-5 text-accent"/> Evaluated Skills Matrix</h3>
                                
                                <div className="space-y-3">
                                    {candidate.skill_scores?.map((ss: any, idx: number) => (
                                        <div key={idx} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-bold text-lg text-white">{ss.skill}</h4>
                                                <span className={`text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-wider ${ss.proficiency === 'Expert' ? 'bg-accent/20 text-accent' : ss.proficiency === 'Intermediate' ? 'bg-amber-500/20 text-amber-400' : ss.proficiency === 'Beginner' ? 'bg-zinc-700 text-zinc-300' : 'bg-red-500/20 text-red-400'}`}>
                                                    {ss.proficiency || 'Unknown'}
                                                </span>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-4 mt-4">
                                                <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800/50">
                                                    <p className="text-[10px] uppercase font-bold text-zinc-500 mb-1">Evidentiary Sources</p>
                                                    <p className="text-xs text-zinc-300">{ss.source?.join(', ') || 'Not found'}</p>
                                                </div>
                                                <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800/50">
                                                    <p className="text-[10px] uppercase font-bold text-zinc-500 mb-1">FAISS Semantic Score</p>
                                                    <p className="text-xs font-medium text-emerald-400">{ss.faiss_score ? (ss.faiss_score * 100).toFixed(1) : '0'}% relevance</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {(!candidate.skill_scores || candidate.skill_scores.length === 0) && (
                                        <p className="text-zinc-500 italic">No detailed skills evaluated.</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'github' && (
                            <div className="space-y-6 animate-in fade-in">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Code2 className="w-5 h-5 text-accent"/> GitHub Profile Analytics</h3>
                                
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-center">
                                        <Code2 className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
                                        <p className="text-2xl font-black">{candidate.github_stats?.total_repos ?? '—'}</p>
                                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Total Repos</p>
                                    </div>
                                    <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-center">
                                        <Star className="w-5 h-5 text-amber-400 mx-auto mb-2" />
                                        <p className="text-2xl font-black">{candidate.github_stats?.total_stars ?? '—'}</p>
                                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Total Stars</p>
                                    </div>
                                    <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-center">
                                        <GitMerge className="w-5 h-5 text-blue-400 mx-auto mb-2" />
                                        <p className="text-2xl font-black">{candidate.github_stats?.total_forks ?? '—'}</p>
                                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Total Forks</p>
                                    </div>
                                    <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-center flex flex-col justify-center">
                                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Last Active</p>
                                        <p className="text-xs font-bold text-zinc-300">
                                            {candidate.github_stats?.last_activity ? new Date(candidate.github_stats.last_activity).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown'}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-zinc-800">
                                    <h4 className="font-bold text-sm text-zinc-400 uppercase tracking-wider">Top Languages</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {candidate.github_stats?.top_languages?.length > 0 ? (
                                            candidate.github_stats.top_languages.map((lang: string, i: number) => (
                                                <span key={i} className="px-3 py-1 bg-zinc-800 text-zinc-200 text-xs rounded-full font-medium border border-zinc-700">{lang}</span>
                                            ))
                                        ) : (
                                            <span className="text-sm text-zinc-500">No languages found</span>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-zinc-800">
                                    <h4 className="font-bold text-sm text-zinc-400 uppercase tracking-wider">Recent Event Log</h4>
                                    <div className="space-y-3">
                                        {recentActivity.length > 0 ? (
                                            recentActivity.map((item: any, idx: number) => {
                                                const Icon = activityIconMap[item.type] || Activity
                                                return (
                                                    <div key={idx} className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-zinc-800 rounded-md shrink-0">
                                                                <Icon className="w-4 h-4 text-zinc-400" />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-zinc-200">{item.type}</p>
                                                                <p className="text-xs text-zinc-500 font-medium">{item.repo}</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-xs font-mono text-zinc-400 sm:text-right shrink-0">
                                                            {formatDate(item.date)}
                                                        </div>
                                                    </div>
                                                )
                                            })
                                        ) : (
                                            <p className="text-sm text-zinc-500 italic">No recent public activity parsed.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                        
                    </div>
                </div>

                {/* RIGHT PDF VIEWER PANEL */}
                <div className="w-full md:w-[45%] bg-[#1a1a1a] border-l md:border-t-0 border-t border-zinc-800 flex flex-col relative h-full shrink-0 overflow-hidden">
                    <div className="flex-none flex items-center justify-between p-4 bg-zinc-900 border-b border-zinc-800 shadow-xl z-10">
                        <h3 className="font-bold text-sm flex items-center gap-2"><FileText className="w-4 h-4 text-accent"/> Source Document</h3>
                        <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
                            <button onClick={() => setScale(s => Math.max(0.4, s - 0.2))} className="p-1.5 hover:bg-zinc-800 rounded-md text-zinc-400 transition-colors"><ZoomOut className="w-4 h-4" /></button>
                            <span className="text-xs font-mono text-zinc-500 w-12 text-center">{Math.round(scale * 100)}%</span>
                            <button onClick={() => setScale(s => Math.min(3.0, s + 0.2))} className="p-1.5 hover:bg-zinc-800 rounded-md text-zinc-400 transition-colors"><ZoomIn className="w-4 h-4" /></button>
                            <div className="w-px h-5 bg-zinc-800 mx-1"></div>
                            <button onClick={onClose} className="p-1.5 hover:bg-red-500/20 hover:text-red-400 rounded-md text-zinc-400 transition-colors group"><X className="w-4 h-4 group-hover:scale-110 transition-transform" /></button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto overflow-x-hidden w-full flex justify-center py-6 bg-zinc-900/20 custom-scrollbar relative">
                        {resumeUrl ? (
                            isPDF ? (
                                <Document
                                    file={resumeUrl}
                                    onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                                    className="flex flex-col items-center gap-4 w-full"
                                    loading={<div className="animate-pulse text-zinc-500 flex flex-col items-center mt-20"><FileText className="w-8 h-8 opacity-50 mb-2"/>Loading PDF Engine...</div>}
                                >
                                    {Array.from(new Array(numPages), (_, index) => (
                                        <Page
                                            key={`page_${index + 1}`}
                                            pageNumber={index + 1}
                                            scale={scale}
                                            className="shadow-2xl ring-1 ring-white/10"
                                            renderTextLayer={true}
                                            renderAnnotationLayer={false}
                                        />
                                    ))}
                                </Document>
                            ) : (
                                <div className="text-zinc-500 text-center m-auto flex flex-col items-center gap-4 max-w-sm px-4">
                                    <div className="p-6 bg-zinc-900/80 rounded-2xl border border-zinc-800/80 shadow-2xl backdrop-blur-lg">
                                        <FileText className="w-12 h-12 mx-auto mb-4 text-zinc-600"/>
                                        <p className="text-zinc-200 font-bold mb-2">Preview not supported</p>
                                        <p className="text-sm font-mono text-accent truncate border border-accent/20 bg-accent/5 p-2 rounded-lg">{filename}</p>
                                        <p className="text-xs mt-4 text-zinc-500 leading-relaxed">Inline preview specifically requires PDF format documents for accurate rendering.</p>
                                    </div>
                                </div>
                            )
                        ) : (
                            <div className="text-zinc-600 text-center m-auto font-medium">No document attached to this candidate profile.</div>
                        )}
                    </div>
                </div>

            </div>
            
            {/* Custom scrollbar styles specific to this modal */}
            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #3f3f46;
                    border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #52525b;
                }
                .react-pdf__Page__textContent {
                    overflow: hidden !important;
                }
            `}</style>
        </div>
    )
}
