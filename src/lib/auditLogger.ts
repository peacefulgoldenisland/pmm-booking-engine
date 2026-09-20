import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import type { User } from "@/types/user";

type AuditActor = Pick<User, "id" | "email" | "fullName" | "role">;

export interface AuditLogParams {
  action: string;
  module: string;
  targetId?: string;
  details: string;
  actor: AuditActor | User | null | undefined;
  ipAddress?: string;
}

/**
 * Log activities to 'audit_logs' collection in Firestore.
 */
export const logAuditTrail = async (params: AuditLogParams) => {
  try {
    const actorData = params.actor ? {
      uid: params.actor.id,
      email: params.actor.email,
      name: params.actor.fullName || "Unknown Admin",
      role: params.actor.role
    } : {
      uid: "SYSTEM",
      email: "system@peacefulgoldenisland.com",
      name: "System Auto",
      role: "system"
    };

    await addDoc(collection(db, "audit_logs"), {
      action: params.action,
      module: params.module,
      targetId: params.targetId || null,
      details: params.details,
      actor: actorData,
      adminEmail: actorData.email, // for search indexing
      ipAddress: params.ipAddress || null,
      timestamp: serverTimestamp(),
    });
    
  } catch (error) {
    console.error("Failed to write audit log:", error);
  }
};
