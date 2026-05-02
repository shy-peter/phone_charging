import {
  RadialBarChart,
  RadialBar,
  PolarGrid,
  Label,
  ResponsiveContainer,
} from 'recharts';

interface RadialChart3Props {
  totalDevices: number;
  processedDevices: number;
}

const formatNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

export default function RadialChart3({ totalDevices, processedDevices }: RadialChart3Props) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow h-full flex flex-col">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900">Total Devices</h3>
        <p className="text-sm text-gray-500">All-time registrations</p>
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
              fill="#f59e0b"
            />
            <Label
              value={formatNumber(totalDevices)}
              position="center"
              fill="#111827"
              fontSize={32}
              fontWeight="bold"
            />
          </RadialBarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between text-sm mt-4 pt-4 border-t border-gray-50">
        <div className="flex flex-col">
          <span className="text-gray-400 font-bold uppercase text-[10px]">Total Reg</span>
          <span className="text-xl font-black text-amber-600">{totalDevices.toLocaleString()}</span>
        </div>
        <div className="text-right">
          <span className="text-gray-400 font-bold uppercase text-[10px]">Processed</span>
          <span className="text-xl font-black text-gray-900">{processedDevices.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
