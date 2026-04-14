import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import Card from "./ui/Card";

ChartJS.register(ArcElement, Tooltip, Legend);

const ProgressChart = ({ progress = 0 }) => {
  const data = {
    labels: ['Completed', 'Remaining'],
    datasets: [
      {
        data: [progress, 100 - progress],
        backgroundColor: ['#00a385', 'rgba(255, 255, 255, 0.18)'],
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
    <Card elevated className="flex flex-col gap-8 !p-6">
      <div className="relative mx-auto h-64 w-64">
        <Doughnut data={data} options={options} />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-4xl font-bold text-ss-highlight">{progress}%</span>
          <span className="mt-1 text-sm text-ss-muted">Complete</span>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="glass-chip flex items-center gap-3 px-4 py-3 text-sm text-ss-neutral-200">
          <span className="h-3 w-3 rounded-full bg-[#00a385]" />
          <span>Completed Sessions</span>
        </div>
        <div className="glass-chip flex items-center gap-3 px-4 py-3 text-sm text-ss-neutral-200">
          <span className="h-3 w-3 rounded-full bg-[rgba(255,255,255,0.28)]" />
          <span>Remaining Sessions</span>
        </div>
      </div>
    </Card>
  );
};

export default ProgressChart;
