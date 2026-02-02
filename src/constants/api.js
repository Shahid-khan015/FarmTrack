const getApiUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  // For React Native, detect if running on emulator or device
  const isEmulator = __DEV__ && (process.env.NODE_ENV === 'development' || !process.env.EXPO_PUBLIC_API_URL);
  if (isEmulator) {
    // For Android emulator, use 10.0.2.2 to reach host machine
    // For iOS simulator or physical device, use the host machine IP
    return 'http://10.0.2.2:8000/';
  }
  return 'http://10.0.2.2:8000/';
};

export const API_BASE_URL = getApiUrl();

export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
  },
  DASHBOARD: {
    STATS: '/api/dashboard/stats',
  },
  TRACTORS: {
    LIST: '/api/tractors',
    CREATE: '/api/tractors',
    UPDATE: (id) => `/api/tractors/${id}`,
    DELETE: (id) => `/api/tractors/${id}`,
  },
  IMPLEMENTS: {
    LIST: '/api/implements',
    CREATE: '/api/implements',
    UPDATE: (id) => `/api/implements/${id}`,
    DELETE: (id) => `/api/implements/${id}`,
  },
  OPERATIONS: {
    LIST: '/api/operations',
    CREATE: '/api/operations',
    STOP: (id) => `/api/operations/${id}/stop`,
  },
  TELEMETRY: {
    GET: (operationId) => `/api/telemetry/${operationId}`,
    CREATE: '/api/telemetry',
  },
  FUEL_LOGS: {
    LIST: '/api/fuel-logs',
    CREATE: '/api/fuel-logs',
  },
  ALERTS: {
    LIST: '/api/alerts',
    CREATE: '/api/alerts',
    RESOLVE: (id) => `/api/alerts/${id}/resolve`,
  },
  FIELDS: {
    LIST: '/api/fields',
    CREATE: '/api/fields',
    UPDATE: (id) => `/api/fields/${id}`,
    DELETE: (id) => `/api/fields/${id}`,
  },
  DISPUTES: {
    LIST: '/api/disputes',
    CREATE: '/api/disputes',
  },
  RECOMMENDATIONS: {
    LIST: '/api/recommendations',
  },
  REPORTS: {
    GET: '/api/reports',
  },
};

export const OPERATION_TYPES = [
  { value: 'tillage', label: 'Tillage' },
  { value: 'sowing', label: 'Sowing' },
  { value: 'spraying', label: 'Spraying' },
  { value: 'weeding', label: 'Weeding' },
  { value: 'harvesting', label: 'Harvesting' },
  { value: 'threshing', label: 'Threshing' },
  { value: 'grading', label: 'Grading' },
];

export const USER_ROLES = [
  { value: 'owner', label: 'Owner' },
  { value: 'operator', label: 'Operator' },
  { value: 'farmer', label: 'Farmer' },
];

export default { API_BASE_URL, ENDPOINTS, OPERATION_TYPES, USER_ROLES };
