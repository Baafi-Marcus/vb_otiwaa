import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Package,
    Plus,
    Clock,
    Loader2,
    Sparkles,
    MessageSquare,
    Send,
    Bot,
    RefreshCw,
    Users,
    Upload,
    X,
    CheckCircle2,
    Printer,
    Bell
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

import axios from 'axios';

import { toast } from 'react-hot-toast';
import { DashboardStats } from './DashboardStats';
import { ReceiptView } from './ReceiptView';
import { useSocket } from '../../context/SocketContext';

const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:3000' : '';

export const MerchantDashboard: React.FC<{ merchantId: string | null }> = ({ merchantId }) => {
    const [activeTab, setActiveTab] = useState<'orders' | 'catalog' | 'sandbox' | 'marketing'>('orders');
    const [merchant, setMerchant] = useState<any>(null);
    const [orders, setOrders] = useState<any[]>([]);
    const [analytics, setAnalytics] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [isAddingProduct, setIsAddingProduct] = useState(false);
    const [uploading, setUploading] = useState(false);
    // const [analyzingMenu, setAnalyzingMenu] = useState(false); // Unused
    const [draftProducts, setDraftProducts] = useState<any[]>([]);
    const [isReviewingMenu, setIsReviewingMenu] = useState(false);
    const [editingProduct, setEditingProduct] = useState<any>(null);
    const [deliveryZones, setDeliveryZones] = useState<any[]>([]);
    const [isAddingZone, setIsAddingZone] = useState(false);
    const [newZone, setNewZone] = useState({ name: '', price: '' });
    const [editingZone, setEditingZone] = useState<any>(null);
    const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
    const [receiptOrder, setReceiptOrder] = useState<any>(null);
    const [localPreview, setLocalPreview] = useState<string | null>(null);
    const [reviewImageUrl, setReviewImageUrl] = useState<string | null>(null);
    const { socket } = useSocket();

    useEffect(() => {
        if (socket && merchantId) {
            socket.emit('joinMerchant', merchantId);

            socket.on('newOrder', (order) => {
                toast.success(`🎉 New Order Received: ${order.shortId}`, { duration: 6000 });
                setOrders(prev => [order, ...prev]);
                // Refresh full data to update stats too
                fetchDashboardData(true);
            });

            socket.on('newMessage', (msg) => {
                toast(`💬 Message from ${msg.from}: ${msg.text || '[Media]'}`, { icon: '📩' });
            });

            return () => {
                socket.off('newOrder');
                socket.off('newMessage');
            };
        }
    }, [socket, merchantId]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Show local preview immediately
        const objectUrl = URL.createObjectURL(file);
        setLocalPreview(objectUrl);

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const resp = await axios.post(`${API_BASE}/api/merchants/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const imageUrl = resp.data.url;

            // 1. Immediate save to DB to prevent sync loss
            await axios.patch(`${API_BASE}/api/merchants/${merchantId}`, {
                menuImageUrl: imageUrl
            });

            setMerchant((prev: any) => prev ? { ...prev, menuImageUrl: imageUrl } : prev);
            toast.success('Image uploaded! Starting AI analysis...');

            const analyzeResp = await axios.post(`${API_BASE}/api/merchants/analyze-menu`, { imageUrl });
            setDraftProducts(analyzeResp.data.products);

            // Explicitly pass the NEW imageUrl to ensure the modal isn't stale
            setReviewImageUrl(imageUrl);
            setIsReviewingMenu(true);
            toast.success('Menu analysis complete! Please review items.');
        } catch (err: any) {
            toast.error('Failed to process menu image.');
            console.error(err);
        } finally {
            setUploading(false);
        }
    };

    const fetchDashboardData = async (silent = false) => {
        if (!merchantId || uploading || isReviewingMenu) return;
        if (!silent) setLoading(true);
        try {
            const resp = await axios.get(`${API_BASE}/api/merchants/${merchantId}/dashboard`);

            if (resp.data.merchant) {
                console.log('[DEBUG] Syncing Merchant Data:', {
                    id: resp.data.merchant.id,
                    menuImageUrl: resp.data.merchant.menuImageUrl
                });
                setMerchant(resp.data.merchant);
            }

            setOrders(resp.data.orders);
            setAnalytics(resp.data.analytics);

            // Fetch delivery zones (protected)
            try {
                const zonesResp = await axios.get(`${API_BASE}/api/merchants/${merchantId}/delivery-zones`);
                setDeliveryZones(zonesResp.data);
            } catch (zErr) {
                console.warn('Delivery zones unavailable, likely pending migration', zErr);
                setDeliveryZones([]); // Fallback to empty
            }
        } catch (err) {
            console.error('Error fetching dashboard data', err);
            if (!silent) toast.error('Failed to sync dashboard data');
        } finally {
            if (!silent) setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchDashboardData(false); // Initial load is NOT silent

        // Auto-refresh orders every 30 seconds (silent refresh)
        // Increased to 30s to be less aggressive, but made it silent to avoid flashing
        const interval = setInterval(() => {
            if (!uploading && !isReviewingMenu) {
                fetchDashboardData(true); // Background refreshes ARE silent
            }
        }, 30000);

        return () => clearInterval(interval);
    }, [merchantId, uploading, isReviewingMenu]);

    const handleUpgradeRequest = async () => {
        try {
            await axios.post(`${API_BASE}/api/merchants/${merchantId}/upgrade-request`, {
                requestedTier: merchant.tier === 'BASIC' ? 'PRO' : 'ENTERPRISE'
            });
            toast.success('Upgrade request sent! Admin will contact you soon.');
        } catch (err) {
            toast.error('Failed to send upgrade request');
        }
    };

    const handleStatusUpdate = async (orderId: string, newStatus: string) => {
        try {
            await axios.patch(`${API_BASE}/api/orders/${orderId}/status`, { status: newStatus });
            toast.success(`Order ${newStatus.toLowerCase()}`);
            fetchDashboardData();
        } catch (err) {
            console.error('Failed to update order status');
            toast.error('Failed to update order status');
        }
    };

    const handleBulkStatusUpdate = async (status: string) => {
        if (selectedOrders.size === 0) return;
        const ids = Array.from(selectedOrders);
        setLoading(true);
        try {
            await axios.patch(`${API_BASE}/api/orders/bulk-status`, { ids, status });
            toast.success(`Updated ${ids.length} orders to ${status.toLowerCase()}`);
            setSelectedOrders(new Set());
            fetchDashboardData();
        } catch (err) {
            toast.error('Bulk update failed');
        } finally {
            setLoading(false);
        }
    };

    const toggleOrderSelection = (id: string) => {
        const next = new Set(selectedOrders);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedOrders(next);
    };

    const toggleSelectAll = () => {
        if (selectedOrders.size === orders.length) {
            setSelectedOrders(new Set());
        } else {
            setSelectedOrders(new Set(orders.map(o => o.id)));
        }
    };

    return (
        <div className="flex h-full bg-secondary/5 overflow-hidden relative">
            {/* Merchant Sidebar (Desktop) */}
            <aside className="hidden lg:flex w-64 bg-card border-r border-border flex-col transition-all">
                <div className="p-6 border-b border-border flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-black shadow-lg shadow-primary/20 uppercase">
                        {merchant?.name?.[0] || 'M'}
                    </div>
                    <span className="font-bold hidden lg:block text-foreground truncate">{merchant?.name || 'Merchant Hub'}</span>
                </div>

                <nav className="flex-1 p-4 space-y-4">
                    <button
                        onClick={() => setActiveTab('orders')}
                        className={`w-full flex items-center justify-center lg:justify-start gap-3 p-3 rounded-xl transition-all ${activeTab === 'orders' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary'}`}
                    >
                        <Clock className="w-5 h-5" />
                        <span className="font-medium hidden lg:block">Live Orders</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('catalog')}
                        className={`w-full flex items-center justify-center lg:justify-start gap-3 p-3 rounded-xl transition-all ${activeTab === 'catalog' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary'}`}
                    >
                        <Package className="w-5 h-5" />
                        <span className="font-medium hidden lg:block">Smart Catalog</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('sandbox')}
                        className={`w-full flex items-center justify-center lg:justify-start gap-3 p-3 rounded-xl transition-all ${activeTab === 'sandbox' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary'}`}
                    >
                        <MessageSquare className="w-5 h-5" />
                        <span className="font-medium hidden lg:block">AI Sandbox</span>
                    </button>
                    {merchant?.tier !== 'BASIC' && (
                        <button
                            onClick={() => setActiveTab('marketing')}
                            className={`w-full flex items-center justify-center lg:justify-start gap-3 p-3 rounded-xl transition-all ${activeTab === 'marketing' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary'}`}
                        >
                            <Users className="w-5 h-5" />
                            <span className="font-medium hidden lg:block">CRM & Marketing</span>
                        </button>
                    )}
                </nav>
            </aside>

            {/* Mobile Bottom Navigation */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 flex justify-around z-50 pb-safe">
                <button onClick={() => setActiveTab('orders')} className={`flex flex-col items-center gap-1 ${activeTab === 'orders' ? 'text-primary' : 'text-muted-foreground'}`}>
                    <Clock className="w-6 h-6" />
                    <span className="text-[10px] font-bold">Orders</span>
                </button>
                <button onClick={() => setActiveTab('catalog')} className={`flex flex-col items-center gap-1 ${activeTab === 'catalog' ? 'text-primary' : 'text-muted-foreground'}`}>
                    <Package className="w-6 h-6" />
                    <span className="text-[10px] font-bold">Catalog</span>
                </button>
                <button onClick={() => setActiveTab('sandbox')} className={`flex flex-col items-center gap-1 ${activeTab === 'sandbox' ? 'text-primary' : 'text-muted-foreground'}`}>
                    <MessageSquare className="w-6 h-6" />
                    <span className="text-[10px] font-bold">Sandbox</span>
                </button>
                {merchant?.tier !== 'BASIC' && (
                    <button onClick={() => setActiveTab('marketing')} className={`flex flex-col items-center gap-1 ${activeTab === 'marketing' ? 'text-primary' : 'text-muted-foreground'}`}>
                        <Users className="w-6 h-6" />
                        <span className="text-[10px] font-bold">CRM</span>
                    </button>
                )}
            </div>

            {/* Content Area */}
            <main className="flex-1 overflow-auto p-4 lg:p-10 space-y-8">
                <div className="max-w-6xl mx-auto space-y-10">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="w-12 h-12 animate-spin text-primary opacity-20" />
                        </div>
                    ) : (
                        <>
                            {/* Header Section */}
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                <div className="space-y-1">
                                    <h1 className="text-4xl font-black tracking-tight text-foreground flex flex-wrap items-center gap-4">
                                        {activeTab === 'orders' ? 'Dashboard' :
                                            activeTab === 'catalog' ? 'Smart Catalog' :
                                                activeTab === 'sandbox' ? 'AI Sandbox' : 'Marketing CRM'}

                                        {merchant?.tier && (
                                            <div className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-sm ${merchant.tier === 'BASIC' ? 'bg-zinc-100 text-zinc-600 border border-zinc-200' :
                                                merchant.tier === 'PRO' ? 'bg-primary/10 text-primary border border-primary/20' :
                                                    'bg-amber-400/10 text-amber-600 border border-amber-400/20'
                                                }`}>
                                                {merchant.tier === 'BASIC' ? '💼 Basic' : merchant.tier === 'PRO' ? '🚀 Pro' : '💎 Enterprise'}
                                            </div>
                                        )}
                                    </h1>
                                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                                        <p className="text-muted-foreground font-medium text-lg">
                                            {merchant?.name ? `Managing ${merchant.name}` : 'Automated business at your fingertips.'}
                                        </p>
                                        {merchant?.tierExpiresAt && (
                                            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground/60 uppercase">
                                                <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                                                Expires: {new Date(merchant.tierExpiresAt).toLocaleDateString()}
                                            </div>
                                        )}
                                        {merchant?.tier === 'BASIC' && (
                                            <div className={`flex items-center gap-2 text-xs font-bold uppercase ${merchant.monthlyOrderCount >= 100 ? 'text-red-500' : 'text-primary'}`}>
                                                <div className="w-1 h-1 rounded-full bg-current opacity-30" />
                                                {merchant.monthlyOrderCount}/100 Orders Used
                                                {merchant.monthlyOrderCount >= 100 && ' (Exceeded)'}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {activeTab === 'orders' && (
                                    <div className="flex items-center gap-3">
                                        {merchant?.tier !== 'ENTERPRISE' && (
                                            <button
                                                onClick={handleUpgradeRequest}
                                                className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 border border-primary/20 hidden sm:flex items-center gap-2"
                                            >
                                                <Sparkles className="w-3.5 h-3.5" />
                                                Upgrade
                                            </button>
                                        )}
                                        <button
                                            onClick={() => fetchDashboardData()}
                                            disabled={loading}
                                            className="p-3 bg-secondary/50 hover:bg-secondary text-foreground rounded-xl transition-all active:scale-95"
                                        >
                                            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                                        </button>
                                        <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl text-sm font-bold flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                            Live System
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'catalog' && (
                                    <button
                                        onClick={() => setIsAddingProduct(true)}
                                        className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all active:scale-95"
                                    >
                                        <Plus className="w-5 h-5" />
                                        Add Product
                                    </button>
                                )}
                            </div>

                            {activeTab === 'orders' && (
                                <DashboardStats orders={orders} analytics={analytics} />
                            )}

                            {activeTab === 'orders' && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                                    {/* Analytics Section */}
                                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                                        <div className="lg:col-span-3 bg-card border border-border rounded-3xl p-8 shadow-sm space-y-6">
                                            <div className="flex items-center justify-between">
                                                <h3 className="font-bold text-xl">Revenue Performance</h3>
                                                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase">
                                                    <div className="w-2 h-2 rounded-full bg-primary" /> Last 7 Days
                                                </div>
                                            </div>
                                            <div className="h-[300px] w-full">
                                                {analytics?.revenueHistory?.length > 0 ? (
                                                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                                                        <AreaChart data={analytics.revenueHistory}>
                                                            <defs>
                                                                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                                                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                                                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                                                </linearGradient>
                                                            </defs>
                                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                                            <XAxis
                                                                dataKey="date"
                                                                axisLine={false}
                                                                tickLine={false}
                                                                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                                                                tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { weekday: 'short' })}
                                                            />
                                                            <YAxis
                                                                axisLine={false}
                                                                tickLine={false}
                                                                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                                                            />
                                                            <Tooltip
                                                                contentStyle={{
                                                                    backgroundColor: 'hsl(var(--card))',
                                                                    borderColor: 'hsl(var(--border))',
                                                                    borderRadius: '12px',
                                                                    fontSize: '12px'
                                                                }}
                                                            />
                                                            <Area
                                                                type="monotone"
                                                                dataKey="revenue"
                                                                stroke="hsl(var(--primary))"
                                                                strokeWidth={3}
                                                                fillOpacity={1}
                                                                fill="url(#colorRev)"
                                                            />
                                                        </AreaChart>
                                                    </ResponsiveContainer>
                                                ) : (
                                                    <div className="h-full w-full flex items-center justify-center text-muted-foreground italic text-sm border border-dashed border-border rounded-2xl">
                                                        No revenue data yet.
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-6">
                                            <StatItem label="Total Revenue" value={`GHS ${analytics?.totalRevenue || 0}`} change="+GHS 12 this week" />
                                            <StatItem label="Active Orders" value={orders.filter(o => o.status === 'PENDING').length} change="Live" accent />
                                            <StatItem label="Success Rate" value="94%" change="Stable" />
                                        </div>
                                    </div>

                                    <div className="space-y-4 relative">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Clock className="w-5 h-5" />
                                                <span className="font-bold text-sm uppercase tracking-widest text-muted-foreground/60">Real-time Feed</span>
                                            </div>
                                            {orders.length > 0 && (
                                                <div className="flex items-center gap-2 bg-secondary/20 px-3 py-1.5 rounded-xl border border-border">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedOrders.size === orders.length && orders.length > 0}
                                                        onChange={toggleSelectAll}
                                                        className="w-4 h-4 rounded text-primary accent-primary"
                                                    />
                                                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-tight">Select All</span>
                                                </div>
                                            )}
                                        </div>
                                        {orders.length === 0 ? (
                                            <div className="py-20 text-center text-muted-foreground italic bg-secondary/5 rounded-3xl border border-dashed border-border">
                                                No incoming orders yet.
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {orders.map((o, i) => (
                                                    <OrderRow
                                                        key={o.id}
                                                        order={o}
                                                        index={i}
                                                        onStatusUpdate={handleStatusUpdate}
                                                        isSelected={selectedOrders.has(o.id)}
                                                        onSelect={toggleOrderSelection}
                                                        onPrint={() => setReceiptOrder(o)}
                                                    />
                                                ))}
                                            </div>
                                        )}

                                        {/* Floating Bulk Action Bar */}
                                        <AnimatePresence>
                                            {selectedOrders.size > 0 && (
                                                <motion.div
                                                    initial={{ y: 100, opacity: 0 }}
                                                    animate={{ y: 0, opacity: 1 }}
                                                    exit={{ y: 100, opacity: 0 }}
                                                    className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-black/80 backdrop-blur-xl border border-white/10 px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-6 min-w-[400px]"
                                                >
                                                    <div className="flex items-center gap-3 pr-6 border-r border-white/10">
                                                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-black text-white">
                                                            {selectedOrders.size}
                                                        </div>
                                                        <span className="text-xs font-bold text-white uppercase tracking-widest">Selected</span>
                                                    </div>

                                                    <div className="flex items-center gap-3">
                                                        <button
                                                            onClick={() => handleBulkStatusUpdate('CONFIRMED')}
                                                            className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-xs font-black uppercase hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                                                        >
                                                            Confirm All (Notify)
                                                        </button>
                                                        <button
                                                            onClick={() => handleBulkStatusUpdate('DELIVERED')}
                                                            className="bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                                                        >
                                                            Deliver All (Notify)
                                                        </button>
                                                        <button
                                                            onClick={() => setSelectedOrders(new Set())}
                                                            className="p-2.5 text-white/50 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                                                        >
                                                            <X className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </motion.div>
                            )
                            }

                            {
                                activeTab === 'catalog' && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.98 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                                    >
                                        {merchant?.catalog?.length > 0 ? (
                                            merchant.catalog.map((p: any) => (
                                                <ProductCard
                                                    key={p.id}
                                                    product={p}
                                                    onEdit={() => setEditingProduct(p)}
                                                    onDelete={async () => {
                                                        if (!confirm(`Delete "${p.name}"?`)) return;
                                                        try {
                                                            await axios.delete(`${API_BASE}/api/merchants/${merchantId}/products/${p.id}`);
                                                            toast.success('Product deleted!');
                                                            fetchDashboardData();
                                                        } catch (err) {
                                                            toast.error('Failed to delete product');
                                                        }
                                                    }}
                                                />
                                            ))
                                        ) : (
                                            <div className="col-span-full py-20 text-center space-y-4 bg-secondary/10 rounded-3xl border-2 border-dashed border-border">
                                                <Package className="w-12 h-12 mx-auto text-muted-foreground/30" />
                                                <div className="space-y-1">
                                                    <p className="font-bold text-foreground">Your catalog is empty</p>
                                                    <p className="text-sm text-muted-foreground">Add products to start accepting WhatsApp orders.</p>
                                                </div>
                                                <button
                                                    onClick={() => setIsAddingProduct(true)}
                                                    className="text-primary font-bold text-sm hover:underline"
                                                >
                                                    Add your first product &rarr;
                                                </button>
                                            </div>
                                        )}
                                    </motion.div>
                                )
                            }

                            {
                                activeTab === 'sandbox' && (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="h-full max-w-4xl mx-auto flex flex-col gap-6">
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[600px]">
                                            {/* Prompt Workshop */}
                                            <div className="bg-card border border-border rounded-3xl p-8 flex flex-col space-y-6 shadow-sm overflow-hidden">
                                                <div className="flex items-center gap-2">
                                                    <Bot className="w-6 h-6 text-primary" />
                                                    <h3 className="font-bold text-xl">Prompt Workshop</h3>
                                                </div>
                                                <div className="flex-1 flex flex-col space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                                                    <div className="space-y-4">
                                                        <div className="space-y-2">
                                                            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Bot Name</label>
                                                            <input
                                                                className="w-full bg-secondary/20 border border-border rounded-xl px-4 py-2 text-sm font-medium outline-none focus:ring-1 focus:ring-primary transition-all"
                                                                value={merchant?.name || ""}
                                                                onChange={(e) => setMerchant({ ...merchant, name: e.target.value })}
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Menu Image (Upload from Device)</label>
                                                            <div className="relative group">
                                                                <input
                                                                    type="file"
                                                                    accept="image/*"
                                                                    onChange={handleFileUpload}
                                                                    className="hidden"
                                                                    id="merchant-menu-upload"
                                                                />
                                                                <label
                                                                    htmlFor="merchant-menu-upload"
                                                                    className={`flex items-center justify-center gap-3 w-full h-48 border-2 border-dashed rounded-2xl cursor-pointer transition-all overflow-hidden relative
                                                                        ${(localPreview || merchant?.menuImageUrl)
                                                                            ? 'border-emerald-500/30 bg-emerald-500/5'
                                                                            : 'border-border bg-secondary/20 hover:border-primary/50'}`}
                                                                >
                                                                    {uploading ? (
                                                                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                                                    ) : (localPreview || merchant?.menuImageUrl) ? (
                                                                        <div className="relative w-full h-full group">
                                                                            <img
                                                                                src={localPreview || (merchant?.menuImageUrl?.startsWith('/') ? `${API_BASE}${merchant.menuImageUrl}` : merchant?.menuImageUrl) || ""}
                                                                                alt="Menu Preview"
                                                                                className="w-full h-full object-cover"
                                                                            />
                                                                            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                                <RefreshCw className="w-8 h-8 text-white mb-2" />
                                                                                <span className="text-xs font-bold text-white uppercase tracking-widest">Click to Change</span>
                                                                            </div>
                                                                            <div className="absolute top-2 right-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg">
                                                                                SAVED
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="flex flex-col items-center gap-1">
                                                                            <Upload className="w-8 h-8 text-muted-foreground opacity-50 group-hover:scale-110 transition-transform" />
                                                                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Pick Menu Image</span>
                                                                        </div>
                                                                    )}
                                                                </label>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">OR Manual Menu URL</label>
                                                            <input
                                                                className="w-full bg-secondary/20 border border-border rounded-xl px-4 py-2 text-sm font-medium outline-none focus:ring-1 focus:ring-primary transition-all"
                                                                value={merchant?.menuImageUrl || ""}
                                                                onChange={(e) => merchant && setMerchant({ ...merchant, menuImageUrl: e.target.value })}
                                                                placeholder="https://example.com/menu.jpg"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">System Prompt (Personality)</label>
                                                            <textarea
                                                                className="w-full h-48 bg-secondary/20 border border-border rounded-2xl p-4 text-sm font-medium resize-none outline-none focus:ring-1 focus:ring-primary transition-all"
                                                                value={merchant?.systemPrompt || ""}
                                                                onChange={(e) => merchant && setMerchant({ ...merchant, systemPrompt: e.target.value })}
                                                                placeholder="Define how your bot should behave here..."
                                                            />
                                                        </div>
                                                        <div className="flex items-center justify-between p-4 bg-secondary/10 rounded-2xl border border-border">
                                                            <div className="space-y-0.5">
                                                                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Store Status</label>
                                                                <p className="text-[10px] text-muted-foreground">When closed, AI will reject immediate orders</p>
                                                            </div>
                                                            <button
                                                                onClick={() => merchant && setMerchant({ ...merchant, isClosed: !merchant?.isClosed })}
                                                                className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${merchant?.isClosed ? 'bg-destructive text-destructive-foreground' : 'bg-emerald-500 text-white'}`}
                                                            >
                                                                {merchant?.isClosed ? '🔴 CLOSED' : '🟢 OPEN'}
                                                            </button>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="space-y-2">
                                                                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Location</label>
                                                                <input
                                                                    className="w-full bg-secondary/20 border border-border rounded-xl px-4 py-2 text-sm font-medium outline-none focus:ring-1 focus:ring-primary transition-all"
                                                                    value={merchant?.location || ""}
                                                                    onChange={(e) => merchant && setMerchant({ ...merchant, location: e.target.value })}
                                                                    placeholder="Accra, Ghana"
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Operating Hours</label>
                                                                <input
                                                                    className="w-full bg-secondary/20 border border-border rounded-xl px-4 py-2 text-sm font-medium outline-none focus:ring-1 focus:ring-primary transition-all"
                                                                    value={merchant?.operatingHours || ""}
                                                                    onChange={(e) => merchant && setMerchant({ ...merchant, operatingHours: e.target.value })}
                                                                    placeholder="Mon-Sat 9am-9pm"
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="space-y-2">
                                                            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Payment Methods</label>
                                                            <input
                                                                className="w-full bg-secondary/20 border border-border rounded-xl px-4 py-2 text-sm font-medium outline-none focus:ring-1 focus:ring-primary transition-all"
                                                                value={merchant?.paymentMethods || ""}
                                                                onChange={(e) => merchant && setMerchant({ ...merchant, paymentMethods: e.target.value })}
                                                                placeholder="MTN MoMo, Cash"
                                                            />
                                                        </div>

                                                        <div className="space-y-2">
                                                            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Base Delivery Fee (GHS)</label>
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                className="w-full bg-secondary/20 border border-border rounded-xl px-4 py-2 text-sm font-medium outline-none focus:ring-1 focus:ring-primary transition-all"
                                                                value={merchant?.baseDeliveryFee || 0}
                                                                onChange={(e) => merchant && setMerchant({ ...merchant, baseDeliveryFee: parseFloat(e.target.value) || 0 })}
                                                            />
                                                        </div>

                                                        {/* Custom Delivery Zones Section */}
                                                        <div className="space-y-4 pt-4 border-t border-border">
                                                            <div className="flex items-center justify-between">
                                                                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Custom Delivery Zones</label>
                                                                <button
                                                                    onClick={() => setIsAddingZone(true)}
                                                                    className="text-[10px] font-black bg-primary/10 text-primary px-3 py-1 rounded-lg hover:bg-primary/20 transition-all"
                                                                >
                                                                    + ADD ZONE
                                                                </button>
                                                            </div>

                                                            <div className="space-y-2">
                                                                {deliveryZones.map((zone) => (
                                                                    <div key={zone.id} className="flex items-center justify-between p-3 bg-secondary/10 rounded-xl border border-border group">
                                                                        <div>
                                                                            <p className="text-sm font-bold">{zone.name}</p>
                                                                            <p className="text-[10px] text-muted-foreground">GHS {zone.price}</p>
                                                                        </div>
                                                                        <div className="flex items-center gap-2">
                                                                            <button
                                                                                onClick={() => setEditingZone(zone)}
                                                                                className="opacity-0 group-hover:opacity-100 p-1 hover:text-primary transition-all"
                                                                            >
                                                                                <Sparkles className="w-4 h-4" />
                                                                            </button>
                                                                            <button
                                                                                onClick={async () => {
                                                                                    if (!confirm(`Delete zone "${zone.name}"?`)) return;
                                                                                    await axios.delete(`${API_BASE}/api/merchants/${merchantId}/delivery-zones/${zone.id}`);
                                                                                    setDeliveryZones(deliveryZones.filter(z => z.id !== zone.id));
                                                                                    toast.success('Zone deleted');
                                                                                }}
                                                                                className="p-2 opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10 rounded-lg transition-all"
                                                                            >
                                                                                <X className="w-4 h-4" />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                ))}

                                                                {isAddingZone && (
                                                                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-4 bg-primary/5 border border-primary/20 rounded-xl space-y-3">
                                                                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary">New Zone</h4>
                                                                        <input
                                                                            className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-xs outline-none"
                                                                            placeholder="Zone Name (e.g. East Legon)"
                                                                            value={newZone.name}
                                                                            onChange={e => setNewZone({ ...newZone, name: e.target.value })}
                                                                        />
                                                                        <input
                                                                            type="number"
                                                                            className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-xs outline-none"
                                                                            placeholder="Price (GHS)"
                                                                            value={newZone.price}
                                                                            onChange={e => setNewZone({ ...newZone, price: e.target.value })}
                                                                        />
                                                                        <div className="flex gap-2">
                                                                            <button
                                                                                onClick={() => setIsAddingZone(false)}
                                                                                className="flex-1 bg-secondary text-foreground py-2 rounded-lg text-[10px] font-bold"
                                                                            >
                                                                                CANCEL
                                                                            </button>
                                                                            <button
                                                                                onClick={async () => {
                                                                                    if (!newZone.name || !newZone.price) return;
                                                                                    const resp = await axios.post(`${API_BASE}/api/merchants/${merchantId}/delivery-zones`, {
                                                                                        name: newZone.name,
                                                                                        price: parseFloat(newZone.price)
                                                                                    });
                                                                                    setDeliveryZones([...deliveryZones, resp.data]);
                                                                                    setIsAddingZone(false);
                                                                                    setNewZone({ name: '', price: '' });
                                                                                    toast.success('Zone added');
                                                                                }}
                                                                                className="flex-1 bg-primary text-white py-2 rounded-lg text-[10px] font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                                                            >
                                                                                ADD ZONE
                                                                            </button>
                                                                        </div>
                                                                    </motion.div>
                                                                )}

                                                                {editingZone && (
                                                                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-4 bg-primary/5 border border-primary/20 rounded-xl space-y-3">
                                                                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary">Edit Zone</h4>
                                                                        <input
                                                                            className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-xs outline-none"
                                                                            value={editingZone.name}
                                                                            onChange={e => setEditingZone({ ...editingZone, name: e.target.value })}
                                                                        />
                                                                        <input
                                                                            type="number"
                                                                            className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-xs outline-none"
                                                                            value={editingZone.price}
                                                                            onChange={e => setEditingZone({ ...editingZone, price: e.target.value })}
                                                                        />
                                                                        <div className="flex gap-2">
                                                                            <button
                                                                                onClick={() => setEditingZone(null)}
                                                                                className="flex-1 bg-secondary text-foreground py-2 rounded-lg text-[10px] font-bold"
                                                                            >
                                                                                CANCEL
                                                                            </button>
                                                                            <button
                                                                                onClick={async () => {
                                                                                    try {
                                                                                        await axios.patch(`${API_BASE}/api/merchants/${merchantId}/delivery-zones/${editingZone.id}`, {
                                                                                            name: editingZone.name,
                                                                                            price: parseFloat(editingZone.price)
                                                                                        });
                                                                                        setDeliveryZones(deliveryZones.map(z => z.id === editingZone.id ? editingZone : z));
                                                                                        setEditingZone(null);
                                                                                        toast.success('Zone updated');
                                                                                    } catch (err) {
                                                                                        toast.error('Failed to update zone');
                                                                                    }
                                                                                }}
                                                                                className="flex-1 bg-primary text-white py-2 rounded-lg text-[10px] font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                                                            >
                                                                                SAVE CHANGES
                                                                            </button>
                                                                        </div>
                                                                    </motion.div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={async () => {
                                                            if (!merchant) return;
                                                            try {
                                                                await axios.patch(`${API_BASE}/api/merchants/${merchantId}`, {
                                                                    name: merchant?.name,
                                                                    systemPrompt: merchant?.systemPrompt,
                                                                    menuImageUrl: merchant?.menuImageUrl,
                                                                    baseDeliveryFee: merchant?.baseDeliveryFee,
                                                                    location: merchant?.location,
                                                                    operatingHours: merchant?.operatingHours,
                                                                    paymentMethods: merchant?.paymentMethods,
                                                                    isClosed: merchant?.isClosed
                                                                });
                                                                toast.success('Bot profile updated!');
                                                            } catch (err) {
                                                                toast.error('Failed to save changes');
                                                            }
                                                        }}
                                                        className="w-full bg-primary text-primary-foreground py-4 rounded-2xl font-black shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all"
                                                    >
                                                        Save Bot Profile
                                                    </button>
                                                </div>
                                                <button
                                                    className="w-full bg-secondary py-3 rounded-2xl font-bold text-sm hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
                                                    onClick={() => fetchDashboardData()}
                                                >
                                                    <RefreshCw className="w-4 h-4" /> Reset to Live
                                                </button>
                                            </div>

                                            {/* Chat Interface */}
                                            <ChatSandbox merchantId={merchantId} systemPrompt={merchant?.systemPrompt} />
                                        </div>
                                    </motion.div>
                                )
                            }

                            {
                                activeTab === 'marketing' && (
                                    <MarketingView merchantId={merchantId} />
                                )
                            }
                        </>
                    )}
                </div >
            </main >

            <AnimatePresence>
                {isAddingProduct && (
                    <ProductModal
                        merchantId={merchantId}
                        onClose={() => setIsAddingProduct(false)}
                        onSuccess={() => {
                            setIsAddingProduct(false);
                            fetchDashboardData();
                        }}
                    />
                )}
                {editingProduct && (
                    <ProductModal
                        merchantId={merchantId}
                        product={editingProduct}
                        onClose={() => setEditingProduct(null)}
                        onSuccess={() => {
                            setEditingProduct(null);
                            fetchDashboardData();
                        }}
                    />
                )}
                {isReviewingMenu && (
                    <ReviewWorkspaceModal
                        merchantId={merchantId}
                        merchant={merchant}
                        menuImageUrl={reviewImageUrl || merchant?.menuImageUrl || null}
                        drafts={draftProducts}
                        onClose={() => setIsReviewingMenu(false)}
                        onSuccess={() => {
                            setIsReviewingMenu(false);
                            fetchDashboardData();
                            setActiveTab('catalog');
                        }}
                    />
                )}
                {receiptOrder && (
                    <ReceiptView
                        order={receiptOrder}
                        merchant={merchant}
                        onClose={() => setReceiptOrder(null)}
                    />
                )}
            </AnimatePresence>
        </div >
    );
};

