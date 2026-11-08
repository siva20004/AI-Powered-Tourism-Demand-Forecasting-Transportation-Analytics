import axios from 'axios';
import {
  DashboardSummary, TrendPoint, RouteShare, Route,
  QualityReport, Dataset, ForecastResponse, ModelMetric,
  CapacitySimulateResponse, WeatherImpactResponse,
  InsightQueryResponse, GeneratedReport, AuditLog, User
} from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token if stored
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('fujitrack_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const apiClient = {
  // Auth
  login: async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.access_token) {
      localStorage.setItem('fujitrack_token', res.data.access_token);
      localStorage.setItem('fujitrack_user', JSON.stringify(res.data.user));
    }
    return res.data;
  },
  getMe: async (): Promise<User> => {
    const res = await api.get('/auth/me');
    return res.data;
  },
  getUsers: async (): Promise<User[]> => {
    const res = await api.get('/auth/users');
    return res.data;
  },
  getAuditLogs: async (): Promise<AuditLog[]> => {
    const res = await api.get('/auth/audit-logs');
    return res.data;
  },

  // Dashboard
  getDashboardSummary: async (): Promise<DashboardSummary> => {
    const res = await api.get('/dashboard/summary');
    return res.data;
  },
  getDashboardTrends: async (days: number = 30): Promise<TrendPoint[]> => {
    const res = await api.get(`/dashboard/trends?days=${days}`);
    return res.data;
  },
  getRouteDistribution: async (): Promise<RouteShare[]> => {
    const res = await api.get('/dashboard/route-distribution');
    return res.data;
  },

  // Routes
  getRoutes: async (): Promise<Route[]> => {
    const res = await api.get('/routes');
    return res.data;
  },
  getRoutePerformance: async (routeId: number) => {
    const res = await api.get(`/routes/${routeId}/performance`);
    return res.data;
  },

  // Upload & ETL
  uploadFile: async (file: File): Promise<QualityReport> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  getDatasets: async (): Promise<Dataset[]> => {
    const res = await api.get('/upload/datasets');
    return res.data;
  },
  getQualityLogs: async (datasetId: number) => {
    const res = await api.get(`/upload/quality-logs/${datasetId}`);
    return res.data;
  },

  // Analytics
  getDailyAnalytics: async (startDate?: string, endDate?: string, routeId?: number) => {
    let url = '/analytics/daily?';
    if (startDate) url += `start_date=${startDate}&`;
    if (endDate) url += `end_date=${endDate}&`;
    if (routeId) url += `route_id=${routeId}&`;
    const res = await api.get(url);
    return res.data;
  },
  getMonthlyAnalytics: async (routeId?: number) => {
    const url = routeId ? `/analytics/monthly?route_id=${routeId}` : '/analytics/monthly';
    const res = await api.get(url);
    return res.data;
  },
  getPeakHours: async (routeId?: number) => {
    const url = routeId ? `/analytics/peak-hours?route_id=${routeId}` : '/analytics/peak-hours';
    const res = await api.get(url);
    return res.data;
  },
  getWeekendComparison: async (routeId?: number) => {
    const url = routeId ? `/analytics/weekend-vs-weekday?route_id=${routeId}` : '/analytics/weekend-vs-weekday';
    const res = await api.get(url);
    return res.data;
  },

  // Forecasting
  getForecast: async (horizonDays: number = 7, routeId?: number, modelType: string = 'gradient_boosting'): Promise<ForecastResponse> => {
    let url = `/forecasting/predict?horizon_days=${horizonDays}&model_type=${modelType}`;
    if (routeId) url += `&route_id=${routeId}`;
    const res = await api.get(url);
    return res.data;
  },
  getModels: async (): Promise<ModelMetric[]> => {
    const res = await api.get('/forecasting/models');
    return res.data;
  },
  retrainModel: async (modelType: string, routeId?: number) => {
    const url = routeId ? `/forecasting/retrain?route_id=${routeId}` : '/forecasting/retrain';
    const res = await api.post(url, { model_type: modelType });
    return res.data;
  },

  // Weather
  getWeatherImpact: async (): Promise<WeatherImpactResponse> => {
    const res = await api.get('/weather/impact');
    return res.data;
  },
  getCurrentWeather: async () => {
    const res = await api.get('/weather/current');
    return res.data;
  },

  // Capacity Simulator
  simulateCapacity: async (params: {
    route_id: number;
    predicted_passengers?: number;
    available_buses: number;
    bus_capacity: number;
    safety_margin_pct: number;
  }): Promise<CapacitySimulateResponse> => {
    const res = await api.post('/capacity/simulate', params);
    return res.data;
  },
  getCapacityRecommendations: async () => {
    const res = await api.get('/capacity/recommendations');
    return res.data;
  },
  updateCapacityStatus: async (recId: number, status: string, note?: string) => {
    const res = await api.put('/capacity/status', {
      recommendation_id: recId,
      status,
      manager_note: note,
    });
    return res.data;
  },

  // AI Insights
  queryInsights: async (query: string): Promise<InsightQueryResponse> => {
    const res = await api.post('/insights/query', { query });
    return res.data;
  },
  getQuickPrompts: async () => {
    const res = await api.get('/insights/quick-prompts');
    return res.data;
  },

  // Reports
  generateReport: async (params: {
    report_type: string;
    format: string;
    period_start?: string;
    period_end?: string;
    route_id?: number;
  }): Promise<GeneratedReport> => {
    const res = await api.post('/reports/generate', params);
    return res.data;
  },
  getReportsList: async (): Promise<GeneratedReport[]> => {
    const res = await api.get('/reports/list');
    return res.data;
  },
  getHealth: async () => {
    const res = await api.get('/health');
    return res.data;
  }
};
