import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { MessageCircle, ArrowLeft, X, Smartphone, MapPin, Tag } from 'lucide-react';
import axios from 'axios';

const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000'
    : '';

const PLATFORM_WHATSAPP = import.meta.env.VITE_PLATFORM_WHATSAPP || '+14155238886';

export default function BusinessesPage() {
    const [merchants, setMerchants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMerchant, setSelectedMerchant] = useState<any>(null);



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

                    {loading ? (
                        <div className="text-center py-20">
                            <div className="inline-block w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                            <p className="mt-4 text-muted-foreground">Loading merchants...</p>
                        </div>
                    ) : merchants.length === 0 ? (
                        <div className="text-center py-20">
                            <p className="text-muted-foreground text-lg">No merchants available at the moment.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {merchants.map((merchant, index) => (
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
                            className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl z-10"
                        >
                            <button
                                onClick={() => setSelectedMerchant(null)}
                                className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all z-20"
                            >
                                <X className="w-6 h-6" />
                            </button>

                            <div className="flex flex-col">
                                {(selectedMerchant.logoUrl || selectedMerchant.menuImageUrl) && (
                                    <div className="w-full h-64 sm:h-80 relative overflow-hidden">
                                        <img
                                            src={selectedMerchant.logoUrl || selectedMerchant.menuImageUrl}
                                            alt={selectedMerchant.name}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
                                    </div>
                                )}

                                <div className="p-8 sm:p-10 space-y-8">
                                    <div className="space-y-4 text-center sm:text-left">
                                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                            <h2 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">
                                                {selectedMerchant.name}
                                            </h2>
                                        </div>
                                        <p className="text-muted-foreground text-lg italic max-w-xl">
                                            "{selectedMerchant.description || 'Verified local business powered by FuseWeb AI.'}"
                                        </p>
                                    </div>

                                    {/* Delivery Options & Menu Section */}
                                    <div className="space-y-6 border-t border-white/5 pt-6">
                                        {selectedMerchant.deliveryOptions && (
                                            <div className="flex flex-wrap gap-2">
                                                {(selectedMerchant.deliveryOptions === 'BOTH' || selectedMerchant.deliveryOptions === 'PICKUP') && (
                                                    <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-white flex items-center gap-2">
                                                        🛍️ Pickup Available
                                                    </span>
                                                )}
                                                {(selectedMerchant.deliveryOptions === 'BOTH' || selectedMerchant.deliveryOptions === 'DELIVERY') && (
                                                    <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-white flex items-center gap-2">
                                                        🛵 Delivery Available
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        {selectedMerchant.catalog && selectedMerchant.catalog.length > 0 && (
                                            <div className="space-y-3">
                                                <h4 className="text-sm font-black uppercase tracking-widest text-white/40">Menu & Prices</h4>
                                                <div className="grid gap-2">
                                                    {selectedMerchant.catalog.map((product: any) => (
                                                        <div key={product.id} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/10">
                                                            <div>
                                                                <p className="font-bold text-sm text-white">{product.name}</p>
                                                                {product.description && <p className="text-xs text-muted-foreground line-clamp-1">{product.description}</p>}
                                                            </div>
                                                            <div className="font-bold text-primary text-sm">
                                                                GHS {product.price}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-white/5">
                                        <div className="space-y-1">
                                            <div className="text-[10px] font-black uppercase tracking-widest text-white/40">Category</div>
                                            <div className="flex items-center gap-2 font-bold text-white">
                                                <Tag className="w-4 h-4 text-primary" />
                                                {selectedMerchant.category || 'Local Business'}
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="text-[10px] font-black uppercase tracking-widest text-white/40">Location</div>
                                            <div className="flex items-center gap-2 font-bold text-white">
                                                <MapPin className="w-4 h-4 text-primary" />
                                                {selectedMerchant.location || 'Accra, Ghana'}
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="text-[10px] font-black uppercase tracking-widest text-white/40">Official Channel</div>
                                            <div className="flex items-center gap-2 font-bold text-white">
                                                <Smartphone className="w-4 h-4 text-primary" />
                                                Verified WhatsApp Bot
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="text-[10px] font-black uppercase tracking-widest text-white/40">Status</div>
                                            <div className="flex items-center gap-2 font-bold text-white">
                                                {selectedMerchant.isClosed ? (
                                                    <span className="flex items-center gap-2 text-red-500">
                                                        <span className="w-2 h-2 rounded-full bg-red-500" />
                                                        Currently Closed
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-2 text-emerald-500">
                                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                        Online & Chatting
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-6">
                                        <a
                                            href={
                                                selectedMerchant.tier === 'LISTING'
                                                    ? `https://wa.me/${selectedMerchant.contactPhone?.replace(/\+/g, '')}`
                                                    : `https://wa.me/${PLATFORM_WHATSAPP.replace(/\+/g, '').replace(' ', '')}?text=Start:${selectedMerchant.id}`
                                            }
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-full py-5 px-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all shadow-xl shadow-emerald-500/20 active:scale-95"
                                        >
                                            <MessageCircle className="w-6 h-6" />
                                            Start Chatting Now
                                        </a>
                                        <p className="text-center text-[10px] text-muted-foreground/40 mt-4 uppercase tracking-[0.2em]">
                                            Secure end-to-end encrypted conversation
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )
                }
            </AnimatePresence >

            {/* Footer */}
            < footer className="w-full py-8 text-center text-xs font-bold text-muted-foreground/60 relative z-10 uppercase tracking-widest flex flex-col md:flex-row items-center justify-between px-8 gap-4 bg-black/20 backdrop-blur-sm border-t border-white/5" >
                <div className="flex items-center gap-4">
                    <span>© 2026 FuseWeb Service</span>
                </div>
                <div className="flex items-center gap-6">
                    <a href="/" className="hover:text-white transition-colors">Home</a>
                    <a href="/businesses" className="hover:text-white transition-colors">Businesses</a>
                    <a href="/admin" className="hover:text-white transition-colors">Admin</a>
                </div>
            </footer >
        </div >
    );
}
