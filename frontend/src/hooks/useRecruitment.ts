import { createContext, useContext, useState } from 'react'

export function useRecruitmentState() {
    const [currentView, setCurrentView] = useState<'jd' | 'candidates' | 'dashboard'>('jd')
    const [jdData, setJdData] = useState<any>(null)
    const [jdRawText, setJdRawText] = useState<string>('')
    const [candidates, setCandidates] = useState<any[]>([])
    const [scoredCandidates, setScoredCandidates] = useState<any[]>([])
    const [comparisonResult, setComparisonResult] = useState<any>(null)
    const [dashboardData, setDashboardData] = useState<any>(null)
    const [pipelineLoading, setPipelineLoading] = useState(false)
    const [pipelineStatus, setPipelineStatus] = useState<string>('')

    return {
        currentView, setCurrentView,
        jdData, setJdData,
        jdRawText, setJdRawText,
        candidates, setCandidates,
        scoredCandidates, setScoredCandidates,
        comparisonResult, setComparisonResult,
        dashboardData, setDashboardData,
        pipelineLoading, setPipelineLoading,
        pipelineStatus, setPipelineStatus,
    }
}

export const RecruitmentContext = createContext<ReturnType<typeof useRecruitmentState> | null>(null)

export function useRecruitment() {
    const context = useContext(RecruitmentContext)
    if (!context) throw new Error('useRecruitment must be used within RecruitmentContext.Provider')
    return context
}
