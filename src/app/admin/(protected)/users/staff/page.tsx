"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  Search, ShieldCheck, User, Ban, 
  Save, ArrowRight, UserPlus, X, Lock, Pencil
} from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { useAuthStore } from "@/store/useAuthStore";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { AdminInput } from "@/components/admin/ui/AdminInput";
import { AdminSelect } from "@/components/admin/ui/AdminSelect";
import { AdminTable } from "@/components/admin/ui/AdminTable";
import { AdminBadge } from "@/components/admin/ui/AdminBadge";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { AdminModal } from "@/components/admin/ui/AdminModal";
import { useToastStore } from "@/store/useToastStore";

import type { User as UserType, Role } from "@/types/user";
import { logAuditTrail } from "@/lib/auditLogger";

const ROLE_MAP: Record<string, { label: string; color: "danger" | "warning" | "info" | "success" | "default" }> = {
  superadmin: { label: "Super Admin", color: "danger" },
  admin:      { label: "Admin", color: "info" },
};

const MENU_OPTIONS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "bookings",  label: "Bookings & Manifest" },
  { id: "voyages",   label: "Trips / Voyages" },
  { id: "guests",    label: "Guests Directory" },
  { id: "vouchers",  label: "Vouchers & Promo" },
  { id: "staff",     label: "Staff Management" },
  { id: "audit",     label: "Security & Audit" },
  { id: "system",    label: "System / Dev Tools" },
];

