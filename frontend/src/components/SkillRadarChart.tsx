import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts'

export default function SkillRadarChart({ skills, data }: { skills: string[], data: any[] }) {
    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                    <PolarGrid stroke="#3f3f46" />
                    <PolarAngleAxis dataKey="skill" tick={{ fill: '#a1a1aa', fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 10]} max={10} tick={false} axisLine={false} />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                        itemStyle={{ color: '#e0e7ff' }}
                    />
                    <Radar name="Candidate Score" dataKey="score" stroke="#1D9E75" fill="#1D9E75" fillOpacity={0.4} />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    )
}
