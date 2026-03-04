import React, { useState, useEffect } from 'react';
import { Users, Calendar, Phone, Mail, Car, Clock, UserCheck, AlertCircle, X, MessageSquare, Bot, User as UserIcon, FileText, Download, Zap, Save, StickyNote, Loader2, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Lead, Appointment, Agent, Message } from '../types';
import { cn } from '../lib/utils';
import Markdown from 'react-markdown';

export default function Dashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterApptStatus, setFilterApptStatus] = useState<string>('all');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedLeadDocs, setSelectedLeadDocs] = useState<any[]>([]);
  const [leadNotes, setLeadNotes] = useState<string>('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  const fetchData = async () => {
    try {
      const [leadsRes, apptsRes, agentsRes] = await Promise.all([
        fetch('/api/leads'),
        fetch('/api/appointments'),
        fetch('/api/agents')
      ]);
      
      setLeads(await leadsRes.json());
      setAppointments(await apptsRes.json());
      setAgents(await agentsRes.json());
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedLead) {
      setLeadNotes(selectedLead.notes || '');
      fetch(`/api/leads/${selectedLead.id}/documents`)
        .then(res => res.json())
        .then(data => setSelectedLeadDocs(data))
        .catch(err => console.error('Error fetching docs:', err));
    } else {
      setSelectedLeadDocs([]);
    }
  }, [selectedLead]);

  const updateAppointmentStatus = async (id: number, status: string) => {
    try {
      await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      fetchData();
    } catch (error) {
      console.error('Error updating appointment status:', error);
    }
  };

  const updateLeadStatus = async (id: number, status: string) => {
    try {
      await fetch(`/api/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      fetchData();
    } catch (error) {
      console.error('Error updating lead status:', error);
    }
  };

  const updateLeadAssignment = async (leadId: number, agentId: string) => {
    try {
      await fetch(`/api/leads/${leadId}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: agentId === 'none' ? null : parseInt(agentId) })
      });
      fetchData();
    } catch (error) {
      console.error('Error updating lead assignment:', error);
    }
  };

  const updateLeadNotes = async () => {
    if (!selectedLead) return;
    setIsSavingNotes(true);
    try {
      await fetch(`/api/leads/${selectedLead.id}/notes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: leadNotes })
      });
      // Update local state
      setLeads(prev => prev.map(l => l.id === selectedLead.id ? { ...l, notes: leadNotes } : l));
      setSelectedLead(prev => prev ? { ...prev, notes: leadNotes } : null);
    } catch (error) {
      console.error('Error updating lead notes:', error);
    } finally {
      setIsSavingNotes(false);
    }
  };

  const filteredLeads = filterStatus === 'all' 
    ? leads 
    : leads.filter(l => l.status === filterStatus);

  const filteredAppointments = filterApptStatus === 'all'
    ? appointments
    : appointments.filter(a => a.status === filterApptStatus);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stats Cards */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-black/5 flex items-center gap-4">
          <div className="bg-indigo-100 p-3 rounded-2xl">
            <Users className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Leads</p>
            <p className="text-2xl font-bold text-gray-900">{leads.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-black/5 flex items-center gap-4">
          <div className="bg-emerald-100 p-3 rounded-2xl">
            <Calendar className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Appointments</p>
            <p className="text-2xl font-bold text-gray-900">{appointments.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-black/5 flex items-center gap-4">
          <div className="bg-amber-100 p-3 rounded-2xl">
            <UserCheck className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Active Agents</p>
            <p className="text-2xl font-bold text-gray-900">{agents.filter(a => a.status === 'available').length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Leads */}
        <section className="space-y-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Users className="w-5 h-5" />
                Leads Management
              </h2>
              <span className="text-xs text-gray-400">Auto-assigned to agents</span>
            </div>
            
            {/* Filter Tabs */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl self-start">
              {['all', 'new', 'contacted', 'qualified', 'unqualified'].map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                    filterStatus === s 
                      ? "bg-white text-black shadow-sm" 
                      : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-black/5 overflow-hidden">
            <div className="divide-y divide-black/5">
              {filteredLeads.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-sm">No leads found for this filter.</div>
              ) : (
                filteredLeads.map((lead) => (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    key={lead.id} 
                    onClick={() => setSelectedLead(lead)}
                    className="p-4 hover:bg-gray-50 transition-colors cursor-pointer group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">{lead.name}</h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Mail className="w-3 h-3" /> {lead.email}
                          </span>
                          {lead.phone && (
                            <span className="flex items-center gap-1 text-xs text-gray-500">
                              <Phone className="w-3 h-3" /> {lead.phone}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={cn(
                          "text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full",
                          lead.status === 'new' ? "bg-blue-100 text-blue-700" : 
                          lead.status === 'contacted' ? "bg-amber-100 text-amber-700" :
                          lead.status === 'qualified' ? "bg-emerald-100 text-emerald-700" :
                          "bg-rose-100 text-rose-700"
                        )}>
                          {lead.status}
                        </span>
                        <select 
                          value={lead.status}
                          onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                          className="text-[10px] bg-transparent border border-black/10 rounded px-1 py-0.5 focus:outline-none focus:border-black/30"
                        >
                          <option value="new">New</option>
                          <option value="contacted">Contacted</option>
                          <option value="qualified">Qualified</option>
                          <option value="unqualified">Unqualified</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg">
                        <Car className="w-3.5 h-3.5" />
                        Interested in: <span className="font-medium text-gray-900">{lead.interest || 'General Inquiry'}</span>
                      </div>
                      <div className="text-xs text-gray-400 italic flex items-center gap-2">
                        Assigned to: 
                        <select 
                          value={lead.agent_id || 'none'}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => updateLeadAssignment(lead.id, e.target.value)}
                          className="text-[10px] bg-transparent border border-black/10 rounded px-1 py-0.5 focus:outline-none focus:border-black/30 text-indigo-600 font-medium"
                        >
                          <option value="none">Unassigned</option>
                          {agents.map(agent => (
                            <option key={agent.id} value={agent.id}>
                              {agent.name} ({agent.leadCount || 0} active)
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Upcoming Appointments */}
        <section className="space-y-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Appointments
              </h2>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl self-start">
              {['all', 'scheduled', 'completed', 'cancelled'].map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterApptStatus(s)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                    filterApptStatus === s 
                      ? "bg-white text-black shadow-sm" 
                      : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-black/5 overflow-hidden">
            <div className="divide-y divide-black/5">
              {filteredAppointments.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-sm">No appointments found for this filter.</div>
              ) : (
                filteredAppointments.map((appt) => (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    key={appt.id} 
                    className="p-4 hover:bg-gray-50 transition-colors flex gap-4"
                  >
                    <div className="bg-black text-white rounded-2xl p-3 flex flex-col items-center justify-center min-w-[70px] h-[70px]">
                      <span className="text-[10px] uppercase font-bold opacity-70">
                        {new Date(appt.date).toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                      <span className="text-xl font-bold">
                        {new Date(appt.date).getDate()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h3 className="font-semibold text-gray-900">{appt.lead_name}</h3>
                        <div className="flex flex-col items-end gap-1">
                          <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                            <Clock className="w-3 h-3" /> {appt.time}
                          </span>
                          <span className={cn(
                            "text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
                            appt.status === 'scheduled' ? "bg-blue-100 text-blue-700" :
                            appt.status === 'completed' ? "bg-emerald-100 text-emerald-700" :
                            "bg-rose-100 text-rose-700"
                          )}>
                            {appt.status}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <Car className="w-3 h-3" /> {appt.interest}
                      </p>
                      {appt.notes && (
                        <div className="mt-2 p-2 bg-amber-50 rounded-lg border border-amber-100 flex gap-2">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <p className="text-[11px] text-amber-800 leading-tight">{appt.notes}</p>
                        </div>
                      )}
                      
                      {appt.status === 'scheduled' && (
                        <div className="mt-3 flex gap-2">
                          <button 
                            onClick={() => updateAppointmentStatus(appt.id, 'completed')}
                            className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-100 hover:bg-emerald-100 transition-colors"
                          >
                            Mark Completed
                          </button>
                          <button 
                            onClick={() => updateAppointmentStatus(appt.id, 'cancelled')}
                            className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-1 rounded border border-rose-100 hover:bg-rose-100 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Embed Code Section */}
      <section className="bg-indigo-900 text-white p-8 rounded-3xl shadow-xl overflow-hidden relative">
        <div className="relative z-10 space-y-4 max-w-2xl">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="w-6 h-6 text-amber-400" />
            Embed AutoGenius on your Website
          </h2>
          <p className="text-indigo-100 text-sm leading-relaxed">
            Copy and paste this script tag into your website's <code className="bg-indigo-800 px-1 rounded">&lt;body&gt;</code> to enable the AI assistant widget. It will automatically crawl your site content to provide accurate answers.
          </p>
          <div className="bg-black/30 backdrop-blur-md p-4 rounded-2xl border border-white/10 font-mono text-[10px] break-all">
            &lt;script src="{window.location.origin}/embed.js"&gt;&lt;/script&gt;
          </div>
        </div>
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-indigo-500 rounded-full blur-3xl opacity-20"></div>
      </section>

      {/* Lead Detail Modal */}
      <AnimatePresence>
        {selectedLead && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-3xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-black/5 flex items-center justify-between bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center text-white">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedLead.name}</h2>
                    <p className="text-sm text-gray-500">Lead ID: #{selectedLead.id} • Registered {new Date(selectedLead.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedLead(null)}
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Contact Information</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm text-gray-700">
                        <Mail className="w-4 h-4 text-gray-400" />
                        {selectedLead.email}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-700">
                        <Phone className="w-4 h-4 text-gray-400" />
                        {selectedLead.phone || 'No phone provided'}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-700">
                        <Car className="w-4 h-4 text-gray-400" />
                        Interested in: <span className="font-semibold">{selectedLead.interest || 'General Inquiry'}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-700">
                        <Globe className="w-4 h-4 text-gray-400" />
                        Source: <span className="font-semibold">{selectedLead.leadSource || 'Website'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Status & Assignment</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm text-gray-700">
                        <span className="text-gray-400 w-4 font-bold">S</span>
                        Status: 
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                          selectedLead.status === 'new' ? "bg-blue-100 text-blue-700" : 
                          selectedLead.status === 'contacted' ? "bg-amber-100 text-amber-700" :
                          selectedLead.status === 'qualified' ? "bg-emerald-100 text-emerald-700" :
                          "bg-rose-100 text-rose-700"
                        )}>
                          {selectedLead.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-700">
                        <UserCheck className="w-4 h-4 text-gray-400" />
                        Assigned Agent: 
                        <select 
                          value={selectedLead.agent_id || 'none'}
                          onChange={(e) => {
                            updateLeadAssignment(selectedLead.id, e.target.value);
                            setSelectedLead(prev => prev ? { ...prev, agent_id: e.target.value === 'none' ? null : parseInt(e.target.value) } : null);
                          }}
                          className="text-xs bg-transparent border border-black/10 rounded px-2 py-1 focus:outline-none focus:border-black/30 font-semibold text-indigo-600"
                        >
                          <option value="none">Unassigned</option>
                          {agents.map(agent => (
                            <option key={agent.id} value={agent.id}>
                              {agent.name} ({agent.leadCount || 0} active)
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Internal Notes */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <StickyNote className="w-4 h-4 text-gray-400" />
                      <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Internal Agent Notes</h3>
                    </div>
                    {selectedLead.notes !== leadNotes && (
                      <button 
                        onClick={updateLeadNotes}
                        disabled={isSavingNotes}
                        className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
                      >
                        {isSavingNotes ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                        SAVE CHANGES
                      </button>
                    )}
                  </div>
                  <textarea
                    value={leadNotes}
                    onChange={(e) => setLeadNotes(e.target.value)}
                    placeholder="Add internal notes about this lead (e.g., preferred contact time, trade-in details)..."
                    className="w-full h-32 bg-amber-50/50 border border-amber-100 rounded-2xl p-4 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-200 transition-all resize-none placeholder:text-gray-400"
                  />
                </div>

                {/* Conversation History */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-gray-400" />
                      <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Conversation Transcript</h3>
                    </div>
                    <span className="text-[10px] text-gray-400 font-mono">LOG_ID: {selectedLead.id}</span>
                  </div>
                  
                  <div className="bg-white rounded-2xl border border-black/5 overflow-hidden shadow-inner">
                    <div className="max-h-[300px] overflow-y-auto divide-y divide-black/5">
                      {selectedLead.history ? (
                        (() => {
                          try {
                            const history = JSON.parse(selectedLead.history) as Message[];
                            return history.map((msg, i) => (
                              <div key={i} className="p-4 flex gap-4 hover:bg-gray-50 transition-colors">
                                <div className={cn(
                                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                                  msg.role === 'user' ? "bg-gray-100" : "bg-indigo-50"
                                )}>
                                  {msg.role === 'user' ? (
                                    <UserIcon className="w-4 h-4 text-gray-600" />
                                  ) : (
                                    <Bot className="w-4 h-4 text-indigo-600" />
                                  )}
                                </div>
                                <div className="flex-1 space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                      {msg.role === 'user' ? 'Customer' : 'AI Assistant'}
                                    </span>
                                  </div>
                                  <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
                                    <Markdown>{msg.text}</Markdown>
                                  </div>
                                </div>
                              </div>
                            ));
                          } catch (e) {
                            return <div className="p-8 text-center text-gray-400 text-xs italic">Error parsing conversation history.</div>;
                          }
                        })()
                      ) : (
                        <div className="p-12 text-center">
                          <MessageSquare className="w-8 h-8 text-gray-200 mx-auto mb-3" />
                          <p className="text-sm text-gray-400 italic">No conversation history available for this lead.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Uploaded Documents */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Verification Documents</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedLeadDocs.length > 0 ? (
                      selectedLeadDocs.map((doc, i) => (
                        <div key={i} className="bg-gray-50 p-3 rounded-xl border border-black/5 flex items-center justify-between group">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                              <FileText className="w-4 h-4 text-indigo-600" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-gray-900 truncate max-w-[150px]">{doc.name}</p>
                              <p className="text-[10px] text-gray-500 uppercase">{doc.type}</p>
                            </div>
                          </div>
                          <a 
                            href={doc.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-400 italic col-span-2 py-2">No documents uploaded yet.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-black/5 bg-gray-50 flex justify-end gap-3">
                <button 
                  onClick={() => setSelectedLead(null)}
                  className="px-6 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
                <button 
                  className="px-6 py-2 rounded-xl text-sm font-medium bg-black text-white hover:bg-gray-800 transition-colors"
                >
                  Contact Lead
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
