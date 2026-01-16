import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
    LayoutDashboard,
    Plus,
    Users,
    Sparkles,
    Settings,
    ShieldAlert,
    Terminal,
    Key,
    Activity,
    ArrowRight,
    Search,
    MessageSquare,
    CheckCircle2,
    X,
    Upload,
    // ImageIcon,
    Loader2,
    Smartphone,
    RefreshCw,
    Trash2,
    Copy,
    PauseCircle,
    PlayCircle,
    Clock,
    ChevronRight,
    ArrowUpCircle,
    Bell,
    Mail,
    User
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useSocket } from '../../context/SocketContext';
import { ChatSandbox } from '../shared/ChatSandbox';

const SidebarLink = ({ active, onClick, icon: Icon, label }: any) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-4 rounded-2xl transition-all duration-300 ${active ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' : 'hover:bg-secondary text-muted-foreground'}`}
    >
        <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-blue-500'}`} />
        <span className="font-bold hidden lg:block text-sm">{label}</span>
    </button>
);

const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:3000' : '';

export const AdminDashboard: React.FC<{ onMerchantSelect: (id: string) => void }> = ({ onMerchantSelect }) => {
    const [activeView, setActiveView] = useState<'overview' | 'register' | 'directory' | 'settings' | 'upgrades' | 'alerts' | 'profile' | 'simulation'>('overview');
    const [merchants, setMerchants] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchMerchants = async () => {
        setLoading(true);
        try {
            const resp = await axios.get(`${API_BASE}/api/merchants`);
            setMerchants(resp.data);
        } catch (err) {
            console.error('Failed to fetch merchants');
        } finally {
            setLoading(false);
        }
    };

    const { socket } = useSocket();

    React.useEffect(() => {
        if (socket) {
            socket.emit('joinAdmin');

            socket.on('newOrder', (data) => {
                toast(`🛒 New Order in Platform: ${data.shortId}`, { icon: '📦' });
            });

            socket.on('newMessage', (msg) => {
                toast(`✉️ Message arrived for Merchant ${msg.merchantId}`, { icon: '🤖' });
            });

            socket.on('newAlert', (data) => {
                toast(`🚨 System Alert: ${data.title}`, {
                    icon: '🚨',
                    duration: 5000,
                    style: {
                        background: '#fee2e2',
                        color: '#991b1b',
                        border: '1px solid #fecaca'
                    }
                });
            });

            return () => {
                socket.off('newOrder');
                socket.off('newMessage');
                socket.off('newAlert');
            };
        }
    }, [socket]);

    React.useEffect(() => {
        fetchMerchants();
    }, []);

    return (
        <div className="flex h-full bg-secondary/5 overflow-hidden">
            {/* Admin Sidebar */}
            <aside className="w-20 lg:w-72 bg-card border-r border-border flex flex-col transition-all">
                <div className="p-8 border-b border-border flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-lg shadow-blue-500/20 overflow-hidden p-1">
                        <img src="/logo-black.png" alt="Admin Logo" className="w-full h-full object-contain" />
                    </div>
                    <span className="font-bold hidden lg:block text-foreground text-xl tracking-tight">Admin Portal</span>
                </div>

                <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
                    <SidebarLink
                        active={activeView === 'overview'}
                        onClick={() => setActiveView('overview')}
                        icon={LayoutDashboard}
                        label="Overview"
                    />
                    <SidebarLink
                        active={activeView === 'directory'}
                        onClick={() => setActiveView('directory')}
                        icon={Users}
                        label="Merchants"
                    />
                    <SidebarLink
                        active={activeView === 'register'}
                        onClick={() => setActiveView('register')}
                        icon={Plus}
                        label="Register New"
                    />
                    <SidebarLink
                        active={activeView === 'upgrades'}
                        onClick={() => setActiveView('upgrades')}
                        icon={Sparkles}
                        label="Upgrade Requests"
                    />
                    <SidebarLink
                        active={activeView === 'alerts'}
                        onClick={() => setActiveView('alerts')}
                        icon={Bell}
                        label="System Alerts"
                    />
                    <SidebarLink
                        active={activeView === 'simulation'}
                        onClick={() => setActiveView('simulation')}
                        icon={Smartphone}
                        label="Live Simulator"
                    />
                    <SidebarLink
                        active={activeView === 'settings'}
                        onClick={() => setActiveView('settings')}
                        icon={Settings}
                        label="Systems Control"
                    />
                    <SidebarLink
                        active={activeView === 'profile'}
                        onClick={() => setActiveView('profile')}
                        icon={User}
                        label="My Profile"
                    />
                </nav>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-auto p-8">
                {activeView === 'overview' && <AdminOverview merchants={merchants} setView={setActiveView} />}
                {activeView === 'register' && <MerchantRegistration onComplete={() => { fetchMerchants(); setActiveView('directory'); }} />}
                {activeView === 'directory' && <MerchantDirectory merchants={merchants} onSelect={onMerchantSelect} loading={loading} />}
                {activeView === 'upgrades' && <UpgradeRequests />}
                {activeView === 'settings' && <SystemSettings />}
                {activeView === 'alerts' && <Notifications />}
                {activeView === 'profile' && <AdminProfile />}
                {activeView === 'simulation' && <AdminSandbox merchants={merchants} />}
            </main>
        </div>
    );
};

