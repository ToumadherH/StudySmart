import React, { useState } from "react";
import { sessionService } from "../services/apiService";
import ErrorBanner from "./ErrorBanner";
import { formatApiError } from "../utils/formatApiError";
import "./SessionDetailModal.css";

const SessionDetailModal = ({ session, onClose, onUpdated }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    status: session.status,
    notes: session.notes,
  });
  const [loading, setLoading] = useState(false);
  const [errorInfo, setErrorInfo] = useState(null);

  const handleStatusChange = async (newStatus) => {
    try {
      setLoading(true);
      setErrorInfo(null);
      if (newStatus === "completed") {
        await sessionService.markComplete(session.id);
      } else {
        await sessionService.update(session.id, { status: newStatus });
      }
      onUpdated();
    } catch (err) {
      setErrorInfo(
        formatApiError(err, {
          fallbackMessage:
            "Could not update status. Check your connection or sign in again.",
        }),
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    try {
      setLoading(true);
      setErrorInfo(null);
      await sessionService.update(session.id, {
        notes: formData.notes,
      });
      setIsEditing(false);
      onUpdated();
    } catch (err) {
      setErrorInfo(
        formatApiError(err, {
          fallbackMessage: "Could not save notes. Try again in a moment.",
        }),
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const statusBgColor = {
    planned: "#d1ecf1",
    in_progress: "#fff3cd",
    completed: "#d4edda",
  };

  const statusTextColor = {
    planned: "#0c5460",
    in_progress: "#856404",
    completed: "#155724",
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{session.subject_name}</h2>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          {errorInfo && (
            <ErrorBanner
              kind={errorInfo.kind}
              summary={errorInfo.summary}
              message={errorInfo.message}
            />
          )}

          <div className="detail-group">
            <label>📅 Date & Time</label>
            <p>{new Date(session.start_time).toLocaleString()}</p>
          </div>

          <div className="detail-group">
            <label>⏱️ Duration</label>
            <p>{session.duration_minutes} minutes</p>
          </div>

          <div className="detail-group">
            <label>📊 Status</label>
            <div className="status-selector">
              {["planned", "in_progress", "completed"].map((status) => (
                <button
                  key={status}
                  className={`status-btn ${session.status === status ? "active" : ""}`}
                  style={
                    session.status === status
                      ? {
                          backgroundColor: statusBgColor[status],
                          color: statusTextColor[status],
                          fontWeight: "600",
                        }
                      : {}
                  }
                  onClick={() => handleStatusChange(status)}
                  disabled={loading}
                >
                  {status === "planned" && "⏳"}
                  {status === "in_progress" && "⏱️"}
                  {status === "completed" && "✅"}
                  {" " + status.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          <div className="detail-group">
            <label>📝 Notes</label>
            {isEditing ? (
              <div className="notes-editor">
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  rows="4"
                  placeholder="Add notes about this session..."
                />
                <div className="editor-actions">
                  <button
                    className="btn btn-primary"
                    onClick={handleSaveNotes}
                    disabled={loading}
                  >
                    💾 Save
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({ ...formData, notes: session.notes });
                    }}
                  >
                    ✕ Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="notes-display">
                {session.notes ? (
                  <p>{session.notes}</p>
                ) : (
                  <p className="empty-notes">No notes yet</p>
                )}
                <button className="edit-btn" onClick={() => setIsEditing(true)}>
                  ✎ Edit Notes
                </button>
              </div>
            )}
          </div>

          <div className="detail-group">
            <label>📌 Created</label>
            <p>{new Date(session.created_at).toLocaleString()}</p>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionDetailModal;
