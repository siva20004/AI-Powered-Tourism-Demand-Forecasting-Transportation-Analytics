export interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'admin' | 'manager' | 'analyst';
  department: string;
  is_active: boolean;
  created_at: string;
}

export interface Route {
  id: number;
  route_code: string;
  name_ja: string;
  name_en: string;
  origin_station: string;
  destination_station: string;
  distance_km: number;
  standard_duration_min: number;
  is_active: boolean;
}

export interface DashboardSummary {
  total_passengers_today: number;
  predicted_passengers_tomorrow: number;
  monthly_passenger_volume: number;
  avg_daily_passengers: number;
  peak_passenger_hours: string;
  bus_utilization_pct: number;
  demand_growth_pct: number;
  forecast_accuracy_r2: number;
  forecast_mae: number;
  high_demand_routes: Array<{
    route_code: string;
    name: string;
    passengers: number;
    status: string;
  }>;
  low_demand_routes: Array<{
    route_code: string;
    name: string;
    passengers: number;
    status: string;
  }>;
}

export interface TrendPoint {
  date: string;
  actual?: number | null;
  predicted?: number | null;
  route_name?: string | null;
}

export interface RouteShare {
  route_id: number;
  route_code: string;
  name_en: string;
  name_ja: string;
  passenger_count: number;
  share_pct: number;
  avg_daily: number;
  status: string;
}

export interface QualityReport {
  dataset_id: number;
  filename: string;
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  missing_values_count: number;
  duplicate_rows_count: number;
  data_quality_score_pct: number;
  processing_status: string;
  issues: Array<{
    check_type: string;
    severity: string;
    count: number;
    details: string;
  }>;
  download_url?: string;
}

export interface Dataset {
  id: number;
  filename: string;
  file_format: string;
  row_count: number;
  valid_rows: number;
  invalid_rows: number;
  status: string;
  created_at: string;
}

export interface ForecastPoint {
  forecast_date: string;
  predicted: number;
  lower_bound: number;
  upper_bound: number;
  actual?: number | null;
}

export interface ForecastResponse {
  route_id?: number | null;
  route_name: string;
  horizon_days: number;
  model_name: string;
  r2_score: number;
  mae: number;
  predictions: ForecastPoint[];
}

export interface ModelMetric {
  id: number;
  model_name: string;
  model_type: string;
  mae: number;
  rmse: number;
  r2: number;
  is_active: boolean;
  training_end_date: string;
  parameters?: Record<string, any>;
}

export interface CapacitySimulateResponse {
  recommendation_id?: number;
  route_id: number;
  route_name: string;
  date: string;
  predicted_passengers: number;
  available_buses: number;
  bus_capacity: number;
  safety_margin_pct: number;
  total_available_capacity: number;
  required_buses: number;
  additional_buses_needed: number;
  capacity_utilization_pct: number;
  overcrowding_risk: 'normal' | 'moderate' | 'high' | 'critical';
  risk_label_ja?: string;
  dispatch_recommendation_text: string;
  managerial_guidance: string;
}

export interface WeatherImpactResponse {
  disclaimer: string;
  summary: {
    weekday_avg: number;
    weekend_avg: number;
    holiday_avg: number;
    rain_impact_pct: number;
    peak_season: string;
    season_distribution: Record<string, number>;
  };
  impact_data: Array<{
    date: string;
    condition: string;
    temp_celsius: number;
    rainfall_mm: number;
    passengers: number;
    is_weekend: boolean;
    is_holiday: boolean;
  }>;
}

export interface InsightQueryResponse {
  query: string;
  category: string;
  answer: string;
  key_metrics: Record<string, any>;
  recommendation: string;
  supporting_data?: Array<Record<string, any>>;
}

export interface GeneratedReport {
  id: number;
  report_type: string;
  title: string;
  period_start: string;
  period_end: string;
  format: string;
  file_size_kb: number;
  download_url: string;
  created_at: string;
}

export interface AuditLog {
  id: number;
  user_email?: string;
  action: string;
  resource: string;
  details?: string;
  ip_address: string;
  created_at: string;
}
