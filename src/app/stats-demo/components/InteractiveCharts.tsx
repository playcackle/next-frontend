'use client';

import { useState } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ComposedChart,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Brush,
  ReferenceLine,
} from 'recharts';
import styles from './InteractiveCharts.module.css';

// Demo data for various chart types
const performanceOverTime = [
  { month: 'Jan', score: 2400, accuracy: 78, gamesPlayed: 12 },
  { month: 'Feb', score: 3200, accuracy: 82, gamesPlayed: 18 },
  { month: 'Mar', score: 2800, accuracy: 75, gamesPlayed: 14 },
  { month: 'Apr', score: 4100, accuracy: 88, gamesPlayed: 22 },
  { month: 'May', score: 3900, accuracy: 85, gamesPlayed: 20 },
  { month: 'Jun', score: 5200, accuracy: 91, gamesPlayed: 28 },
  { month: 'Jul', score: 4800, accuracy: 87, gamesPlayed: 25 },
  { month: 'Aug', score: 6100, accuracy: 93, gamesPlayed: 32 },
];

const categoryPerformance = [
  { category: 'Science', score: 850, accuracy: 82, questions: 45 },
  { category: 'History', score: 720, accuracy: 75, questions: 38 },
  { category: 'Sports', score: 920, accuracy: 88, questions: 52 },
  { category: 'Music', score: 680, accuracy: 71, questions: 35 },
  { category: 'Movies', score: 780, accuracy: 79, questions: 42 },
  { category: 'Geography', score: 640, accuracy: 68, questions: 30 },
];

const skillRadarData = [
  { skill: 'Speed', value: 85, fullMark: 100 },
  { skill: 'Accuracy', value: 78, fullMark: 100 },
  { skill: 'Consistency', value: 72, fullMark: 100 },
  { skill: 'Streak', value: 90, fullMark: 100 },
  { skill: 'Rare Claims', value: 65, fullMark: 100 },
  { skill: 'Clutch', value: 82, fullMark: 100 },
];

const scoreDistribution = [
  { name: '0-100', value: 5, fill: '#ff6b6b' },
  { name: '100-300', value: 15, fill: '#feca57' },
  { name: '300-500', value: 25, fill: '#48dbfb' },
  { name: '500-800', value: 35, fill: '#1dd1a1' },
  { name: '800+', value: 20, fill: '#ff9ff3' },
];

const scatterData = [
  { speed: 2.1, accuracy: 85, size: 120 },
  { speed: 1.8, accuracy: 92, size: 150 },
  { speed: 3.2, accuracy: 72, size: 80 },
  { speed: 2.5, accuracy: 78, size: 100 },
  { speed: 1.5, accuracy: 95, size: 180 },
  { speed: 2.8, accuracy: 68, size: 70 },
  { speed: 2.0, accuracy: 88, size: 140 },
  { speed: 3.5, accuracy: 65, size: 60 },
  { speed: 1.2, accuracy: 98, size: 200 },
  { speed: 2.3, accuracy: 82, size: 110 },
];

const COLORS = ['#00f5ff', '#ff00ff', '#00ff88', '#ffaa00', '#ff6b6b', '#a855f7'];

type ChartType = 'line' | 'area' | 'bar' | 'composed' | 'pie' | 'radar' | 'scatter';

interface ChartConfig {
  showGrid: boolean;
  showLegend: boolean;
  showTooltip: boolean;
  showBrush: boolean;
  animationDuration: number;
  strokeWidth: number;
  fillOpacity: number;
}

