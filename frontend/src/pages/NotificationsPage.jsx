import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { notificationService } from "../services/apiService";
import { useAuth } from "../context/AuthContext";
import ErrorBanner from "../components/ErrorBanner";
import { formatApiError } from "../utils/formatApiError";
import "./NotificationsPage.css";

const NotificationsPage = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorInfo, setErrorInfo] = useState(null);
  const [filter, setFilter] = useState("all"); // all, unread, read

  const fetchAll = async () => {
    try {
      setLoading(true);
      setErrorInfo(null);
      const listRes = await notificationService.list({ ordering: "-created_at" });
      const raw = listRes.data;
      const list = Array.isArray(raw) ? raw : raw.results ?? [];
      setNotifications(list);

      const unreadRes = await notificationService.getUnreadCount();
      setUnreadCount(unreadRes.data.unread_count);
    } catch (err) {
      console.error("Error loading notifications:", err);
      setErrorInfo(
        formatApiError(err, {
          fallbackMessage:
            "Could not load notifications. Check that you are signed in and the server is running.",
        }),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchAll();
  }, []);

  const handleMarkRead = async (id) => {
    try {
      setErrorInfo(null);
      await notificationService.markAsRead(id);
      void fetchAll();
    } catch (err) {
      console.error(err);
      setErrorInfo(
        formatApiError(err, {
          fallbackMessage: "Could not mark this notification as read. Try again.",
        }),
      );
    }
  };

  const handleDelete = async (id) => {
    try {
      setErrorInfo(null);
      await notificationService.delete(id);
      void fetchAll();
    } catch (err) {
      console.error(err);
      setErrorInfo(
        formatApiError(err, {
          fallbackMessage: "Could not delete this notification. Try again.",
        }),
      );
    }
  };

  const handleMarkAll = async () => {
    try {
      setErrorInfo(null);
      await notificationService.markAllRead();
      void fetchAll();
    } catch (err) {
      console.error(err);
      setErrorInfo(
        formatApiError(err, {
          fallbackMessage: "Could not mark all notifications as read. Try again.",
        }),
      );
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    const icons = {
      exam_close: "📚",
      session_reminder: "⏰",
      session_complete: "✅",
      planning_generated: "📊",
    };
    return icons[type] || "📢";
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread") return !n.is_read;
    if (filter === "read") return n.is_read;
    return true;
  });

  const readCount = Math.max(0, notifications.length - unreadCount);

  return (
    <div className="notifications-page">
      <header className="notifications-topbar" role="banner">
        <div className="notifications-topbar__inner">
          <div className="notifications-topbar__left">
            <button
              type="button"
              className="notifications-back"
              onClick={() => navigate("/dashboard")}
            >
              <span className="notifications-back__icon" aria-hidden="true">
                ←
              </span>
              <span className="notifications-back__text">Dashboard</span>
            </button>
            <div className="notifications-heading">
              <h1 id="notifications-page-title">Notifications</h1>
              {unreadCount > 0 && (
                <span className="notifications-heading__badge">{unreadCount} new</span>
              )}
            </div>
          </div>
          <div className="notifications-topbar__actions">
            <button
              type="button"
              className="notifications-btn notifications-btn--ghost notifications-refresh"
              onClick={() => void fetchAll()}
              disabled={loading}
              title="Refresh list"
            >
              <span aria-hidden="true">⟳</span>
              <span className="notifications-btn__text">Refresh</span>
            </button>
            {unreadCount > 0 && (
              <button
                type="button"
                className="notifications-btn notifications-btn--emphasis"
                onClick={handleMarkAll}
              >
                Mark all read
              </button>
            )}
            <button
              type="button"
              className="notifications-btn notifications-btn--ghost"
              onClick={() => navigate("/planning")}
            >
              Planning
            </button>
            <button
              type="button"
              className="notifications-btn notifications-btn--danger"
              onClick={async () => {
                await logout();
                navigate("/login");
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="notifications-main" aria-labelledby="notifications-page-title">
        <div className="notifications-main__inner">
          {errorInfo && (
            <div className="notifications-banner-wrap">
              <ErrorBanner
                kind={errorInfo.kind}
                summary={errorInfo.summary}
                message={errorInfo.message}
              />
            </div>
          )}

          {loading ? (
            <div className="notifications-panel notifications-panel--center">
              <div className="notifications-spinner" aria-hidden="true" />
              <p className="notifications-loading-text">Loading notifications…</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="notifications-panel notifications-panel--empty">
              <div className="notifications-empty-icon" aria-hidden="true">
                🔔
              </div>
              <p className="notifications-empty-title">Nothing here yet</p>
              <p className="notifications-empty-hint">
                You&apos;ll see reminders, exam alerts, and planning updates when they
                arrive.
              </p>
            </div>
          ) : (
            <>
              <div
                className="notifications-toolbar"
                role="group"
                aria-label="Filter notifications"
              >
                <button
                  type="button"
                  className={`notifications-filter${filter === "all" ? " is-active" : ""}`}
                  onClick={() => setFilter("all")}
                  aria-pressed={filter === "all"}
                >
                  All
                  <span className="notifications-filter__count">
                    {notifications.length}
                  </span>
                </button>
                <button
                  type="button"
                  className={`notifications-filter${filter === "unread" ? " is-active" : ""}`}
                  onClick={() => setFilter("unread")}
                  aria-pressed={filter === "unread"}
                >
                  Unread
                  <span className="notifications-filter__count">{unreadCount}</span>
                </button>
                <button
                  type="button"
                  className={`notifications-filter${filter === "read" ? " is-active" : ""}`}
                  onClick={() => setFilter("read")}
                  aria-pressed={filter === "read"}
                >
                  Read
                  <span className="notifications-filter__count">{readCount}</span>
                </button>
              </div>

              {filteredNotifications.length === 0 ? (
                <div className="notifications-panel notifications-panel--empty notifications-panel--compact">
                  <p className="notifications-empty-title">
                    No {filter === "unread" ? "unread" : "read"} notifications
                  </p>
                  <p className="notifications-empty-hint">
                    Try another filter or check back later.
                  </p>
                </div>
              ) : (
                <ul className="notifications-list">
                  {filteredNotifications.map((n) => (
                    <li
                      key={n.id}
                      className={`notification-card${
                        n.is_read
                          ? " notification-card--read"
                          : " notification-card--unread"
                      }`}
                    >
                      <div className="notification-card__body">
                        <div
                          className="notification-card__icon"
                          aria-hidden="true"
                          title={n.notification_type}
                        >
                          {getNotificationIcon(n.notification_type)}
                        </div>
                        <div className="notification-card__content">
                          <div className="notification-card__top">
                            <h2 className="notification-card__title">{n.title}</h2>
                            {!n.is_read && (
                              <span className="notification-card__dot" aria-label="Unread" />
                            )}
                          </div>
                          <p className="notification-card__message">{n.message}</p>
                          <time
                            className="notification-card__time"
                            dateTime={n.created_at}
                          >
                            {new Date(n.created_at).toLocaleString(undefined, {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </time>
                        </div>
                      </div>
                      <div className="notification-card__actions">
                        {!n.is_read && (
                          <button
                            type="button"
                            className="notification-card__btn notification-card__btn--read"
                            onClick={() => handleMarkRead(n.id)}
                          >
                            Mark read
                          </button>
                        )}
                        <button
                          type="button"
                          className="notification-card__btn notification-card__btn--delete"
                          onClick={() => handleDelete(n.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default NotificationsPage;
