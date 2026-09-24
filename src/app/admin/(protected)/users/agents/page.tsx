"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  Search, Users, Save, Plus, X, Pencil, Trash2
} from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { useAuthStore } from "@/store/useAuthStore";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { AdminInput } from "@/components/admin/ui/AdminInput";
import { AdminTable } from "@/components/admin/ui/AdminTable";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { AdminModal } from "@/components/admin/ui/AdminModal";
import { useToastStore } from "@/store/useToastStore";
import { logAuditTrail } from "@/lib/auditLogger";

export interface TravelAgent {
  id: string;
  name: string;
  companyName: string;
  email: string;
  phone: string;
  defaultDiscount: number;
  defaultPickupLocation: string;
  createdAt: string;
}

export default function TravelAgentsPage() {
  const { user: currentUser } = useAuthStore();
  const { addToast } = useToastStore();
  
  const [agents, setAgents] = useState<TravelAgent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newAgent, setNewAgent] = useState({
    name: "", companyName: "", email: "", phone: "",
    defaultDiscount: 900000, defaultPickupLocation: ""
  });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editAgentData, setEditAgentData] = useState<TravelAgent | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const snap = await getDocs(collection(db, "agents"));
      const allAgents = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as TravelAgent[];
      
      setAgents(allAgents.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    } catch (error) {
      console.error("Error loading agents:", error);
      addToast({ title: 'Error', message: 'Failed to load agents.', variant: 'danger' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (agent: TravelAgent) => {
    if (!confirm(`Are you sure you want to delete ${agent.name}?`)) return;

    try {
      await deleteDoc(doc(db, "agents", agent.id));
      
      await logAuditTrail({
        action: "DELETE_AGENT",
        module: "Travel Agents",
        targetId: agent.id,
        details: `Deleted travel agent ${agent.name}`,
        actor: currentUser,
      });
      
      addToast({ title: 'Success', message: 'Travel agent deleted.', variant: 'success' });
      setAgents(prev => prev.filter(a => a.id !== agent.id));
    } catch (error) {
      addToast({ title: 'Error', message: 'Failed to delete agent.', variant: 'danger' });
    }
  };

  const handleEditClick = (agent: TravelAgent) => {
    setEditAgentData(agent);
    setIsEditModalOpen(true);
  };

  const handleUpdateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editAgentData) return;
    setIsProcessing(true);
    try {
      const updatePayload = {
        name: editAgentData.name,
        companyName: editAgentData.companyName,
        email: editAgentData.email,
        phone: editAgentData.phone,
        defaultDiscount: Number(editAgentData.defaultDiscount),
        defaultPickupLocation: editAgentData.defaultPickupLocation,
      };
      
      await updateDoc(doc(db, "agents", editAgentData.id), updatePayload);
      
      await logAuditTrail({
        action: "UPDATE_AGENT",
        module: "Travel Agents",
        targetId: editAgentData.id,
        details: `Updated travel agent ${editAgentData.name}`,
        actor: currentUser,
      });

      addToast({ title: 'Success', message: 'Travel agent updated.', variant: 'success' });
      setAgents(prev => prev.map(a => a.id === editAgentData.id ? { ...a, ...updatePayload } : a));
      setIsEditModalOpen(false);
    } catch (error: any) {
      addToast({ title: 'Error', message: error.message || "Failed to update agent.", variant: 'danger' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const generatedId = `AGT-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 100)}`;
      
      const payload: TravelAgent = {
        id: generatedId,
        name: newAgent.name,
        companyName: newAgent.companyName,
        email: newAgent.email,
        phone: newAgent.phone,
        defaultDiscount: Number(newAgent.defaultDiscount),
        defaultPickupLocation: newAgent.defaultPickupLocation,
        createdAt: new Date().toISOString(),
      };
      
      await setDoc(doc(db, "agents", generatedId), payload);

      await logAuditTrail({
        action: "CREATE_AGENT",
        module: "Travel Agents",
        targetId: generatedId,
        details: `Registered new travel agent: ${newAgent.name}`,
        actor: currentUser,
      });

      addToast({ title: 'Success', message: `Travel agent ${newAgent.name} successfully created.`, variant: 'success' });
      
      setAgents(prev => [payload, ...prev]);
      
      setNewAgent({ 
        name: "", companyName: "", email: "", phone: "",
        defaultDiscount: 900000, defaultPickupLocation: "" 
      });
      setIsAddModalOpen(false);
    } catch (error: any) {
      addToast({ title: 'Error', message: error.message || "Failed to save new agent.", variant: 'danger' });
    } finally {
      setIsProcessing(false);
    }
  };

  const processedData = useMemo(() => {
    return agents.filter((a) => {
      return (a.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
             (a.companyName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
             (a.email || "").toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [agents, searchQuery]);

  return (
    <div className="space-y-6 pb-20">
      
      {/* Mobile Floating Action Button */}
      <div className="md:hidden fixed bottom-[80px] right-4 z-40">
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center w-14 h-14 bg-[var(--color-gold-500)] text-[var(--color-navy-900)] rounded-sm shadow-[0_8px_16px_rgba(212,175,55,0.4)] hover:scale-105 active:scale-95 transition-transform"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Page Header */}
      <div className="md:hidden mb-4 mt-2">
        <h1 className="text-3xl font-serif text-[var(--color-navy-900)] mb-1">Travel Agents</h1>
        <p className="text-xs text-gray-500">
          Showing {processedData.length} {processedData.length === 1 ? 'agent' : 'agents'}.
        </p>
      </div>

      {/* HEADER HERO SECTION (Desktop Only) */}
      <div className="hidden md:flex bg-[var(--color-navy-900)] p-6 md:p-8 rounded-sm shadow-luxury flex-col md:flex-row justify-between md:items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-gold-500)]/10 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2 text-[var(--color-gold-400)] text-[10px] font-bold uppercase tracking-widest">
            <Users className="w-4 h-4" />
            <span>Users Directory</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-serif text-white tracking-wide">Travel Agents</h1>
          <p className="text-gray-400 text-sm mt-1 max-w-xl">
            Manage your B2B partners, contact details, and their default discounts/pickup areas.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-6 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Total</p>
            <p className="font-mono text-white text-lg">
              {agents.length} <span className="text-[10px] uppercase text-gray-400 font-sans tracking-widest">Agents</span>
            </p>
          </div>
          <AdminButton onClick={() => setIsAddModalOpen(true)} className="shrink-0 rounded-sm">
            <Plus className="w-4 h-4 mr-2" /> Add Agent
          </AdminButton>
        </div>
      </div>

      {/* Control Panel (Search & Filter) */}
      <div className="md:static md:bg-white md:p-4 md:rounded-sm md:border md:border-gray-200/60 md:shadow-sm py-3 md:py-0 mb-6 flex flex-row items-center justify-between md:justify-end gap-2 md:gap-3 -mx-4 px-4 md:mx-0 md:px-0 md:shadow-none bg-transparent">
        <div className="flex-1 md:w-96 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search name, company, or email..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-gray-200/80 md:border-none rounded-sm pl-9 pr-3 py-3 md:py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-gold-400)] shadow-sm font-medium text-[var(--color-navy-900)] placeholder:text-gray-400 transition-shadow"
          />
        </div>
      </div>

      {/* TABLE (Desktop) & CARDS (Mobile) */}
      <div className="hidden md:block">
        <AdminCard className="overflow-hidden">
        <AdminTable 
          headers={["Agent Info", "Contact Details", "Defaults", "Actions"]} 
          isLoading={isLoading} 
          skeletonCount={4}
        >
          {processedData.length === 0 && !isLoading ? (
            <tr>
              <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                <p>No agents found.</p>
              </td>
            </tr>
          ) : (
            processedData.map((agent) => (
              <tr key={agent.id} className="hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0">
                <td className="px-6 py-4">
                  <div>
                    <p className="font-bold text-[var(--color-navy-900)] text-sm">{agent.name}</p>
                    <p className="text-xs text-gray-500">{agent.companyName || "-"}</p>
                  </div>
                </td>
                
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-0.5">
                    <p className="text-xs font-medium text-gray-600">{agent.email}</p>
                    <p className="text-[10px] font-mono text-gray-400">{agent.phone}</p>
                  </div>
                </td>
                
                <td className="px-6 py-4">
                   <div className="flex flex-col gap-1">
                      <div className="text-xs">
                        <span className="text-gray-400">Discount:</span> <span className="font-mono text-red-600 font-bold">Rp {agent.defaultDiscount.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="text-xs">
                         <span className="text-gray-400">Pickup:</span> <span className="font-medium text-[var(--color-navy-900)]">{agent.defaultPickupLocation || 'None'}</span>
                      </div>
                   </div>
                </td>
                
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <AdminButton 
                      variant="outline" 
                      size="sm" 
                      className="rounded-sm text-blue-600 hover:bg-blue-50"
                      onClick={() => handleEditClick(agent)}
                      title="Edit Agent"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </AdminButton>
                    <AdminButton 
                      variant="outline" 
                      size="sm" 
                      className="rounded-sm text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(agent)}
                      title="Delete Agent"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </AdminButton>
                  </div>
                </td>
              </tr>
            ))
          )}
          </AdminTable>
        </AdminCard>
      </div>

      {/* Mobile Cards View */}
      <div className="md:hidden flex flex-col gap-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-sm border border-gray-200 p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))
        ) : processedData.length === 0 ? (
          <div className="bg-white rounded-sm border border-gray-200 p-8 text-center text-gray-500 text-sm">
            <p>No agents found.</p>
          </div>
        ) : (
          processedData.map((agent) => (
            <div key={agent.id} className="bg-white rounded-sm border border-gray-200 p-4 shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-bold text-[var(--color-navy-900)] text-sm">{agent.name}</p>
                  <p className="text-xs text-gray-500 truncate mb-1">{agent.companyName || "-"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <AdminButton 
                    variant="outline" 
                    size="sm" 
                    className="p-1.5 h-auto rounded-sm text-blue-600 border-blue-200 hover:bg-blue-50"
                    onClick={() => handleEditClick(agent)}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </AdminButton>
                  <AdminButton 
                    variant="outline" 
                    size="sm" 
                    className="p-1.5 h-auto rounded-sm text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => handleDelete(agent)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </AdminButton>
                </div>
              </div>

              <div className="text-xs font-medium text-gray-600 mb-1">{agent.email}</div>
              <div className="text-[10px] font-mono text-gray-400 mb-3">{agent.phone}</div>

              <div className="flex flex-col gap-1.5 pt-3 border-t border-gray-100 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Default Discount:</span> 
                  <span className="font-mono text-red-600 font-bold">Rp {agent.defaultDiscount.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Default Pickup:</span> 
                  <span className="font-medium text-[var(--color-navy-900)]">{agent.defaultPickupLocation || 'None'}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* CREATE AGENT MODAL */}
      <AdminModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Travel Agent"
      >
        <form onSubmit={handleCreateAgent} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Agent Name *</label>
              <AdminInput required value={newAgent.name} onChange={e => setNewAgent({...newAgent, name: e.target.value})} placeholder="e.g. AZMI" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Company Name</label>
              <AdminInput value={newAgent.companyName} onChange={e => setNewAgent({...newAgent, companyName: e.target.value})} placeholder="e.g. Kopang Travel" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Email Address</label>
              <AdminInput type="email" value={newAgent.email} onChange={e => setNewAgent({...newAgent, email: e.target.value})} placeholder="agent@example.com" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Phone Number</label>
              <AdminInput type="tel" value={newAgent.phone} onChange={e => setNewAgent({...newAgent, phone: e.target.value})} placeholder="+62..." />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Default Discount (IDR) *</label>
              <AdminInput type="number" required value={newAgent.defaultDiscount} onChange={e => setNewAgent({...newAgent, defaultDiscount: Number(e.target.value)})} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Default Pickup Location</label>
              <AdminInput value={newAgent.defaultPickupLocation} onChange={e => setNewAgent({...newAgent, defaultPickupLocation: e.target.value})} placeholder="e.g. Senggigi" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
            <AdminButton type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</AdminButton>
            <AdminButton type="submit" disabled={isProcessing}>
              {isProcessing ? 'Saving...' : 'Add Agent'}
            </AdminButton>
          </div>
        </form>
      </AdminModal>

      {/* EDIT AGENT MODAL */}
      <AdminModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Travel Agent"
      >
        {editAgentData && (
          <form onSubmit={handleUpdateAgent} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Agent Name *</label>
                <AdminInput required value={editAgentData.name} onChange={e => setEditAgentData({...editAgentData, name: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Company Name</label>
                <AdminInput value={editAgentData.companyName} onChange={e => setEditAgentData({...editAgentData, companyName: e.target.value})} />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Email Address</label>
                <AdminInput type="email" value={editAgentData.email} onChange={e => setEditAgentData({...editAgentData, email: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Phone Number</label>
                <AdminInput type="tel" value={editAgentData.phone} onChange={e => setEditAgentData({...editAgentData, phone: e.target.value})} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Default Discount (IDR) *</label>
                <AdminInput type="number" required value={editAgentData.defaultDiscount} onChange={e => setEditAgentData({...editAgentData, defaultDiscount: Number(e.target.value)})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Default Pickup Location</label>
                <AdminInput value={editAgentData.defaultPickupLocation} onChange={e => setEditAgentData({...editAgentData, defaultPickupLocation: e.target.value})} />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
              <AdminButton type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</AdminButton>
              <AdminButton type="submit" disabled={isProcessing}>
                {isProcessing ? 'Saving...' : 'Save Changes'}
              </AdminButton>
            </div>
          </form>
        )}
      </AdminModal>

    </div>
  );
}
