import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Line } from 'react-native-svg';

interface SparklineChartProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  showReferenceLine?: boolean;
}

const SparklineChart: React.FC<SparklineChartProps> = ({
  data,
  width = 80,
  height = 20,
  color = '#1E90FF',
  showReferenceLine = true,
}) => {
  if (!data || data.length < 2) {
    return <View style={[styles.container, { width, height }]} />;
  }

  // Normalize data to fit within the chart dimensions
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const normalizedData = data.map((value, index) => ({
    x: (index / (data.length - 1)) * width,
    y: height - ((value - min) / range) * height,
  }));

  // Create path for the sparkline
  const pathData = normalizedData
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');

  // Calculate reference line (average)
  const average = data.reduce((sum, val) => sum + val, 0) / data.length;
  const referenceY = height - ((average - min) / range) * height;

  return (
    <View style={[styles.container, { width, height }]}>
      <Svg width={width} height={height}>
        {/* Reference line */}
        {showReferenceLine && (
          <Line
            x1={0}
            y1={referenceY}
            x2={width}
            y2={referenceY}
            stroke="#000000"
            strokeWidth={1}
            strokeDasharray="2,2"
          />
        )}
        
        {/* Sparkline path */}
        <Path
          d={pathData}
          stroke={color}
          strokeWidth={1.5}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
  },
});

export default SparklineChart;
