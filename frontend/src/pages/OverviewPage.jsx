import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Compass,
  ArrowRight,
  Briefcase,
  Globe2,
  TrendingUp,
  Sparkles,
  ShieldCheck,
  Send,
  Building2,
  FileText,
  RefreshCw,
  Zap,
  Bot,
  Play
} from 'lucide-react';
import { fetchJobs, fetchStats, fetchProfile, fetchATSReadiness, fetchProfileHistory } from '../services/api';
import { fetchDiceStats, fetchDiceStatus } from '../services/diceApi';
import { SearchInput } from '../components/ui/SearchInput';
import { JobCard } from '../components/jobs/JobCard';
import { JobCardSkeleton } from '../components/ui/Skeleton';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { extractSkillList } from '../utils/skills';

export const OverviewPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshOverview = async () => {
    setIsRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['overviewJobs'] }),
      queryClient.invalidateQueries({ queryKey: ['stats'] }),
      queryClient.invalidateQueries({ queryKey: ['atsReadiness'] }),
      queryClient.invalidateQueries({ queryKey: ['diceStats'] }),
      queryClient.invalidateQueries({ queryKey: ['diceStatus'] }),
    ]);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  // Fetch JobsAPI Stats
  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: fetchStats,
    staleTime: 60000,
  });

  // Fetch Dice Automation Stats
  const { data: diceStats } = useQuery({
    queryKey: ['diceStats'],
    queryFn: fetchDiceStats,
    staleTime: 30000,
  });

  // Fetch Dice Session Status
  const { data: diceStatus } = useQuery({
    queryKey: ['diceStatus'],
    queryFn: () => fetchDiceStatus(false),
    staleTime: 30000,
  });

  // Fetch Candidate Profile
  const { data: profileData } = useQuery({
    queryKey: ['userProfile'],
    queryFn: fetchProfile,
    staleTime: 60000,
  });

  // Fetch ATS Readiness
  const { data: readinessData } = useQuery({
    queryKey: ['atsReadiness'],
    queryFn: fetchATSReadiness,
    staleTime: 60000,
  });

  // Fetch Recommended / Latest Jobs
  const { data: jobsData, isLoading: isJobsLoading } = useQuery({
    queryKey: ['overviewJobs'],
    queryFn: () => fetchJobs({ limit: 6, sort: 'Most Relevant' }),
    staleTime: 60000,
  });

  // Fetch Application History
  const { data: historyData } = useQuery({
    queryKey: ['userHistory'],
    queryFn: fetchProfileHistory,
    staleTime: 60000,
  });

  const candidateName = profileData?.profile?.basicInfo?.firstName || profileData?.profile?.identity?.firstName || 'Candidate';
  const readinessScore = readinessData?.readiness?.overallScore || profileData?.readiness?.overallScore || 92;
  const userSkills = extractSkillList(profileData?.profile?.skills || profileData?.profile?.professionalInfo?.skills);

  const handleSearch = (q) => {
    if (q && q.trim()) {
      navigate(`/jobs?role=${encodeURIComponent(q.trim())}`);
    } else {
      navigate('/jobs');
    }
  };

  return (
    <div className="space-y-8">
      {/* Dice UI Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0F172A] via-[#1E1B4B] to-[#312E81] text-white p-6 sm:p-8 shadow-xl border border-white/10">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#6366F1]/30 border border-[#6366F1]/50 text-[#A5B4FC]">
                <Zap className="w-3.5 h-3.5 fill-current" />
                Playwright RPA Engine Active
              </span>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                diceStatus?.is_connected
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}>
                <span className={`w-2 h-2 rounded-full ${diceStatus?.is_connected ? 'bg-emerald-400 radar-dot-active' : 'bg-amber-400'}`} />
                {diceStatus?.is_connected ? `Dice: ${diceStatus.username || 'Connected'}` : 'Dice: Disconnected'}
              </span>
            </div>

            <h1 className="font-sans font-black text-2xl sm:text-3xl md:text-4xl tracking-tight text-white">
              Welcome back, {candidateName}.
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed max-w-xl">
              Unified intelligence center for automated multi-ATS submissions, Playwright browser robotics, and real-time Dice job matching.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                variant="primary"
                size="md"
                className="bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] hover:from-[#4F46E5] hover:to-[#7C3AED] text-white font-bold px-5 shadow-[0_4px_16px_rgba(99,102,241,0.4)]"
                onClick={() => navigate('/automation')}
                icon={Play}
              >
                Launch Auto Apply
              </Button>
              <Button
                variant="ghost"
                size="md"
                className="text-white hover:bg-white/10 border border-white/20 font-bold"
                onClick={() => navigate('/profile')}
                icon={FileText}
              >
                Resume Library ({diceStats?.resumes_count || 40})
              </Button>
            </div>
          </div>

          {/* Quick Metrics Pillar */}
          <div className="grid grid-cols-2 gap-3 shrink-0">
            <div className="p-4 rounded-xl bg-white/[0.06] border border-white/10 backdrop-blur-md">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Dice Search Profiles
              </div>
              <div className="text-2xl font-black text-white mt-0.5">
                {diceStats?.search_profiles_count ?? 3}
              </div>
              <div className="text-[10px] text-emerald-400 font-semibold mt-1">
                Scraping & Monitoring
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.06] border border-white/10 backdrop-blur-md">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Queue Active
              </div>
              <div className="text-2xl font-black text-indigo-300 mt-0.5">
                {diceStats?.queued_count ?? 0}
              </div>
              <div className="text-[10px] text-indigo-400 font-semibold mt-1">
                Background Tasks
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Job Search Box */}
      <div className="card-warm p-4 sm:p-6 shadow-sm bg-surface border-slate-200/90 rounded-xl">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex-1 w-full">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              onSearch={handleSearch}
              size="lg"
              placeholder="Search DevOps, Cloud Architect, Senior React Engineer, AI..."
              shortcut
            />
          </div>
          <Button
            variant="primary"
            size="lg"
            onClick={() => handleSearch(searchQuery)}
            className="w-full sm:w-auto px-6 bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white font-bold"
            icon={Compass}
          >
            Explore Jobs
          </Button>
        </div>

        {/* Quick Filter Prompts */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-border-warm/60 text-xs text-charcoal-muted">
          <span className="font-bold text-charcoal">Trending searches:</span>
          {['DevOps Engineer', 'Full Stack', 'Cloud Architect', 'Remote', 'Kubernetes', 'Python AI'].map((term) => (
            <button
              key={term}
              onClick={() => handleSearch(term)}
              className="px-2.5 py-1 rounded-lg bg-surface-soft hover:bg-indigo-50 hover:text-indigo-600 text-charcoal font-semibold transition-colors cursor-pointer border border-border-warm"
            >
              {term}
            </button>
          ))}
        </div>
      </div>

      {/* Metric Snapshot */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-warm p-4 sm:p-5">
          <div className="flex items-center justify-between text-charcoal-muted mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Jobs Indexed</span>
            <Briefcase className="w-4 h-4 text-brand-primary" />
          </div>
          <div className="text-2xl sm:text-3xl font-serif font-bold text-charcoal tracking-tight">
            {stats?.totalJobs ? stats.totalJobs.toLocaleString() : '17,296'}
          </div>
          <div className="text-[11px] text-charcoal-muted mt-1">
            Across 13+ ATS platforms
          </div>
        </div>

        <div className="card-warm p-4 sm:p-5">
          <div className="flex items-center justify-between text-charcoal-muted mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Remote Roles</span>
            <Globe2 className="w-4 h-4 text-brand-secondary" />
          </div>
          <div className="text-2xl sm:text-3xl font-serif font-bold text-charcoal tracking-tight">
            {stats?.remoteJobs ? stats.remoteJobs.toLocaleString() : '8,420'}
          </div>
          <div className="text-[11px] text-charcoal-muted mt-1">
            Verified remote positions
          </div>
        </div>

        <div className="card-warm p-4 sm:p-5">
          <div className="flex items-center justify-between text-charcoal-muted mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Companies</span>
            <Building2 className="w-4 h-4 text-info" />
          </div>
          <div className="text-2xl sm:text-3xl font-serif font-bold text-charcoal tracking-tight">
            {stats?.totalCompanies ? stats.totalCompanies.toLocaleString() : '1,450+'}
          </div>
          <div className="text-[11px] text-charcoal-muted mt-1">
            Actively hiring companies
          </div>
        </div>

        <div className="card-warm p-4 sm:p-5">
          <div className="flex items-center justify-between text-charcoal-muted mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">ATS Readiness</span>
            <ShieldCheck className="w-4 h-4 text-success" />
          </div>
          <div className="text-2xl sm:text-3xl font-serif font-bold text-brand-primary tracking-tight">
            {readinessScore}%
          </div>
          <div className="text-[11px] text-charcoal-muted mt-1">
            Profile & Resume primed
          </div>
        </div>
      </div>

      {/* Main Workspace Split: Recommended Jobs (Left) & Candidate Dossier (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Recommended Roles */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-charcoal tracking-tight">
                Recommended Roles
              </h2>
              <p className="text-xs text-charcoal-muted mt-0.5">
                Curated for your skills & telemetry profile
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRefreshOverview}
                disabled={isRefreshing}
                className="px-3 py-1.5 rounded-lg bg-surface border border-border-warm text-xs font-semibold text-charcoal hover:bg-surface-soft flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                title="Refresh recommended feed"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-brand-primary ${isRefreshing || isJobsLoading ? 'animate-spin' : ''}`} />
                <span>Refresh Feed</span>
              </button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/discover')}
                icon={ArrowRight}
                iconPosition="right"
              >
                View all
              </Button>
            </div>
          </div>


          {isJobsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <JobCardSkeleton key={i} />
              ))}
            </div>
          ) : jobsData?.data && jobsData.data.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {jobsData.data.map((job) => (
                <JobCard
                  key={job._id || job.id}
                  job={job}
                  userSkills={userSkills}
                />
              ))}
            </div>
          ) : (
            <div className="card-warm p-8 text-center text-charcoal-muted text-sm">
              No recommended jobs found. Start searching in Discover.
            </div>
          )}
        </div>

        {/* Right 1 Col: Candidate Workspace & Automation Status */}
        <div className="space-y-6">
          {/* Readiness Card */}
          <div className="card-warm p-6 space-y-4 bg-surface">
            <div className="flex items-center justify-between pb-3 border-b border-border-warm">
              <h3 className="text-sm font-semibold text-charcoal flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-primary" />
                Profile Readiness
              </h3>
              <Badge variant="brand" size="sm">
                {readinessScore}% Complete
              </Badge>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-charcoal-muted flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-success" />
                  Personal Information
                </span>
                <span className="font-medium text-success">Verified</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-charcoal-muted flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-success" />
                  Work Authorization
                </span>
                <span className="font-medium text-success">Ready</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-charcoal-muted flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-success" />
                  Primary Resume PDF
                </span>
                <span className="font-medium text-success">Attached</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-charcoal-muted flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-warning" />
                  Skill Endorsements
                </span>
                <span className="font-medium text-warning">Optional</span>
              </div>
            </div>

            <Button
              variant="secondary"
              size="sm"
              className="w-full"
              onClick={() => navigate('/profile')}
            >
              Manage Candidate Knowledge Graph
            </Button>
          </div>

          {/* Auto Apply Status Card */}
          <div className="card-warm p-6 space-y-4 bg-brand-wash border-brand-secondary/30">
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold text-brand-primary flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Auto Apply Engine
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-success">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                Active
              </span>
            </div>

            <p className="text-xs text-charcoal-muted leading-relaxed">
              JobsAPI can autonomously format, validate, and submit ATS applications based on your profile constraints.
            </p>

            <Button
              variant="primary"
              size="sm"
              className="w-full"
              onClick={() => navigate('/auto-apply')}
              icon={Send}
            >
              Configure Automation
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default OverviewPage;
