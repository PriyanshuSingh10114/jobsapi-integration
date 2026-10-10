import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Menu, Search, Sparkles, RefreshCw, CheckCircle2, AlertCircle, Zap } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { ThemeToggle } from '../ui/ThemeToggle';
import { fetchDiceStatus } from '../../services/diceApi';

export const TopBar = ({ onOpenMobileMenu, onOpenCommandPalette }) => {
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [diceSession, setDiceSession] = useState({ is_connected: false, username: '' });

  useEffect(() => {
    fetchDiceStatus(false)
      .then((status) => {
        setDiceSession(status || { is_connected: false });
      })
      .catch(() => setDiceSession({ is_connected: false }));
  }, []);

  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  // Get human friendly page title
  const getPageTitle = (pathname) => {
    if (pathname === '/') return 'Dashboard';
    if (pathname.startsWith('/jobs')) return 'All Jobs & Discovery';
    if (pathname.startsWith('/automation') || pathname.startsWith('/auto-apply')) return 'Automation Center';
    if (pathname.startsWith('/applications')) return 'My Applications';
    if (pathname.startsWith('/saved')) return 'Saved Jobs';
    if (pathname.startsWith('/profile')) return 'Profile & Resumes';
    if (pathname.startsWith('/settings')) return 'Integrations & Settings';
    return 'Workspace';
  };

  return (
    <header className="h-16 bg-surface/90 backdrop-blur-md border-b border-border-warm sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between gap-4">
      {/* Mobile Menu trigger & title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="p-2 rounded-lg text-charcoal hover:bg-surface-soft border border-border-warm md:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-sans font-extrabold text-base sm:text-lg text-charcoal tracking-tight leading-tight">
            {getPageTitle(location.pathname)}
          </h1>
          <p className="text-[11px] text-charcoal-muted hidden lg:block leading-none mt-0.5">
            Dice UI Automation Engine & Multi-ATS Application Platform
          </p>
        </div>
      </div>

      {/* Global Search Button (acts as Command Palette trigger) */}
      <div className="flex-1 max-w-md hidden md:block">
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="w-full bg-surface-soft/80 hover:bg-surface-soft border border-border-warm rounded-xl px-3.5 py-1.5 text-xs text-charcoal-muted flex items-center justify-between transition-all group cursor-pointer shadow-2xs hover:border-brand-secondary/40"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-charcoal-muted group-hover:text-charcoal transition-colors" />
            <span className="text-charcoal-muted/80 group-hover:text-charcoal transition-colors truncate">
              Search jobs, profiles, automation...
            </span>
          </div>
          <div className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold text-charcoal-muted bg-surface border border-border-warm rounded">
            <span>⌘</span>
            <span>K</span>
          </div>
        </button>
      </div>

      {/* Right Actions & Dice UI Status Chips */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Dice Session Status Badge */}
        <button
          type="button"
          onClick={() => navigate('/settings')}
          className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
            diceSession.is_connected
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
              : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
          }`}
          title={diceSession.is_connected ? `Connected: ${diceSession.username || 'Dice User'}` : 'Click Settings to sign into Dice'}
        >
          {diceSession.is_connected ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{diceSession.username ? `Dice: ${diceSession.username}` : 'Dice: Connected'}</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>Dice: Sign In</span>
            </>
          )}
        </button>

        {/* Playwright Engine Badge */}
        <div className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
          <Zap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Playwright Engine Ready</span>
        </div>

        {/* Global Refresh Button */}
        <button
          type="button"
          onClick={handleRefreshAll}
          disabled={isRefreshing}
          className="p-1.5 rounded-lg text-charcoal-muted hover:text-charcoal hover:bg-surface-soft border border-border-warm/60 transition-all cursor-pointer"
          title="Refresh workspace data"
          aria-label="Refresh workspace"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-brand-primary' : ''}`} />
        </button>

        <ThemeToggle />

        {/* Candidate Avatar & Profile link */}
        <NavLink
          to="/profile"
          className="flex items-center gap-2 pl-1 pr-1.5 py-1 rounded-xl hover:bg-surface-soft transition-colors"
          title="Candidate Profile & Resumes"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center text-xs font-bold border border-white/20 shadow-sm">
            CP
          </div>
        </NavLink>
      </div>
    </header>
  );
};
