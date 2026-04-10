import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import './ProgressChart.css';

ChartJS.register(ArcElement, Tooltip, Legend);

const ProgressChart = ({ progress = 0 }) => {
  const data = {
    labels: ['Completed', 'Remaining'],
    datasets: [
      {
        data: [progress, 100 - progress],
        backgroundColor: ['#667eea', '#e2e8f0'],
        borderWidth: 0,
        cutout: '75%',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.label}: ${context.raw}%`,
        },
      },
    },
  };

  return (
    <div className="progress-chart">
      <div className="chart-wrapper">
        <Doughnut data={data} options={options} />
        <div className="chart-center">
          <span className="progress-value">{progress}%</span>
          <span className="progress-label">Complete</span>
        </div>
      </div>
      <div className="chart-legend">
        <div className="legend-item">
          <span className="legend-color" style={{ background: '#667eea' }}></span>
          <span>Completed Sessions</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ background: '#e2e8f0' }}></span>
          <span>Remaining Sessions</span>
        </div>
      </div>
    </div>
  );
};

export default ProgressChart;
