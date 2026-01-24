import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { MessageCircle, ArrowLeft, X, MapPin, Tag, Clock, Search, Plus } from 'lucide-react';
import axios from 'axios';

const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000'
    : '';

const PLATFORM_WHATSAPP = import.meta.env.VITE_PLATFORM_WHATSAPP || '+14155238886';

export default function BusinessesPage() {
    const [merchants, setMerchants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMerchant, setSelectedMerchant] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');



    useEffect(() => {
        const fetchMerchants = async () => {
            try {
                const response = await axios.get(`${API_BASE}/api/merchants/public`);
                setMerchants(response.data);
                setLoading(false);
            } catch (error) {
                console.error('Failed to fetch merchants:', error);
                setLoading(false);
            }
        };
        fetchMerchants();
    }, []);

    const filteredMerchants = merchants.filter(m =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.category && m.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (m.location && m.location.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="min-h-screen bg-[#020202] text-white flex flex-col font-sans relative overflow-y-auto">
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]" />

            {/* Ambient background glow */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none opacity-30 z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary rounded-full blur-[150px] animate-pulse" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600 rounded-full blur-[150px] animate-pulse [animation-delay:2s]" />
            </div>

            {/* Navigation Bar */}
            <nav className="w-full py-4 px-6 lg:px-20 relative z-20 bg-black/20 backdrop-blur-sm border-b border-white/5">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src="/logo-white.png" alt="FuseWeb Service Logo" className="w-10 h-10 object-contain" />
                        <span className="text-xl font-black tracking-tight">FuseWeb Service</span>
                    </div>
                    <div className="flex items-center gap-6">
                        <a href="/" className="text-xs sm:text-sm font-semibold text-white/80 hover:text-white transition-colors flex items-center gap-2">
                            <ArrowLeft className="w-4 h-4" />
                            <span className="hidden sm:inline">Back to Home</span>
                            <span className="sm:hidden">Home</span>
                        </a>
                        <a href="/#contact" className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs sm:text-sm font-bold text-white transition-all">
                            <Plus className="w-4 h-4" />
                            Add Your Business
                        </a>
                        <a href="/admin" className="px-4 py-2 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 rounded-xl text-xs sm:text-sm font-bold text-white transition-all shadow-lg shadow-primary/20">
                            Dashboard
                        </a>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="w-full py-20 px-6 relative z-10 flex-1">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-12 sm:mb-16"
                    >
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60 uppercase">
                            Browse Merchants
                        </h1>
                        <p className="text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg px-4">
                            Discover local businesses powered by AI. Click "Chat Now" to start ordering instantly.
                        </p>
                    </motion.div>

                    {merchants.length >= 20 && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="relative max-w-xl mx-auto mb-12 sm:mb-16"
                        >
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-purple-600 rounded-[2rem] blur opacity-25 group-focus-within:opacity-50 transition duration-1000"></div>
                                <div className="relative flex items-center bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden">
                                    <div className="pl-5">
                                        <Search className="w-5 h-5 text-primary" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Search by name, category, or location..."
                                        className="w-full px-4 py-5 bg-transparent outline-none font-bold text-white placeholder:text-muted-foreground/40 text-lg"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                    {searchTerm && (
                                        <button
                                            onClick={() => setSearchTerm('')}
                                            className="pr-5 text-muted-foreground hover:text-white transition-colors"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {loading ? (
                        <div className="text-center py-20">
                            <div className="inline-block w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                            <p className="mt-4 text-muted-foreground">Loading merchants...</p>
                        </div>
                    ) : filteredMerchants.length === 0 ? (
                        <div className="text-center py-20">
                            <p className="text-muted-foreground text-lg">No merchants found matching "{searchTerm}".</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredMerchants.map((merchant, index) => (
                                <motion.div
                                    key={merchant.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    onClick={() => setSelectedMerchant(merchant)}
                                    className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md hover:bg-white/10 transition-all cursor-pointer group"
                                >
                                    {(merchant.logoUrl || merchant.menuImageUrl) && (
                                        <img
                                            src={merchant.logoUrl || merchant.menuImageUrl}
                                            alt={merchant.name}
                                            className="w-full h-48 object-cover rounded-xl mb-4"
                                        />
                                    )}
                                    <div className="flex items-start justify-between mb-3">
                                        <h3 className="text-xl font-bold text-white">{merchant.name}</h3>
                                    </div>
                                    <div className="space-y-2 mb-4">
                                        {merchant.category && (
                                            <p className="text-sm text-muted-foreground">📂 {merchant.category}</p>
                                        )}
                                        {merchant.location && (
                                            <p className="text-sm text-muted-foreground">📍 {merchant.location}</p>
                                        )}
                                        {merchant.isClosed && (
                                            <p className="text-sm text-red-400 font-semibold">🔴 Currently Closed</p>
                                        )}
                                    </div>
                                    <a
                                        href={
                                            merchant.tier === 'LISTING'
                                                ? `https://wa.me/${merchant.contactPhone?.replace(/\+/g, '')}`
                                                : `https://wa.me/${PLATFORM_WHATSAPP.replace(/\+/g, '').replace(' ', '')}?text=Start:${merchant.id}`
                                        }
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
                                    >
                                        <MessageCircle className="w-4 h-4" />
                                        Chat Now
                                    </a>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Merchant Detail Modal */}
            <AnimatePresence>
                {selectedMerchant && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 italic-none">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedMerchant(null)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-3xl bg-card border border-border rounded-3xl overflow-hidden shadow-2xl z-10 max-h-[90vh] overflow-y-auto"
                        >
                            <button
                                onClick={() => setSelectedMerchant(null)}
                                className="absolute top-4 right-4 p-2 rounded-full bg-secondary hover:bg-secondary/80 text-foreground transition-all z-20"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="flex flex-col">
                                {/* Hero Image */}
                                {(selectedMerchant.logoUrl || selectedMerchant.menuImageUrl) && (
                                    <div className="w-full h-48 sm:h-64 relative overflow-hidden">
                                        <img
                                            src={selectedMerchant.logoUrl || selectedMerchant.menuImageUrl}
                                            alt={selectedMerchant.name}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
                                    </div>
                                )}

                                <div className="p-6 sm:p-8 space-y-6">
                                    {/* Business Header */}
                                    <div className="space-y-3">
                                        <h2 className="text-3xl sm:text-4xl font-black text-foreground">
                                            {selectedMerchant.name}
                                        </h2>
                                        {selectedMerchant.description && (
                                            <p className="text-muted-foreground text-base italic leading-relaxed">
                                                "{selectedMerchant.description}"
                                            </p>
                                        )}
                                    </div>

                                    {/* Quick Info Grid */}
                                    <div className="grid grid-cols-2 gap-4 p-4 bg-secondary/30 rounded-2xl border border-border">
                                        <div className="space-y-1">
                                            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                                <Tag className="w-3 h-3" />
                                                Category
                                            </div>
                                            <div className="font-bold text-foreground text-sm">
                                                {selectedMerchant.category || 'Local Business'}
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                                <MapPin className="w-3 h-3" />
                                                Location
                                            </div>
                                            <div className="font-bold text-foreground text-sm">
                                                {selectedMerchant.location || 'Accra, Ghana'}
                                            </div>
                                        </div>
                                        {selectedMerchant.operatingHours && (
                                            <div className="space-y-1 col-span-2">
                                                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                                    <Clock className="w-3 h-3" />
                                                    Hours
                                                </div>
                                                <div className="font-bold text-foreground text-sm">
                                                    {selectedMerchant.operatingHours}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Delivery Options */}
                                    {selectedMerchant.deliveryOptions && (
                                        <div className="flex flex-wrap gap-2">
                                            {(selectedMerchant.deliveryOptions === 'BOTH' || selectedMerchant.deliveryOptions === 'PICKUP') && (
                                                <span className="px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-sm font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2">
                                                    🛍️ Pickup Available
                                                </span>
                                            )}
                                            {(selectedMerchant.deliveryOptions === 'BOTH' || selectedMerchant.deliveryOptions === 'DELIVERY') && (
                                                <span className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                                                    🛵 Delivery Available
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {/* Menu Preview */}
                                    {selectedMerchant.catalog && selectedMerchant.catalog.length > 0 && (
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-lg font-black text-foreground">Popular Items</h4>
                                                <span className="text-xs font-bold text-muted-foreground">
                                                    {selectedMerchant.catalog.length} items available
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {selectedMerchant.catalog.slice(0, 6).map((product: any) => (
                                                    <div key={product.id} className="p-4 bg-secondary/50 rounded-xl border border-border hover:border-primary/30 transition-all">
                                                        <div className="flex justify-between items-start gap-3">
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-bold text-sm text-foreground truncate">{product.name}</p>
                                                                {product.description && (
                                                                    <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                                                                        {product.description}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <div className="font-black text-primary text-sm whitespace-nowrap">
                                                                GHS {product.price}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            {selectedMerchant.catalog.length > 6 && (
                                                <p className="text-center text-xs text-muted-foreground italic">
                                                    + {selectedMerchant.catalog.length - 6} more items available via chat
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {/* Status Indicator */}
                                    <div className="flex items-center justify-center gap-2 p-3 bg-secondary/30 rounded-xl">
                                        {selectedMerchant.isClosed ? (
                                            <span className="flex items-center gap-2 text-red-500 font-bold text-sm">
                                                <span className="w-2 h-2 rounded-full bg-red-500" />
                                                Currently Closed
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-2 text-emerald-500 font-bold text-sm">
                                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                Online & Ready to Chat
                                            </span>
                                        )}
                                    </div>

                                    {/* CTA Button */}
                                    <div className="space-y-3 pt-2">
                                        <a
                                            href={
                                                selectedMerchant.tier === 'LISTING'
                                                    ? `https://wa.me/${selectedMerchant.contactPhone?.replace(/\+/g, '')}`
                                                    : `https://wa.me/${PLATFORM_WHATSAPP.replace(/\+/g, '').replace(' ', '')}?text=Start:${selectedMerchant.id}`
                                            }
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-base flex items-center justify-center gap-3 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                                        >
                                            <MessageCircle className="w-5 h-5" />
                                            Start Chatting on WhatsApp
                                        </a>
                                        <p className="text-center text-xs text-muted-foreground/60 uppercase tracking-wider">
                                            🔒 Secure end-to-end encrypted
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )
                }
            </AnimatePresence>

            {/* Footer */}
            < footer className="w-full py-8 text-center text-xs font-bold text-muted-foreground/60 relative z-10 uppercase tracking-widest flex flex-col md:flex-row items-center justify-between px-8 gap-4 bg-black/20 backdrop-blur-sm border-t border-white/5" >
                <div className="flex items-center gap-4">
                    <span>© 2026 FuseWeb Service</span>
                </div>
                <div className="flex items-center gap-6">
                    <a href="/" className="hover:text-white transition-colors">Home</a>
                    <a href="/#contact" className="hover:text-white transition-colors">Join Us</a>
                    <a href="/businesses" className="hover:text-white transition-colors">Businesses</a>
                    <a href="/admin" className="hover:text-white transition-colors">Admin</a>
                </div>
            </footer >
        </div >
    );
}
