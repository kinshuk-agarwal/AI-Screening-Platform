import { JDPage } from './pages/JDPage'
import { CandidatesPage } from './pages/CandidatesPage'
import ComparisonDashboard from './pages/ComparisonDashboard'
import { RecruitmentContext, useRecruitmentState } from './hooks/useRecruitment'

export default function App() {
  const state = useRecruitmentState()
  const { currentView, setCurrentView, jdData, dashboardData } = state

  return (
    <RecruitmentContext.Provider value={state}>
      <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-accent/30 flex flex-col">
        <header className="sticky top-0 z-50 w-full border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/60">
          <div className="container mx-auto flex h-16 items-center flex-row justify-between px-6">
            <div className="font-extrabold font-heading text-xl tracking-tight text-white flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-accent"></div>
              AI Recruiter
            </div>
            <nav className="flex space-x-1 p-1 bg-zinc-900 rounded-lg border border-zinc-800">
              <button onClick={() => setCurrentView('jd')} className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${currentView === 'jd' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}>1. Job Details</button>
              <button onClick={() => setCurrentView('candidates')} disabled={!jdData} className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${currentView === 'candidates' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}>2. Candidates</button>
              <button onClick={() => setCurrentView('dashboard')} disabled={!dashboardData} className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${currentView === 'dashboard' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}>3. Dashboard</button>
            </nav>
          </div>
        </header>

        <main className="flex-1 w-full px-4 overflow-x-hidden">
          {currentView === 'jd' && <JDPage />}
          {currentView === 'candidates' && <CandidatesPage />}
          {currentView === 'dashboard' && <ComparisonDashboard />}
        </main>
      </div>
    </RecruitmentContext.Provider>
  )
}
