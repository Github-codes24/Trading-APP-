import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Line } from 'react-native-svg';

interface SparklineChartProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  gradientColor?: string; // Color for the top of the gradient fill
  showReferenceLine?: boolean;
}

const SparklineChart: React.FC<SparklineChartProps> = ({
  data,
  width = 80,
  height = 20,
  color = '#007AFF', // A blue color similar to the image
  gradientColor = '#007AFF',
  showReferenceLine = true,
}) => {
  if (!data || data.length < 2) {
    return <View style={[styles.container, { width, height }]} />;
  }

  // Find min and max to normalize data
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1; // Ensure range is not zero

  // Normalize data points to fit the SVG canvas
  const normalizedData = data.map((value, index) => ({
    x: (index / (data.length - 1)) * width,
    y: height - ((value - min) / range) * height,
  }));

  // Create the SVG path string for the line
  const linePathData = normalizedData
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(' ');

  // Create the SVG path string for the gradient area fill
  // It's the same as the line path, but closed at the bottom
  const fillPathData = `${linePathData} L ${width} ${height} L 0 ${height} Z`;

  // Calculate the position for the reference line (using average)
  // Note: The image's reference line seems to be near the bottom, not necessarily the average.
  // For this fix, we'll place it at 80% of the height to better match the visual.
  const referenceY = height * 0.8;


  return (
    <View style={[styles.container, { width, height }]}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="gradient" x1="0" y1="0" x2="0" y2={height}>
            {/* Start the gradient with some opacity */}
            <Stop offset="0" stopColor={gradientColor} stopOpacity="0.3" />
            {/* Fade to transparent at the bottom */}
            <Stop offset="1" stopColor={gradientColor} stopOpacity="0" />
          </LinearGradient>
        </Defs>

        {/* Dashed reference line, styled to match the image */}
        {showReferenceLine && (
          <Line
            x1={0}
            y1={referenceY}
            x2={width}
            y2={referenceY}
            stroke="#A9A9A9" // A light grey color
            strokeWidth={1}
            strokeDasharray="4, 4" // Dashes are more spaced out
          />
        )}
        
        {/* Gradient fill area */}
        <Path
          d={fillPathData}
          fill="url(#gradient)"
        />

        {/* The main sparkline path */}
        <Path
          d={linePathData}
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