export function InteractiveCharts() {
  const [activeChart, setActiveChart] = useState<ChartType>('composed');
  const [config, setConfig] = useState<ChartConfig>({
    showGrid: true,
    showLegend: true,
    showTooltip: true,
    showBrush: false,
    animationDuration: 1500,
    strokeWidth: 2,
    fillOpacity: 0.6,
  });
  const [dataMetric, setDataMetric] = useState<'score' | 'accuracy' | 'gamesPlayed'>('score');

  const chartTypes: { id: ChartType; label: string; icon: string }[] = [
    { id: 'composed', label: 'Composed', icon: '📊' },
    { id: 'line', label: 'Line', icon: '📈' },
    { id: 'area', label: 'Area', icon: '📉' },
    { id: 'bar', label: 'Bar', icon: '📶' },
    { id: 'pie', label: 'Pie', icon: '🥧' },
    { id: 'radar', label: 'Radar', icon: '🎯' },
    { id: 'scatter', label: 'Scatter', icon: '✨' },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={styles.customTooltip}>
          <p className={styles.tooltipLabel}>{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className={styles.tooltipValue}>
              {entry.name}: {entry.value.toLocaleString()}
              {entry.name === 'accuracy' ? '%' : ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    const commonProps = {
      data: performanceOverTime,
      margin: { top: 20, right: 30, left: 20, bottom: 20 },
    };

    switch (activeChart) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart {...commonProps}>
              {config.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />}
              <XAxis dataKey="month" stroke="#888" />
              <YAxis stroke="#888" />
              {config.showTooltip && <Tooltip content={<CustomTooltip />} />}
              {config.showLegend && <Legend />}
              <Line
                type="monotone"
                dataKey={dataMetric}
                stroke="#00f5ff"
                strokeWidth={config.strokeWidth}
                dot={{ fill: '#00f5ff', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 8, fill: '#ff00ff' }}
                animationDuration={config.animationDuration}
              />
              <ReferenceLine y={4000} stroke="#ff00ff" strokeDasharray="5 5" label="Goal" />
              {config.showBrush && <Brush dataKey="month" height={30} stroke="#00f5ff" />}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart {...commonProps}>
              {config.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />}
              <XAxis dataKey="month" stroke="#888" />
              <YAxis stroke="#888" />
              {config.showTooltip && <Tooltip content={<CustomTooltip />} />}
              {config.showLegend && <Legend />}
              <defs>
                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00f5ff" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#00f5ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey={dataMetric}
                stroke="#00f5ff"
                strokeWidth={config.strokeWidth}
                fill="url(#colorScore)"
                fillOpacity={config.fillOpacity}
                animationDuration={config.animationDuration}
              />
              {config.showBrush && <Brush dataKey="month" height={30} stroke="#00f5ff" />}
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={categoryPerformance} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              {config.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />}
              <XAxis dataKey="category" stroke="#888" angle={-45} textAnchor="end" height={60} />
              <YAxis stroke="#888" />
              {config.showTooltip && <Tooltip content={<CustomTooltip />} />}
              {config.showLegend && <Legend />}
              <Bar
                dataKey="score"
                fill="#00f5ff"
                radius={[4, 4, 0, 0]}
                animationDuration={config.animationDuration}
              >
                {categoryPerformance.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );

      case 'composed':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart {...commonProps}>
              {config.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />}
              <XAxis dataKey="month" stroke="#888" />
              <YAxis yAxisId="left" stroke="#00f5ff" />
              <YAxis yAxisId="right" orientation="right" stroke="#ff00ff" />
              {config.showTooltip && <Tooltip content={<CustomTooltip />} />}
              {config.showLegend && <Legend />}
              <defs>
                <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00ff88" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00ff88" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="score"
                fill="url(#colorArea)"
                stroke="#00ff88"
                animationDuration={config.animationDuration}
              />
              <Bar
                yAxisId="left"
                dataKey="gamesPlayed"
                fill="#00f5ff"
                opacity={0.8}
                radius={[4, 4, 0, 0]}
                animationDuration={config.animationDuration}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="accuracy"
                stroke="#ff00ff"
                strokeWidth={config.strokeWidth}
                dot={{ fill: '#ff00ff' }}
                animationDuration={config.animationDuration}
              />
              {config.showBrush && <Brush dataKey="month" height={30} stroke="#00f5ff" />}
            </ComposedChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              {config.showTooltip && <Tooltip content={<CustomTooltip />} />}
              {config.showLegend && <Legend />}
              <Pie
                data={scoreDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={150}
                innerRadius={60}
                paddingAngle={5}
                dataKey="value"
                animationDuration={config.animationDuration}
              >
                {scoreDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} stroke="rgba(0,0,0,0.3)" strokeWidth={2} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        );

      case 'radar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skillRadarData}>
              <PolarGrid stroke="rgba(255,255,255,0.2)" />
              <PolarAngleAxis dataKey="skill" stroke="#888" />
              <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#888" />
              {config.showTooltip && <Tooltip content={<CustomTooltip />} />}
              {config.showLegend && <Legend />}
              <Radar
                name="Skills"
                dataKey="value"
                stroke="#00f5ff"
                fill="#00f5ff"
                fillOpacity={config.fillOpacity}
                animationDuration={config.animationDuration}
              />
            </RadarChart>
          </ResponsiveContainer>
        );

      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              {config.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />}
              <XAxis
                type="number"
                dataKey="speed"
                name="Response Time"
                unit="s"
                stroke="#888"
                label={{ value: 'Response Time (s)', position: 'bottom', fill: '#888' }}
              />
              <YAxis
                type="number"
                dataKey="accuracy"
                name="Accuracy"
                unit="%"
                stroke="#888"
                label={{ value: 'Accuracy (%)', angle: -90, position: 'left', fill: '#888' }}
              />
              {config.showTooltip && <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />}
              {config.showLegend && <Legend />}
              <Scatter
                name="Performance"
                data={scatterData}
                fill="#00f5ff"
                animationDuration={config.animationDuration}
              >
                {scatterData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.accuracy > 85 ? '#00ff88' : entry.accuracy > 75 ? '#ffaa00' : '#ff6b6b'}
                  />
                ))}
              </Scatter>
              <ReferenceLine y={80} stroke="#ff00ff" strokeDasharray="5 5" label="Target" />
            </ScatterChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Interactive Charts</h2>
        <p className={styles.subtitle}>Explore your stats with customizable visualizations</p>
      </div>

      <div className={styles.chartTypeSelector}>
        {chartTypes.map((type) => (
          <button
            key={type.id}
            className={`${styles.chartTypeButton} ${activeChart === type.id ? styles.active : ''}`}
            onClick={() => setActiveChart(type.id)}
          >
            <span className={styles.chartIcon}>{type.icon}</span>
            <span className={styles.chartLabel}>{type.label}</span>
          </button>
        ))}
      </div>

      <div className={styles.content}>
        <div className={styles.chartWrapper}>
          <div className={styles.chartContainer}>{renderChart()}</div>
        </div>

        <div className={styles.controlPanel}>
          <h3 className={styles.controlTitle}>Customize Chart</h3>

          {(activeChart === 'line' || activeChart === 'area') && (
            <div className={styles.controlGroup}>
              <label className={styles.controlLabel}>Data Metric</label>
              <div className={styles.buttonGroup}>
                {(['score', 'accuracy', 'gamesPlayed'] as const).map((metric) => (
                  <button
                    key={metric}
                    className={`${styles.metricButton} ${dataMetric === metric ? styles.active : ''}`}
                    onClick={() => setDataMetric(metric)}
                  >
                    {metric === 'gamesPlayed' ? 'Games' : metric.charAt(0).toUpperCase() + metric.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className={styles.controlGroup}>
            <label className={styles.controlLabel}>Display Options</label>
            <div className={styles.toggleGroup}>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={config.showGrid}
                  onChange={(e) => setConfig({ ...config, showGrid: e.target.checked })}
                />
                <span className={styles.toggleSlider}></span>
                <span className={styles.toggleText}>Grid</span>
              </label>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={config.showLegend}
                  onChange={(e) => setConfig({ ...config, showLegend: e.target.checked })}
                />
                <span className={styles.toggleSlider}></span>
                <span className={styles.toggleText}>Legend</span>
              </label>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={config.showTooltip}
                  onChange={(e) => setConfig({ ...config, showTooltip: e.target.checked })}
                />
                <span className={styles.toggleSlider}></span>
                <span className={styles.toggleText}>Tooltip</span>
              </label>
              {(activeChart === 'line' || activeChart === 'area' || activeChart === 'composed') && (
                <label className={styles.toggle}>
                  <input
                    type="checkbox"
                    checked={config.showBrush}
                    onChange={(e) => setConfig({ ...config, showBrush: e.target.checked })}
                  />
                  <span className={styles.toggleSlider}></span>
                  <span className={styles.toggleText}>Brush</span>
                </label>
              )}
            </div>
          </div>

          <div className={styles.controlGroup}>
            <label className={styles.controlLabel}>
              Animation Duration: {config.animationDuration}ms
            </label>
            <input
              type="range"
              min="0"
              max="3000"
              step="100"
              value={config.animationDuration}
              onChange={(e) => setConfig({ ...config, animationDuration: Number(e.target.value) })}
              className={styles.slider}
            />
          </div>

          <div className={styles.controlGroup}>
            <label className={styles.controlLabel}>
              Stroke Width: {config.strokeWidth}px
            </label>
            <input
              type="range"
              min="1"
              max="5"
              step="0.5"
              value={config.strokeWidth}
              onChange={(e) => setConfig({ ...config, strokeWidth: Number(e.target.value) })}
              className={styles.slider}
            />
          </div>

          <div className={styles.controlGroup}>
            <label className={styles.controlLabel}>
              Fill Opacity: {(config.fillOpacity * 100).toFixed(0)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={config.fillOpacity}
              onChange={(e) => setConfig({ ...config, fillOpacity: Number(e.target.value) })}
              className={styles.slider}
            />
          </div>

          <button
            className={styles.resetButton}
            onClick={() =>
              setConfig({
                showGrid: true,
                showLegend: true,
                showTooltip: true,
                showBrush: false,
                animationDuration: 1500,
                strokeWidth: 2,
                fillOpacity: 0.6,
              })
            }
          >
            Reset to Defaults
          </button>
        </div>
      </div>

      <div className={styles.chartInfo}>
        <div className={styles.infoCard}>
          <h4>About This Chart</h4>
          <p>
            {activeChart === 'composed' &&
              'The Composed Chart combines multiple chart types (Area, Bar, and Line) to show relationships between different metrics on dual Y-axes.'}
            {activeChart === 'line' &&
              'The Line Chart shows trends over time with customizable reference lines and interactive brush selection.'}
            {activeChart === 'area' &&
              'The Area Chart emphasizes volume and cumulative values with gradient fills and smooth animations.'}
            {activeChart === 'bar' &&
              'The Bar Chart compares categories with color-coded bars and rotated labels for readability.'}
            {activeChart === 'pie' &&
              'The Pie Chart shows score distribution as a donut chart with percentage labels and hover effects.'}
            {activeChart === 'radar' &&
              'The Radar Chart visualizes multi-dimensional skill data on a circular grid for quick comparison.'}
            {activeChart === 'scatter' &&
              'The Scatter Chart plots response time vs accuracy, with point colors indicating performance levels.'}
          </p>
        </div>
      </div>
    </div>
  );
}
