import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Zap, Brain, Loader2, CheckCircle2, Paperclip, FileText, X as CloseIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { getChatResponse, processLeadCollection } from '../services/geminiService';
import { Message, Lead } from '../types';
import { cn } from '../lib/utils';

export default function ChatBot() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: "Hello! I'm AutoGenius, your personal car shopping assistant. How can I help you find your dream car today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'standard' | 'fast' | 'thinking'>('fast');
  const [leadCaptured, setLeadCaptured] = useState(false);
  const [currentLeadId, setCurrentLeadId] = useState<number | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string, type: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const response = await getChatResponse(userMessage, history, mode);
      
      setMessages(prev => [...prev, { role: 'model', text: response || 'I apologize, I encountered an error.' }]);

      // Check if we should try to extract lead info
      if (!leadCaptured && messages.length > 2) {
        const leadInfo = await processLeadCollection(userMessage + " " + response);
        if (leadInfo.name && (leadInfo.email || leadInfo.phone)) {
          // Send to backend with full history
          const res = await fetch('/api/leads', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...leadInfo,
              history: [...messages, { role: 'user', text: userMessage }, { role: 'model', text: response }]
            })
          });
          const data = await res.json();
          setLeadCaptured(true);
          setCurrentLeadId(data.id);

          // Upload any pending files
          if (uploadedFiles.length > 0) {
            for (const file of uploadedFiles) {
              await fetch(`/api/leads/${data.id}/documents`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: file.name, type: file.type })
              });
            }
          }
        }
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: "I'm sorry, I'm having trouble connecting right now." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files).map(f => ({
      name: f.name,
      type: f.type
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);

    // If lead already exists, upload immediately
    if (currentLeadId) {
      for (const file of newFiles) {
        await fetch(`/api/leads/${currentLeadId}/documents`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: file.name, type: file.type })
        });
      }
    }
    
    // Add a system message about the upload
    setMessages(prev => [...prev, { 
      role: 'model', 
      text: `I've received your document: **${newFiles[0].name}**. Thank you! This will help speed up your verification process.` 
    }]);
  };

  return (
    <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full p-4 md:p-6 gap-4">
      {/* Mode Selector */}
      <div className="flex items-center justify-between bg-white p-3 rounded-2xl shadow-sm border border-black/5">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-500" />
          <span className="text-sm font-medium text-gray-700">AI Response Speed</span>
        </div>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setMode('fast')}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
              mode === 'fast' ? "bg-white text-emerald-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            <Zap className="w-3.5 h-3.5" />
            Fast
          </button>
          <button
            onClick={() => setMode('standard')}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
              mode === 'standard' ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Standard
          </button>
          <button
            onClick={() => setMode('thinking')}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
              mode === 'thinking' ? "bg-white text-purple-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            <Brain className="w-3.5 h-3.5" />
            Thinking
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div 
        ref={scrollRef}
        className="flex-1 bg-white rounded-3xl shadow-sm border border-black/5 overflow-y-auto p-4 md:p-6 space-y-6"
      >
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex gap-3 max-w-[85%]",
                msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                msg.role === 'user' ? "bg-black" : "bg-indigo-100"
              )}>
                {msg.role === 'user' ? (
                  <User className="w-4 h-4 text-white" />
                ) : (
                  <Bot className="w-4 h-4 text-indigo-600" />
                )}
              </div>
              <div className={cn(
                "px-4 py-3 rounded-2xl text-sm leading-relaxed",
                msg.role === 'user' 
                  ? "bg-black text-white rounded-tr-none" 
                  : "bg-gray-100 text-gray-800 rounded-tl-none"
              )}>
                <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-black/5">
                  <Markdown>{msg.text}</Markdown>
                </div>
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3 mr-auto"
            >
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                <span className="text-xs font-medium text-gray-500">
                  {mode === 'thinking' ? 'Thinking deeply...' : 'AutoGenius is typing...'}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input Area */}
      <div className="relative">
        {leadCaptured && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute -top-10 left-0 right-0 flex justify-center"
          >
            <div className="bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1 shadow-sm border border-emerald-200">
              <CheckCircle2 className="w-3 h-3" />
              Lead Captured & Routed to Agent
            </div>
          </motion.div>
        )}
        <div className="bg-white rounded-2xl shadow-lg border border-black/5 p-2 flex flex-col gap-2">
          {uploadedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 px-2 pt-2">
              {uploadedFiles.map((file, i) => (
                <div key={i} className="bg-gray-100 rounded-lg px-2 py-1 flex items-center gap-2 text-[10px] font-medium text-gray-600 border border-black/5">
                  <FileText className="w-3 h-3" />
                  <span className="truncate max-w-[100px]">{file.name}</span>
                  <button onClick={() => setUploadedFiles(prev => prev.filter((_, idx) => idx !== i))}>
                    <CloseIcon className="w-3 h-3 hover:text-rose-500" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              multiple
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
              title="Upload documents"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about our inventory, pricing, or book a test drive..."
              className="flex-1 bg-transparent px-2 py-2 text-sm focus:outline-none"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="bg-black text-white p-2 rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
        <p className="mt-2 text-[10px] text-center text-gray-400">
          Powered by Gemini 3.1 Pro & 2.5 Flash • AutoGenius AI v1.0
        </p>
      </div>
    </div>
  );
}