const AdminSandbox = ({ merchants }: { merchants: any[] }) => {
    const [selectedMerchantId, setSelectedMerchantId] = useState<string>('');

    // Find selected merchant to get their system prompt
    const selectedMerchant = merchants.find(m => m.id === selectedMerchantId);

    return (
        <div className="space-y-6 max-w-5xl mx-auto h-[calc(100vh-100px)] flex flex-col">
            <header>
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                    <Smartphone className="w-8 h-8 text-blue-500" />
                    Live Bot Simulator
                </h1>
                <p className="text-muted-foreground mt-1">Test the chatbot behavior of any merchant in a safe sandbox environment.</p>
            </header>

            <div className="bg-card border border-border p-4 rounded-2xl flex items-center gap-4 shadow-sm shrink-0">
                <div className="flex-1">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-2">Select Merchant to Simulate</label>
                    <div className="relative">
                        <select
                            className="w-full bg-secondary/30 border-border rounded-xl px-4 py-3 appearance-none font-bold outline-none ring-offset-background focus:ring-2 focus:ring-ring"
                            value={selectedMerchantId}
                            onChange={(e) => setSelectedMerchantId(e.target.value)}
                        >
                            <option value="">-- Choose a Merchant --</option>
                            {merchants.map((m: any) => (
                                <option key={m.id} value={m.id}>{m.name} ({m.phoneId})</option>
                            ))}
                        </select>
                        <ChevronRight className="w-4 h-4 text-muted-foreground absolute right-4 top-1/2 -translate-y-1/2 rotate-90" />
                    </div>
                </div>
            </div>

            {selectedMerchantId ? (
                <div className="flex-1 overflow-hidden pb-6">
                    <ChatSandbox
                        merchantId={selectedMerchantId}
                        systemPrompt={selectedMerchant?.systemPrompt || "You are a helpful assistant."}
                    />
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground bg-secondary/10 rounded-3xl border border-dashed border-border mx-4 mb-4">
                    <Smartphone className="w-16 h-16 opacity-20 mb-4" />
                    <p className="font-medium">Select a merchant above to start the simulation</p>
                </div>
            )}
        </div>
    );
};

