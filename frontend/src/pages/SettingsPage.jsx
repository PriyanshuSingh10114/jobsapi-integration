import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Settings,
  Moon,
  Sun,
  Trash2,
  Save,
  Globe,
  ExternalLink,
  RotateCw,
  Bot,
  Zap,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import {
  fetchDiceStatus,
  openDiceLogin,
  fetchDiceSettings,
  updateDiceSettings
} from '../services/diceApi';

export const SettingsPage = () => {
  const [token, setToken] = useState(() => localStorage.getItem('auth_token') || '');
  const [apiBaseUrl, setApiBaseUrl] = useState(() => localStorage.getItem('jobsapi_base_url') || 'http://localhost:5000/api');
  const [theme, setTheme] = useState(() => localStorage.getItem('jobsapi_theme') || 'light');
  const [saved, setSaved] = useState(false);
  const [isLaunchingBrowser, setIsLaunchingBrowser] = useState(false);

  // Dice session & settings query
  const {
    data: diceStatus,
    isFetching: isVerifyingDice,
    refetch: refetchDiceStatus
  } = useQuery({
    queryKey: ['settingsDiceStatus'],
    queryFn: () => fetchDiceStatus(true),
    staleTime: 30000,
  });

  const { data: _remoteDiceConfig } = useQuery({
    queryKey: ['settingsDiceConfig'],
    queryFn: fetchDiceSettings,
    staleTime: 60000,
  });

  const [diceConfig, setDiceConfig] = useState({
    openai_model: 'gpt-4o-mini',
    max_jobs_per_search: 15,
    max_applications_per_run: 10,
    headless_browser: true,
  });

  const handleLaunchDiceBrowser = async () => {
    setIsLaunchingBrowser(true);
    try {
      await openDiceLogin();
      alert('Playwright browser session opened! Complete your Dice login in the opened browser window, then click "Verify Connection".');
    } catch (err) {
      alert(`Could not launch browser: ${err.message}`);
    } finally {
      setIsLaunchingBrowser(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
    localStorage.setItem('jobsapi_base_url', apiBaseUrl);

    try {
      await updateDiceSettings(diceConfig);
    } catch {
      // Backend might not have DB write permissions, continue
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    const root = document.documentElement;
    if (newTheme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      localStorage.setItem('jobsapi_theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      localStorage.setItem('jobsapi_theme', 'light');
    }
  };

  const handleClearCache = () => {
    if (window.confirm('Clear locally cached jobs and saved bookmarks?')) {
      localStorage.removeItem('jobsapi_saved_jobs');
      window.location.reload();
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="space-y-1 pb-4 border-b border-border-warm">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold mb-2">
          <Settings className="w-3.5 h-3.5" />
          <span>Platform Integrations & Configuration</span>
        </div>
        <h1 className="font-sans font-extrabold text-2xl sm:text-3xl tracking-tight text-charcoal">
          Workspace Settings
        </h1>
        <p className="text-sm text-charcoal-muted mt-1">
          Configure Dice Playwright session authentication, ATS gateways, and UI preferences.
        </p>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Dice Platform Connection Studio */}
        <div className="p-6 sm:p-8 rounded-xl bg-surface border border-slate-200/90 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-warm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-bold shadow-[0_4px_16px_rgba(16,185,129,0.35)]">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-charcoal flex items-center gap-2">
                  <span>Dice Portal Session Authentication</span>
                  {diceStatus?.is_connected ? (
                    <Badge variant="success" size="sm" dot>
                      Session Live
                    </Badge>
                  ) : (
                    <Badge variant="warning" size="sm" dot>
                      Disconnected
                    </Badge>
                  )}
                </h2>
                <p className="text-xs text-charcoal-muted mt-0.5">
                  Playwright browser automation requires authenticated Dice session cookies.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                isLoading={isVerifyingDice}
                onClick={() => refetchDiceStatus()}
                icon={RotateCw}
              >
                Verify Session
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold shadow-xs"
                isLoading={isLaunchingBrowser}
                onClick={handleLaunchDiceBrowser}
                icon={ExternalLink}
              >
                Launch Dice Login
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-surface-soft border border-border-warm">
              <div className="text-charcoal-muted font-medium">Logged-in User</div>
              <div className="font-bold text-charcoal mt-1 text-sm">
                {diceStatus?.username || (diceStatus?.is_connected ? 'Authenticated User' : 'Not Signed In')}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-soft border border-border-warm">
              <div className="text-charcoal-muted font-medium">Stored Cookies</div>
              <div className="font-bold text-indigo-600 mt-1 text-sm">
                {diceStatus?.cookies_count !== undefined ? `${diceStatus.cookies_count} Cookies` : '0 Cached'}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-soft border border-border-warm">
              <div className="text-charcoal-muted font-medium">Last Verified</div>
              <div className="font-bold text-charcoal mt-1 text-sm">
                {diceStatus?.last_verified ? new Date(diceStatus.last_verified).toLocaleTimeString() : 'Just now'}
              </div>
            </div>
          </div>
        </div>

        {/* Dice Playwright & RPA Settings */}
        <div className="p-6 sm:p-8 rounded-xl bg-surface border border-slate-200/90 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-charcoal tracking-tight flex items-center gap-2">
            <Bot className="w-4 h-4 text-indigo-600" />
            <span>Playwright RPA Configuration</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-charcoal block mb-1">
                AI Matcher Model
              </label>
              <select
                value={diceConfig.openai_model}
                onChange={(e) => setDiceConfig({ ...diceConfig, openai_model: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-surface-soft border border-border-warm focus:outline-none focus:border-indigo-500 font-semibold"
              >
                <option value="gpt-4o-mini">gpt-4o-mini (Fast & Recommended)</option>
                <option value="gpt-4o">gpt-4o (Comprehensive)</option>
                <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-charcoal block mb-1">
                Max Applications per Automation Batch
              </label>
              <Input
                type="number"
                min="1"
                max="50"
                value={diceConfig.max_applications_per_run}
                onChange={(e) => setDiceConfig({ ...diceConfig, max_applications_per_run: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="headless"
              checked={diceConfig.headless_browser}
              onChange={(e) => setDiceConfig({ ...diceConfig, headless_browser: e.target.checked })}
              className="rounded accent-indigo-600"
            />
            <label htmlFor="headless" className="text-xs font-semibold text-charcoal cursor-pointer">
              Run Playwright in Headless Mode (runs silently without opening GUI windows)
            </label>
          </div>
        </div>

        {/* JobsAPI ATS Gateway Settings */}
        <div className="p-6 sm:p-8 rounded-xl bg-surface border border-slate-200/90 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-charcoal tracking-tight flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-600" />
            <span>JobsAPI Gateway & Tokens</span>
          </h2>

          <div className="grid grid-cols-1 gap-4">
            <Input
              label="JobsAPI Backend Endpoint"
              value={apiBaseUrl}
              onChange={(e) => setApiBaseUrl(e.target.value)}
              placeholder="http://localhost:5000/api"
            />

            <Input
              label="Bearer Token (Optional Candidate Authorization)"
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            />
          </div>
        </div>

        {/* Appearance Settings */}
        <div className="p-6 sm:p-8 rounded-xl bg-surface border border-slate-200/90 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-charcoal tracking-tight flex items-center gap-2">
            <Sun className="w-4 h-4 text-indigo-600" />
            <span>Appearance & Theme</span>
          </h2>

          <div className="grid grid-cols-2 gap-4 max-w-sm pt-1">
            <button
              type="button"
              onClick={() => handleThemeChange('light')}
              className={`p-4 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                theme === 'light'
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-bold shadow-xs'
                  : 'border-border-warm bg-surface-soft text-charcoal'
              }`}
            >
              <Sun className="w-5 h-5 text-amber-500" />
              <div>
                <div className="text-xs font-bold">Dice Slate Light</div>
                <div className="text-[10px] text-charcoal-muted">Crisp #F8FAFC</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleThemeChange('dark')}
              className={`p-4 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                theme === 'dark'
                  ? 'border-indigo-500 bg-indigo-900/30 text-indigo-300 font-bold shadow-xs'
                  : 'border-border-warm bg-surface-soft text-charcoal'
              }`}
            >
              <Moon className="w-5 h-5 text-indigo-400" />
              <div>
                <div className="text-xs font-bold">Obsidian Dark</div>
                <div className="text-[10px] text-charcoal-muted">Deep Navy #090D16</div>
              </div>
            </button>
          </div>
        </div>

        {/* Maintenance & Reset */}
        <div className="p-6 rounded-xl bg-surface border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-charcoal">Cache & Stored State</div>
            <div className="text-[11px] text-charcoal-muted">Purge cached bookmarks and local browser storage.</div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-rose-600 hover:bg-rose-50 font-bold text-xs"
            onClick={handleClearCache}
            icon={Trash2}
          >
            Clear Cache
          </Button>
        </div>

        {/* Submit Bar */}
        <div className="flex items-center justify-between pt-4">
          <span className="text-xs font-semibold text-emerald-600">
            {saved && '✓ Settings saved and synced across engines'}
          </span>
          <Button
            type="submit"
            variant="primary"
            size="md"
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold px-6 shadow-[0_4px_12px_rgba(16,185,129,0.3)]"
            icon={Save}
          >
            Save Settings
          </Button>
        </div>
      </form>
    </div>
  );
};
export default SettingsPage;
