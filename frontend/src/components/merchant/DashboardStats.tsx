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
import { TrendingUp, ShoppingBag, DollarSign, Bot, Users } from 'lucide-react';

interface DashboardStatsProps {
    orders: any[];
    analytics: any;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ orders, analytics }) => {
    const totalRevenue = analytics?.totalRevenue || 0;
    const activeOrders = orders.filter(o => ['PENDING', 'CONFIRMED'].includes(o.status)).length;
    const activeAI = analytics?.activeAI || 0;
    const totalCustomers = analytics?.totalCustomers || 0;

    // Use revenue history from analytics if available
    const finalChartData = analytics?.revenueHistory?.length > 0
        ? analytics.revenueHistory.map((item: any) => ({
            time: item.date.split('-').slice(1).join('/'), // Convert YYYY-MM-DD to MM/DD
            revenue: Number(item.revenue)
        }))
        : [
            { time: 'Sun', revenue: 0 },
            { time: 'Mon', revenue: 0 },
            { time: 'Tue', revenue: 0 },
            { time: 'Wed', revenue: 0 },
            { time: 'Thu', revenue: 0 },
            { time: 'Fri', revenue: 0 },
            { time: 'Sat', revenue: 0 },
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
                    title="Active AI Chats"
                    value={activeAI.toString()}
                    icon={Bot}
                    color="text-amber-500"
                    bgColor="bg-amber-500/10"
                />
                <StatCard
                    title="Total Customers"
                    value={totalCustomers.toString()}
                    icon={Users}
                    color="text-purple-500"
                    bgColor="bg-purple-500/10"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Chart */}
                <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 h-[350px]">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-muted-foreground" />
                        7-Day Revenue Trend
                    </h3>
                    <ResponsiveContainer width="100%" height="80%">
                        <AreaChart data={finalChartData}>
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.2} />
                            <XAxis dataKey="time" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#111', borderRadius: '12px', border: '1px solid #333' }}
                                itemStyle={{ color: '#fff' }}
                            />
                            <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Top Products */}
                <div className="bg-card border border-border rounded-2xl p-6 overflow-hidden">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5 text-muted-foreground" />
                        Top Products
                    </h3>
                    <div className="space-y-4">
                        {analytics?.topProducts?.length > 0 ? (
                            analytics.topProducts.map((product: any, i: number) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-secondary/20 border border-border/50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold text-xs">
                                            {i + 1}
                                        </div>
                                        <span className="font-bold text-sm truncate max-w-[120px]">{product.name}</span>
                                    </div>
                                    <span className="text-xs font-bold bg-secondary px-2 py-1 rounded-md text-muted-foreground">
                                        {product.quantity} sold
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-muted-foreground text-sm">
                                Not enough data yet.
                            </div>
                        )}
                    </div>
                </div>
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
