// src/config.js

export const isNativePlatform = () => {
  try {
    return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
  } catch {
    return false;
  }
};

// Environment-based API config:
// For native phone builds, uses the laptop/server IP (10.236.27.214).
// Can be overridden by setting the REACT_APP_API_URL environment variable.
const devBackendUrl = "http://10.236.27.214:5000";

export const BACKEND_URL = process.env.REACT_APP_API_URL || (isNativePlatform() ? devBackendUrl : "");

export const getApiBaseUrl = () => {
  if (BACKEND_URL) {
    return `${BACKEND_URL}/api`;
  }
  return "/api";
};

export const getBackendBaseUrl = () => {
  return BACKEND_URL;
};
