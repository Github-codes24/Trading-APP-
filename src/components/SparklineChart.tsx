import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Line } from 'react-native-svg';

interface SparklineChartProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  showReferenceLine?: boolean;
  animationDuration?: number;
}

const SparklineChart: React.FC<SparklineChartProps> = ({
  data,
  width = 60,
  height = 20,
  color = '#1E90FF',
  showReferenceLine = true,
  animationDuration = 1000, // animation duration
}) => {
  const [animatedData, setAnimatedData] = useState<number[]>([]);
  const prevDataRef = useRef<number[]>([]);

  useEffect(() => {
    if (!data || data.length < 2) return;

    prevDataRef.current = data.map(() => 0); // start animation from 0
    const start = performance.now();

    const animate = (time: number) => {
      const progress = Math.min((time - start) / animationDuration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3); // easeOutCubic

      const interpolated = data.map((val, i) => {
        const prev = prevDataRef.current[i];
        return prev + (val - prev) * easedProgress;
      });

      setAnimatedData(interpolated);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        prevDataRef.current = data;
      }
    };

    requestAnimationFrame(animate);
    // ⚠️ Only run once on mount
  }, []);

  if (!animatedData || animatedData.length < 2) {
    return <View style={[styles.container, { width, height }]} />;
  }

  // Average baseline
  const average =
    animatedData.reduce((sum, val) => sum + val, 0) / animatedData.length;

  const diffs = animatedData.map(v => Math.max(v - average, 0));
  const maxDiff = Math.max(...diffs) || 1;

  const normalizedData = animatedData.map((value, index) => {
    const x = (index / (animatedData.length - 1)) * width - 30;
    const diff = Math.max(value - average, 0);
    const y = height - (diff / maxDiff) * height;
    return { x, y };
  });

  const pathData = normalizedData
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  return (
    <View style={[styles.container, { width, height }]}>
      <Svg width={width} height={height}>
        {showReferenceLine && (
          <Line
            x1={0}
            y1={height}
            x2={width}
            y2={height}
            stroke="#000000"
            strokeWidth={1}
            strokeDasharray="2,2"
          />
        )}
        <Path d={pathData} stroke={color} strokeWidth={1.5} fill="none" />
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
