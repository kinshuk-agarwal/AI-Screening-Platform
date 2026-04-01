import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts'

export default function ComparisonRadarChart({ skills, candidates }: { skills: string[], candidates: any[] }) {
    // We need data in format: { skill: 'Python', 'Kinshuk Agarwal': 9, 'Shrishk Kumar': 6 }
    const chartData = skills.map(sk => {
        const row: any = { skill: sk }
        candidates.forEach(cand => {
            const found = cand.skill_scores?.find((ss: any) => ss.skill.toLowerCase() === sk.toLowerCase())
            let score = 0;
            if (found) {
                if (found.proficiency === 'Expert') score = 9;
                else if (found.proficiency === 'Intermediate') score = 6;
                else if (found.proficiency === 'Beginner') score = 3;
            }
            row[cand.name] = score
        })
        return row
    })

    const colors = ['#1D9E75', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4']

    return (
        <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
                    <PolarGrid stroke="#3f3f46" />
                    <PolarAngleAxis dataKey="skill" tick={{ fill: '#a1a1aa', fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 10]} max={10} tick={false} axisLine={false} />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', color: '#fff' }}
                        itemStyle={{ color: '#e0e7ff' }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    {candidates.map((cand, i) => (
                        <Radar 
                            key={cand.name} 
                            name={cand.name} 
                            dataKey={cand.name} 
                            stroke={colors[i % colors.length]} 
                            fill={colors[i % colors.length]} 
                            fillOpacity={0.4} 
                        />
                    ))}
                </RadarChart>
            </ResponsiveContainer>
        </div>
    )
}
