interface UsageChartProps {
  data: { date: string; requests: number; revenue: string }[]
}

export default function UsageChart({ data }: UsageChartProps) {
  const safeData =
    data.length > 0
      ? data
      : Array.from({ length: 7 }, (_, index) => ({
          date: `Day ${index + 1}`,
          requests: 0,
          revenue: "0.00"
        }))

  const maxRequests = Math.max(...safeData.map((item) => item.requests), 1)
  const width = 560
  const height = 240
  const padding = 24
  const gap = 14
  const barWidth = (width - padding * 2 - gap * (safeData.length - 1)) / safeData.length

  return (
    <div className="space-y-4">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full overflow-visible">
        {safeData.map((item, index) => {
          const barHeight = (item.requests / maxRequests) * (height - padding * 2 - 24)
          const x = padding + index * (barWidth + gap)
          const y = height - padding - barHeight - 20

          return (
            <g key={`${item.date}-${index}`}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx="10"
                className="fill-purple-600"
              />
              <text
                x={x + barWidth / 2}
                y={height - 6}
                textAnchor="middle"
                className="fill-gray-500 text-[11px]"
              >
                {new Date(item.date).toLocaleDateString(undefined, { weekday: "short" })}
              </text>
              <text
                x={x + barWidth / 2}
                y={y - 8}
                textAnchor="middle"
                className="fill-gray-300 text-[11px]"
              >
                {item.requests}
              </text>
            </g>
          )
        })}
      </svg>
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <span className="inline-block h-3 w-3 rounded-full bg-purple-600" />
        Requests per day
      </div>
    </div>
  )
}
