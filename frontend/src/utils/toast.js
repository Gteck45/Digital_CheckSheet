import toast from "react-hot-toast";

// Standardized toast functions for consistent UI across the app
export const showToast = {
  success: (message, options = {}) => {
    return toast.success(message, {
      style: {
        background: "#1f2937",
        color: "#e5e7eb",
        border: "1px solid #22c55e",
        borderRadius: "8px",
        padding: "12px 16px",
        fontSize: "14px",
        fontWeight: "500",
        boxShadow: "0 10px 25px rgba(0, 0, 0, 0.3)",
        maxWidth: "400px",
        textAlign: "center",
      },
      iconTheme: {
        primary: "#22c55e",
        secondary: "#1f2937",
      },
      duration: 4000,
      ...options,
    });
  },

  error: (message, options = {}) => {
    return toast.error(message, {
      style: {
        background: "#1f2937",
        color: "#e5e7eb",
        border: "1px solid #ef4444",
        borderRadius: "8px",
        padding: "12px 16px",
        fontSize: "14px",
        fontWeight: "500",
        boxShadow: "0 10px 25px rgba(0, 0, 0, 0.3)",
        maxWidth: "400px",
        textAlign: "center",
      },
      iconTheme: {
        primary: "#ef4444",
        secondary: "#1f2937",
      },
      duration: 5000, // Error toasts stay longer
      ...options,
    });
  },

  loading: (message, options = {}) => {
    return toast.loading(message, {
      style: {
        background: "#1f2937",
        color: "#e5e7eb",
        border: "1px solid #3b82f6",
        borderRadius: "8px",
        padding: "12px 16px",
        fontSize: "14px",
        fontWeight: "500",
        boxShadow: "0 10px 25px rgba(0, 0, 0, 0.3)",
        maxWidth: "400px",
        textAlign: "center",
      },
      iconTheme: {
        primary: "#3b82f6",
        secondary: "#1f2937",
      },
      ...options,
    });
  },

  info: (message, options = {}) => {
    return toast(message, {
      style: {
        background: "#1f2937",
        color: "#e5e7eb",
        border: "1px solid #3b82f6",
        borderRadius: "8px",
        padding: "12px 16px",
        fontSize: "14px",
        fontWeight: "500",
        boxShadow: "0 10px 25px rgba(0, 0, 0, 0.3)",
        maxWidth: "400px",
        textAlign: "center",
      },
      icon: "ℹ️",
      duration: 4000,
      ...options,
    });
  },

  // Dismiss specific toast
  dismiss: (toastId) => {
    toast.dismiss(toastId);
  },

  // Dismiss all toasts
  dismissAll: () => {
    toast.dismiss();
  },
};

export default showToast;