import { X, ZoomIn, ZoomOut, ArrowUpCircle, GitPullRequest, GitBranch, Activity } from 'lucide-react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { useState } from 'react'

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

const activityIconMap: Record<string, React.ElementType> = {
    Push: ArrowUpCircle,
    PushEvent: ArrowUpCircle,
    PullRequest: GitPullRequest,
    PullRequestEvent: GitPullRequest,
    Create: GitBranch,
    CreateEvent: GitBranch,
}

function formatDate(dateStr: string) {
    try {
        return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    } catch {
        return dateStr
    }
}

export default function ResumeSidePanel({ candidate, onClose }: { candidate: any, onClose: () => void }) {
    const [numPages, setNumPages] = useState<number>()
    const [scale, setScale] = useState(1.2)

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

    return (
        <div className="fixed inset-y-0 right-0 w-full md:w-[600px] bg-zinc-950 border-l border-zinc-800 shadow-2xl flex flex-col z-50 animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/50">
                <h3 className="font-semibold text-lg">{candidate?.original_profile?.name || candidate?.name}'s Resume</h3>
                <div className="flex items-center gap-2">
                    <button onClick={() => setScale(s => s - 0.2)} className="p-2 hover:bg-zinc-800 rounded-md text-zinc-400"><ZoomOut className="w-4 h-4" /></button>
                    <button onClick={() => setScale(s => s + 0.2)} className="p-2 hover:bg-zinc-800 rounded-md text-zinc-400"><ZoomIn className="w-4 h-4" /></button>
                    <div className="w-px h-6 bg-zinc-800 mx-2"></div>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-md text-zinc-400"><X className="w-5 h-5" /></button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-zinc-900/30 p-4">
                {resumeUrl ? (
                    isPDF ? (
                        <Document
                            file={resumeUrl}
                            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                            className="flex flex-col items-center gap-4"
                            loading={<div className="animate-pulse text-zinc-500">Loading PDF...</div>}
                        >
                            {Array.from(new Array(numPages), (_, index) => (
                                <Page
                                    key={`page_${index + 1}`}
                                    pageNumber={index + 1}
                                    scale={scale}
                                    className="shadow-xl"
                                    renderTextLayer={true}
                                    renderAnnotationLayer={false}
                                />
                            ))}
                        </Document>
                    ) : (
                        <div className="text-zinc-500 text-center mt-20 flex flex-col items-center gap-4">
                            <div className="p-4 bg-zinc-900 rounded-lg border border-zinc-800">
                                <p className="text-zinc-300 font-medium">Preview not supported for this file type</p>
                                <p className="text-sm mt-2">{filename}</p>
                                <p className="text-xs mt-2 italic">Inline preview only supports .pdf files.</p>
                            </div>
                        </div>
                    )
                ) : (
                    <div className="text-zinc-500 text-center mt-20">No document available for this candidate.</div>
                )}
            </div>

            <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex-shrink-0 space-y-4">
                <div>
                    <h4 className="font-semibold text-sm mb-2 text-zinc-400 uppercase">GitHub Analytics</h4>
                    <div className="grid grid-cols-4 gap-4 text-center">
                        <div className="bg-zinc-900 p-2 rounded-lg border border-zinc-800">
                            <p className="text-xl font-bold text-accent">{candidate.github_stats?.total_stars ?? '—'}</p>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Stars</p>
                        </div>
                        <div className="bg-zinc-900 p-2 rounded-lg border border-zinc-800">
                            <p className="text-xl font-bold text-accent">{candidate.github_stats?.total_forks ?? '—'}</p>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Forks</p>
                        </div>
                        <div className="col-span-2 bg-zinc-900 p-2 rounded-lg border border-zinc-800 text-left px-3">
                            <p className="text-xs text-zinc-400 truncate mt-1 break-all">Top: {candidate.github_stats?.top_languages?.join(', ') || '—'}</p>
                            <p className="text-xs text-zinc-500 mt-1">Last active: {candidate.github_stats?.last_activity ? new Date(candidate.github_stats.last_activity).toLocaleDateString() : '—'}</p>
                        </div>
                    </div>
                </div>

                <div>
                    <h4 className="font-semibold text-sm mb-2 text-zinc-400 uppercase">Recent Activity</h4>
                    {recentActivity.length > 0 ? (
                        <div className="space-y-1.5">
                            {recentActivity.slice(0, 3).map((item: any, idx: number) => {
                                const Icon = activityIconMap[item.type] || Activity
                                return (
                                    <div key={idx} className="flex items-center justify-between text-xs text-zinc-400">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <Icon className="w-3.5 h-3.5 flex-shrink-0 text-zinc-500" />
                                            <span className="truncate">{item.type} → {item.repo}</span>
                                        </div>
                                        <span className="text-zinc-500 flex-shrink-0 ml-2">{formatDate(item.date)}</span>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <p className="text-xs text-zinc-500 italic">No recent public activity found</p>
                    )}
                </div>
            </div>
        </div>
    )
}
