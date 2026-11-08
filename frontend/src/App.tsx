import React, { useState } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { OverviewPage } from './pages/OverviewPage';
import { DataUploadPage } from './pages/DataUploadPage';
import { DataQualityPage } from './pages/DataQualityPage';
import { PassengerAnalyticsPage } from './pages/PassengerAnalyticsPage';
import { ForecastingPage } from './pages/ForecastingPage';
import { WeatherSeasonalPage } from './pages/WeatherSeasonalPage';
import { BusCapacityPage } from './pages/BusCapacityPage';
import { RoutePerformancePage } from './pages/RoutePerformancePage';
import { AiInsightsPage } from './pages/AiInsightsPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [currentRole, setCurrentRole] = useState<'admin' | 'manager' | 'analyst'>('admin');

  const renderActiveModule = () => {
    switch (currentTab) {
      case 'overview':
        return <OverviewPage onNavigate={setCurrentTab} />;
      case 'upload':
        return <DataUploadPage />;
      case 'quality':
        return <DataQualityPage />;
      case 'analytics':
        return <PassengerAnalyticsPage />;
      case 'forecasting':
        return <ForecastingPage />;
      case 'weather':
        return <WeatherSeasonalPage />;
      case 'capacity':
        return <BusCapacityPage currentRole={currentRole} />;
      case 'routes':
        return <RoutePerformancePage />;
      case 'insights':
        return <AiInsightsPage />;
      case 'reports':
        return <ReportsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <OverviewPage onNavigate={setCurrentTab} />;
    }
  };

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-slate-50 font-sans text-slate-800">
      {/* Top Navigation */}
      <Header
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
      />

      {/* Main Workspace: Sidebar + Dynamic Content Page */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Content Container */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="mx-auto max-w-7xl">
            {renderActiveModule()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
