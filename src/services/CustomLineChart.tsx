/* eslint-disable react-native/no-inline-styles */
import React from "react";
import { View, StyleSheet, Dimensions, Text } from "react-native";
import Svg, { Path, Line, Circle } from "react-native-svg";

// Candle interface
export interface Candle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  tick_volume: number;
}

const { width, height } = Dimensions.get("window");
const chartHeight = height * 0.37;
const chartWidth = width - 60;

const formatDate = (dateStr: string): string => {
  // expects "YYYY-MM-DD HH:mm:ss"
  const date = new Date(dateStr.replace(" ", "T")); // ensure valid ISO format
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
};

export const CustomLineChart = ({ data }: { data: Candle[] }) => {
  if (!data || data.length === 0) return null;

  // Extract close prices
  const values = data.map((c) => c.close);

  // Find min & max for scaling
  let min = Math.min(...values);
  let max = Math.max(...values);

  // ✅ Add padding (5% of range) so line doesn't touch top/bottom
  const padding = (max - min) * 0.05 || 1; // fallback 1 if all values equal
  min -= padding;
  max += padding;

  // ✅ Limit width to 75%
  const effectiveWidth = chartWidth * 0.60;

  // Convert data points into SVG coordinates
  const points = values.map((value, i) => {
    const x = (i / (values.length - 1)) * effectiveWidth;
    const y = chartHeight - ((value - min) / (max - min)) * chartHeight;
    return { x, y, value, time: data[i].time };
  });

  const pathData = points
    .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
    .join(" ");

  const lastPoint = points[points.length - 1];

  // ✅ Pick only 4 Y-axis ticks (min, max, and 2 mids)
  const yTicks = [max, max - (max - min) / 3, max - (2 * (max - min)) / 3, min];

  // ✅ Pick only 3 X-axis ticks (first, middle, last)
  const xTicks = [
    points[0],
    points[Math.floor(points.length / 4)],
    points[points.length - 1],
  ];

  return (
    <View style={styles.container}>
      <Svg width={chartWidth} height={chartHeight}>
        {/* Y-axis grid lines + labels */}
        {yTicks.map((value, i) => {
          const y = chartHeight - ((value - min) / (max - min)) * chartHeight;
          return (
            <React.Fragment key={i}>
              <Line
                x1="0"
                y1={y}
                x2={chartWidth}
                y2={y}
                stroke="#ddd"
                strokeWidth="1"
              />
              <Text
                style={{
                  position: "absolute",
                  left: chartWidth + 5,
                  top: y - 8,
                  fontSize: 12,
                  color: "#333",
                }}
              >
                {value.toFixed(4)}
              </Text>
            </React.Fragment>
          );
        })}

        {/* Line Path (only 75% width) */}
        <Path d={pathData} stroke="black" strokeWidth="2" fill="none" />

        {/* Last point indicator */}
        <Circle cx={lastPoint.x} cy={lastPoint.y} r="3" fill="black" />

        {/* Dotted line from last point to y-axis */}
        <Line
          x1={lastPoint.x}
          y1={lastPoint.y}
          x2={chartWidth}
          y2={lastPoint.y}
          stroke="#1992FC"
          strokeWidth="1"
          strokeDasharray="4,4"
        />
         <Line
          x1={lastPoint.x}
          y1={lastPoint.y + 5}
          x2={chartWidth}
          y2={lastPoint.y + 5}
          stroke="#ff5b5b"
          strokeWidth="1"
          strokeDasharray="4,4"
        />
      </Svg>

      {/* ✅ Price label at end of dotted line */}
      <Text
        style={{
          position: "absolute",
          left: chartWidth,
          top: lastPoint.y,
          fontSize: 11,
          fontWeight: "bold",
          color: "black",
          backgroundColor: '#1992FC',
          paddingHorizontal: 10,
          paddingVertical: 3,
          borderTopLeftRadius: 15,
        }}
      >
        {lastPoint.value.toFixed(3)}
      </Text>

      <Text
        style={{
          position: "absolute",
          left: chartWidth,
          top: lastPoint.y + 25,
          fontSize: 11,
          fontWeight: "bold",
          color: "black",
          backgroundColor: '#ff5b5b',
          paddingHorizontal: 10,
          paddingVertical: 3,
          borderBottomLeftRadius: 15,
        }}
      >
        {lastPoint.value.toFixed(3)}
      </Text>

      {/* X-axis labels */}
      <View style={styles.xAxis}>
        {xTicks.map((p, i) => (
          <Text key={i} style={styles.xAxisText}>
            {formatDate(p.time)}
          </Text>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    // padding: 20,
    paddingTop: 20,
    flex: 1,
  },
  xAxis: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
    width: chartWidth,
  },
  xAxisText: {
    fontSize: 10,
    color: "#333",
  },
  priceLabel: {
    position: "absolute",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  labelText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
});
