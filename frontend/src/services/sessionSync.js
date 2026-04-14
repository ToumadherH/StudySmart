const SESSION_PROGRESS_UPDATED_EVENT = "studysmart:session-progress-updated";

export const publishSessionProgressUpdated = (payload = {}) => {
  window.dispatchEvent(
    new CustomEvent(SESSION_PROGRESS_UPDATED_EVENT, {
      detail: payload,
    }),
  );
};

export const subscribeSessionProgressUpdated = (callback) => {
  const wrapped = (event) => {
    callback(event.detail || {});
  };

  window.addEventListener(SESSION_PROGRESS_UPDATED_EVENT, wrapped);
  return () => window.removeEventListener(SESSION_PROGRESS_UPDATED_EVENT, wrapped);
};
