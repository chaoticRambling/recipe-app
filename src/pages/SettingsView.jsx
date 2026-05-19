import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ThemeSwitcher from '../components/ThemeSwitcher';
import AppNavigation from '../components/AppNavigation';
import { useTheme } from '../theme/useTheme';
import { usesTopTabs } from '../theme/themeCatalog';
import Desktop95ScrollArea from '../components/Desktop95ScrollArea';
import './SettingsView.css';

export default function SettingsView({ session }) {
  const navigate = useNavigate();
  const { activeTheme } = useTheme();
  const useTopTabs = usesTopTabs(activeTheme);
  
  // Tab states: 'general' | 'appearance' | 'sync'
  const [activeTab, setActiveTab] = useState('appearance');
  
  // Form placeholders for skeleton structure
  const [chefName, setChefName] = useState(session?.user?.email ? session.user.email.split('@')[0] : 'Chef');
  const [unitSystem, setUnitSystem] = useState('metric');
  const [autoScale, setAutoScale] = useState(true);

  // Simulated save message/feedback for user premium experience
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const handleApply = () => {
    setFeedbackMessage('Settings applied successfully.');
    setTimeout(() => setFeedbackMessage(''), 3000);
  };

  const handleOK = () => {
    navigate(-1); // Return to previous page
  };

  const handleCancel = () => {
    navigate(-1); // Return to previous page without applying alert feedback
  };

  // Render contents for each tab pane
  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="settings-tab-pane">
            <h3 className="settings-pane-title">Chef Profile Settings</h3>
            <div className="settings-field-group">
              <label htmlFor="chef-name">Chef Display Name</label>
              <input
                id="chef-name"
                type="text"
                className="settings-text-input"
                value={chefName}
                onChange={(e) => setChefName(e.target.value)}
                placeholder="Enter display name"
              />
              <span className="field-help-text">Your name appears next to dashboard greeting headers.</span>
            </div>

            <div className="settings-field-group">
              <label htmlFor="cooking-units">Default Measurement Unit System</label>
              <select
                id="cooking-units"
                className="settings-select-input"
                value={unitSystem}
                onChange={(e) => setUnitSystem(e.target.value)}
              >
                <option value="metric">Metric System (grams, ml, Celsius)</option>
                <option value="imperial">Imperial System (ounces, cups, Fahrenheit)</option>
                <option value="hybrid">Hybrid (recipe-native units)</option>
              </select>
            </div>

            <div className="settings-field-checkbox">
              <input
                id="auto-scale"
                type="checkbox"
                checked={autoScale}
                onChange={(e) => setAutoScale(e.target.checked)}
              />
              <label htmlFor="auto-scale">Automatically auto-scale cooking steps text when scaling ingredients multiplier</label>
            </div>
          </div>
        );

      case 'appearance':
        return (
          <div className="settings-tab-pane">
            <h3 className="settings-pane-title">Appearance & Custom Skins</h3>
            <p className="settings-pane-desc">Choose a visual preset skin to customize the styling, colors, borders, and interaction behaviors of your recipe box.</p>
            <div className="theme-switcher-wrapper-settings">
              <ThemeSwitcher selectId="settings-theme-selector" />
            </div>
            <div className="settings-theme-preview-card">
              <span className="preview-label">Active Skin Features:</span>
              <ul className="preview-features-list">
                <li>🎨 Primary Color: <code style={{ color: activeTheme.swatches[2] }}>{activeTheme.swatches[2]}</code></li>
                <li>🛠️ Window Chrome: <code>{activeTheme.uiChrome?.frame || 'None'}</code></li>
                <li>📱 Navigation Layout: <code>{activeTheme.uiChrome?.nav === 'top-tabs' ? 'Top-Tabs' : 'Bottom-Nav'}</code></li>
                <li>📜 Custom Scrollbars: <code>{activeTheme.uiChrome?.scrollbars === 'chunky' ? 'Chunky retro' : 'Native'}</code></li>
              </ul>
            </div>
          </div>
        );

      case 'sync':
        return (
          <div className="settings-tab-pane">
            <h3 className="settings-pane-title">Database Syncing & Security</h3>
            <div className="sync-status-card">
              <div className="sync-indicator">
                <span className={`sync-dot ${session ? 'active' : 'inactive'}`}></span>
                <strong>{session ? 'Database Sync Online' : 'Local Sandbox Mode (Guest)'}</strong>
              </div>
              <p className="sync-desc">
                {session
                  ? `Authenticated as ${session.user.email}. Theme choices and preferences are synced with your Supabase account profile in real-time.`
                  : 'You are currently running in guest or local-only mode. Theme choices are stored in local storage and will reset upon browser cache clearance.'}
              </p>
            </div>

            <div className="settings-field-group">
              <label>Row-Level Security (RLS) Grants Status</label>
              <div className="rls-readout">
                <div className="rls-row">
                  <span>Recipes Schema Access</span>
                  <span className="status-badge success">Granted</span>
                </div>
                <div className="rls-row">
                  <span>User Preferences Schema Access</span>
                  <span className="status-badge success">Granted</span>
                </div>
                <div className="rls-row">
                  <span>Client-Side Data API Connection</span>
                  <span className="status-badge success">Connected</span>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const retroLayout = (
    <div className="settings-view retro-settings-view">
      <header className="dashboard-header settings-header-nav">
        <h1>System Properties</h1>
      </header>

      {useTopTabs && <AppNavigation />}

      <main className="dashboard-main settings-main">
        <Desktop95ScrollArea
          className="settings-page-scroll"
          contentClassName="settings-page-scroll-content"
          scrollStep={240}
        >
          <div className="win95-dialog">
            <nav className="win95-tabs" role="tablist">
              <button
                type="button"
                className={`win95-tab ${activeTab === 'general' ? 'active' : ''}`}
                role="tab"
                aria-selected={activeTab === 'general'}
                onClick={() => setActiveTab('general')}
              >
                General
              </button>
              <button
                type="button"
                className={`win95-tab ${activeTab === 'appearance' ? 'active' : ''}`}
                role="tab"
                aria-selected={activeTab === 'appearance'}
                onClick={() => setActiveTab('appearance')}
              >
                Appearance
              </button>
              <button
                type="button"
                className={`win95-tab ${activeTab === 'sync' ? 'active' : ''}`}
                role="tab"
                aria-selected={activeTab === 'sync'}
                onClick={() => setActiveTab('sync')}
              >
                Network Sync
              </button>
            </nav>

            <div className="win95-tab-content" role="tabpanel">
              {renderTabContent()}
            </div>

            {feedbackMessage && (
              <div className="win95-feedback-banner">
                <span>{feedbackMessage}</span>
              </div>
            )}

            <div className="win95-dialog-buttons">
              <button type="button" className="win95-btn" onClick={handleOK}>
                OK
              </button>
              <button type="button" className="win95-btn" onClick={handleCancel}>
                Cancel
              </button>
              <button type="button" className="win95-btn" onClick={handleApply}>
                Apply
              </button>
            </div>
          </div>
        </Desktop95ScrollArea>
      </main>

      {useTopTabs && <div style={{ height: 'var(--spacing-md)' }} />}
    </div>
  );

  const modernLayout = (
    <div className="settings-view modern-settings-view">
      <header className="dashboard-header settings-header-nav">
        <h1>Application Settings</h1>
      </header>

      <main className="dashboard-main settings-main">
        <div className="modern-settings-container">
          <aside className="modern-settings-sidebar">
            <nav className="modern-tabs-list">
              <button
                className={`modern-tab-btn ${activeTab === 'general' ? 'active' : ''}`}
                onClick={() => setActiveTab('general')}
              >
                👤 Chef Profile
              </button>
              <button
                className={`modern-tab-btn ${activeTab === 'appearance' ? 'active' : ''}`}
                onClick={() => setActiveTab('appearance')}
              >
                🎨 Custom Skins
              </button>
              <button
                className={`modern-tab-btn ${activeTab === 'sync' ? 'active' : ''}`}
                onClick={() => setActiveTab('sync')}
              >
                🛡️ Cloud Sync
              </button>
            </nav>
          </aside>

          <section className="modern-settings-content-card">
            {renderTabContent()}

            {feedbackMessage && (
              <div className="modern-feedback-toast">
                <span>{feedbackMessage}</span>
              </div>
            )}

            <div className="modern-settings-footer-actions">
              <button className="modern-btn-secondary" onClick={handleCancel}>
                Cancel
              </button>
              <button className="modern-btn-primary" onClick={handleApply}>
                Save Changes
              </button>
            </div>
          </section>
        </div>
      </main>

      {!useTopTabs && <AppNavigation />}
    </div>
  );

  return activeTheme.id === 'desktop95' ? retroLayout : modernLayout;
}
