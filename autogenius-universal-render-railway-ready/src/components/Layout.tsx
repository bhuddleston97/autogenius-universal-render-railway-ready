import React from 'react';
import { Car, LayoutDashboard, MessageSquare, LogOut, User } from 'lucide-react';
import { cn } from '../lib/utils';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: 'chat' | 'dashboard';
  setActiveTab: (tab: 'chat' | 'dashboard') => void;
  user?: any;
  onLogout?: () => void;
}

export default function Layout({ children, activeTab, setActiveTab, user, onLogout }: LayoutProps) {
  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col font-sans overflow-x-hidden">
      {/* Header */}
      <header className="bg-white border-b border-black/5 px-6 py-4 flex items-center justify-between sticky top-0 z-50 shrink-0">
        <div className="flex items-center gap-2">
          <div className="bg-black p-2 rounded-lg">
            <Car className="text-white w-6 h-6" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-gray-900">
            AutoGenius <span className="text-gray-400 font-normal">AI</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-6">
          <nav className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('chat')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                activeTab === 'chat' 
                  ? "bg-white text-black shadow-sm" 
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              <MessageSquare className="w-4 h-4" />
              Customer Chat
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                activeTab === 'dashboard' 
                  ? "bg-white text-black shadow-sm" 
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              <LayoutDashboard className="w-4 h-4" />
              Agent Dashboard
            </button>
          </nav>

          {user && (
            <div className="flex items-center gap-4 pl-6 border-l border-black/5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-xs font-bold text-gray-900 leading-none">{user.name}</p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">{user.status}</p>
                </div>
              </div>
              <button 
                onClick={onLogout}
                className="p-2 text-gray-400 hover:text-rose-500 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col w-full relative">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-black/5 p-4 text-center text-xs text-gray-400 shrink-0">
        &copy; 2026 AutoGenius AI Dealership Systems. All rights reserved.
      </footer>
    </div>
  );
}
