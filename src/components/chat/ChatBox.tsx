'use client';

import { useEffect, useState, useRef } from 'react';
import { Send, X } from 'lucide-react';
import { ref, onValue, push, update } from 'firebase/database';
import { database } from '@/lib/firebase';
import { ChatMessage } from '@/types';
import { Button } from '@/components/ui';

interface ChatBoxProps {
    rideId: string;
    userId: string;
    userName: string;
    userRole: 'CUSTOMER' | 'DRIVER';
    onClose: () => void;
    isOpen: boolean;
}

export function ChatBox({
    rideId,
    userId,
    userName,
    userRole,
    onClose,
    isOpen
}: ChatBoxProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Subscribe to chat messages
    useEffect(() => {
        if (!rideId || !isOpen) return;

        const messagesRef = ref(database, `chats/${rideId}/messages`);
        const unsubscribe = onValue(messagesRef, (snapshot) => {
            if (snapshot.exists()) {
                const msgs: ChatMessage[] = [];
                snapshot.forEach((child) => {
                    msgs.push({ id: child.key, ...child.val() } as ChatMessage);
                });
                // Sort by timestamp
                msgs.sort((a, b) => a.timestamp - b.timestamp);
                setMessages(msgs);

                // Mark messages from other user as read
                msgs.forEach((msg) => {
                    if (msg.senderId !== userId && !msg.read) {
                        update(ref(database, `chats/${rideId}/messages/${msg.id}`), {
                            read: true
                        });
                    }
                });
            } else {
                setMessages([]);
            }
        });

        return () => unsubscribe();
    }, [rideId, userId, isOpen]);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!newMessage.trim() || sending) return;

        setSending(true);
        try {
            const messagesRef = ref(database, `chats/${rideId}/messages`);
            await push(messagesRef, {
                rideId,
                senderId: userId,
                senderName: userName,
                senderRole: userRole,
                message: newMessage.trim(),
                timestamp: Date.now(),
                read: false,
            });
            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setSending(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Chat Container */}
            <div className="relative w-full sm:max-w-md h-[70vh] sm:h-[500px] bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white">
                    <div>
                        <h3 className="font-semibold">Chat</h3>
                        <p className="text-xs text-violet-200">
                            {userRole === 'CUSTOMER' ? 'Chat with your driver' : 'Chat with passenger'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 dark:bg-slate-800">
                    {messages.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                            <p className="text-sm">No messages yet</p>
                            <p className="text-xs mt-1">Say hello! 👋</p>
                        </div>
                    ) : (
                        messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.senderId === userId ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[75%] rounded-2xl px-4 py-2 ${msg.senderId === userId
                                            ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-br-md'
                                            : 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-bl-md shadow-sm'
                                        }`}
                                >
                                    {msg.senderId !== userId && (
                                        <p className="text-xs font-medium text-violet-600 dark:text-violet-400 mb-1">
                                            {msg.senderName}
                                        </p>
                                    )}
                                    <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                                    <p
                                        className={`text-xs mt-1 ${msg.senderId === userId ? 'text-violet-200' : 'text-slate-400'
                                            }`}
                                    >
                                        {new Date(msg.timestamp).toLocaleTimeString([], {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Type a message..."
                            className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 border-0 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                        />
                        <Button
                            onClick={handleSend}
                            disabled={!newMessage.trim()}
                            loading={sending}
                            className="w-12 h-12 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 p-0 flex items-center justify-center"
                        >
                            <Send className="w-5 h-5" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ChatBox;
