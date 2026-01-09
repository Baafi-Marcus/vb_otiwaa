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
    ClipboardList,
    MessageSquare,
    CheckCircle2,
    X,
    Upload,
    // ImageIcon,
    Loader2,
    Smartphone,
    RefreshCw
} from 'lucide-react';
import { toast } from 'react-hot-toast';

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
    const [activeView, setActiveView] = useState<'overview' | 'register' | 'directory' | 'settings'>('overview');
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

                <nav className="flex-1 p-6 space-y-2">
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
                        active={activeView === 'settings'}
                        onClick={() => setActiveView('settings')}
                        icon={Settings}
                        label="Systems Control"
                    />
                </nav>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-auto p-8">
                {activeView === 'overview' && <AdminOverview merchants={merchants} setView={setActiveView} />}
                {activeView === 'register' && <MerchantRegistration onComplete={() => { fetchMerchants(); setActiveView('directory'); }} />}
                {activeView === 'directory' && <MerchantDirectory merchants={merchants} onSelect={onMerchantSelect} loading={loading} />}
                {activeView === 'settings' && <SystemSettings />}
            </main>
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
        menuImageUrl: ''
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
                systemPrompt: expandedPrompt || undefined
            });

            const newId = resp.data.merchantId;
            setRegisteredId(newId);
            setSuccess(true);

            if (draftProducts.length > 0) {
                setIsReviewingMenu(true);
            } else {
                setFormData({ name: '', phoneId: '', twilioPhoneNumber: '', category: 'Restaurant', vision: '', location: '', operatingHours: '', paymentMethods: '', menuImageUrl: '' });
                setExpandedPrompt(null);
                onComplete();
            }

            setTimeout(() => setSuccess(false), 5000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to register merchant. Check if DB is connected.');
        } finally {
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
                <AnimatePresence>
                    {success && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-x-0 top-0 bg-emerald-500 text-white p-4 flex items-center justify-center gap-2 font-bold z-10"
                        >
                            <CheckCircle2 className="w-5 h-5" />
                            Merchant Registered Successfully!
                        </motion.div>
                    )}
                </AnimatePresence>

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

                <AnimatePresence>
                    {isReviewingMenu && (
                        <ReviewWorkspaceModal
                            merchantId={registeredId}
                            drafts={draftProducts}
                            onClose={() => {
                                setIsReviewingMenu(false);
                                onComplete();
                                setFormData({ name: '', phoneId: '', twilioPhoneNumber: '', category: 'Restaurant', vision: '', location: '', operatingHours: '', paymentMethods: '', menuImageUrl: '' });
                                setExpandedPrompt(null);
                            }}
                            onSuccess={() => {
                                setIsReviewingMenu(false);
                                onComplete();
                                setFormData({ name: '', phoneId: '', twilioPhoneNumber: '', category: 'Restaurant', vision: '', location: '', operatingHours: '', paymentMethods: '', menuImageUrl: '' });
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
                        <motion.div
                            key={m.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ delay: i * 0.05 }}
                            className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden"
                        >
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <h3 className="font-bold text-lg text-foreground">{m.name}</h3>
                                    <div className="flex items-center gap-2 text-xs font-semibold px-2 py-1 bg-secondary/50 rounded-lg text-muted-foreground w-fit">
                                        <Smartphone className="w-3 h-3 text-blue-500" />
                                        {m.whatsappPhoneNumberId || 'No ID'}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{m.clientVision}</p>
                                </div>
                                <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
                                    <CheckCircle2 className="w-4 h-4" />
                                </div>
                            </div>

                            <button
                                onClick={() => onSelect(m.id)}
                                className="mt-6 w-full py-2.5 bg-secondary hover:bg-primary hover:text-white rounded-xl text-sm font-bold transition-all transition-colors flex items-center justify-center gap-2"
                            >
                                <LayoutDashboard className="w-4 h-4" />
                                Open Workspace
                            </button>
                        </motion.div>
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
    const [logs, setLogs] = useState<any[]>([]);
    const [configs, setConfigs] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [cResp, lResp] = await Promise.all([
                axios.get(`${API_BASE}/api/system/configs`),
                axios.get(`${API_BASE}/api/system/logs`)
            ]);
            setConfigs(cResp.data);
            setLogs(lResp.data);
        } catch (err) {
            console.error('Failed to fetch settings');
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchData();
    }, []);

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            <header>
                <h2 className="text-3xl font-bold">System Status & Logs</h2>
                <p className="text-muted-foreground">Monitor technical health and global configurations.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
                        <h3 className="font-bold flex items-center gap-2 border-b border-border pb-4">
                            <Settings className="w-4 h-4 text-blue-500" />
                            Global Config
                        </h3>
                        <div className="space-y-4">
                            {configs && Object.entries(configs).map(([key, val]: any) => (
                                <div key={key} className="space-y-1">
                                    <label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">{key}</label>
                                    <div className="flex items-center gap-2">
                                        <Key className="w-3 h-3 text-amber-500" />
                                        <code className="text-xs bg-secondary px-2 py-1 rounded-lg block overflow-hidden text-ellipsis whitespace-nowrap">{val || 'NOT_SET'}</code>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2">
                    <div className="bg-card border border-border rounded-2xl overflow-hidden">
                        <div className="p-6 border-b border-border flex items-center justify-between">
                            <h3 className="font-bold flex items-center gap-2">
                                <ClipboardList className="w-4 h-4 text-emerald-500" />
                                Application Logs
                            </h3>
                            <button
                                onClick={fetchData}
                                className="p-2 hover:bg-secondary rounded-lg transition-colors"
                            >
                                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                        <div className="h-[500px] overflow-auto bg-black/5 dark:bg-black/40 p-4 font-mono text-[10px] space-y-1">
                            {logs.map((log: any, i: number) => (
                                <div key={i} className="flex gap-4 border-b border-border/5 py-1">
                                    <span className="text-muted-foreground opacity-50 shrink-0">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                    <span className={`font-bold shrink-0 ${log.level === 'error' ? 'text-red-500' : 'text-blue-500'}`}>{log.level.toUpperCase()}</span>
                                    <span className="text-foreground shrink-0 opacity-70">[{log.context}]</span>
                                    <span className="text-foreground">{log.message}</span>
                                </div>
                            ))}
                            {logs.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center opacity-30 italic">
                                    No logs recorded yet.
                                </div>
                            )}
                        </div>
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
                            <div className="col-span-1 flex justify-center">
                                <button
                                    onClick={() => handleRemoveItem(idx)}
                                    className="p-2 text-muted-foreground hover:text-red-500 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="flex gap-4 pt-6 border-t border-border">
                    <button
                        onClick={onClose}
                        className="flex-1 py-4 px-8 bg-secondary hover:bg-secondary/80 rounded-2xl font-bold transition-all"
                    >
                        Skip for Now
                    </button>
                    <button
                        onClick={handleSaveAll}
                        disabled={loading || items.length === 0}
                        className="flex-[2] py-4 px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 disabled:opacity-50 transition-all hover:scale-[1.02]"
                    >
                        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle2 className="w-6 h-6" />}
                        Confirm & Save to Catalog
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};
