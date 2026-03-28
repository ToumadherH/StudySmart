import React, { useState, useEffect, useCallback } from "react";
import { notificationService } from "../services/apiService";
import "./NotificationBell.css";

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await notificationService.list({
        ordering: "-created_at",
        limit: 10,
      });
      const raw = response.data;
      const list = Array.isArray(raw) ? raw : raw.results ?? [];
      setNotifications(list);

      const unreadResp = await notificationService.getUnreadCount();
      setUnreadCount(unreadResp.data.unread_count);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  }, []);

  useEffect(() => {
    const runFetch = () => {
      void fetchNotifications();
    };

    const timeout = setTimeout(runFetch, 0);
    const interval = setInterval(runFetch, 30000); // Refresh every 30 seconds
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      fetchNotifications();
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await notificationService.delete(id);
      fetchNotifications();
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  return (
    <div className="notification-bell">
      <button
        className="bell-button"
        onClick={() => setIsOpen(!isOpen)}
        title="Notifications"
      >
        🔔
        {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button
                className="mark-all-btn"
                onClick={async () => {
                  await notificationService.markAllRead();
                  fetchNotifications();
                }}
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="empty-notifications">
                <p>No notifications</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`notification-item ${notif.is_read ? "read" : "unread"}`}
                >
                  <div className="notification-content">
                    <h4>{notif.title}</h4>
                    <p>{notif.message}</p>
                    <span className="notif-time">
                      {new Date(notif.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="notification-actions">
                    {!notif.is_read && (
                      <button
                        className="action-btn"
                        onClick={() => handleMarkAsRead(notif.id)}
                        title="Mark as read"
                      >
                        ✓
                      </button>
                    )}
                    <button
                      className="action-btn delete-btn"
                      onClick={() => handleDelete(notif.id)}
                      title="Delete"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
