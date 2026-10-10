import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Compass,
  Sparkles,
  Send,
  Bookmark,
  FileText,
  Settings,
  Database,
  Globe,
  Radio,
  ExternalLink,
} from 'lucide-react';
import { fetchHealth } from '../../services/api';
import { fetchDiceStatus, fetchDiceHealth } from '../../services/diceApi';

export const Sidebar = ({ className = '', onCloseMobile }) => {
  const navigate = useNavigate();
  const [dbStatus, setDbStatus] = useState('checking');
  const [diceStatus, setDiceStatus] = useState({ is_connected: false, checking: true });
  const [apiStatus, setApiStatus] = useState('checking');

  useEffect(() => {
    // Check JobsAPI backend health
    fetchHealth()
      .then(() => setApiStatus('connected'))
      .catch(() => setApiStatus('error'));

    // Check Dice backend health & session status
    fetchDiceHealth()
      .then((data) => {
        setDbStatus(data?.database === 'connected' ? 'connected' : 'online');
      })
      .catch(() => setDbStatus('error'));

    fetchDiceStatus(false)
      .then((status) => setDiceStatus({ ...status, checking: false }))
      .catch(() => setDiceStatus({ is_connected: false, checking: false }));
  }, []);

  const navSections = [
    {
      title: 'DISCOVERY',
      items: [
        { name: 'Dashboard', to: '/', icon: LayoutDashboard },
        { name: 'All Jobs', to: '/jobs', icon: Compass, badge: '16k+' },
      ],
    },
    {
      title: 'EXECUTION',
      items: [
        { name: 'Automation Center', to: '/automation', icon: Sparkles, badge: 'RPA' },
        { name: 'My Applications', to: '/applications', icon: Send },
        { name: 'Saved Jobs', to: '/saved', icon: Bookmark },
      ],
    },
    {
      title: 'INTELLIGENCE & ASSETS',
      items: [
        { name: 'Profile & Resumes', to: '/profile', icon: FileText },
        { name: 'Integrations & Settings', to: '/settings', icon: Settings },
      ],
    },
  ];

  return (
    <aside className={`w-64 bg-white dark:bg-[#090D16] text-slate-800 dark:text-[#F8FAFC] border-r border-slate-200 dark:border-white/10 flex flex-col h-full select-none ${className}`}>
      {/* Dice UI Brand Header */}
      <div className="p-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
        <NavLink to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-bold text-lg shadow-[0_4px_16px_rgba(16,185,129,0.4)] group-hover:scale-102 transition-transform">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-sans font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                DiceAuto
              </span>
              <span className="text-[10px] font-sans font-bold tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/20 border border-emerald-300 dark:border-emerald-500/40 px-1.5 py-0.5 rounded-sm">
                PRO
              </span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-[#64748B] font-medium mt-1">
              JobsAPI + Dice Workspace
            </div>
          </div>
        </NavLink>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navSections.map((section) => (
          <div key={section.title} className="space-y-1">
            <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-[#64748B]">
              {section.title}
            </div>
            <div className="space-y-1 pt-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    onClick={() => onCloseMobile && onCloseMobile()}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all group ${
                        isActive
                          ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-l-[3.5px] border-emerald-500 shadow-xs'
                          : 'text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F8FAFC] hover:bg-slate-100/70 dark:hover:bg-white/5 border-l-[3.5px] border-transparent'
                      }`
                    }
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-700 dark:group-hover:text-white transition-colors" />
                      <span>{item.name}</span>
                    </div>

                    {item.badge && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Dice UI System Status Footer */}
      <div className="p-3 m-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 space-y-2 text-xs">
        {/* MongoDB Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-[#94A3B8]">
            <Database className="w-3.5 h-3.5 text-slate-400 dark:text-[#64748B]" />
            <span className="font-semibold text-[11px]">Database</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                apiStatus === 'connected' ? 'bg-emerald-500 radar-dot-active' : 'bg-rose-500'
              }`}
            />
            <span className={`font-bold text-[11px] ${apiStatus === 'connected' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
              {apiStatus === 'connected' ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>

        {/* Dice Session Status */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-white/5">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-[#94A3B8]">
            <Globe className="w-3.5 h-3.5 text-slate-400 dark:text-[#64748B]" />
            <span className="font-semibold text-[11px]">Dice Session</span>
          </div>
          <button
            onClick={() => {
              navigate('/settings');
              if (onCloseMobile) onCloseMobile();
            }}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-transparent transition-colors cursor-pointer"
            title="Click to manage Dice session"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                diceStatus.is_connected ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
            <span
              className={`font-bold text-[11px] ${
                diceStatus.is_connected ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
              }`}
            >
              {diceStatus.is_connected ? 'Connected' : 'Sign In'}
            </span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
