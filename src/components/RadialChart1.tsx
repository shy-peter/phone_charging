import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';

interface RadialChart1Props {
  phones: number;
  powerBanks: number;
  others: number;
  total: number;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b'];

export default function RadialChart1({ phones, powerBanks, others, total }: RadialChart1Props) {
  const data = [
    { name: 'Phones', value: phones },
    { name: 'Power Banks', value: powerBanks },
    { name: 'Others', value: others },
  ].filter(d => d.value > 0);

  // If no devices are charging, show a placeholder
  const chartData = data.length > 0 ? data : [{ name: 'Empty', value: 1 }];
  const emptyColors = data.length > 0 ? COLORS : ['#f3f4f6'];

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow h-full flex flex-col">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900">Currently Charging</h3>
        <p className="text-sm text-gray-500">Live breakdown by category</p>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={chartData}
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {chartData.map((_entry, index) => (
                <Cell key={`cell-${index}`} fill={emptyColors[index % emptyColors.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend verticalAlign="bottom" height={36}/>
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between text-sm mt-4 pt-4 border-t border-gray-50">
        <div className="flex flex-col">
          <span className="text-gray-400 font-bold uppercase text-[10px]">Total Active</span>
          <span className="text-xl font-black text-blue-600">{total}</span>
        </div>
        <div className="text-right">
          <span className="text-gray-400 font-bold uppercase text-[10px]">Utilization</span>
          <span className="text-xl font-black text-gray-900">{((total / 1000) * 100).toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
}