const AdminOverview = ({ merchants, setView }: any) => {
    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Admin Workspace</h1>
                    <p className="text-muted-foreground mt-1">Monitor activity and manage the VB.OTIWAA merchant network.</p>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Total Merchants', value: merchants.length, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                    { label: 'Live Bots', value: merchants.filter((m: any) => m.whatsappPhoneNumberId).length, icon: MessageSquare, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                    { label: 'System Uptime', value: '99.9%', icon: Activity, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                    { label: 'Active Sessions', value: '24', icon: Terminal, color: 'text-purple-500', bg: 'bg-purple-500/10' },
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-card border border-border rounded-2xl p-6 shadow-sm"
                    >
                        <div className="flex items-center gap-4">
                            <div className={`${stat.bg} ${stat.color} p-3 rounded-xl`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                                <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-card border border-border rounded-3xl p-8 space-y-6">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-blue-500" />
                        Quick Actions
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => setView('register')}
                            className="p-6 bg-secondary/30 hover:bg-secondary/50 rounded-2xl text-left transition-all border border-border group"
                        >
                            <Plus className="w-6 h-6 text-blue-500 mb-3 group-hover:scale-110 transition-transform" />
                            <p className="font-bold">Register</p>
                            <p className="text-xs text-muted-foreground">Add a new shop profile</p>
                        </button>
                        <button
                            onClick={() => setView('directory')}
                            className="p-6 bg-secondary/30 hover:bg-secondary/50 rounded-2xl text-left transition-all border border-border group"
                        >
                            <Users className="w-6 h-6 text-emerald-500 mb-3 group-hover:scale-110 transition-transform" />
                            <p className="font-bold">Directory</p>
                            <p className="text-xs text-muted-foreground">View all merchants</p>
                        </button>
                    </div>
                </div>

                <div className="bg-card border border-border rounded-3xl p-8 space-y-6">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 text-amber-500" />
                        System Health
                    </h3>
                    <div className="space-y-4">
                        {[
                            { label: 'Database Service', status: 'Operational', color: 'text-emerald-500' },
                            { label: 'AI Inference Engine', status: 'High Load', color: 'text-amber-500' },
                            { label: 'WhatsApp Webhook', status: 'Operational', color: 'text-emerald-500' },
                        ].map((s, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-secondary/20 rounded-xl">
                                <span className="text-sm font-medium text-muted-foreground">{s.label}</span>
                                <span className={`text-xs font-bold uppercase ${s.color}`}>{s.status}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const MerchantRegistration = ({ onComplete }: any) => {
    const [formData, setFormData] = useState({
        name: '',
        phoneId: '',
        twilioPhoneNumber: '',
        category: 'Restaurant',
        vision: '',
        location: '',
        operatingHours: '',
        paymentMethods: '',
        menuImageUrl: '',
        tier: 'BASIC',
        tierDurationMonths: 1
    });
    const [draftProducts, setDraftProducts] = useState<any[]>([]);
    const [analyzingMenu, setAnalyzingMenu] = useState(false);
    const [isReviewingMenu, setIsReviewingMenu] = useState(false);
    const [registeredId, setRegisteredId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [expanding, setExpanding] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expandedPrompt, setExpandedPrompt] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setError(null);
        const formDataUpload = new FormData();
        formDataUpload.append('file', file);

        try {
            const resp = await axios.post(`${API_BASE}/api/merchants/upload`, formDataUpload, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const imageUrl = resp.data.url;
            setFormData({ ...formData, menuImageUrl: imageUrl });

            // Auto-analyze for AI review
            setAnalyzingMenu(true);
            const analyzeResp = await axios.post(`${API_BASE}/api/merchants/analyze-menu`, { imageUrl });
            setDraftProducts(analyzeResp.data.products);
            toast.success('Menu analyzed! Review available after registration.');
        } catch (err: any) {
            setError('Failed to process menu image.');
        } finally {
            setUploading(false);
            setAnalyzingMenu(false);
        }
    };

    const handleMagicExpand = async () => {
        if (!formData.name || !formData.vision) {
            setError('Please provide a Business Name and Vision first.');
            return;
        }
        setExpanding(true);
        setError(null);
        try {
            const resp = await axios.post(`${API_BASE}/api/merchants/expand-vision`, {
                name: formData.name,
                category: formData.category,
                vision: formData.vision
            });
            setExpandedPrompt(resp.data.systemPrompt);
        } catch (err: any) {
            setError('Failed to expand vision. AI module unreachable.');
        } finally {
            setExpanding(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const resp = await axios.post(`${API_BASE}/api/merchants/register`, {
                name: formData.name,
                whatsappPhoneNumberId: formData.phoneId,
                twilioPhoneNumber: formData.twilioPhoneNumber,
                category: formData.category,
                clientVision: formData.vision,
                location: formData.location || undefined,
                operatingHours: formData.operatingHours || undefined,
                paymentMethods: formData.paymentMethods || undefined,
                menuImageUrl: formData.menuImageUrl || undefined,
                systemPrompt: expandedPrompt || undefined,
                tier: formData.tier,
                tierDurationMonths: formData.tierDurationMonths
            });

            const newId = resp.data.merchantId;
            setRegisteredId(newId);
            setSuccess(true);

            // We do NOT call onComplete() here anymore, we wait for user action

            if (draftProducts.length > 0) {
                // If reviewing menu, we will show the review modal
                // deeper integration might be needed but let's keep it simple for now:
                // The review modal will appear. On success/close of THAT, we might usually call onComplete.
                // We should probably update ReviewWorkspaceModal to NOT call onComplete but let us return to "Success" view.
                // But for simplicity, let's just trigger review if needed. 
                setIsReviewingMenu(true);
            } else {
                // Clear form data so if they click "Register Another" it's clean
                setFormData({ name: '', phoneId: '', twilioPhoneNumber: '', category: 'Restaurant', vision: '', location: '', operatingHours: '', paymentMethods: '', menuImageUrl: '', tier: 'BASIC', tierDurationMonths: 1 });
                setExpandedPrompt(null);
            }

            // Remove auto-hide
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to register merchant. Check if DB is connected.');
            setLoading(false); // Ensure loading is turned off on error
        } finally {
            if (!success) setLoading(false); // Only turn off loading if not success (to prevent flickering before view switch? actually we can just turn it off)
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="max-w-2xl mx-auto"
        >
            <div className="bg-card border border-border rounded-2xl p-8 shadow-xl space-y-8 relative overflow-hidden">
                {success ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-10 space-y-8"
                    >
                        <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 className="w-10 h-10" />
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-3xl font-black text-foreground">Registration Complete!</h2>
                            <p className="text-muted-foreground">The merchant workspace is ready.</p>
                        </div>

                        <div className="max-w-md mx-auto bg-secondary/30 border border-border rounded-2xl p-6 space-y-4 text-left">
                            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Merchant Login Link</label>
                            <div className="flex gap-2">
                                <code className="flex-1 bg-black/20 border border-border rounded-xl px-4 py-3 font-mono text-sm text-blue-400 overflow-hidden text-ellipsis whitespace-nowrap">
                                    {window.location.protocol}//{window.location.host}/{registeredId}
                                </code>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(`${window.location.protocol}//${window.location.host}/${registeredId}`);
                                        toast.success('Link copied to clipboard');
                                    }}
                                    className="p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors shadow-lg shadow-blue-500/20"
                                    title="Copy Link"
                                >
                                    <Copy className="w-5 h-5" />
                                </button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Share this link with the merchant. It will auto-fill their username.
                            </p>
                        </div>

                        <div className="flex gap-4 justify-center pt-4">
                            <button
                                onClick={() => {
                                    setSuccess(false);
                                    setRegisteredId(null);
                                    setFormData({ name: '', phoneId: '', twilioPhoneNumber: '', category: 'Restaurant', vision: '', location: '', operatingHours: '', paymentMethods: '', menuImageUrl: '', tier: 'BASIC', tierDurationMonths: 1 });
                                    setExpandedPrompt(null);
                                }}
                                className="px-6 py-3 font-bold text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Register Another
                            </button>
                            <button
                                onClick={() => onComplete()}
                                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2"
                            >
                                <LayoutDashboard className="w-5 h-5" />
                                Go to Directory
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    <>
                        <div className="space-y-2 pt-4">
                            <h2 className="text-2xl font-bold text-foreground">Register New Merchant</h2>
                            <p className="text-muted-foreground">Create a fresh profile for a business wanting a WhatsApp Chatbot.</p>
                        </div>

                        {error && (
                            <div className="p-4 bg-destructive/10 text-destructive rounded-xl text-sm font-medium border border-destructive/20">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Business Name</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Mama Mia's Pizza"
                                        className="w-full bg-secondary/30 border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none transition-all"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        disabled={loading}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Business Category</label>
                                    <select
                                        className="w-full bg-secondary/30 border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none transition-all appearance-none cursor-pointer font-bold"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        disabled={loading}
                                    >
                                        <option value="Restaurant">🍴 Restaurant / Cafe</option>
                                        <option value="Boutique">👗 Boutique / Fashion</option>
                                        <option value="Professional Service">💼 Professional Service</option>
                                        <option value="Logistics">🚚 Logistics / Delivery</option>
                                        <option value="General">🏢 General Business</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Subscription Tier</label>
                                    <select
                                        className="w-full bg-secondary/30 border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none transition-all appearance-none cursor-pointer font-bold"
                                        value={formData.tier}
                                        onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
                                        disabled={loading}
                                    >
                                        <option value="BASIC">💼 Basic (150 GHS/mo - 100 orders)</option>
                                        <option value="PRO">🚀 Pro (450 GHS/mo - Unlimited)</option>
                                        <option value="ENTERPRISE">💎 Enterprise (Custom Pricing)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Duration (Months)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        placeholder="e.g. 12"
                                        className="w-full bg-secondary/30 border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none transition-all text-sm"
                                        value={formData.tierDurationMonths}
                                        onChange={(e) => setFormData({ ...formData, tierDurationMonths: parseInt(e.target.value) || 1 })}
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">WhatsApp Phone ID</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 991984..."
                                        className="w-full bg-secondary/30 border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none transition-all font-mono text-sm"
                                        value={formData.phoneId}
                                        onChange={(e) => setFormData({ ...formData, phoneId: e.target.value })}
                                        disabled={loading}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Twilio Sandbox Num</label>
                                    <input
                                        type="text"
                                        placeholder="+14155238886"
                                        className="w-full bg-secondary/30 border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none transition-all font-mono text-sm"
                                        value={formData.twilioPhoneNumber}
                                        onChange={(e) => setFormData({ ...formData, twilioPhoneNumber: e.target.value })}
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Location</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Accra, Ghana"
                                        className="w-full bg-secondary/30 border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none transition-all text-sm"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        disabled={loading}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Operating Hours</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Mon-Sat 9am-9pm"
                                        className="w-full bg-secondary/30 border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none transition-all text-sm"
                                        value={formData.operatingHours}
                                        onChange={(e) => setFormData({ ...formData, operatingHours: e.target.value })}
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Payment Methods</label>
                                <input
                                    type="text"
                                    placeholder="e.g. MTN MoMo, Cash on Delivery"
                                    className="w-full bg-secondary/30 border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none transition-all text-sm"
                                    value={formData.paymentMethods}
                                    onChange={(e) => setFormData({ ...formData, paymentMethods: e.target.value })}
                                    disabled={loading}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Menu Image (Upload from Device)</label>
                                <div className="relative group">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileUpload}
                                        className="hidden"
                                        id="menu-upload"
                                        disabled={uploading || loading}
                                    />
                                    <label
                                        htmlFor="menu-upload"
                                        className={`flex items-center justify-center gap-3 w-full h-32 border-2 border-dashed rounded-2xl cursor-pointer transition-all
                                        ${formData.menuImageUrl
                                                ? 'border-emerald-500/30 bg-emerald-500/5'
                                                : 'border-border bg-secondary/20 hover:border-primary/50'}`}
                                    >
                                        {uploading ? (
                                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                        ) : formData.menuImageUrl ? (
                                            <div className="flex flex-col items-center gap-1">
                                                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                                                <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Image Uploaded</span>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-1">
                                                <Upload className="w-8 h-8 text-muted-foreground opacity-50 group-hover:scale-110 transition-transform" />
                                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Pick Menu Image</span>
                                            </div>
                                        )}
                                    </label>
                                    {formData.menuImageUrl && (
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, menuImageUrl: '' })}
                                            className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Business Vision & Personality</label>
                                    <button
                                        type="button"
                                        onClick={handleMagicExpand}
                                        disabled={expanding || loading}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded-lg transition-colors text-xs font-bold"
                                    >
                                        {expanding ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                        Magic Expand
                                    </button>
                                </div>
                                <textarea
                                    required
                                    rows={4}
                                    placeholder="Describe how the bot should behave and what the business offers..."
                                    className="w-full bg-secondary/30 border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none transition-all resize-none"
                                    value={formData.vision}
                                    onChange={(e) => setFormData({ ...formData, vision: e.target.value })}
                                    disabled={loading}
                                />
                            </div>

                            {expandedPrompt && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="space-y-2"
                                >
                                    <label className="text-sm font-semibold uppercase tracking-wider text-emerald-500 flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4" />
                                        Generated System Personality
                                    </label>
                                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs font-mono text-emerald-800 dark:text-emerald-400 max-h-40 overflow-auto">
                                        {expandedPrompt}
                                    </div>
                                </motion.div>
                            )}

                            <button
                                type="submit"
                                disabled={loading || expanding || analyzingMenu}
                                className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Register Merchant'}
                                {!loading && <ArrowRight className="w-5 h-5" />}
                            </button>
                        </form>
                    </>
                )}


                <AnimatePresence>
                    {isReviewingMenu && (
                        <ReviewWorkspaceModal
                            merchantId={registeredId}
                            drafts={draftProducts}
                            onClose={() => {
                                setIsReviewingMenu(false);
                                onComplete();
                                setFormData({ name: '', phoneId: '', twilioPhoneNumber: '', category: 'Restaurant', vision: '', location: '', operatingHours: '', paymentMethods: '', menuImageUrl: '', tier: 'BASIC', tierDurationMonths: 1 });
                                setExpandedPrompt(null);
                            }}
                            onSuccess={() => {
                                setIsReviewingMenu(false);
                                onComplete();
                                setFormData({ name: '', phoneId: '', twilioPhoneNumber: '', category: 'Restaurant', vision: '', location: '', operatingHours: '', paymentMethods: '', menuImageUrl: '', tier: 'BASIC', tierDurationMonths: 1 });
                                setExpandedPrompt(null);
                            }}
                        />
                    )}
                </AnimatePresence>
                {analyzingMenu && (
                    <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-20 flex flex-col items-center justify-center space-y-4">
                        <Loader2 className="w-12 h-12 animate-spin text-primary" />
                        <p className="font-bold text-lg animate-pulse">AI is reading the menu...</p>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

const MerchantDirectory = ({ merchants, onSelect, loading }: any) => {
    const [search, setSearch] = useState('');

    const filtered = merchants.filter((m: any) =>
        m.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Merchant Directory</h2>
                    <p className="text-muted-foreground">Manage and monitor all business profiles.</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search merchants..."
                        className="pl-10 pr-4 py-2 bg-card border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all w-full md:w-64"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <AnimatePresence>
                    {filtered.map((m: any, i: number) => (
                        <MerchantCard
                            key={m.id}
                            merchant={m}
                            index={i}
                            onSelect={onSelect}
                            onRefresh={() => window.location.reload()} // Crude but effective for now
                        />
                    ))}
                </AnimatePresence>
            </div>

            {filtered.length === 0 && !loading && (
                <div className="text-center py-20 bg-secondary/10 rounded-3xl border border-dashed border-border">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto opacity-20 mb-4" />
                    <p className="text-muted-foreground">No merchants found matching your search.</p>
                </div>
            )}
        </div>
    );
};

const SystemSettings = () => {
    const [apiKeys, setApiKeys] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [newKey, setNewKey] = useState({ provider: 'openai', key: '' });
    const [adding, setAdding] = useState(false);

    const fetchApiKeys = async () => {
        setLoading(true);
        try {
            const resp = await axios.get(`${API_BASE}/api/system/api-keys`);
            setApiKeys(resp.data);
        } catch (err) {
            toast.error('Failed to fetch API keys');
        } finally {
            setLoading(false);
        }
    };

    const handleAddKey = async () => {
        if (!newKey.key.trim()) {
            toast.error('Please enter an API key');
            return;
        }

        setAdding(true);
        try {
            await axios.post(`${API_BASE}/api/system/api-keys`, newKey);
            toast.success('API key added successfully');
            setNewKey({ provider: 'openai', key: '' });
            fetchApiKeys();
        } catch (err) {
            toast.error('Failed to add API key');
        } finally {
            setAdding(false);
        }
    };

    const handleDeleteKey = async (id: string) => {
        try {
            await axios.delete(`${API_BASE}/api/system/api-keys/${id}`);
            toast.success('API key deleted');
            fetchApiKeys();
        } catch (err) {
            toast.error('Failed to delete API key');
        }
    };

    React.useEffect(() => {
        fetchApiKeys();
    }, []);

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            <header>
                <h1 className="text-3xl font-bold text-foreground">System Control</h1>
                <p className="text-muted-foreground mt-1">Manage API keys, system configuration, and monitoring.</p>
            </header>

            {/* API Key Management */}
            <div className="bg-card border border-border rounded-3xl p-8 space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <Key className="w-5 h-5 text-blue-500" />
                        API Key Management
                    </h3>
                    <button
                        onClick={fetchApiKeys}
                        className="p-2 hover:bg-secondary rounded-xl transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>

                {/* Add New Key */}
                <div className="bg-secondary/30 border border-border rounded-2xl p-6 space-y-4">
                    <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Add New API Key</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <select
                            value={newKey.provider}
                            onChange={(e) => setNewKey({ ...newKey, provider: e.target.value })}
                            className="px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                        >
                            <option value="openai">OpenAI</option>
                            <option value="anthropic">Anthropic</option>
                            <option value="azure">Azure OpenAI</option>
                            <option value="github">GitHub Models</option>
                        </select>
                        <input
                            type="password"
                            value={newKey.key}
                            onChange={(e) => setNewKey({ ...newKey, key: e.target.value })}
                            placeholder="sk-..."
                            className="px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                        />
                        <button
                            onClick={handleAddKey}
                            disabled={adding}
                            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            Add Key
                        </button>
                    </div>
                </div>

                {/* Existing Keys */}
                <div className="space-y-3">
                    {loading ? (
                        <div className="text-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500" />
                        </div>
                    ) : apiKeys.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Key className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>No API keys configured</p>
                        </div>
                    ) : (
                        apiKeys.map((key, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between p-4 bg-secondary/20 border border-border rounded-xl hover:bg-secondary/30 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
                                        <Key className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm capitalize">{key.provider}</p>
                                        <p className="text-xs text-muted-foreground font-mono">
                                            {key.key.substring(0, 8)}...{key.key.substring(key.key.length - 4)}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDeleteKey(key.id)}
                                    className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors"
                                    title="Delete Key"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* System Health */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-card border border-border rounded-3xl p-8 space-y-6">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <Activity className="w-5 h-5 text-emerald-500" />
                        System Health
                    </h3>
                    <div className="space-y-4">
                        {[
                            { label: 'Database', status: 'Operational', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                            { label: 'AI Services', status: 'Operational', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                            { label: 'WhatsApp API', status: 'Operational', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                            { label: 'Redis Cache', status: 'Operational', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                        ].map((service, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-secondary/20 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${service.bg} ${service.color}`} />
                                    <span className="font-medium">{service.label}</span>
                                </div>
                                <span className={`text-xs font-bold uppercase ${service.color}`}>{service.status}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-card border border-border rounded-3xl p-8 space-y-6">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <Terminal className="w-5 h-5 text-purple-500" />
                        System Information
                    </h3>
                    <div className="space-y-4">
                        {[
                            { label: 'Platform Version', value: 'v2.1.0' },
                            { label: 'Node.js', value: 'v20.x' },
                            { label: 'Database', value: 'PostgreSQL 15' },
                            { label: 'Uptime', value: '99.9%' },
                        ].map((info, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-secondary/20 rounded-xl">
                                <span className="text-sm font-medium text-muted-foreground">{info.label}</span>
                                <span className="text-sm font-bold">{info.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
const ReviewWorkspaceModal = ({ merchantId, drafts, onClose, onSuccess }: any) => {
    const [items, setItems] = React.useState(drafts);
    const [loading, setLoading] = React.useState(false);

    const handleUpdateItem = (index: number, field: string, value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const handleRemoveItem = (index: number) => {
        setItems(items.filter((_: any, i: number) => i !== index));
    };

    const handleSaveAll = async () => {
        setLoading(true);
        try {
            await axios.post(`${API_BASE}/api/merchants/${merchantId}/bulk-products`, {
                products: items
            });
            onSuccess();
        } catch (err) {
            console.error('Failed to import items');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-10 bg-background/90 backdrop-blur-lg"
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-card border border-border w-full max-w-5xl h-[80vh] rounded-[2rem] p-10 shadow-2xl flex flex-col space-y-8 overflow-hidden"
            >
                <div className="flex justify-between items-center border-b border-border pb-6">
                    <div>
                        <h2 className="text-3xl font-black flex items-center gap-3">
                            <Sparkles className="w-8 h-8 text-blue-500" />
                            AI Review Hub
                        </h2>
                        <p className="text-muted-foreground mt-1">Review and refine the menu items extracted by AI.</p>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-secondary rounded-2xl transition-all">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 pr-4 custom-scrollbar">
                    {items.map((item: any, idx: number) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="grid grid-cols-12 gap-6 p-6 bg-secondary/20 border border-border rounded-2xl items-center group transition-all hover:bg-secondary/40"
                        >
                            <div className="col-span-4 space-y-1">
                                <label className="text-[10px] font-black uppercase text-secondary-foreground/40">Product Name</label>
                                <input
                                    value={item.name}
                                    onChange={e => handleUpdateItem(idx, 'name', e.target.value)}
                                    className="w-full bg-background border border-border rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div className="col-span-2 space-y-1">
                                <label className="text-[10px] font-black uppercase text-secondary-foreground/40">Price (GHS)</label>
                                <input
                                    type="number"
                                    value={item.price}
                                    onChange={e => handleUpdateItem(idx, 'price', e.target.value)}
                                    className="w-full bg-background border border-border rounded-xl px-4 py-2 text-sm font-black focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div className="col-span-5 space-y-1">
                                <label className="text-[10px] font-black uppercase text-secondary-foreground/40">Description</label>
                                <input
                                    value={item.description}
                                    onChange={e => handleUpdateItem(idx, 'description', e.target.value)}
                                    className="w-full bg-background border border-border rounded-xl px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div className="col-span-1 flex justify-end">
                                <button
                                    onClick={() => handleRemoveItem(idx)}
                                    className="p-2 hover:bg-red-500/10 text-muted-foreground hover:text-red-500 rounded-xl transition-all"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="border-t border-border pt-6 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 font-bold text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSaveAll}
                        disabled={loading}
                        className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                        Approve & Import
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

const MerchantCard = ({ merchant, index, onSelect, onRefresh }: any) => {
    const [actionLoading, setActionLoading] = useState(false);

    const handleToggleStatus = async () => {
        setActionLoading(true);
        try {
            await axios.patch(`${API_BASE}/api/merchants/${merchant.id}/toggle-status`, {
                isPaused: !merchant.isClosed
            });
            toast.success(`Merchant ${merchant.isClosed ? 'Resumed' : 'Suspended'}`);
            onRefresh();
        } catch (err) {
            toast.error('Failed to update status');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this merchant? This action cannot be undone.')) return;
        setActionLoading(true);
        try {
            await axios.delete(`${API_BASE}/api/merchants/${merchant.id}/delete`);
            toast.success('Merchant deleted');
            onRefresh();
        } catch (err) {
            toast.error('Failed to delete merchant');
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ delay: index * 0.05 }}
            className={`bg-card border ${merchant.isClosed ? 'border-red-500/30' : 'border-border'} rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group relative overflow-hidden`}
        >
            {merchant.isClosed && (
                <div className="absolute inset-0 bg-background/60 backdrop-blur-sm z-10 flex items-center justify-center pointer-events-none">
                    <div className="bg-red-500/10 text-red-500 px-4 py-2 rounded-xl font-bold flex items-center gap-2 border border-red-500/20">
                        <PauseCircle className="w-4 h-4" /> Suspended
                    </div>
                </div>
            )}

            <div className="flex items-start justify-between relative z-20">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <h3 className="font-bold text-lg text-foreground">{merchant.name}</h3>
                        <div className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-tighter border shadow-sm ${merchant.tier === 'BASIC' ? 'bg-secondary text-muted-foreground border-border' :
                            merchant.tier === 'PRO' ? 'bg-primary/10 text-primary border-primary/20' :
                                'bg-amber-400/10 text-amber-600 border-amber-400/20'
                            }`}>
                            {merchant.tier}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold px-2 py-1 bg-secondary/50 rounded-lg text-muted-foreground w-fit">
                        <Smartphone className="w-3 h-3 text-blue-500" />
                        {merchant.whatsappPhoneNumberId || 'No ID'}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase pt-1">
                        <Clock className="w-3 h-3" />
                        Expires: {merchant.tierExpiresAt ? new Date(merchant.tierExpiresAt).toLocaleDateString() : 'Never'}
                        {merchant.tierExpiresAt && new Date(merchant.tierExpiresAt) < new Date() && (
                            <span className="text-red-500 bg-red-500/10 px-1.5 rounded animate-pulse">Expired</span>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{merchant.clientVision}</p>
                </div>
                <div className={`p-2 rounded-lg ${merchant.isClosed ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                    {merchant.isClosed ? <PauseCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                </div>
            </div>

            <div className="mt-6 flex items-center gap-2 relative z-20">
                <button
                    onClick={() => onSelect(merchant.id)}
                    className="flex-1 py-2.5 bg-secondary hover:bg-primary hover:text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
                >
                    <LayoutDashboard className="w-4 h-4" />
                    Open
                </button>

                <button
                    onClick={handleToggleStatus}
                    disabled={actionLoading}
                    className={`p-2.5 rounded-xl transition-colors ${merchant.isClosed ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20' : 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20'}`}
                    title={merchant.isClosed ? "Resume Business" : "Suspend Business"}
                >
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (merchant.isClosed ? <PlayCircle className="w-4 h-4" /> : <PauseCircle className="w-4 h-4" />)}
                </button>

                <button
                    onClick={handleDelete}
                    disabled={actionLoading}
                    className="p-2.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-xl transition-colors"
                    title="Delete Merchant"
                >
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
            </div>
        </motion.div>
    );
}

const UpgradeRequests = () => {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [approvingRequestId, setApprovingRequestId] = useState<string | null>(null);
    const [selectedTier, setSelectedTier] = useState<string>('BASIC');
    const [selectedDuration, setSelectedDuration] = useState<number>(1);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const resp = await axios.get(`${API_BASE}/api/merchants/upgrade-requests`);
            setRequests(resp.data);
        } catch (err) {
            toast.error('Failed to fetch upgrade requests');
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchRequests();
    }, []);

    const handleApprove = async () => {
        if (!approvingRequestId) return;
        try {
            await axios.patch(`${API_BASE}/api/merchants/upgrade-requests/${approvingRequestId}/approve`, {
                tier: selectedTier,
                durationMonths: selectedDuration
            });
            toast.success('Upgrade approved!');
            setApprovingRequestId(null);
            fetchRequests();
        } catch (err) {
            toast.error('Failed to approve upgrade');
        }
    };

    const handleReject = async (requestId: string) => {
        try {
            await axios.patch(`${API_BASE}/api/merchants/upgrade-requests/${requestId}/reject`);
            toast.success('Upgrade rejected');
            fetchRequests();
        } catch (err) {
            toast.error('Failed to reject upgrade');
        }
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-20">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-foreground flex items-center gap-3">
                        <Sparkles className="w-8 h-8 text-blue-500" />
                        Upgrade Requests
                    </h1>
                    <p className="text-muted-foreground mt-1">Review and manage merchant requests for higher subscription tiers.</p>
                </div>
                <button
                    onClick={fetchRequests}
                    className="p-3 bg-secondary/50 hover:bg-secondary text-foreground rounded-xl transition-all"
                >
                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </header>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-10 h-10 animate-spin text-primary opacity-20" />
                </div>
            ) : requests.length === 0 ? (
                <div className="bg-card border border-border rounded-3xl p-12 text-center space-y-4">
                    <div className="w-20 h-20 bg-secondary/50 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-10 h-10 text-muted-foreground opacity-20" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground">Clean Slate!</h3>
                    <p className="text-muted-foreground">No pending upgrade requests at the moment.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {requests.map((req, idx) => (
                        <motion.div
                            key={req.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-card border border-border rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 hover:border-blue-500/30 transition-all shadow-sm"
                        >
                            <div className="flex items-center gap-6">
                                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500 font-black">
                                    {req.merchant.name[0]}
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg">{req.merchant.name}</h4>
                                    <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-wider mt-1">
                                        <span className="text-muted-foreground line-through opacity-50">{req.currentTier}</span>
                                        <ChevronRight className="w-4 h-4 text-primary" />
                                        <span className="text-primary px-2 py-0.5 bg-primary/10 rounded-lg border border-primary/20 flex items-center gap-1">
                                            <ArrowUpCircle className="w-3 h-3" />
                                            {req.requestedTier}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground/60 mt-2">
                                        Requested on {new Date(req.createdAt).toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => handleReject(req.id)}
                                    className="px-6 py-2 rounded-xl text-sm font-bold text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-all border border-transparent hover:border-red-500/20"
                                >
                                    Reject
                                </button>
                                <button
                                    onClick={() => {
                                        setApprovingRequestId(req.id);
                                        setSelectedTier(req.requestedTier);
                                        setSelectedDuration(1);
                                    }}
                                    className="px-8 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-all"
                                >
                                    Approve...
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            <AnimatePresence>
                {approvingRequestId && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-card border border-border w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl space-y-8"
                        >
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-black text-foreground">Finalize Upgrade</h2>
                                <button onClick={() => setApprovingRequestId(null)} className="p-2 hover:bg-secondary rounded-full transition-all">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Select Final Tier</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {['BASIC', 'PRO', 'ENTERPRISE'].map((t) => (
                                            <button
                                                key={t}
                                                onClick={() => setSelectedTier(t)}
                                                className={`py-3 rounded-2xl text-[10px] font-black uppercase transition-all border ${selectedTier === t ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-secondary/30 border-border hover:border-primary/30 text-muted-foreground'}`}
                                            >
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Duration (Months)</label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {[1, 3, 6, 12].map((m) => (
                                            <button
                                                key={m}
                                                onClick={() => setSelectedDuration(m)}
                                                className={`py-3 rounded-xl text-xs font-bold transition-all border ${selectedDuration === m ? 'bg-primary text-white border-primary' : 'bg-secondary/30 border-border hover:border-primary/30 text-muted-foreground'}`}
                                            >
                                                {m}m
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex flex-col gap-3">
                                <button
                                    onClick={handleApprove}
                                    className="w-full py-4 bg-primary hover:bg-primary/90 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <Sparkles className="w-4 h-4" />
                                    Confirm Approval
                                </button>
                                <button
                                    onClick={() => setApprovingRequestId(null)}
                                    className="w-full py-4 text-muted-foreground hover:text-foreground font-bold text-sm transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const Notifications = () => {
    const [notifications, setNotifications] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(false);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const resp = await axios.get(`${API_BASE}/api/admin/notifications`);
            setNotifications(resp.data);
        } catch (err) {
            toast.error('Failed to fetch notifications');
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchNotifications();
    }, []);

    const handleMarkAsRead = async (id: string) => {
        try {
            await axios.patch(`${API_BASE}/api/admin/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        } catch (err) {
            toast.error('Failed to update notification');
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await axios.delete(`${API_BASE}/api/admin/notifications/${id}`);
            setNotifications(prev => prev.filter(n => n.id !== id));
            toast.success('Notification cleared');
        } catch (err) {
            toast.error('Failed to delete notification');
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await axios.patch(`${API_BASE}/api/admin/notifications/read-all`);
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            toast.success('All marked as read');
        } catch (err) {
            toast.error('Action failed');
        }
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-20">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-foreground flex items-center gap-3">
                        <Bell className="w-8 h-8 text-blue-500" />
                        System Alerts
                    </h1>
                    <p className="text-muted-foreground mt-1">Permanent record of system events and merchant alerts.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleMarkAllRead}
                        className="px-4 py-2 bg-secondary/50 hover:bg-secondary text-foreground text-sm font-bold rounded-xl transition-all"
                    >
                        Mark All Read
                    </button>
                    <button
                        onClick={fetchNotifications}
                        className="p-3 bg-secondary/50 hover:bg-secondary text-foreground rounded-xl transition-all"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </header>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-10 h-10 animate-spin text-primary opacity-20" />
                </div>
            ) : notifications.length === 0 ? (
                <div className="bg-card border border-border rounded-3xl p-12 text-center space-y-4">
                    <div className="w-20 h-20 bg-secondary/50 rounded-full flex items-center justify-center mx-auto">
                        <Mail className="w-10 h-10 text-muted-foreground opacity-20" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground">No Alerts Yet</h3>
                    <p className="text-muted-foreground">Critical platform notifications will appear here.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {notifications.map((n, idx) => (
                        <motion.div
                            key={n.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className={`p-6 rounded-2xl border transition-all flex items-start gap-4 ${n.isRead ? 'bg-card/50 border-border opacity-70' : 'bg-card border-blue-500/30'}`}
                        >
                            <div className={`p-3 rounded-xl ${n.priority === 'CRITICAL' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                <ShieldAlert className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <h4 className={`font-bold text-lg ${!n.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>{n.title}</h4>
                                    <span className="text-xs text-muted-foreground">{new Date(n.createdAt).toLocaleString()}</span>
                                </div>
                                <p className="text-muted-foreground mt-1">{n.message}</p>
                                <div className="flex items-center gap-4 mt-4">
                                    {!n.isRead && (
                                        <button
                                            onClick={() => handleMarkAsRead(n.id)}
                                            className="text-xs font-bold text-blue-500 hover:text-blue-600"
                                        >
                                            Mark as Read
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDelete(n.id)}
                                        className="text-xs font-bold text-muted-foreground hover:text-red-500"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

const AdminProfile = () => {
    const [phone, setPhone] = React.useState('');
    const [loading, setLoading] = React.useState(false);

    React.useEffect(() => {
        const fetchProfile = async () => {
            try {
                const resp = await axios.get(`${API_BASE}/api/admin/profile`);
                setPhone(resp.data.phone || '');
            } catch (err) {
                console.error('Failed to fetch admin profile');
            }
        };
        fetchProfile();
    }, []);

    const handleUpdate = async (e: any) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.patch(`${API_BASE}/api/admin/profile`, { phone });
            toast.success('Admin profile updated successfully!');
        } catch (err) {
            toast.error('Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 max-w-2xl mx-auto pb-20">
            <header>
                <h1 className="text-3xl font-black text-foreground flex items-center gap-3">
                    <User className="w-8 h-8 text-blue-500" />
                    Admin Profile
                </h1>
                <p className="text-muted-foreground mt-1">Manage your administrative contact details.</p>
            </header>

            <div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
                <form onSubmit={handleUpdate} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-muted-foreground">Notification Phone Number (WhatsApp)</label>
                        <div className="relative">
                            <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <input
                                type="text"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="+233..."
                                className="w-full pl-12 pr-4 py-4 bg-secondary/30 border border-border rounded-2xl focus:border-blue-500 outline-none transition-all font-medium"
                            />
                        </div>
                        <p className="text-[10px] text-muted-foreground">Critical alerts will be sent here when you are offline.</p>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Profile Changes'}
                    </button>
                </form>
            </div>
        </div>
    );
};
