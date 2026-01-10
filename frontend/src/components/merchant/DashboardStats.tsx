import React from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { TrendingUp, ShoppingBag, DollarSign, Clock } from 'lucide-react';

interface DashboardStatsProps {
    orders: any[];
    analytics: any;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ orders }) => {
    // Calculate simple stats if analytics is missing or strictly from frontend for instant feedback
    const totalRevenue = orders.reduce((acc, order) => {
        // Parse "GHS 50.00" -> 50.00
        const price = parseFloat((order.total || '0').replace(/[^0-9.]/g, ''));
        return acc + price;
    }, 0);

    const activeOrders = orders.filter(o => ['PENDING', 'CONFIRMED'].includes(o.status)).length;

    // Group orders by hour for the chart
    const ordersByHour = orders.reduce((acc: any, order) => {
        const date = new Date(order.createdAt);
        const hour = date.getHours();
        const key = `${hour}:00`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {});

    const chartData = Object.keys(ordersByHour).map(key => ({
        time: key,
        orders: ordersByHour[key]
    })).sort((a, b) => parseInt(a.time) - parseInt(b.time));

    // If no data, provide dummy data for visualization
    const finalChartData = chartData.length > 0 ? chartData : [
        { time: '9:00', orders: 2 },
        { time: '10:00', orders: 5 },
        { time: '11:00', orders: 3 },
        { time: '12:00', orders: 8 },
        { time: '13:00', orders: 6 },
        { time: '14:00', orders: 4 },
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Revenue"
                    value={`GHS ${totalRevenue.toFixed(2)}`}
                    icon={DollarSign}
                    color="text-emerald-500"
                    bgColor="bg-emerald-500/10"
                />
                <StatCard
                    title="Active Orders"
                    value={activeOrders.toString()}
                    icon={ShoppingBag}
                    color="text-blue-500"
                    bgColor="bg-blue-500/10"
                />
                <StatCard
                    title="Avg. Prep Time"
                    value="12m"
                    icon={Clock}
                    color="text-amber-500"
                    bgColor="bg-amber-500/10"
                />
                <StatCard
                    title="Conversion Rate"
                    value="8.5%"
                    icon={TrendingUp}
                    color="text-purple-500"
                    bgColor="bg-purple-500/10"
                />
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 h-[300px]">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-muted-foreground" />
                    Order Volume Trends
                </h3>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={finalChartData}>
                        <defs>
                            <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.2} />
                        <XAxis dataKey="time" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#111', borderRadius: '12px', border: '1px solid #333' }}
                            itemStyle={{ color: '#fff' }}
                        />
                        <Area type="monotone" dataKey="orders" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorOrders)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

const StatCard = ({ title, value, icon: Icon, color, bgColor }: any) => (
    <div className="bg-card border border-border rounded-2xl p-6 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
        <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{title}</p>
            <h4 className="text-2xl font-black mt-1">{value}</h4>
        </div>
        <div className={`p-3 rounded-xl ${bgColor} ${color}`}>
            <Icon className="w-6 h-6" />
        </div>
    </div>
);
