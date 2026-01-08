import type { MasterTourClient } from '../api/client.js';
import type { ToolResult, PushNotificationsOutput, PushNotificationOutput } from '../types/outputs.js';
import { separator, formatDate } from '../utils/formatters.js';

export interface GetPushNotificationsParams {
  limit?: number;
  since?: string;
}

/**
 * Gets push notification history.
 */
export async function getPushNotifications(
  client: MasterTourClient,
  params: GetPushNotificationsParams = {}
): Promise<ToolResult<PushNotificationsOutput>> {
  const response = await client.getPushNotifications({
    limit: params.limit,
    since: params.since,
  });

  // Build structured data
  const notifications: PushNotificationOutput[] = response.notifications.map((n) => ({
    id: n.id,
    timestamp: n.timestamp,
    title: n.title,
    message: n.message,
    type: n.type,
    tourId: n.tourId,
    read: n.read,
  }));

  const data: PushNotificationsOutput = {
    notifications,
    totalCount: response.totalCount,
    unreadCount: response.unreadCount,
  };

  const text = formatNotificationsText(data);

  return { data, text };
}

function formatNotificationsText(data: PushNotificationsOutput): string {
  const lines: string[] = [
    '🔔 Push Notifications',
    separator(),
    '',
  ];

  if (data.notifications.length === 0) {
    lines.push('ℹ️ No notifications found.');
  } else {
    // Group by date
    const byDate: Record<string, PushNotificationOutput[]> = {};
    for (const notification of data.notifications) {
      const dateKey = notification.timestamp.split('T')[0] || notification.timestamp.split(' ')[0] || 'Unknown';
      if (!byDate[dateKey]) byDate[dateKey] = [];
      byDate[dateKey].push(notification);
    }

    for (const [date, dateNotifications] of Object.entries(byDate)) {
      lines.push(`📅 ${formatDate(date)}:`);
      for (const notification of dateNotifications) {
        const time = extractTime(notification.timestamp);
        const readIcon = notification.read === false ? '🔵' : '⚪';
        lines.push(`  ${readIcon} [${time}] ${notification.title}`);
        if (notification.message) {
          lines.push(`     ${notification.message}`);
        }
        if (notification.type) {
          lines.push(`     📋 Type: ${notification.type}`);
        }
      }
      lines.push('');
    }

    lines.push(separator());
    lines.push(`Total: ${data.totalCount} notification${data.totalCount !== 1 ? 's' : ''}`);
    if (data.unreadCount !== undefined) {
      lines.push(`Unread: ${data.unreadCount}`);
    }
  }

  return lines.join('\n');
}

function extractTime(timestamp: string): string {
  // Handle ISO format or datetime format
  const timeMatch = timestamp.match(/T(\d{2}:\d{2})/);
  if (timeMatch) return timeMatch[1];

  const spaceMatch = timestamp.match(/\s(\d{2}:\d{2})/);
  if (spaceMatch) return spaceMatch[1];

  return timestamp;
}
