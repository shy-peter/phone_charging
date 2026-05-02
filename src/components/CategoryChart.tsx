import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { RegisteredDevice } from './DeviceRegistration';

interface CategoryChartProps {
  devices: RegisteredDevice[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function CategoryChart({ devices }: CategoryChartProps) {
  const chartData = [
    { name: 'Phone', value: devices.filter(d => d.deviceType === 'Phone').length },
    { name: 'Power Bank', value: devices.filter(d => d.deviceType === 'Power Bank').length },
    { name: 'E-Scooter', value: devices.filter(d => d.deviceType === 'E-Scooter').length },
    { name: 'E-Bike', value: devices.filter(d => d.deviceType === 'E-Bike').length },
    { name: 'EV', value: devices.filter(d => d.deviceType === 'EV').length },
    { name: 'PC', value: devices.filter(d => d.deviceType === 'PC').length },
  ].filter(item => item.value > 0);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Charges by Category</h3>
        <p className="text-sm text-gray-500 mt-1">Distribution across device types</p>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((_entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
