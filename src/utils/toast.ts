import toast from "react-hot-toast";

export const showSuccess = (msg: string) =>
  toast.success(msg, {
    style: {
      border: "2px solid #1E293B",
      padding: "12px 16px",
      color: "#1E293B",
      fontWeight: "600",
      boxShadow: "4px 4px 0px #1E293B",
      borderRadius: "12px",
    },
    iconTheme: {
      primary: "#34D399",
      secondary: "#fff",
    },
  });

export const showError = (msg: string) =>
  toast.error(msg, {
    style: {
      border: "2px solid #1E293B",
      padding: "12px 16px",
      color: "#1E293B",
      fontWeight: "600",
      boxShadow: "4px 4px 0px #1E293B",
      borderRadius: "12px",
    },
  });

export const showWarning = (msg: string) =>
  toast(msg, {
    style: {
      border: "2px solid #1E293B",
      padding: "12px 16px",
      color: "#1E293B",
      fontWeight: "600",
      background: "#FBBF24",
      boxShadow: "4px 4px 0px #1E293B",
      borderRadius: "12px",
    },
  });