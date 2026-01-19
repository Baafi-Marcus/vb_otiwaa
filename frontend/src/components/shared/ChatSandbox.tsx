import React, { useState } from 'react';
import axios from 'axios';
import { MessageSquare, Send } from 'lucide-react';
import { toast } from 'react-hot-toast';

const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:3001' : '';

export const ChatSandbox: React.FC<{ merchantId: string | null, systemPrompt: string }> = ({ merchantId, systemPrompt }) => {
    const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSend = async () => {
        if (!input.trim() || loading || !merchantId) return;
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
        <div className="bg-card border border-border rounded-3xl flex flex-col shadow-sm overflow-hidden h-full min-h-[500px]">
            <div className="p-6 border-b border-border bg-secondary/10">
                <h4 className="font-bold text-sm uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live Simulation
                </h4>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-secondary/5 h-0">
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
