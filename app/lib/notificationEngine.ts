import { getDb } from './db';

export interface NotificationRecord {
  id: string;
  userId: string | null; // null means global or role-based
  type: 'BLOCK_APPROVAL_NEEDED' | 'CRITICAL_OVERDUE' | 'PLAN_PUBLISHED' | 'EMERGENCY_BLOCK';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  relatedEntityId: string | null;
}

export const notificationEngine = {
  createNotification(notification: Omit<NotificationRecord, 'id' | 'isRead' | 'createdAt'>): NotificationRecord {
    const db = getDb();
    const id = `NOTIF-${Date.now().toString(36).toUpperCase()}`;
    const createdAt = new Date().toISOString();
    
    db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, message, is_read, created_at, related_entity_id)
      VALUES (?, ?, ?, ?, ?, 0, ?, ?)
    `).run(
      id,
      notification.userId,
      notification.type,
      notification.title,
      notification.message,
      createdAt,
      notification.relatedEntityId
    );
    
    return {
      id,
      ...notification,
      isRead: false,
      createdAt
    };
  },

  getNotificationsForUser(userId: string | null): NotificationRecord[] {
    const db = getDb();
    let rows;
    if (userId) {
      rows = db.prepare('SELECT * FROM notifications WHERE user_id = ? OR user_id IS NULL ORDER BY created_at DESC').all(userId) as any[];
    } else {
      rows = db.prepare('SELECT * FROM notifications WHERE user_id IS NULL ORDER BY created_at DESC').all() as any[];
    }
    return rows.map(r => this.mapRow(r));
  },

  markAsRead(id: string) {
    const db = getDb();
    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(id);
  },

  getUnreadCount(userId: string | null): number {
    const db = getDb();
    if (userId) {
      const result = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE is_read = 0 AND (user_id = ? OR user_id IS NULL)').get(userId) as any;
      return result.count;
    } else {
      const result = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE is_read = 0 AND user_id IS NULL').get() as any;
      return result.count;
    }
  },

  autoGenerateApprovalNeeded(planId: string) {
    this.createNotification({
      userId: null, // notify approvers
      type: 'BLOCK_APPROVAL_NEEDED',
      title: 'Plan Approval Required',
      message: `Plan ${planId} has been proposed and requires approval.`,
      relatedEntityId: planId,
    });
  },

  autoGeneratePlanPublished(planId: string) {
    this.createNotification({
      userId: null,
      type: 'PLAN_PUBLISHED',
      title: 'New Block Plan Published',
      message: `Plan ${planId} has been published and is ready for execution.`,
      relatedEntityId: planId,
    });
  },
  
  autoGenerateCriticalOverdue(taskId: string, title: string, overdueDays: number) {
    this.createNotification({
      userId: null,
      type: 'CRITICAL_OVERDUE',
      title: 'Critical Task Overdue',
      message: `Critical task "${title}" is overdue by ${overdueDays} days. Immediate action required.`,
      relatedEntityId: taskId,
    });
  },

  mapRow(row: any): NotificationRecord {
    return {
      id: row.id,
      userId: row.user_id,
      type: row.type,
      title: row.title,
      message: row.message,
      isRead: row.is_read === 1,
      createdAt: row.created_at,
      relatedEntityId: row.related_entity_id,
    };
  }
};
