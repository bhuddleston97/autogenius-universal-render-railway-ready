import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import ChatBot from './components/ChatBot';
import Dashboard from './components/Dashboard';
import Login from './components/Login';

export default function App() {
  const [activeTab, setActiveTab] = useState<'chat' | 'dashboard'>('chat');
  const [user, setUser] = useState<any>(null);

  // Load user from local storage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('agent_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('agent_user');
      }
    }
  }, []);

  const handleLogin = (agent: any) => {
    setUser(agent);
    localStorage.setItem('agent_user', JSON.stringify(agent));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('agent_user');
    setActiveTab('chat');
  };

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab} 
      user={user} 
      onLogout={handleLogout}
    >
      {activeTab === 'chat' ? (
        <ChatBot />
      ) : user ? (
        <Dashboard />
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </Layout>
  );
}
