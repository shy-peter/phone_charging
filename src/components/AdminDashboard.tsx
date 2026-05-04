import { 
  Battery, 
  CheckCircle, 
  TrendingUp, 
  History, 
  Clock,
  DollarSign,
  Package
} from 'lucide-react';
import type { RegisteredDevice } from './DeviceRegistration';
import type { PowerBankRental } from './RentPower';
import RevenueChart from './RevenueChart';
import CategoryChart from './CategoryChart';
import { useState } from 'react';

interface AdminDashboardProps {
  registeredDevices: RegisteredDevice[];
  deviceHistory: RegisteredDevice[];
  rentals: PowerBankRental[];
  agentInvites: { id: string; code: string; createdAt: string; usedAt?: string | null; usedByUsername?: string | null; usedByName?: string | null }[];
  agents: { id: string; name: string; phone: string; username: string; role: string; createdAt: string }[];
  canGenerateInvites?: boolean;
  onGenerateInvite: (role: string) => void;
  onDeleteAgent: (id: string) => void;
  canManageAgents?: boolean;
}

export default function AdminDashboard({
  registeredDevices,
  deviceHistory,
  rentals,
  agentInvites,
  agents,
  canGenerateInvites,
  onGenerateInvite,
  onDeleteAgent,
  canManageAgents,
}: AdminDashboardProps) {
  const [section, setSection] = useState<'overview' | 'agents' | 'counter'>('overview');
  const [inviteRole, setInviteRole] = useState<'agent-sales' | 'agent-audit' | 'view-only'>('agent-sales');
  const [counterFilter, setCounterFilter] = useState<'all' | 'registered' | 'retrieved' | 'rentals'>('all');
  // Calculate total revenue from charging and rentals
  const chargingRevenue = deviceHistory.reduce((sum, d) => sum + d.price, 0);
  const rentalRevenue = rentals.reduce((sum, r) => sum + r.amountPaid, 0);
  const totalRevenue = chargingRevenue + rentalRevenue;

  const activeChargingCount = registeredDevices.length;
  const completedChargingCount = deviceHistory.length;
  const totalRentalsCount = rentals.length;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(startOfToday);
  endOfToday.setDate(endOfToday.getDate() + 1);

  const todayRegisteredDevices = [...registeredDevices, ...deviceHistory].filter(
    (d) => d.registeredAt && d.registeredAt >= startOfToday && d.registeredAt < endOfToday,
  );
  const todayReleasedDevices = deviceHistory.filter(
    (d) => d.retrievedAt && d.retrievedAt >= startOfToday && d.retrievedAt < endOfToday,
  );

  const perfMap = new Map<
    string,
    { agent: string; registrations: number; releases: number; activities: number; registeredRevenue: number }
  >();

  for (const d of todayRegisteredDevices) {
    const agent = String(d.registeredBy || '').trim() || 'Unknown';
    const row = perfMap.get(agent) || { agent, registrations: 0, releases: 0, activities: 0, registeredRevenue: 0 };
    row.registrations += 1;
    row.registeredRevenue += typeof d.price === 'number' ? d.price : 0;
    row.activities = row.registrations + row.releases;
    perfMap.set(agent, row);
  }

  for (const d of todayReleasedDevices) {
    const agent = String(d.releasedBy || '').trim() || 'Unknown';
    const row = perfMap.get(agent) || { agent, registrations: 0, releases: 0, activities: 0, registeredRevenue: 0 };
    row.releases += 1;
    row.activities = row.registrations + row.releases;
    perfMap.set(agent, row);
  }

  const perfRows = Array.from(perfMap.values()).sort((a, b) => b.activities - a.activities);
  const revenueRows = Array.from(perfMap.values()).sort((a, b) => b.registeredRevenue - a.registeredRevenue);

  // Stats for the cards
  const stats = [
    {
      label: 'Total Revenue',
      value: `₦${totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-green-500',
      description: `Charging: ₦${chargingRevenue.toLocaleString()} | Rentals: ₦${rentalRevenue.toLocaleString()}`
    },
    {
      label: 'Active Charging',
      value: activeChargingCount.toString(),
      icon: Battery,
      color: 'bg-blue-500',
      description: 'Devices currently plugged in'
    },
    {
      label: 'Completed Charges',
      value: completedChargingCount.toString(),
      icon: CheckCircle,
      color: 'bg-indigo-500',
      description: 'Successfully retrieved devices'
    },
    {
      label: 'Total Rentals',
      value: totalRentalsCount.toString(),
      icon: TrendingUp,
      color: 'bg-purple-500',
      description: 'Power bank rental transactions'
    }
  ];

  const registeredPhones = registeredDevices.filter((d) => String(d.deviceType || '').toLowerCase() === 'phone');
  const retrievedPhones = deviceHistory.filter((d) => String(d.deviceType || '').toLowerCase() === 'phone');

  const counterRows = (() => {
    const regRows = registeredPhones.map((d) => ({
      kind: 'registered' as const,
      id: d.id,
      name: d.username,
      detail: `${d.deviceName || '—'} • Slot #${d.slotNumber}`,
      amount: d.price,
      at: d.registeredAt,
      status: d.paymentStatus || d.status,
    }));
    const retRows = retrievedPhones.map((d) => ({
      kind: 'retrieved' as const,
      id: d.id,
      name: d.username,
      detail: `${d.deviceName || '—'} • Slot #${d.slotNumber}`,
      amount: d.price,
      at: d.retrievedAt || d.registeredAt,
      status: d.paymentStatus || d.status,
    }));
    const rentRows = rentals.map((r) => ({
      kind: 'rentals' as const,
      id: r.id,
      name: r.userName,
      detail: `${r.powerBankName} • ${r.userPhone}`,
      amount: r.amountPaid,
      at: r.rentalDate,
      status: r.status,
    }));

    const all = [...regRows, ...retRows, ...rentRows].sort((a, b) => {
      const atA = a.at ? new Date(a.at).getTime() : 0;
      const atB = b.at ? new Date(b.at).getTime() : 0;
      return atB - atA;
    });

    if (counterFilter === 'registered') return regRows;
    if (counterFilter === 'retrieved') return retRows;
    if (counterFilter === 'rentals') return rentRows;
    return all;
  })();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Admin Oversight</h2>
        <div className="text-sm text-gray-500 font-medium">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setSection('overview')}
          className={`px-4 py-2 rounded-lg font-bold text-sm border ${
            section === 'overview' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setSection('counter')}
          className={`px-4 py-2 rounded-lg font-bold text-sm border ${
            section === 'counter' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
          }`}
        >
          Counter
        </button>
        <button
          onClick={() => setSection('agents')}
          className={`px-4 py-2 rounded-lg font-bold text-sm border ${
            section === 'agents' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
          }`}
        >
          Agents
        </button>
      </div>

      {section === 'counter' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="font-bold text-gray-800">Counter</h3>
              <p className="text-xs text-gray-500 font-semibold">Registered phones, retrieved phones, and power bank rentals</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setCounterFilter('all')}
                className={`px-3 py-2 rounded-lg font-bold text-xs border ${
                  counterFilter === 'all' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setCounterFilter('registered')}
                className={`px-3 py-2 rounded-lg font-bold text-xs border ${
                  counterFilter === 'registered' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                Registered Phones
              </button>
              <button
                onClick={() => setCounterFilter('retrieved')}
                className={`px-3 py-2 rounded-lg font-bold text-xs border ${
                  counterFilter === 'retrieved' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                Retrieved Phones
              </button>
              <button
                onClick={() => setCounterFilter('rentals')}
                className={`px-3 py-2 rounded-lg font-bold text-xs border ${
                  counterFilter === 'rentals' ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                Rentals
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Details</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {counterRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-gray-400 font-semibold">No records</td>
                  </tr>
                ) : (
                  counterRows.slice(0, 200).map((row) => (
                    <tr key={`${row.kind}_${row.id}`} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                          row.kind === 'registered'
                            ? 'bg-blue-100 text-blue-700'
                            : row.kind === 'retrieved'
                              ? 'bg-indigo-100 text-indigo-700'
                              : 'bg-purple-100 text-purple-700'
                        }`}>
                          {row.kind}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900">{row.name || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{row.detail || '—'}</td>
                      <td className="px-4 py-3 font-black text-gray-900">₦{Number(row.amount || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-[10px] text-gray-500 font-mono">{row.at ? new Date(row.at).toLocaleString() : '—'}</td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 uppercase">
                          {String(row.status || '—')}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {section === 'agents' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-800">Agent Registration Codes</h3>
                <p className="text-xs text-gray-500">Generate 10-digit codes for agent sign-up</p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'agent-sales' | 'agent-audit' | 'view-only')}
                  className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm font-semibold text-gray-700"
                >
                  <option value="agent-sales">agent-sales</option>
                  <option value="agent-audit">agent-audit</option>
                  <option value="view-only">view-only</option>
                </select>
                <button
                  onClick={() => onGenerateInvite(inviteRole)}
                  disabled={canGenerateInvites === false}
                  className={`px-4 py-2 rounded-lg font-bold text-sm ${
                    canGenerateInvites === false
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                >
                  Generate Code
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500 font-semibold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Code</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Used By</th>
                    <th className="px-4 py-3">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {agentInvites.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-gray-400">No codes generated yet</td>
                    </tr>
                  ) : (
                    [...agentInvites]
                      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
                      .map((invite) => {
                        const used = !!invite.usedAt;
                        return (
                          <tr key={invite.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 font-mono font-bold text-gray-900">{invite.code}</td>
                            <td className="px-4 py-3">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                used ? 'bg-gray-100 text-gray-700' : 'bg-green-100 text-green-700'
                              }`}>
                                {used ? 'USED' : 'UNUSED'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-700 font-semibold">
                              {invite.usedByUsername || '—'}
                            </td>
                            <td className="px-4 py-3 text-[10px] text-gray-500 font-mono">
                              {new Date(invite.createdAt).toLocaleString()}
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-800">Registered Agents</h3>
                <p className="text-xs text-gray-500">{agents.length} total</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500 font-semibold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Username</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {agents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-400">No agents yet</td>
                    </tr>
                  ) : (
                    [...agents]
                      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
                      .map((agent) => (
                        <tr key={agent.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 font-semibold text-gray-800">{agent.name}</td>
                          <td className="px-4 py-3 font-mono text-xs text-gray-700">{agent.username}</td>
                          <td className="px-4 py-3 text-xs font-bold text-gray-700">{agent.role}</td>
                          <td className="px-4 py-3 text-xs text-gray-700 font-semibold">{agent.phone}</td>
                          <td className="px-4 py-3 text-[10px] text-gray-500 font-mono">
                            {new Date(agent.createdAt).toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            {canManageAgents ? (
                              <button
                                type="button"
                                onClick={() => {
                                  const ok = confirm(`Delete agent "${agent.username}"?`);
                                  if (!ok) return;
                                  onDeleteAgent(agent.id);
                                }}
                                className="px-3 py-2 rounded-lg font-bold text-xs bg-red-600 text-white hover:bg-red-700"
                              >
                                Delete
                              </button>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-gray-100 text-gray-500">
                                Read-only
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {section === 'overview' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                <div className="flex items-center gap-4">
                  <div className={`${stat.color} p-3 rounded-lg text-white`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                    <h4 className="text-xl font-bold text-gray-900">{stat.value}</h4>
                  </div>
                </div>
                <p className="mt-4 text-xs text-gray-400 font-medium">{stat.description}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RevenueChart devices={deviceHistory} />
            <CategoryChart devices={[...registeredDevices, ...deviceHistory]} />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-800">Agent Performance (Today)</h3>
                  <p className="text-xs text-gray-500 font-semibold">Most activities: registrations + releases</p>
                </div>
                <span className="text-xs font-bold bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                  {startOfToday.toLocaleDateString()}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-500 font-semibold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Agent</th>
                      <th className="px-4 py-3">Registrations</th>
                      <th className="px-4 py-3">Releases</th>
                      <th className="px-4 py-3">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {perfRows.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-gray-400">No activity today</td>
                      </tr>
                    ) : (
                      perfRows.slice(0, 10).map((row) => (
                        <tr key={row.agent} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 font-semibold text-gray-900">{row.agent}</td>
                          <td className="px-4 py-3 text-gray-700 font-bold">{row.registrations}</td>
                          <td className="px-4 py-3 text-gray-700 font-bold">{row.releases}</td>
                          <td className="px-4 py-3 text-gray-900 font-black">{row.activities}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-800">Revenue by Agent (Today)</h3>
                  <p className="text-xs text-gray-500 font-semibold">Based on devices registered today</p>
                </div>
                <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded-full">
                  ₦{todayRegisteredDevices.reduce((sum, d) => sum + (typeof d.price === 'number' ? d.price : 0), 0).toLocaleString()}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-500 font-semibold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Agent</th>
                      <th className="px-4 py-3">Registrations</th>
                      <th className="px-4 py-3">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {revenueRows.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-8 text-center text-gray-400">No registrations today</td>
                      </tr>
                    ) : (
                      revenueRows.slice(0, 10).map((row) => (
                        <tr key={row.agent} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 font-semibold text-gray-900">{row.agent}</td>
                          <td className="px-4 py-3 text-gray-700 font-bold">{row.registrations}</td>
                          <td className="px-4 py-3 font-black text-gray-900">₦{row.registeredRevenue.toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-500" />
                  <h3 className="font-bold text-gray-800">Currently Charging</h3>
                </div>
                <span className="text-xs font-bold bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                  {activeChargingCount} Active
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-500 font-semibold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Slot</th>
                      <th className="px-4 py-3">User</th>
                      <th className="px-4 py-3">Device</th>
                      <th className="px-4 py-3">Payment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {registeredDevices.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-gray-400">No active devices</td>
                      </tr>
                    ) : (
                      registeredDevices.map((device) => (
                        <tr key={device.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 font-bold text-gray-900">#{device.slotNumber}</td>
                          <td className="px-4 py-3 font-medium text-gray-700">{device.username}</td>
                          <td className="px-4 py-3">
                            <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                              {device.deviceType}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              device.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                              {device.paymentStatus}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

        {/* Recent Activity / History */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-500" />
              <h3 className="font-bold text-gray-800">Recent Retrievals</h3>
            </div>
            <span className="text-xs font-bold bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full">
              Latest 10
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Registered By</th>
                  <th className="px-4 py-3">Released By</th>
                  <th className="px-4 py-3">Retrieved At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {deviceHistory.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400">No history yet</td>
                  </tr>
                ) : (
                  [...deviceHistory].reverse().slice(0, 10).map((device) => (
                    <tr key={device.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-700">{device.username}</p>
                          <p className="text-[10px] text-gray-400">{device.deviceName}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-bold text-gray-900">₦{device.price.toLocaleString()}</td>
                      <td className="px-4 py-3 text-[10px] text-gray-700 font-semibold">
                        {device.registeredBy || '—'}
                      </td>
                      <td className="px-4 py-3 text-[10px] text-gray-700 font-semibold">
                        {device.releasedBy || '—'}
                      </td>
                      <td className="px-4 py-3 text-[10px] text-gray-500 font-mono">
                        {device.retrievedAtTime}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Rentals Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-purple-500" />
            <h3 className="font-bold text-gray-800">Recent Power Bank Rentals</h3>
          </div>
          <span className="text-xs font-bold bg-purple-100 text-purple-600 px-2 py-1 rounded-full">
            {totalRentalsCount} Total
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Power Bank</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rentals.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">No rentals yet</td>
                </tr>
              ) : (
                [...rentals].reverse().slice(0, 5).map((rental) => (
                  <tr key={rental.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {rental.userPhoto ? (
                          <img src={rental.userPhoto} alt="" className="w-6 h-6 rounded-full object-cover" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-black">
                            {String(rental.userName || '?').trim().slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <span className="font-medium text-gray-700">{rental.userName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{rental.powerBankName}</td>
                    <td className="px-4 py-3 font-bold text-gray-900">₦{rental.amountPaid.toLocaleString()}</td>
                    <td className="px-4 py-3 text-[10px] text-gray-500">
                      {new Date(rental.rentalDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 uppercase">
                        {rental.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
        </>
      )}
    </div>
  );
}
