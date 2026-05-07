export type AdminNotificationType = 'emergency' | 'ambulance' | 'system';
export type AdminNotificationPriority = 'normal' | 'high' | 'critical';
export type AdminNotificationStatus = 'unread' | 'read' | 'acknowledged';

export interface AdminNotification {
  id: string;
  type: AdminNotificationType;
  category: string;
  requestId?: string;
  title: string;
  message: string;
  priority: AdminNotificationPriority;
  status: AdminNotificationStatus;
  senderName?: string;
  emergencyType?: string;
  location?: { address?: string; latitude?: number; longitude?: number };
  acknowledgedAt?: string;
  createdAt: string;
}
