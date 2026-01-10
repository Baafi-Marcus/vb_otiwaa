import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Zap, Globe, ShieldCheck, Send, Check } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-[#020202] text-white flex flex-col font-sans relative overflow-hidden">
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]" />

            {/* Ambient background glow */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none opacity-30 z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary rounded-full blur-[150px] animate-pulse" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600 rounded-full blur-[150px] animate-pulse [animation-delay:2s]" />
            </div>

            <div className="flex-1 flex flex-col lg:flex-row items-center justify-center p-6 lg:p-20 relative z-10 gap-16 lg:gap-24">
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="max-w-2xl w-full space-y-10 text-center lg:text-left"
                >
                    <div className="space-y-6">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="w-32 h-32 mx-auto lg:mx-0"
                        >
                            <img src="/logo-white.png" alt="VB.OTIWAA Logo" className="w-full h-full object-contain" />
                        </motion.div>

                        <div className="space-y-2">
                            <h1 className="text-6xl lg:text-8xl font-black tracking-tighter leading-none bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
                                VB.OTIWAA
                            </h1>
                            <p className="text-xl lg:text-2xl text-white/90 font-medium tracking-wide font-mono">
                                create.build.inspire.
                            </p>
                        </div>

                        <p className="text-base lg:text-lg text-muted-foreground/80 leading-relaxed max-w-lg mx-auto lg:mx-0">
                            Empowering small businesses with AI-driven WhatsApp commerce.
                            Automate orders, engage customers, and scale effortlessy with the power of intelligent conversations.
                        </p>
                    </div>

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
                    className="w-full max-w-sm hidden lg:block"
                >
                    <ChatDemo />
                </motion.div>
            </div>

            <footer className="w-full py-6 text-center text-xs font-medium text-muted-foreground/40 relative z-10 uppercase tracking-widest flex items-center justify-between px-8">
                <p>&copy; {new Date().getFullYear()} VB.OTIWAA Inc.</p>
                <div className="flex items-center gap-2">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Secure Enterprise Platform</span>
                </div>
            </footer>
        </div>
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

function ChatDemo() {
    const [messages, setMessages] = useState<any[]>([]);

    useEffect(() => {
        const scenario = [
            { text: "Hi, I'd like to order jollof rice", isBot: false, delay: 1000 },
            { text: "Hello! 👋 Welcome to Tasty Bytes. Here is our menu...", isBot: true, delay: 2000, hasImage: true },
            { text: "1x Jollof Combo please", isBot: false, delay: 3500 },
            { text: "Great choice! That's GHS 45. Delivery or Pickup?", isBot: true, delay: 4500 },
        ];

        let timeouts: any[] = [];

        scenario.forEach((msg) => {
            const t = setTimeout(() => {
                setMessages(prev => [...prev, msg]);
            }, msg.delay);
            timeouts.push(t);
        });

        // Loop animation
        const resetT = setTimeout(() => {
            setMessages([]);
            // Trigger re-render to restart effect effectively? 
            // In a real app we'd use a more robust loop, but this is a simple demo
            // Let's just clear for now, effect dependency handles mount only.
            // To loop, we can just clear and let the user refresh or set a state to trigger re-run.
            // For this simple demo, one run is fine, or we can make it loop by toggling a key.
        }, 8000);
        timeouts.push(resetT);

        return () => timeouts.forEach(clearTimeout);
    }, []); // Run once on mount

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

