import { useMemo } from 'react'
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts'
import { buildDayMap, dailySeries, weeklySeries, monthlySeries } from '../../utils/analytics'

const tooltipStyle = {
  backgroundColor: 'rgba(90,46,30,0.96)',
  border: '1px solid rgba(249,115,22,0.45)',
  borderRadius: '14px',
  color: '#f6ede4',
  fontSize: '12px',
}

/** Line chart of daily completion % and XP over the last N days. */
export function DailyTrend({ history, liveToday, days = 30 }) {
  const data = useMemo(
    () => dailySeries(buildDayMap(history, liveToday), days),
    [history, liveToday, days],
  )
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(140,123,112,0.25)" />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#8c7b70' }} interval="preserveStartEnd" minTickGap={24} />
          <YAxis yAxisId="pct" domain={[0, 100]} tick={{ fontSize: 10, fill: '#8c7b70' }} />
          <YAxis yAxisId="xp" orientation="right" tick={{ fontSize: 10, fill: '#8c7b70' }} />
          <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#fdba74', fontWeight: 700 }} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar yAxisId="xp" dataKey="xp" name="XP" fill="#A0470F" radius={[3, 3, 0, 0]} opacity={0.55} />
          <Line yAxisId="pct" type="monotone" dataKey="pct" name="Completion %" stroke="#F97316" strokeWidth={2.5} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

/** Weekly aggregate bars (avg completion % + XP sum). */
export function WeeklyTrend({ history, liveToday, weeks = 8 }) {
  const data = useMemo(
    () => weeklySeries(buildDayMap(history, liveToday), weeks),
    [history, liveToday, weeks],
  )
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(140,123,112,0.25)" />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#8c7b70' }} />
          <YAxis yAxisId="pct" domain={[0, 100]} tick={{ fontSize: 10, fill: '#8c7b70' }} />
          <YAxis yAxisId="xp" orientation="right" tick={{ fontSize: 10, fill: '#8c7b70' }} />
          <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#fdba74', fontWeight: 700 }} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar yAxisId="xp" dataKey="xp" name="XP" fill="#8FA82B" radius={[4, 4, 0, 0]} opacity={0.55} />
          <Line yAxisId="pct" type="monotone" dataKey="pct" name="Avg completion %" stroke="#5A2E1E" strokeWidth={2.5} dot={{ r: 3 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

/** Monthly aggregate bars. */
export function MonthlyTrend({ history, liveToday, months = 6 }) {
  const data = useMemo(
    () => monthlySeries(buildDayMap(history, liveToday), months),
    [history, liveToday, months],
  )
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(140,123,112,0.25)" />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#8c7b70' }} />
          <YAxis tick={{ fontSize: 10, fill: '#8c7b70' }} />
          <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#fdba74', fontWeight: 700 }} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="xp" name="XP earned" fill="#E88BC8" radius={[4, 4, 0, 0]} />
          <Bar dataKey="activeDays" name="Days active" fill="#5A2E1E" radius={[4, 4, 0, 0]} opacity={0.7} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
