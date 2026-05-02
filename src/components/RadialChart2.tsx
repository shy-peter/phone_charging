import {
  RadialBarChart,
  RadialBar,
  PolarGrid,
  Label,
  ResponsiveContainer,
} from 'recharts';

interface RadialChart2Props {
  completedCount: number;
}

const formatNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

export default function RadialChart2({ completedCount }: RadialChart2Props) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow h-full flex flex-col">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900">Completed</h3>
        <p className="text-sm text-gray-500">Successfully retrieved</p>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <ResponsiveContainer width="100%" height={250}>
          <RadialBarChart
            data={[{ value: 100 }]}
            innerRadius="60%"
            outerRadius="90%"
            startAngle={90}
            endAngle={450}
          >
            <PolarGrid gridType="circle" radialLines={false} stroke="none" />
            <RadialBar
              dataKey="value"
              cornerRadius={10}
              fill="#10b981"
            />
            <Label
              value={formatNumber(completedCount)}
              position="center"
              fill="#111827"
              fontSize={32}
              fontWeight="bold"
            />
          </RadialBarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center gap-2 text-sm mt-4 pt-4 border-t border-gray-50">
        <span className="text-emerald-600 font-black text-xl">{completedCount.toLocaleString()}</span>
        <span className="text-gray-400 font-bold uppercase text-[10px]">Total Success</span>
      </div>
    </div>
  );
}
