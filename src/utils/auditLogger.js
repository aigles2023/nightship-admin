import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";
import { getAuth } from "firebase/auth";

export const logAudit = async (action, orderId, details = {}) => {
  const auth = getAuth();
  const user = auth.currentUser;

  try {
    await addDoc(collection(db, "audit_logs"), {
      action,              // 'deleted', 'restored', 'final_deleted'
      orderId,
      userEmail: user?.email || "unknown",
      timestamp: serverTimestamp(),
      ...details
    });
  } catch (error) {
    console.error("Failed to log audit:", error);
  }
};
