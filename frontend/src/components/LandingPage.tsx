import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Zap, Globe, ShieldCheck, Send, Check, ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000'
    : '';



export default function LandingPage() {

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
                        <a href="/businesses" className="text-sm font-semibold text-white/80 hover:text-white transition-colors">
                            Businesses
                        </a>
                        <a href="/admin" className="px-4 py-2 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 rounded-xl text-xs sm:text-sm font-bold text-white transition-all shadow-lg shadow-primary/20">
                            Dashboard
                        </a>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}

            <div className="flex-1 flex flex-col lg:flex-row items-center justify-center p-6 lg:p-20 relative z-10 gap-16 lg:gap-24">
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="max-w-2xl w-full space-y-10 text-center lg:text-left"
                >
                    <div className="space-y-4">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-bold tracking-widest uppercase text-primary"
                        >
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                            </span>
                            Welcome to
                        </motion.div>
                        <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.9] bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40">
                            AI-POWERED<br />
                            COMMERCE.
                        </h1>
                        <p className="text-lg sm:text-xl lg:text-2xl text-primary font-bold tracking-[0.2em] uppercase font-sans">
                            create.build.inspire.
                        </p>
                    </div>

                    <p className="text-base lg:text-lg text-muted-foreground/80 leading-relaxed max-w-lg mx-auto lg:mx-0 text-center lg:text-left">
                        Empowering small businesses with AI-driven WhatsApp commerce.
                        Automate orders, engage customers, and scale effortlessy with the power of intelligent conversations.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <FeatureCard
                            icon={Bot}
                            title="AI Chatbot"
                            description="24/7 Automated Orders"
                        />
                        <FeatureCard
                            icon={Zap}
                            title="Instant Catalog"
                            description="Menu to DB in Seconds"
                        />
                        <FeatureCard
                            icon={Globe}
                            title="Global Reach"
                            description="Multi-language Support"
                        />
                    </div>
                </motion.div>

                {/* Live Chat Demo Section */}
                <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
                    className="w-full max-w-sm"
                >
                    <ChatDemo />
                </motion.div>
            </div >

            {/* What We Offer Section */}
            <section className="w-full py-20 px-6 relative z-10">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-12"
                    >
                        <h2 className="text-4xl lg:text-5xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
                            What We Offer
                        </h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            Empowering businesses with cutting-edge AI technology
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <OfferCard
                            icon={Bot}
                            title="AI-Powered Chatbot"
                            description="24/7 automated customer service that handles orders, inquiries, and support seamlessly through WhatsApp."
                        />
                        <OfferCard
                            icon={Zap}
                            title="Instant Setup"
                            description="Get your business online in minutes. Upload your menu, customize your bot, and start taking orders immediately."
                        />
                        <OfferCard
                            icon={Globe}
                            title="Multi-Business Platform"
                            description="Join our growing directory of businesses. Customers discover you, and our AI handles the rest."
                        />
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="w-full py-20 px-6 relative z-10 bg-gradient-to-b from-white/5 to-transparent">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-4xl lg:text-5xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
                            How It Works
                        </h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            Simple, fast, and powerful
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
                        <ImprovedStepCard
                            number="1"
                            title="Contact Us"
                            description="Fill out our simple form with your business details and requirements."
                        />
                        <ImprovedStepCard
                            number="2"
                            title="We Set Up Everything"
                            description="Our team configures your AI chatbot, menu, and WhatsApp integration."
                        />
                        <ImprovedStepCard
                            number="3"
                            title="Start Selling"
                            description="Your customers can order 24/7 through WhatsApp with zero effort from you."
                        />
                    </div>
                </div>
            </section>

            {/* For Customers Section */}
            <section className="w-full py-24 px-6 relative z-10 bg-gradient-to-t from-white/5 to-transparent">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-4xl lg:text-5xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60 uppercase">
                            Better For You
                        </h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                            Experience the future of shopping. No slow websites, no complicated apps. Just chat with your favorite local businesses directly on WhatsApp.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                        <OfferCard
                            icon={Bot}
                            title="Instant AI Help"
                            description="Get immediate answers about prices and availability from our AI, any time of day."
                        />
                        <OfferCard
                            icon={Zap}
                            title="Shop on WhatsApp"
                            description="Order directly from your chat window. No extra apps or storage space required."
                        />
                        <OfferCard
                            icon={Globe}
                            title="Track Your Orders"
                            description="Receive automated live updates and track your delivery status with simple messages."
                        />
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center"
                    >
                        <a
                            href="/businesses"
                            className="inline-flex items-center gap-2 px-10 py-5 bg-white text-black font-black rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/10"
                        >
                            Explore Business Directory
                            <ArrowLeft className="w-5 h-5 rotate-180" />
                        </a>
                    </motion.div>
                </div>
            </section>

            {/* Contact Form Section */}
            <div id="contact">
                <ContactFormSection />
            </div>

            <footer className="w-full py-8 text-center text-xs font-bold text-muted-foreground/60 relative z-10 uppercase tracking-widest flex flex-col md:flex-row items-center justify-between px-8 gap-4 bg-black/20 backdrop-blur-sm border-t border-white/5">
                <div className="flex items-center gap-4">
                    <span>&copy; {new Date().getFullYear()} FuseWeb Service</span>
                    <span className="hidden md:inline text-white/20">|</span>
                    <a
                        href="https://wa.me/233276019796"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-emerald-400 transition-colors flex items-center gap-1"
                    >
                        <Send className="w-3 h-3" />
                        WhatsApp: 0276019796
                    </a>
                </div>
                <div className="flex items-center gap-2 text-emerald-500/80">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Secure Enterprise Platform</span>
                </div>
            </footer>
        </div >
    );
}

