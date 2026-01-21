import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, AlertTriangle, Clock, Users } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import * as healthService from '@/services/health';
import type { HealthCheckResponse } from '@/api/types';

const chartData = [
  { time: '00:00', calls: 120, errors: 2 },
  { time: '04:00', calls: 80, errors: 1 },
  { time: '08:00', calls: 450, errors: 8 },
  { time: '12:00', calls: 620, errors: 12 },
  { time: '16:00', calls: 580, errors: 7 },
  { time: '20:00', calls: 320, errors: 4 },
];

const queueData = [
  { name: 'Sales Queue', current: 12, waiting: 3, avgWait: '2m 30s' },
  { name: 'Support Queue', current: 8, waiting: 1, avgWait: '1m 15s' },
  { name: 'Billing Queue', current: 5, waiting: 0, avgWait: '45s' },
  { name: 'Technical Queue', current: 15, waiting: 6, avgWait: '4m 10s' },
];

export function HomePage() {
  const [healthStatus, setHealthStatus] = useState<HealthCheckResponse | null>(null);
  const [dbHealthStatus, setDbHealthStatus] = useState<HealthCheckResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHealth();
    // Refresh every 30 seconds
    const interval = setInterval(loadHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadHealth = async () => {
    try {
      const [health, dbHealth] = await Promise.all([
        healthService.getHealth(),
        healthService.getDatabaseHealth(),
      ]);
      setHealthStatus(health);
      setDbHealthStatus(dbHealth);
    } catch (error) {
      console.error('Failed to load health status:', error);
    } finally {
      setLoading(false);
    }
  };

  const getHealthColor = (status?: string) => {
    if (status === 'ok') return { bg: 'bg-emerald-50', badge: 'bg-emerald-100 text-emerald-700', text: 'Healthy' };
    if (status === 'error') return { bg: 'bg-red-50', badge: 'bg-red-100 text-red-700', text: 'Error' };
    return { bg: 'bg-amber-50', badge: 'bg-amber-100 text-amber-700', text: 'Unknown' };
  };

  const apiHealth = getHealthColor(healthStatus?.status);
  const dbHealth = getHealthColor(dbHealthStatus?.status);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl text-slate-900 mb-2">Dashboard</h1>
        <p className="text-sm sm:text-base text-slate-600">Real-time overview of your IVR system</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm text-slate-900">Active Calls</CardTitle>
            <Activity className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-slate-900">142</div>
            <p className="text-xs text-slate-500 mt-1">+12% from last hour</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm text-slate-900">Queue Load</CardTitle>
            <Users className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-slate-900">40</div>
            <p className="text-xs text-slate-500 mt-1">10 callers waiting</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm text-slate-900">System Errors</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-slate-900">7</div>
            <p className="text-xs text-slate-500 mt-1">-3 from last hour</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm text-slate-900">Avg Wait Time</CardTitle>
            <Clock className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-slate-900">2m 15s</div>
            <p className="text-xs text-slate-500 mt-1">Within SLA targets</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts & Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-slate-900">Call Volume & Errors</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="time" tick={{ fill: '#64748b' }} />
                <YAxis tick={{ fill: '#64748b' }} />
                <Tooltip />
                <Area type="monotone" dataKey="calls" stackId="1" stroke="#6366f1" fill="#6366f1" fillOpacity={0.6} />
                <Area type="monotone" dataKey="errors" stackId="2" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-slate-900">Queue Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {queueData.map((queue) => (
                <div key={queue.name} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{queue.name}</p>
                    <p className="text-xs text-slate-500">Avg wait: {queue.avgWait}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-slate-900">{queue.current} active</div>
                    {queue.waiting > 0 && (
                      <div className="text-xs text-amber-600 font-medium">{queue.waiting} waiting</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Health */}
      <div className="mt-4 sm:mt-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-slate-900">System Health</CardTitle>
              {loading && <span className="text-sm text-slate-500">Loading...</span>}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`p-4 ${apiHealth.bg} rounded-lg border border-${apiHealth.bg.replace('bg-', 'border-')}`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-700 font-medium">Backend API</span>
                  <span className={`px-2 py-1 text-xs ${apiHealth.badge} rounded`}>
                    {apiHealth.text}
                  </span>
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  Status: {healthStatus?.status || 'Checking...'}
                </div>
                {healthStatus?.info && (
                  <div className="mt-1 text-xs text-slate-500">
                    {JSON.stringify(healthStatus.info).substring(0, 50)}...
                  </div>
                )}
              </div>
              
              <div className={`p-4 ${dbHealth.bg} rounded-lg border border-${dbHealth.bg.replace('bg-', 'border-')}`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-700 font-medium">Database</span>
                  <span className={`px-2 py-1 text-xs ${dbHealth.badge} rounded`}>
                    {dbHealth.text}
                  </span>
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  Status: {dbHealthStatus?.status || 'Checking...'}
                </div>
                {dbHealthStatus?.details && (
                  <div className="mt-1 text-xs text-slate-500">
                    Connection: {dbHealthStatus.details.database ? 'Active' : 'Inactive'}
                  </div>
                )}
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-500">
              Last updated: {new Date().toLocaleTimeString()} • Refreshes every 30 seconds
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