const ProductModal: React.FC<{ merchantId: string | null, product?: any, onClose: () => void, onSuccess: () => void }> = ({ merchantId, product, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: product?.name || '',
        description: product?.description || '',
        price: product?.price?.toString() || ''
    });
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [imageUrl, setImageUrl] = useState<string | null>(product?.imageUrl ? `${API_BASE}${product.imageUrl}` : null);

    const handleGenerateImage = async () => {
        if (!formData.name || !formData.description) return;
        setGenerating(true);
        try {
            const resp = await axios.post(`${API_BASE}/api/merchants/${merchantId}/generate-image`, {
                name: formData.name,
                description: formData.description
            });
            if (resp.data.imageUrl) {
                setImageUrl(`${API_BASE}${resp.data.imageUrl}`);
            }
        } catch (err) {
            console.error('Image gen failed');
        } finally {
            setGenerating(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (product) {
                // Update existing product
                await axios.patch(`${API_BASE}/api/merchants/${merchantId}/products/${product.id}`, {
                    ...formData,
                    price: parseFloat(formData.price),
                    imageUrl: imageUrl?.replace(API_BASE, '')
                });
                toast.success('Product updated!');
            } else {
                // Create new product
                await axios.post(`${API_BASE}/api/merchants/${merchantId}/products`, {
                    ...formData,
                    price: parseFloat(formData.price),
                    imageUrl: imageUrl ? imageUrl.replace(API_BASE, '') : undefined
                });
                toast.success('Product added!');
            }
            onSuccess();
        } catch (err) {
            console.error('Failed to save product');
            toast.error('Failed to save product');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-background/80 backdrop-blur-sm"
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-card border border-border w-full max-w-xl rounded-3xl p-8 shadow-2xl space-y-8"
            >
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-black">Add New Product</h2>
                    <button onClick={onClose} className="p-2 hover:bg-secondary rounded-xl transition-colors">
                        <Plus className="w-6 h-6 rotate-45" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-muted-foreground">Product Name</label>
                            <input
                                required
                                className="w-full bg-secondary/30 border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none transition-all"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-muted-foreground">Price (GHS)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    className="w-full bg-secondary/30 border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none transition-all"
                                    value={formData.price}
                                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-muted-foreground">Visuals</label>
                                <button
                                    type="button"
                                    onClick={handleGenerateImage}
                                    disabled={generating || !formData.name}
                                    className="w-full flex items-center justify-center gap-2 bg-primary/10 text-primary py-3 rounded-xl font-bold hover:bg-primary/20 transition-all disabled:opacity-50"
                                >
                                    {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                    Magic AI Image
                                </button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-muted-foreground">Description</label>
                            <textarea
                                rows={3}
                                required
                                className="w-full bg-secondary/30 border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none transition-all resize-none"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                    </div>

                    {imageUrl && (
                        <div className="aspect-video relative rounded-2xl overflow-hidden border border-border">
                            <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                            <div className="absolute top-2 right-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-lg">AI Generated</div>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary py-4 rounded-2xl font-black text-primary-foreground hover:opacity-90 active:scale-95 transition-all shadow-xl shadow-primary/20 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 'Confirm & Save Product'}
                    </button>
                </form>
            </motion.div>
        </motion.div>
    );
};

const ReviewWorkspaceModal: React.FC<{
    merchantId: string | null,
    merchant: any,
    menuImageUrl: string | null,
    drafts: any[],
    onClose: () => void,
    onSuccess: () => void
}> = ({ merchantId, merchant, menuImageUrl, drafts, onClose, onSuccess }) => {
    const [items, setItems] = useState(drafts);
    const [loading, setLoading] = useState(false);

    const handleUpdateItem = (index: number, field: string, value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const handleRemoveItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleSaveAll = async () => {
        setLoading(true);
        try {
            // 1. Bulk Add Products
            await axios.post(`${API_BASE}/api/merchants/${merchantId}/bulk-products`, {
                products: items
            });

            // 2. Auto-save Menu Image if present and Pro/Enterprise (Fixes user issue)
            if (menuImageUrl && merchant?.tier !== 'BASIC') {
                await axios.patch(`${API_BASE}/api/merchants/${merchantId}`, {
                    menuImageUrl: menuImageUrl
                });
            }

            toast.success(`Imported ${items.length} items${merchant?.tier !== 'BASIC' ? ' & Updated Menu Image' : ''}!`);
            onSuccess();
        } catch (err) {
            toast.error('Failed to import items');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:p-10 bg-background/80 backdrop-blur-sm"
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-card border border-border w-full max-w-4xl max-h-screen lg:max-h-[90vh] rounded-3xl p-6 lg:p-8 shadow-2xl flex flex-col space-y-8 overflow-hidden"
            >
                <div className="flex justify-between items-center bg-secondary/50 p-4 -m-8 mb-4 border-b border-border">
                    <div className="flex items-center gap-3">
                        <Sparkles className="w-6 h-6 text-primary animate-pulse" />
                        <div>
                            <h2 className="text-xl lg:text-2xl font-black">AI Review Workspace</h2>
                            <p className="text-xs font-bold text-muted-foreground uppercase opacity-60">Verify extracted menu items</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-secondary rounded-xl transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                    {items.length === 0 ? (
                        <div className="py-20 text-center space-y-4">
                            <p className="text-muted-foreground italic font-medium">No items found in image.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {items.map((item, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 bg-secondary/10 border border-border rounded-2xl items-center group relative overflow-hidden"
                                >
                                    <div className="lg:col-span-4 space-y-1">
                                        <label className="text-[10px] font-black uppercase text-muted-foreground/50">Item Name</label>
                                        <input
                                            value={item.name}
                                            onChange={e => handleUpdateItem(idx, 'name', e.target.value)}
                                            className="w-full bg-background/50 border border-border rounded-lg px-3 py-1.5 text-sm font-bold outline-none focus:ring-1 focus:ring-primary"
                                        />
                                    </div>
                                    <div className="lg:col-span-2 space-y-1">
                                        <label className="text-[10px] font-black uppercase text-muted-foreground/50">Price (GHS)</label>
                                        <input
                                            type="number"
                                            value={item.price}
                                            onChange={e => handleUpdateItem(idx, 'price', e.target.value)}
                                            className="w-full bg-background/50 border border-border rounded-lg px-3 py-1.5 text-sm font-black outline-none focus:ring-1 focus:ring-primary"
                                        />
                                    </div>
                                    <div className="lg:col-span-5 space-y-1">
                                        <label className="text-[10px] font-black uppercase text-muted-foreground/50">Description</label>
                                        <input
                                            value={item.description}
                                            onChange={e => handleUpdateItem(idx, 'description', e.target.value)}
                                            className="w-full bg-background/50 border border-border rounded-lg px-3 py-1.5 text-sm font-medium outline-none focus:ring-1 focus:ring-primary"
                                        />
                                    </div>
                                    <div className="lg:col-span-1 flex justify-end">
                                        <button
                                            onClick={() => handleRemoveItem(idx)}
                                            className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary scale-y-0 group-hover:scale-y-100 transition-transform origin-top" />
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="pt-6 border-t border-border flex flex-col lg:flex-row gap-4">
                    <button
                        onClick={onClose}
                        className="flex-1 px-8 py-4 rounded-2xl font-bold bg-secondary hover:bg-secondary/80 transition-all active:scale-95"
                    >
                        Discard All
                    </button>
                    <button
                        onClick={handleSaveAll}
                        disabled={loading || items.length === 0}
                        className="flex-[2] bg-primary text-primary-foreground px-12 py-4 rounded-2xl font-black shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle2 className="w-6 h-6" />}
                        Confirm & Import to Catalog
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

const ChatSandbox: React.FC<{ merchantId: string | null, systemPrompt: string }> = ({ merchantId, systemPrompt }) => {
    const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSend = async () => {
        if (!input.trim() || loading) return;
        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setLoading(true);

        try {
            const resp = await axios.post(`${API_BASE}/api/merchants/${merchantId}/sandbox`, {
                customPrompt: systemPrompt,
                message: userMsg
            });
            setMessages(prev => [...prev, { role: 'assistant', content: resp.data.response }]);
        } catch (err) {
            toast.error('Sandbox AI failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-card border border-border rounded-3xl flex flex-col shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border bg-secondary/10">
                <h4 className="font-bold text-sm uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live Simulation
                </h4>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-secondary/5">
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-2 opacity-40">
                        <MessageSquare className="w-8 h-8" />
                        <p className="text-xs font-medium">Start a conversation to test your AI</p>
                    </div>
                )}
                {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm font-medium shadow-sm ${m.role === 'user'
                            ? 'bg-primary text-primary-foreground rounded-tr-none'
                            : 'bg-card border border-border text-foreground rounded-tl-none'
                            }`}>
                            {m.content}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-card border border-border px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex gap-1">
                            <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" />
                            <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.2s]" />
                            <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.4s]" />
                        </div>
                    </div>
                )}
            </div>

            <div className="p-4 border-t border-border bg-card">
                <div className="flex gap-2">
                    <input
                        className="flex-1 bg-secondary border border-border rounded-xl px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-primary transition-all"
                        placeholder="Type a test message..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    />
                    <button
                        onClick={handleSend}
                        disabled={loading || !input.trim()}
                        className="bg-primary text-primary-foreground p-2 rounded-xl hover:scale-105 transition-all active:scale-95 disabled:opacity-50"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

const StatItem = ({ label, value, change, accent }: any) => (
    <div className={`p-6 rounded-2xl border border-border bg-card shadow-sm space-y-2 ${accent ? 'ring-2 ring-primary/20' : ''}`}>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{label}</p>
        <div className="flex items-baseline justify-between">
            <h3 className="text-2xl font-black">{value}</h3>
            <span className="text-xs font-bold px-2 py-1 rounded-full bg-secondary text-primary">{change}</span>
        </div>
    </div>
);

const OrderRow = ({ order, index, onStatusUpdate, isSelected, onSelect, onPrint }: { order: any, index: number, onStatusUpdate: (id: string, s: string) => void, isSelected: boolean, onSelect: (id: string) => void, onPrint?: () => void }) => {
    const statusColors: any = {
        PENDING: 'bg-orange-500/10 text-orange-500',
        CONFIRMED: 'bg-blue-500/10 text-blue-500',
        DELIVERED: 'bg-emerald-500/10 text-emerald-500',
        CANCELLED: 'bg-red-500/10 text-red-500'
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-card border border-border p-4 sm:p-6 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group hover:border-primary/50 transition-all shadow-sm"
        >
            <div className="flex items-center gap-4">
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onSelect(order.id)}
                    className="w-5 h-5 rounded-md border-border text-primary focus:ring-primary accent-primary cursor-pointer"
                />
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black ${statusColors[order.status] || 'bg-secondary text-muted-foreground'}`}>
                    {order.status[0]}
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="font-bold text-foreground">{order.customerName || 'Guest'}</span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1 bg-secondary/30 px-2 py-0.5 rounded-lg border border-border">
                                {order.customerPhone}
                            </span>
                            <span className={`text-[10px] font-black tracking-tighter uppercase px-2 py-0.5 rounded-md border ${order.fulfillmentMode === 'DELIVERY' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                                {order.fulfillmentMode}
                            </span>
                            {order.fulfillmentMode === 'DELIVERY' && order.location && (
                                <span className="text-[10px] font-bold text-muted-foreground italic flex items-center gap-1">
                                    📍 {order.location}
                                </span>
                            )}
                            {Number(order.deliveryFee) > 0 && (
                                <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/5 px-2 py-0.5 rounded-md border border-emerald-500/10">
                                    + GHS {order.deliveryFee} Fee
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground font-medium mt-1">
                            {order.items?.map((it: any) => `${it.quantity}x ${it.product?.name || 'Item'}`).join(', ') || 'Processing items...'}
                        </p>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                    <span className="text-[10px] font-bold text-muted-foreground block uppercase">
                        {new Date(order.createdAt).toLocaleTimeString()}
                    </span>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${statusColors[order.status] || 'bg-secondary'}`}>
                        {order.status}
                    </span>
                </div>
                <div className="flex gap-2">
                    {order.status === 'PENDING' && (
                        <button
                            onClick={() => onStatusUpdate(order.id, 'CONFIRMED')}
                            className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-xs font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                        >
                            Confirm (Notify)
                        </button>
                    )}
                    {order.status === 'CONFIRMED' && (
                        <button
                            onClick={() => onStatusUpdate(order.id, 'DELIVERED')}
                            className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold hover:opacity-90 transition-all shadow-lg shadow-emerald-500/20"
                        >
                            Delivered (Notify)
                        </button>
                    )}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onPrint?.();
                        }}
                        className="p-2 bg-secondary text-foreground rounded-xl hover:bg-secondary/80 transition-all"
                        title="Print Receipt"
                    >
                        <Printer className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

const ProductCard = ({ product, onEdit, onDelete }: { product?: any, onEdit: () => void, onDelete: () => void }) => (
    <div className="bg-card border border-border rounded-2xl overflow-hidden group hover:shadow-xl transition-all border-b-4 border-b-primary/10">
        <div className="aspect-video bg-secondary/50 flex items-center justify-center relative overflow-hidden">
            {product?.imageUrl ? (
                <img src={product.imageUrl.startsWith('/') ? `${API_BASE}${product.imageUrl}` : product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            ) : (
                <Package className="w-12 h-12 text-muted-foreground/30" />
            )}
            <div className="absolute top-4 right-4 bg-background/80 backdrop-blur px-3 py-1 rounded-lg text-xs font-bold shadow-sm text-primary">
                GHS {product?.price || '0.00'}
            </div>
        </div>
        <div className="p-6 space-y-4">
            <div>
                <h4 className="font-bold text-lg">{product?.name || 'Sample Item'}</h4>
                <p className="text-sm text-muted-foreground line-clamp-2">{product?.description || 'Premium quality product from your catalog.'}</p>
            </div>
            <div className="flex gap-2">
                <button
                    onClick={onEdit}
                    className="flex-1 bg-secondary text-foreground py-3 rounded-xl font-bold text-sm hover:bg-secondary/80 outline-none transition-colors"
                >
                    Edit
                </button>
                <button
                    onClick={onDelete}
                    className="flex-1 border border-destructive/50 text-destructive py-3 rounded-xl font-bold text-sm hover:bg-destructive/10 outline-none transition-colors"
                >
                    Delete
                </button>
            </div>
        </div>
    </div>
);

const MarketingView: React.FC<{ merchantId: string | null }> = ({ merchantId }) => {
    const [customers, setCustomers] = useState<any[]>([]);
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [broadcastMsg, setBroadcastMsg] = useState('');
    const [campaignName, setCampaignName] = useState('');
    const [sending, setSending] = useState(false);

    const fetchData = async () => {
        if (!merchantId) return;
        try {
            const [custResp, campResp] = await Promise.all([
                axios.get(`${API_BASE}/api/merchants/${merchantId}/customers`),
                axios.get(`${API_BASE}/api/marketing/${merchantId}/campaigns`)
            ]);
            setCustomers(custResp.data);
            setCampaigns(campResp.data);
        } catch (err) {
            toast.error('Failed to load marketing data');
        }
    };

    useEffect(() => {
        fetchData();
    }, [merchantId]);

    const handleBroadcast = async () => {
        if (!broadcastMsg.trim() || !campaignName.trim() || sending) {
            toast.error('Please provide a campaign name and message');
            return;
        }
        setSending(true);
        try {
            await axios.post(`${API_BASE}/api/marketing/${merchantId}/campaign`, {
                name: campaignName,
                message: broadcastMsg,
                customerIds: customers.map((c: any) => c.id)
            });
            toast.success('Campaign started successfully!');
            setBroadcastMsg('');
            setCampaignName('');
            fetchData(); // Refresh history
        } catch (err) {
            toast.error('Failed to start campaign');
        } finally {
            setSending(false);
        }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Campaign Composer */}
                <div className="lg:col-span-2 bg-card border border-border rounded-3xl p-8 space-y-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                <Send className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-xl">New Campaign</h3>
                                <p className="text-sm text-muted-foreground">Broadcast updates to your customers</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <input
                            type="text"
                            className="w-full bg-secondary/20 border border-border rounded-xl p-4 text-sm font-bold outline-none focus:ring-1 focus:ring-primary transition-all"
                            placeholder="Campaign Name (e.g., Weekend Promo)"
                            value={campaignName}
                            onChange={(e) => setCampaignName(e.target.value)}
                        />
                        <textarea
                            className="w-full h-40 bg-secondary/20 border border-border rounded-2xl p-4 text-sm font-medium resize-none outline-none focus:ring-1 focus:ring-primary transition-all"
                            placeholder="Type your message here... (e.g., 'Check out our new menu!')"
                            value={broadcastMsg}
                            onChange={(e) => setBroadcastMsg(e.target.value)}
                        />
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                Target: All Customers ({customers.length})
                            </span>
                            <button
                                onClick={handleBroadcast}
                                disabled={sending || !broadcastMsg.trim()}
                                className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold text-sm hover:scale-105 transition-all disabled:opacity-50 flex items-center gap-2"
                            >
                                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                Send Broadcast
                            </button>
                        </div>
                    </div>
                </div>

                {/* Audience Stats & History */}
                <div className="space-y-6">
                    <div className="bg-card border border-border rounded-3xl p-6 space-y-4 shadow-sm">
                        <h4 className="font-bold text-sm text-muted-foreground uppercase tracking-widest">Audience Growth</h4>
                        <div className="text-4xl font-black">{customers.length}</div>
                        <div className="text-sm text-emerald-500 font-bold flex items-center gap-1">
                            <Sparkles className="w-4 h-4" /> +{customers.filter(c => new Date(c.createdAt) > new Date(Date.now() - 7 * 86400000)).length} this week
                        </div>
                    </div>

                    <div className="bg-card border border-border rounded-3xl p-6 space-y-4 shadow-sm">
                        <h4 className="font-bold text-sm text-muted-foreground uppercase tracking-widest">Recent Campaigns</h4>
                        <div className="space-y-3">
                            {campaigns.length === 0 ? (
                                <p className="text-xs text-muted-foreground italic">No campaigns yet.</p>
                            ) : (
                                campaigns.slice(0, 5).map((camp: any) => (
                                    <div key={camp.id} className="p-3 rounded-xl bg-secondary/20 border border-border/50 text-xs">
                                        <div className="flex justify-between font-bold mb-1">
                                            <span>{camp.name}</span>
                                            <span className={`px-2 py-0.5 rounded ${camp.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                                {camp.status}
                                            </span>
                                        </div>
                                        <p className="text-muted-foreground line-clamp-1">{camp.message}</p>
                                        <div className="mt-2 text-[10px] text-muted-foreground/60 flex justify-between">
                                            <span>{new Date(camp.createdAt).toLocaleDateString()}</span>
                                            <span>{camp.logs?.length || 0} recipients</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-3xl p-6 space-y-2">
                        <h4 className="font-bold text-sm text-blue-500 uppercase tracking-widest">Pro Tip</h4>
                        <p className="text-sm text-muted-foreground/80">Use emojis in your broadcasts to increase engagement rates by up to 40%.</p>
                    </div>
                </div>
            </div>

            {/* Customer List */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-4">
                    <Users className="w-5 h-5" />
                    <span className="font-bold text-sm uppercase tracking-widest text-muted-foreground/60">Recent Customers</span>
                </div>
                <div className="bg-card border border-border rounded-3xl overflow-hidden overflow-x-auto">
                    <table className="w-full text-sm text-left min-w-[600px]">
                        <thead className="bg-secondary/30 text-muted-foreground font-bold uppercase text-xs">
                            <tr>
                                <th className="px-6 py-4">Customer</th>
                                <th className="px-6 py-4">Orders</th>
                                <th className="px-6 py-4">Last Seen</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {customers.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground italic">
                                        No customers found yet.
                                    </td>
                                </tr>
                            ) : (
                                customers.map((c: any) => (
                                    <tr key={c.id} className="hover:bg-secondary/10 transition-colors">
                                        <td className="px-6 py-4 font-bold">{c.name || 'Unknown'} <span className="block text-xs font-normal text-muted-foreground">{c.phoneNumber}</span></td>
                                        <td className="px-6 py-4">{c._count?.orders || 0}</td>
                                        <td className="px-6 py-4 text-muted-foreground">{new Date(c.lastSeen).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-right flex justify-end gap-2">
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        await axios.post(`${API_BASE}/api/nudge/manual/${c.id}`);
                                                        toast.success('Nudge sent to ' + (c.name || c.phoneNumber));
                                                    } catch (err) {
                                                        toast.error('Failed to send nudge');
                                                    }
                                                }}
                                                className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase bg-primary text-primary-foreground hover:scale-105 transition-all flex items-center gap-1"
                                            >
                                                <Bell className="w-3 h-3" /> Nudge
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    const newState = !c.botPaused;
                                                    await axios.patch(`${API_BASE}/api/merchants/${merchantId}/customers/${c.id}/toggle-bot`, { paused: newState });
                                                    setCustomers(customers.map(cust => cust.id === c.id ? { ...cust, botPaused: newState } : cust));
                                                    toast.success(newState ? 'AI Paused (Manual Mode)' : 'AI Resumed');
                                                }}
                                                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${c.botPaused ? 'bg-amber-500 text-white' : 'bg-secondary text-foreground hover:bg-secondary/80'}`}
                                            >
                                                {c.botPaused ? 'Resume AI' : 'Pause AI'}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div>
    );
};

export default MerchantDashboard;