function FeatureCard({ icon: Icon, title, description }: any) {
    return (
        <motion.div
            whileHover={{ y: -5 }}
            className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md"
        >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center mb-3 text-white">
                <Icon className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">{title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
        </motion.div>
    )
}

function OfferCard({ icon: Icon, title, description }: any) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -5 }}
            className="p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md"
        >
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-purple-600/20 flex items-center justify-center mb-6 text-white">
                <Icon className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        </motion.div>
    );
}

function ImprovedStepCard({ number, title, description }: any) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative flex flex-col items-center text-center"
        >
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-3xl font-black shadow-2xl shadow-primary/40 mb-6">
                {number}
            </div>
            <div className="space-y-3">
                <h3 className="text-2xl font-bold text-white">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">{description}</p>
            </div>
        </motion.div>
    );
}

function ContactFormSection() {
    const [formData, setFormData] = useState({
        businessName: '',
        contactPerson: '',
        phone: '',
        email: '',
        businessType: '',
        message: ''
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await axios.post(`${API_BASE}/api/system/leads`, formData);
            alert('Thank you! We will contact you soon for any further questions and details.');
            setFormData({ businessName: '', contactPerson: '', phone: '', email: '', businessType: '', message: '' });
        } catch (error) {
            console.error('Failed to submit lead:', error);
            alert('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full py-20 px-6 relative z-10 bg-black/20 backdrop-blur-sm">
            <div className="max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-12"
                >
                    <h2 className="text-4xl lg:text-5xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
                        Get Started Today
                    </h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        Fill out the form below and we'll set up your AI-powered WhatsApp business in no time
                    </p>
                </motion.div>

                <motion.form
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    onSubmit={handleSubmit}
                    className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-md space-y-6"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-white mb-2">Business Name *</label>
                            <input
                                type="text"
                                required
                                value={formData.businessName}
                                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder="Your Business Name"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-white mb-2">Contact Person *</label>
                            <input
                                type="text"
                                required
                                value={formData.contactPerson}
                                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder="Your Name"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-white mb-2">Phone Number *</label>
                            <input
                                type="tel"
                                required
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder="+233 XXX XXX XXX"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-white mb-2">Email *</label>
                            <input
                                type="email"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder="your@email.com"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-white mb-2">Business Type *</label>
                        <select
                            required
                            value={formData.businessType}
                            onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="" className="bg-[#1a1a1a]">Select a type</option>
                            <option value="Restaurant" className="bg-[#1a1a1a]">🍴 Restaurant / Cafe</option>
                            <option value="Boutique" className="bg-[#1a1a1a]">👗 Boutique / Fashion</option>
                            <option value="Professional Service" className="bg-[#1a1a1a]">💼 Professional Service</option>
                            <option value="Logistics" className="bg-[#1a1a1a]">🚚 Logistics / Delivery</option>
                            <option value="General" className="bg-[#1a1a1a]">🏢 General Business</option>
                            <option value="Other" className="bg-[#1a1a1a]">✨ Other</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-white mb-2">Message</label>
                        <textarea
                            value={formData.message}
                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                            rows={4}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                            placeholder="Tell us about your business and what you need..."
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Sending...' : 'Get Started →'}
                    </button>
                </motion.form>
            </div>
        </div>
    );
}

function ChatDemo() {
    const [messages, setMessages] = useState<any[]>([]);
    const [scenarioIndex, setScenarioIndex] = useState(0);

    useEffect(() => {
        const scenarios = [
            // Scenario 1: Food Order
            [
                { text: "Hi, I'd like to order jollof rice", isBot: false, delay: 1000 },
                { text: "Hello! 👋 Welcome to Tasty Bytes. Here is our menu...", isBot: true, delay: 2000, hasImage: true },
                { text: "1x Jollof Combo please", isBot: false, delay: 3500 },
                { text: "Great choice! That's GHS 45. Delivery or Pickup?", isBot: true, delay: 4500 },
                { text: "Delivery to East Legon", isBot: false, delay: 6000 },
                { text: "Understood. Delivery fee is GHS 15. Total: GHS 60.\nReply 'CONFIRM' to proceed.", isBot: true, delay: 7500 },
                { text: "CONFIRM", isBot: false, delay: 9000 },
                { text: "Order #1234 CONFIRMED! 🚀\nWe are preparing your food now.", isBot: true, delay: 10500 },
            ],
            // Scenario 2: Menu Inquiry
            [
                { text: "What's on the menu today?", isBot: false, delay: 1000 },
                { text: "Great question! 🍽️ Here's what we have...", isBot: true, delay: 2000, hasImage: true },
                { text: "Do you have vegetarian options?", isBot: false, delay: 3500 },
                { text: "Yes! We have:\n- Veggie Fried Rice (GHS 35)\n- Garden Salad (GHS 25)\n- Grilled Veggies (GHS 30)", isBot: true, delay: 5000 },
                { text: "I'll take the Veggie Fried Rice", isBot: false, delay: 6500 },
                { text: "Perfect! GHS 35. Pickup or Delivery?", isBot: true, delay: 7500 },
                { text: "Pickup", isBot: false, delay: 8500 },
                { text: "Order #1235 confirmed for pickup! Ready in 20 mins. 🎉", isBot: true, delay: 9500 },
            ],
            // Scenario 3: Order Status Check
            [
                { text: "Hi, what's the status of order #1230?", isBot: false, delay: 1000 },
                { text: "Let me check that for you... 🔍", isBot: true, delay: 2000 },
                { text: "Order #1230 is out for delivery! 🚗\nETA: 15 minutes", isBot: true, delay: 3500 },
                { text: "Great! Can I add drinks to it?", isBot: false, delay: 5000 },
                { text: "Sure! What would you like?\n- Coke (GHS 5)\n- Sprite (GHS 5)\n- Water (GHS 3)", isBot: true, delay: 6500 },
                { text: "2x Coke please", isBot: false, delay: 8000 },
                { text: "Added! New total: GHS 10 extra.\nDriver will bring them. 🥤", isBot: true, delay: 9500 },
            ],
        ];

        const currentScenario = scenarios[scenarioIndex];
        let timeouts: any[] = [];

        currentScenario.forEach((msg) => {
            const t = setTimeout(() => {
                setMessages(prev => [...prev, msg]);
            }, msg.delay);
            timeouts.push(t);
        });

        // Loop to next scenario
        const resetT = setTimeout(() => {
            setMessages([]);
            setScenarioIndex((prev) => (prev + 1) % scenarios.length);
        }, 12000);
        timeouts.push(resetT);

        return () => timeouts.forEach(clearTimeout);
    }, [scenarioIndex]);

    return (
        <div className="w-full aspect-[9/19] bg-black rounded-[3rem] border-8 border-neutral-800 shadow-2xl overflow-hidden relative">
            {/* Phone Notch/Status Bar */}
            <div className="absolute top-0 left-0 right-0 h-6 bg-transparent z-20 flex justify-between px-6 py-2">
                <span className="text-[10px] font-bold text-white">9:41</span>
                <div className="flex gap-1">
                    <div className="w-3 h-3 rounded-full bg-white/20" />
                    <div className="w-3 h-3 rounded-full bg-white/20" />
                </div>
            </div>

            {/* WhatsApp Header */}
            <div className="bg-[#075E54] p-4 pt-8 flex items-center gap-3 shadow-md relative z-10">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#075E54] font-bold text-xs">
                    TB
                </div>
                <div>
                    <h3 className="text-sm font-bold text-white leading-none">Tasty Bytes 🤖</h3>
                    <p className="text-[10px] text-white/80">Business Account</p>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 bg-[#ECE5DD] p-4 space-y-3 overflow-hidden relative h-full">
                {/* Chat Background Doodle Pattern (Simplified) */}
                <div className="absolute inset-0 opacity-5 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat bg-[length:400px_400px] pointer-events-none" />

                <AnimatePresence mode="popLayout">
                    {messages.map((msg, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            layout
                            className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'} relative z-10`}
                        >
                            <div className={`
                                max-w-[80%] rounded-xl p-2.5 text-xs shadow-sm
                                ${msg.isBot ? 'bg-white rounded-tl-none text-black' : 'bg-[#DCF8C6] rounded-tr-none text-black'}
                            `}>
                                {msg.hasImage && (
                                    <div className="w-full h-24 bg-gray-200 rounded-lg mb-2 overflow-hidden relative">
                                        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30 font-bold uppercase tracking-widest text-[8px]">
                                            Menu Image
                                        </div>
                                    </div>
                                )}
                                <p className="leading-relaxed">{msg.text}</p>
                                <span className="text-[9px] text-black/40 block text-right mt-1 flex items-center justify-end gap-1">
                                    10:{30 + i} AM
                                    {!msg.isBot && <Check className="w-2 h-2 text-blue-500" />}
                                </span>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Input Area */}
            <div className="absolute bottom-0 left-0 right-0 bg-[#F0F0F0] p-3 flex items-center gap-2">
                <div className="flex-1 bg-white rounded-full h-8 px-4 text-xs flex items-center text-muted-foreground">
                    Type a message...
                </div>
                <div className="w-8 h-8 rounded-full bg-[#00897B] flex items-center justify-center text-white shadow-sm">
                    <Send className="w-3 h-3" />
                </div>
            </div>
        </div>
    );
}