export default function StaffManagementPage() {
  const { user: currentUser } = useAuthStore();
  const { addToast } = useToastStore();
  
  const [users, setUsers] = useState<UserType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("all");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newStaff, setNewStaff] = useState({
    name: "", email: "", phone: "", password: "",
    role: "admin" as Role,
    allowedMenus: [] as string[],
  });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editStaffData, setEditStaffData] = useState<UserType | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const snap = await getDocs(collection(db, "users"));
      const allUsers = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as UserType[];
      
      const staffMembers = allUsers.filter(u => u.role === 'admin' || u.role === 'superadmin');
      setUsers(staffMembers);
    } catch (error) {
      console.error("Error loading staff:", error);
      addToast({ title: 'Error', message: 'Failed to load staff members.', variant: 'danger' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSuspend = async (targetUser: UserType) => {
    if (targetUser.id === currentUser?.id) {
      addToast({ title: 'Error', message: 'You cannot suspend yourself.', variant: 'danger' });
      return;
    }
    
    if (!confirm(`Are you sure you want to ${targetUser.isSuspended ? 'restore' : 'suspend'} access for ${targetUser.fullName}?`)) return;

    try {
      const newStatus = !targetUser.isSuspended;
      await updateDoc(doc(db, "users", targetUser.id), { isSuspended: newStatus });
      
      await logAuditTrail({
        action: "TOGGLE_SUSPEND",
        module: "Staff Management",
        targetId: targetUser.id,
        details: `Changed access status for ${targetUser.email} to ${newStatus ? 'Suspended' : 'Active'}`,
        actor: currentUser,
      });
      
      addToast({ title: 'Success', message: 'Access status updated.', variant: 'success' });
      setUsers(prev => prev.map(u => u.id === targetUser.id ? { ...u, isSuspended: newStatus } : u));
    } catch (error) {
      addToast({ title: 'Error', message: 'Failed to update access status.', variant: 'danger' });
    }
  };

  const handleEditClick = (staff: UserType) => {
    setEditStaffData(staff);
    setIsEditModalOpen(true);
  };

  const handleUpdateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editStaffData) return;
    setIsProcessing(true);
    try {
      const updatePayload = {
        fullName: editStaffData.fullName,
        phone: editStaffData.phone || "",
        role: editStaffData.role,
        allowedMenus: editStaffData.role === 'admin' ? (editStaffData.allowedMenus || []) : [],
      };
      
      await updateDoc(doc(db, "users", editStaffData.id), updatePayload);
      
      await logAuditTrail({
        action: "UPDATE_STAFF",
        module: "Staff Management",
        targetId: editStaffData.id,
        details: `Updated staff profile for ${editStaffData.email}`,
        actor: currentUser,
      });

      addToast({ title: 'Success', message: 'Staff profile updated.', variant: 'success' });
      setUsers(prev => prev.map(u => u.id === editStaffData.id ? { ...u, ...updatePayload } : u));
      setIsEditModalOpen(false);
    } catch (error: any) {
      addToast({ title: 'Error', message: error.message || "Failed to update staff.", variant: 'danger' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newStaff.password.length < 6) { 
      addToast({ title: 'Error', message: 'Password must be at least 6 characters.', variant: 'danger' });
      return; 
    }
    setIsProcessing(true);
    try {
      const res = await fetch("/api/admin/create-staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newStaff),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create staff");

      await logAuditTrail({
        action: "CREATE_STAFF",
        module: "Staff Management",
        targetId: data.uid,
        details: `Registered new staff: ${newStaff.email} with role: ${newStaff.role}`,
        actor: currentUser,
      });

      addToast({ title: 'Success', message: `Staff account for ${newStaff.name} successfully created.`, variant: 'success' });
      
      setUsers(prev => [{
        id: data.uid,
        ...data.data,
      }, ...prev]);
      
      setNewStaff({ name: "", email: "", phone: "", password: "", role: "admin", allowedMenus: [] });
      setIsAddModalOpen(false);
    } catch (error: any) {
      addToast({ title: 'Error', message: error.message || "Failed to save new staff entity.", variant: 'danger' });
    } finally {
      setIsProcessing(false);
    }
  };

  const processedData = useMemo(() => {
    return users.filter((u) => {
      const matchSearch = (u.fullName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                          u.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchRole = filterRole === "all" ? true : u.role === filterRole;
      return matchSearch && matchRole;
    });
  }, [users, searchQuery, filterRole]);

  const activeCount = users.filter(u => !u.isSuspended).length;
  const suspendedCount = users.filter(u => u.isSuspended).length;

  return (
    <div className="space-y-6">
      
      {/* HEADER HERO SECTION */}
      <div className="bg-[var(--color-navy-900)] p-6 md:p-8 rounded-sm shadow-luxury flex flex-col md:flex-row justify-between md:items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-gold-500)]/10 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2 text-[var(--color-gold-400)] text-[10px] font-bold uppercase tracking-widest">
            <ShieldCheck className="w-4 h-4" />
            <span>Settings / Access Control</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-serif text-white tracking-wide">Staff Management</h1>
          <p className="text-gray-400 text-sm mt-1 max-w-xl">
            Control internal staff access, roles, and granular menu permissions securely.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-6 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Status</p>
            <p className="font-mono text-white text-lg">
              {activeCount} <span className="text-[10px] uppercase text-gray-400 font-sans tracking-widest">Active</span>
              {' / '}
              {suspendedCount} <span className="text-[10px] uppercase text-gray-400 font-sans tracking-widest">Suspended</span>
            </p>
          </div>
          <AdminButton onClick={() => setIsAddModalOpen(true)} className="shrink-0 rounded-sm">
            <UserPlus className="w-4 h-4 mr-2" /> Add Staff
          </AdminButton>
        </div>
      </div>

      {/* FILTER & SEARCH */}
      <AdminCard className="p-4 flex flex-col sm:flex-row gap-4 justify-between items-center bg-white/60">
        <div className="relative w-full sm:max-w-md">
          <AdminInput 
            placeholder="Search name or email..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-gray-400" />}
          />
        </div>
        <div className="w-full sm:w-auto">
          <AdminSelect 
            value={filterRole} 
            onChange={(val) => setFilterRole(val)}
            options={[
              { value: "all", label: "All Roles" },
              { value: "superadmin", label: "Super Admin" },
              { value: "admin", label: "Admin" }
            ]}
          />
        </div>
      </AdminCard>

      {/* TABLE */}
      <AdminCard className="overflow-hidden">
        <AdminTable 
          headers={["Staff Info", "Role & Access", "Status", "Actions"]} 
          isLoading={isLoading} 
          skeletonCount={4}
        >
          {processedData.length === 0 && !isLoading ? (
            <tr>
              <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                <p>No staff found.</p>
              </td>
            </tr>
          ) : (
            processedData.map((staff) => (
              <tr key={staff.id} className="hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0">
                <td className="px-6 py-4">
                  <div>
                    <p className="font-bold text-[var(--color-navy-900)] text-sm">{staff.fullName}</p>
                    <p className="text-xs text-gray-500">{staff.email}</p>
                    {staff.phone && <p className="text-[10px] font-mono text-gray-400 mt-0.5">{staff.phone}</p>}
                  </div>
                </td>
                
                <td className="px-6 py-4">
                  <div className="flex flex-col items-start gap-1">
                    <AdminBadge variant={ROLE_MAP[staff.role]?.color || "default"}>
                      {ROLE_MAP[staff.role]?.label || staff.role}
                    </AdminBadge>
                    {staff.role === 'admin' && staff.allowedMenus && (
                      <p className="text-[10px] text-gray-500 font-mono mt-1 max-w-[200px] truncate" title={staff.allowedMenus.join(', ')}>
                        Access: {staff.allowedMenus.length} modules
                      </p>
                    )}
                  </div>
                </td>
                
                <td className="px-6 py-4">
                  {staff.isSuspended ? (
                    <div className="flex items-center gap-1.5 text-red-600">
                      <Lock className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Suspended</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-emerald-600">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Active</span>
                    </div>
                  )}
                </td>
                
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <AdminButton 
                      variant="outline" 
                      size="sm" 
                      className="rounded-sm text-blue-600 hover:bg-blue-50"
                      onClick={() => handleEditClick(staff)}
                      title="Edit Staff"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </AdminButton>
                    <AdminButton 
                      variant="outline" 
                      size="sm" 
                      className={`rounded-sm ${staff.isSuspended ? 'text-emerald-600 hover:bg-emerald-50' : 'text-red-600 hover:bg-red-50'}`}
                      onClick={() => handleToggleSuspend(staff)}
                      title={staff.isSuspended ? 'Restore Access' : 'Suspend'}
                    >
                      {staff.isSuspended ? <ShieldCheck className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                    </AdminButton>
                  </div>
                </td>
              </tr>
            ))
          )}
        </AdminTable>
      </AdminCard>

      {/* CREATE STAFF MODAL */}
      <AdminModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Staff Member"
      >
        <form onSubmit={handleCreateStaff} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Full Name</label>
              <AdminInput required value={newStaff.name} onChange={e => setNewStaff({...newStaff, name: e.target.value})} placeholder="e.g. John Doe" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Email Address</label>
              <AdminInput type="email" required value={newStaff.email} onChange={e => setNewStaff({...newStaff, email: e.target.value})} placeholder="john@example.com" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Phone Number (Optional)</label>
              <AdminInput type="tel" value={newStaff.phone} onChange={e => setNewStaff({...newStaff, phone: e.target.value})} placeholder="+62..." />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Temporary Password</label>
              <AdminInput type="password" required value={newStaff.password} onChange={e => setNewStaff({...newStaff, password: e.target.value})} placeholder="Min. 6 chars" />
            </div>
          </div>

          <div className="space-y-1 pt-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Role Level</label>
            <AdminSelect 
              value={newStaff.role}
              onChange={val => setNewStaff({...newStaff, role: val as Role})}
              options={[
                { value: "admin", label: "Admin (Restricted)" },
                { value: "superadmin", label: "Super Admin (Full Access)" }
              ]}
            />
          </div>

          {newStaff.role === 'admin' && (
            <div className="space-y-2 pt-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Menu Access Permissions</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-gray-50 p-3 rounded-sm border border-gray-100">
                {MENU_OPTIONS.map(menu => (
                  <label key={menu.id} className="flex items-center gap-2 cursor-pointer hover:bg-white p-2 rounded transition-colors">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded text-[var(--color-navy-900)] border-gray-300 focus:ring-[var(--color-gold-500)]"
                      checked={newStaff.allowedMenus.includes(menu.id)}
                      onChange={e => {
                        const checked = e.target.checked;
                        setNewStaff(prev => ({
                          ...prev,
                          allowedMenus: checked 
                            ? [...prev.allowedMenus, menu.id]
                            : prev.allowedMenus.filter(m => m !== menu.id)
                        }))
                      }}
                    />
                    <span className="text-xs font-bold text-[var(--color-navy-900)]">{menu.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
            <AdminButton type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</AdminButton>
            <AdminButton type="submit" disabled={isProcessing}>
              {isProcessing ? 'Saving...' : 'Create Account'}
            </AdminButton>
          </div>
        </form>
      </AdminModal>

      {/* EDIT STAFF MODAL */}
      <AdminModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Staff Member"
      >
        {editStaffData && (
          <form onSubmit={handleUpdateStaff} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Full Name</label>
                <AdminInput required value={editStaffData.fullName} onChange={e => setEditStaffData({...editStaffData, fullName: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Email Address</label>
                <AdminInput type="email" disabled value={editStaffData.email} className="bg-gray-100 opacity-70 cursor-not-allowed" title="Email cannot be changed" />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Phone Number</label>
                <AdminInput type="tel" value={editStaffData.phone || ""} onChange={e => setEditStaffData({...editStaffData, phone: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Role Level</label>
                <AdminSelect 
                  value={editStaffData.role}
                  onChange={val => setEditStaffData({...editStaffData, role: val as Role})}
                  options={[
                    { value: "admin", label: "Admin (Restricted)" },
                    { value: "superadmin", label: "Super Admin (Full Access)" }
                  ]}
                />
              </div>
            </div>

            {editStaffData.role === 'admin' && (
              <div className="space-y-2 pt-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Menu Access Permissions</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-gray-50 p-3 rounded-sm border border-gray-100">
                  {MENU_OPTIONS.map(menu => (
                    <label key={menu.id} className="flex items-center gap-2 cursor-pointer hover:bg-white p-2 rounded transition-colors">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded text-[var(--color-navy-900)] border-gray-300 focus:ring-[var(--color-gold-500)]"
                        checked={(editStaffData.allowedMenus || []).includes(menu.id)}
                        onChange={e => {
                          const checked = e.target.checked;
                          setEditStaffData(prev => {
                            if (!prev) return prev;
                            const menus = prev.allowedMenus || [];
                            return {
                              ...prev,
                              allowedMenus: checked 
                                ? [...menus, menu.id]
                                : menus.filter(m => m !== menu.id)
                            };
                          });
                        }}
                      />
                      <span className="text-xs font-bold text-[var(--color-navy-900)]">{menu.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

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
