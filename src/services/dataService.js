import api from './api';
import { ENDPOINTS } from '../constants/api';

export const getDashboardStats = async () => {
  const response = await api.get(ENDPOINTS.DASHBOARD.STATS);
  if (response.error) {
    throw new Error(response.error.message);
  }
  return response.data || {};
};

export const getTractors = async () => {
  const response = await api.get(ENDPOINTS.TRACTORS.LIST);
  if (response.error) {
    throw new Error(response.error.message);
  }
  return response.data || [];
};

export const createTractor = async (data) => {
  const response = await api.post(ENDPOINTS.TRACTORS.CREATE, data);
  return response.data;
};

export const updateTractor = async (id, data) => {
  const response = await api.patch(ENDPOINTS.TRACTORS.UPDATE(id), data);
  return response.data;
};

export const deleteTractor = async (id) => {
  const response = await api.delete(ENDPOINTS.TRACTORS.DELETE(id));
  return response.data;
};

export const getImplements = async () => {
  const response = await api.get(ENDPOINTS.IMPLEMENTS.LIST);
  return response.data;
};

export const createImplement = async (data) => {
  const response = await api.post(ENDPOINTS.IMPLEMENTS.CREATE, data);
  return response.data;
};

export const updateImplement = async (id, data) => {
  const response = await api.patch(ENDPOINTS.IMPLEMENTS.UPDATE(id), data);
  return response.data;
};

export const deleteImplement = async (id) => {
  const response = await api.delete(ENDPOINTS.IMPLEMENTS.DELETE(id));
  return response.data;
};

export const getOperations = async () => {
  const response = await api.get(ENDPOINTS.OPERATIONS.LIST);
  return response.data;
};

export const createOperation = async (data) => {
  const response = await api.post(ENDPOINTS.OPERATIONS.CREATE, data);
  return response.data;
};

export const stopOperation = async (id) => {
  const response = await api.post(ENDPOINTS.OPERATIONS.STOP(id));
  return response.data;
};

export const getTelemetry = async (operationId) => {
  const response = await api.get(ENDPOINTS.TELEMETRY.GET(operationId));
  return response.data;
};

export const createTelemetry = async (data) => {
  const response = await api.post(ENDPOINTS.TELEMETRY.CREATE, data);
  return response.data;
};

export const getFuelLogs = async () => {
  const response = await api.get(ENDPOINTS.FUEL_LOGS.LIST);
  return response.data;
};

export const createFuelLog = async (data) => {
  const response = await api.post(ENDPOINTS.FUEL_LOGS.CREATE, data);
  return response.data;
};

export const getAlerts = async () => {
  const response = await api.get(ENDPOINTS.ALERTS.LIST);
  return response.data;
};

export const createAlert = async (data) => {
  const response = await api.post(ENDPOINTS.ALERTS.CREATE, data);
  return response.data;
};

export const resolveAlert = async (id) => {
  const response = await api.post(ENDPOINTS.ALERTS.RESOLVE(id));
  return response.data;
};

export const getReports = async (params) => {
  const response = await api.get(ENDPOINTS.REPORTS.GET, { params });
  return response.data;
};

export const getFields = async () => {
  const response = await api.get(ENDPOINTS.FIELDS.LIST);
  if (response.error) {
    throw new Error(response.error.message);
  }
  return response.data || [];
};

export const getField = async (id) => {
  const response = await api.get(ENDPOINTS.FIELDS.UPDATE(id));
  if (response.error) {
    throw new Error(response.error.message);
  }
  return response.data;
};

export const createField = async (data) => {
  const response = await api.post(ENDPOINTS.FIELDS.CREATE, data);
  if (response.error) {
    throw new Error(response.error.message);
  }
  return response.data;
};

export const updateField = async (id, data) => {
  const response = await api.patch(ENDPOINTS.FIELDS.UPDATE(id), data);
  if (response.error) {
    throw new Error(response.error.message);
  }
  return response.data;
};

export const deleteField = async (id) => {
  const response = await api.delete(ENDPOINTS.FIELDS.DELETE(id));
  if (response.error) {
    throw new Error(response.error.message);
  }
  return response.data;
};

export const getDisputes = async () => {
  const response = await api.get(ENDPOINTS.DISPUTES.LIST);
  if (response.error) {
    throw new Error(response.error.message);
  }
  return response.data || [];
};

export const createDispute = async (data) => {
  const response = await api.post(ENDPOINTS.DISPUTES.CREATE, data);
  if (response.error) {
    throw new Error(response.error.message);
  }
  return response.data;
};

export const getRecommendations = async (fieldId) => {
  const params = fieldId ? { field_id: fieldId } : {};
  const response = await api.get(ENDPOINTS.RECOMMENDATIONS.LIST, { params });
  if (response.error) {
    throw new Error(response.error.message);
  }
  return response.data || [];
};

export default {
  getDashboardStats,
  getTractors,
  createTractor,
  updateTractor,
  deleteTractor,
  getImplements,
  createImplement,
  updateImplement,
  deleteImplement,
  getOperations,
  createOperation,
  stopOperation,
  getTelemetry,
  createTelemetry,
  getFuelLogs,
  createFuelLog,
  getAlerts,
  createAlert,
  resolveAlert,
  getReports,
  getFields,
  getField,
  createField,
  updateField,
  deleteField,
  getDisputes,
  createDispute,
  getRecommendations,
};
