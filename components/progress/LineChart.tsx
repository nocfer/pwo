/**
 * LineChart - Simple line chart with gradient fill
 */

import { theme } from "@/theme/theme";
import { StyleSheet, Text, View } from "react-native";
import Svg, {
    Circle,
    Defs,
    Line,
    LinearGradient,
    Path,
    Stop,
    Text as SvgText
} from "react-native-svg";

export type DataPoint = {
  date: string;
  value: number;
  label?: string;
};

type Props = {
  data: DataPoint[];
  height?: number;
  showDots?: boolean;
  showLabels?: boolean;
  showGrid?: boolean;
  valueFormatter?: (value: number) => string;
  color?: string;
};

export default function LineChart({
  data,
  height = 180,
  showDots = true,
  showLabels = true,
  showGrid = true,
  valueFormatter = (v) => String(v),
  color = theme.colors.primary
}: Props) {
  if (data.length === 0) {
    return (
      <View style={[styles.container, { height }]}>
        <Text style={styles.emptyText}>No data available</Text>
      </View>
    );
  }

  const width = 300; // Will be stretched via aspectRatio
  const padding = { top: 20, right: 20, bottom: 40, left: 40 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const values = data.map((d) => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const valueRange = maxValue - minValue || 1;

  // Scale values to chart dimensions
  const getX = (index: number) =>
    padding.left + (index / (data.length - 1 || 1)) * chartWidth;
  const getY = (value: number) =>
    padding.top + chartHeight - ((value - minValue) / valueRange) * chartHeight;

  // Build line path
  const linePath = data
    .map((point, index) => {
      const x = getX(index);
      const y = getY(point.value);
      return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    })
    .join(" ");

  // Build fill path (closed polygon)
  const fillPath =
    linePath +
    ` L ${getX(data.length - 1)} ${padding.top + chartHeight}` +
    ` L ${padding.left} ${padding.top + chartHeight}` +
    " Z";

  // Y-axis labels (3 values: min, mid, max)
  const yLabels = [
    { value: maxValue, y: padding.top },
    { value: (maxValue + minValue) / 2, y: padding.top + chartHeight / 2 },
    { value: minValue, y: padding.top + chartHeight }
  ];

  // X-axis labels (first, middle, last)
  const xLabelIndices = [0, Math.floor(data.length / 2), data.length - 1];

  return (
    <View style={styles.container}>
      <Svg
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
      >
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

        {/* Fill area */}
        <Path d={fillPath} fill="url(#fillGradient)" />

        {/* Line */}
        <Path
          d={linePath}
          stroke={color}
          strokeWidth={2.5}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {showDots &&
          data.map((point, index) => (
            <Circle
              key={`dot-${index}`}
              cx={getX(index)}
              cy={getY(point.value)}
              r={4}
              fill={theme.colors.surface}
              stroke={color}
              strokeWidth={2}
            />
          ))}

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
            if (!data[idx]) return null;
            const point = data[idx];
            const label =
              point.label ||
              new Date(point.date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric"
              });
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
            );
          })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%"
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.muted,
    textAlign: "center",
    paddingVertical: theme.spacing.xl
  }
});
