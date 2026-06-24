/**
 * LineChart - Simple line chart with gradient fill.
 *
 * Measures its own width (onLayout) and renders the SVG 1:1 at that width, so
 * geometry and axis labels stay correctly positioned at any container size.
 */

import { theme } from '@/theme/theme'
import { useState } from 'react'
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native'
import Svg, {
  Circle,
  Defs,
  Line,
  LinearGradient,
  Path,
  Stop,
  Text as SvgText
} from 'react-native-svg'

export type DataPoint = {
  date: string
  value: number
  label?: string
  /** Render this point emphasized (e.g. a personal record). */
  highlight?: boolean
}

type Props = {
  data: DataPoint[]
  height?: number
  showDots?: boolean
  showLabels?: boolean
  showGrid?: boolean
  valueFormatter?: (value: number) => string
  color?: string
}

// Sensible first-paint width before onLayout reports the real one.
const DEFAULT_WIDTH = 320

export default function LineChart({
  data,
  height = 180,
  showDots = true,
  showLabels = true,
  showGrid = true,
  valueFormatter = v => String(v),
  color = theme.colors.primary
}: Props) {
  const [width, setWidth] = useState(DEFAULT_WIDTH)

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width
    if (w > 0 && Math.abs(w - width) > 1) setWidth(w)
  }

  if (data.length === 0) {
    return (
      <View style={[styles.container, { height }]} onLayout={onLayout}>
        <Text style={styles.emptyText}>No data available</Text>
      </View>
    )
  }

  const padding = { top: 20, right: 20, bottom: 40, left: 40 }
  const chartWidth = Math.max(1, width - padding.left - padding.right)
  const chartHeight = Math.max(1, height - padding.top - padding.bottom)

  // Drop non-finite values so a bad point can't NaN the whole path.
  const values = data.map(d => (Number.isFinite(d.value) ? d.value : 0))
  const minValue = Math.min(...values)
  const maxValue = Math.max(...values)
  const valueRange = maxValue - minValue

  const getX = (index: number) =>
    padding.left + (index / (data.length - 1 || 1)) * chartWidth
  const getY = (value: number) =>
    // A flat series (range 0) is centered rather than pinned to the axis.
    valueRange === 0
      ? padding.top + chartHeight / 2
      : padding.top + chartHeight - ((value - minValue) / valueRange) * chartHeight

  const linePath = data
    .map((point, index) => {
      const x = getX(index)
      const y = getY(values[index])
      return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`
    })
    .join(' ')

  // Closed polygon for the gradient fill, anchored to the baseline.
  const baseline = padding.top + chartHeight
  const fillPath =
    `${linePath} L ${getX(data.length - 1)} ${baseline}` +
    ` L ${getX(0)} ${baseline} Z`

  const yLabels = [
    { value: maxValue, y: padding.top },
    { value: (maxValue + minValue) / 2, y: padding.top + chartHeight / 2 },
    { value: minValue, y: baseline }
  ]

  const xLabelIndices = [0, Math.floor(data.length / 2), data.length - 1]

  return (
    <View style={styles.container} onLayout={onLayout}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="fillGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <Stop offset="100%" stopColor={color} stopOpacity="0.05" />
          </LinearGradient>
        </Defs>

        {/* Grid lines */}
        {showGrid &&
          yLabels.map((label, i) => (
            <Line
              key={`grid-${i}`}
              x1={padding.left}
              y1={label.y}
              x2={width - padding.right}
              y2={label.y}
              stroke={theme.colors.border}
              strokeWidth={1}
              strokeDasharray="4,4"
            />
          ))}

        {/* Fill area — only meaningful with at least a segment */}
        {data.length > 1 && <Path d={fillPath} fill="url(#fillGradient)" />}

        {/* Line */}
        <Path
          d={linePath}
          stroke={color}
          strokeWidth={2.5}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points — highlighted points (e.g. PRs) always render */}
        {data.map((point, index) => {
          const highlighted = point.highlight
          if (!showDots && !highlighted) return null
          return (
            <Circle
              key={`dot-${index}`}
              cx={getX(index)}
              cy={getY(values[index])}
              r={highlighted ? 5 : 4}
              fill={highlighted ? theme.colors.accent : theme.colors.surface}
              stroke={highlighted ? theme.colors.accent : color}
              strokeWidth={2}
            />
          )
        })}

        {/* Y-axis labels */}
        {showLabels &&
          yLabels.map((label, i) => (
            <SvgText
              key={`y-label-${i}`}
              x={padding.left - 8}
              y={label.y + 4}
              fontSize={10}
              fill={theme.colors.muted}
              textAnchor="end"
            >
              {valueFormatter(label.value)}
            </SvgText>
          ))}

        {/* X-axis labels */}
        {showLabels &&
          xLabelIndices.map((idx, position) => {
            if (!data[idx]) return null
            const point = data[idx]
            const label =
              point.label ||
              new Date(point.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
              })
            return (
              <SvgText
                key={`x-label-${position}-${idx}`}
                x={getX(idx)}
                y={height - 8}
                fontSize={10}
                fill={theme.colors.muted}
                textAnchor="middle"
              >
                {label}
              </SvgText>
            )
          })}
      </Svg>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%'
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.muted,
    textAlign: 'center',
    paddingVertical: theme.spacing.xl
  }
})
