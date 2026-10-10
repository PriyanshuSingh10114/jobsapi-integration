import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Sparkles,
  Zap,
  Play,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Send,
  Plus,
  Trash2,
  RefreshCw,
  Search,
  MapPin,
  Bot,
  Sliders,
  Clock,
  Layers,
  ChevronRight
} from 'lucide-react';
import { fetchProfile, fetchATSReadiness, runAutoApply } from '../services/api';
import {
  fetchDiceQueueStatus,
  fetchReviewQueue,
  answerReviewQuestion,
  fetchSearchProfiles,
  createSearchProfile,
  runSearchProfile,
  deleteSearchProfile
} from '../services/diceApi';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';

export const AutoApplyPage = ({ initialTab = 'queue' }) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(initialTab);

  // --- TAB 1: Queue & Auto Apply State ---
  const [isCycleRunning, setIsCycleRunning] = useState(false);
  const [cycleResult, setCycleResult] = useState(null);
  const [settings, setSettings] = useState({
    maxPerDay: 15,
    minMatchScore: 75,
    requireReview: false,
    allowedLocations: 'Remote, United States',
    blockedCompanies: 'ExampleCorp, BadCompany',
    blockedRoles: 'Intern, Junior',
  });

  // Query Dice Queue Status
  const { data: queueStatus, refetch: refetchQueue } = useQuery({
    queryKey: ['diceQueueStatus'],
    queryFn: fetchDiceQueueStatus,
    refetchInterval: 15000,
    staleTime: 10000,
  });

  // Query Profile & Readiness
  const { data: profileData } = useQuery({
    queryKey: ['userProfile'],
    queryFn: fetchProfile,
    staleTime: 60000,
  });

  const { data: readinessData } = useQuery({
    queryKey: ['atsReadiness'],
    queryFn: fetchATSReadiness,
    staleTime: 60000,
  });

  // --- TAB 2: Review Queue State ---
  const [reviewAnswers, setReviewAnswers] = useState({});
  const [submittingReviewId, setSubmittingReviewId] = useState(null);
  const [reviewFeedback, setReviewFeedback] = useState(null);

  const {
    data: reviewQueue = [],
    isLoading: isReviewLoading,
    refetch: refetchReview
  } = useQuery({
    queryKey: ['diceReviewQueue'],
    queryFn: fetchReviewQueue,
    refetchInterval: 10000,
    staleTime: 5000,
  });

  const handleAnswerReview = async (questionId) => {
    const text = reviewAnswers[questionId];
    if (!text || !text.trim()) return;

    setSubmittingReviewId(questionId);
    setReviewFeedback(null);
    try {
      await answerReviewQuestion(questionId, text.trim());
      setReviewFeedback({ success: true, message: 'Answer recorded! Playwright submission resumed.' });
      setReviewAnswers((prev) => ({ ...prev, [questionId]: '' }));
      refetchReview();
      queryClient.invalidateQueries({ queryKey: ['diceQueueStatus'] });
    } catch (err) {
      setReviewFeedback({ success: false, message: err.message || 'Failed to submit answer' });
    } finally {
      setSubmittingReviewId(null);
    }
  };

  // --- TAB 3: Search Profiles State ---
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [runningProfileId, setRunningProfileId] = useState(null);
  const [profileRunFeedback, setProfileRunFeedback] = useState(null);
  const [newProfile, setNewProfile] = useState({
    name: '',
    keywords: '',
    location: 'Remote, United States',
    work_settings: ['Remote'],
    employment_types: ['FULLTIME'],
    easy_apply_only: true,
  });

  const {
    data: searchProfiles = [],
    isLoading: isProfilesLoading,
    refetch: refetchProfiles
  } = useQuery({
    queryKey: ['diceSearchProfiles'],
    queryFn: fetchSearchProfiles,
    staleTime: 30000,
  });

  const handleCreateSearchProfile = async (e) => {
    e.preventDefault();
    if (!newProfile.name || !newProfile.keywords) return;

    try {
      const payload = {
        name: newProfile.name,
        keywords: newProfile.keywords.split(',').map((k) => k.trim()).filter(Boolean),
        location: newProfile.location,
        work_settings: newProfile.work_settings,
        employment_types: newProfile.employment_types,
        easy_apply_only: newProfile.easy_apply_only,
      };
      await createSearchProfile(payload);
      setIsProfileModalOpen(false);
      setNewProfile({
        name: '',
        keywords: '',
        location: 'Remote, United States',
        work_settings: ['Remote'],
        employment_types: ['FULLTIME'],
        easy_apply_only: true,
      });
      refetchProfiles();
    } catch (err) {
      alert(`Error creating profile: ${err.message}`);
    }
  };

  const handleRunProfile = async (profileId) => {
    setRunningProfileId(profileId);
    setProfileRunFeedback(null);
    try {
      const res = await runSearchProfile(profileId);
      setProfileRunFeedback({
        profileId,
        message: `Found ${res.total_found ?? 0} jobs (${res.new_jobs_added ?? 0} new added)`,
      });
      refetchProfiles();
      queryClient.invalidateQueries({ queryKey: ['diceQueueStatus'] });
    } catch (err) {
      setProfileRunFeedback({
        profileId,
        isError: true,
        message: err.message || 'Failed to execute profile search',
      });
    } finally {
      setRunningProfileId(null);
    }
  };

  const handleDeleteProfile = async (profileId) => {
    if (!window.confirm('Are you sure you want to delete this search profile?')) return;
    try {
      await deleteSearchProfile(profileId);
      refetchProfiles();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRunCycle = async () => {
    setIsCycleRunning(true);
    setCycleResult(null);
    try {
      const res = await runAutoApply({
        minScore: Number(settings.minMatchScore),
        limit: 5,
      });
      setCycleResult({
        success: true,
        message: 'Auto Apply cycle triggered successfully across matching ATS feeds.',
        data: res.result,
      });
      refetchQueue();
    } catch (err) {
      setCycleResult({
        success: false,
        message: err.message || 'Auto Apply cycle failed to execute.',
      });
    } finally {
      setIsCycleRunning(false);
    }
  };

  const readinessScore = readinessData?.readiness?.overallScore || 92;
  const isResumeReady = Boolean(profileData?.profile?.assets?.length > 0 || profileData?.profile?.documents?.defaultResumePath);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Autonomous Execution Center</span>
          </div>
          <h1 className="font-sans font-extrabold text-2xl sm:text-3xl tracking-tight text-charcoal">
            Automation Center
          </h1>
          <p className="text-sm text-charcoal-muted mt-1">
            Orchestrate Dice Playwright browser robotics, automated search profiles, and ATS form submissions.
          </p>
        </div>

        {/* Global status pills */}
        <div className="flex items-center gap-2.5">
          <div className="px-3 py-1.5 rounded-xl bg-surface border border-border-warm flex items-center gap-2 text-xs shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 radar-dot-active" />
            <span className="font-semibold text-charcoal">Queue:</span>
            <span className="font-bold text-emerald-600">{queueStatus?.queued_count ?? 0} Queued</span>
          </div>

          {reviewQueue.length > 0 && (
            <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-2 text-xs text-amber-800 font-bold shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>{reviewQueue.length} Screener Reviews</span>
            </div>
          )}
        </div>
      </div>

      {/* Modern Tabs Navigation */}
      <div className="flex border-b border-border-warm space-x-1 sm:space-x-3">
        <button
          type="button"
          onClick={() => setActiveTab('queue')}
          className={`px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'queue'
              ? 'border-[#6366F1] text-[#6366F1]'
              : 'border-transparent text-charcoal-muted hover:text-charcoal'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Automation Queue</span>
          {queueStatus?.queued_count > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-700">
              {queueStatus.queued_count}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('review')}
          className={`px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'review'
              ? 'border-[#6366F1] text-[#6366F1]'
              : 'border-transparent text-charcoal-muted hover:text-charcoal'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>Human Review Queue</span>
          {reviewQueue.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
              {reviewQueue.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('profiles')}
          className={`px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'profiles'
              ? 'border-[#6366F1] text-[#6366F1]'
              : 'border-transparent text-charcoal-muted hover:text-charcoal'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>Search Profiles</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
            {searchProfiles.length}
          </span>
        </button>
      </div>

      {/* TAB 1: AUTOMATION QUEUE & CYCLE */}
      {activeTab === 'queue' && (
        <div className="space-y-6">
          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-surface border border-slate-200/90 shadow-sm space-y-1">
              <div className="text-xs font-semibold text-charcoal-muted flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5 text-indigo-600" />
                Playwright Status
              </div>
              <div className="text-lg font-bold text-charcoal flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 radar-dot-active" />
                {queueStatus?.is_active ? 'Executing' : 'Standby / Ready'}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-surface border border-slate-200/90 shadow-sm space-y-1">
              <div className="text-xs font-semibold text-charcoal-muted flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                Active in Queue
              </div>
              <div className="text-2xl font-black text-indigo-600">
                {queueStatus?.queued_count ?? 0}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-surface border border-slate-200/90 shadow-sm space-y-1">
              <div className="text-xs font-semibold text-charcoal-muted flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Completed
              </div>
              <div className="text-2xl font-black text-emerald-600">
                {queueStatus?.completed_count ?? 0}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-surface border border-slate-200/90 shadow-sm space-y-1">
              <div className="text-xs font-semibold text-charcoal-muted flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                Failed / Interrupted
              </div>
              <div className="text-2xl font-black text-rose-500">
                {queueStatus?.failed_count ?? 0}
              </div>
            </div>
          </div>

          {/* Engine Trigger & Safety Overview */}
          <div className="p-6 sm:p-8 rounded-xl bg-surface border border-slate-200/90 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border-warm">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] text-white flex items-center justify-center font-bold shadow-[0_4px_16px_rgba(99,102,241,0.35)]">
                  <Zap className="w-6 h-6 fill-current" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-charcoal">
                      Playwright & Multi-ATS Execution Engine
                    </span>
                    <Badge variant="brand" size="sm" dot>
                      Dual Core Ready
                    </Badge>
                  </div>
                  <p className="text-xs text-charcoal-muted mt-0.5">
                    Safe headless submission with question interceptor and deduplication guards.
                  </p>
                </div>
              </div>

              <Button
                variant="primary"
                size="lg"
                className="bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] hover:from-[#4F46E5] hover:to-[#7C3AED] text-white font-bold px-6 shadow-[0_4px_12px_rgba(99,102,241,0.25)]"
                isLoading={isCycleRunning}
                onClick={handleRunCycle}
                icon={Play}
              >
                Trigger Auto Apply Cycle
              </Button>
            </div>

            {/* Run Feedback */}
            {cycleResult && (
              <div
                className={`p-4 rounded-xl text-xs flex items-start gap-3 ${
                  cycleResult.success
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {cycleResult.success ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                )}
                <div>
                  <div className="font-bold">{cycleResult.message}</div>
                  {cycleResult.data && (
                    <div className="mt-1 opacity-80">
                      Processed: {cycleResult.data.processedCount || 0} jobs.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Threshold & Guardrail Settings */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 text-sm font-bold text-charcoal">
                <Sliders className="w-4 h-4 text-indigo-600" />
                <span>Execution Filters & Guardrails</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-surface-soft border border-border-warm space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-charcoal">
                    <span>Minimum Match Score</span>
                    <span className="font-bold text-indigo-600">{settings.minMatchScore}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="95"
                    step="5"
                    value={settings.minMatchScore}
                    onChange={(e) => setSettings({ ...settings, minMatchScore: e.target.value })}
                    className="w-full accent-indigo-600"
                  />
                  <p className="text-[11px] text-charcoal-muted">
                    Only jobs aligned at or above this percentage will be automatically submitted.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-surface-soft border border-border-warm space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-charcoal">
                    <span>Max Submissions per Run</span>
                    <span className="font-bold text-indigo-600">{settings.maxPerDay}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    step="1"
                    value={settings.maxPerDay}
                    onChange={(e) => setSettings({ ...settings, maxPerDay: e.target.value })}
                    className="w-full accent-indigo-600"
                  />
                  <p className="text-[11px] text-charcoal-muted">
                    Rate limits apply per cycle to prevent rate-limiting by job portals.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: HUMAN REVIEW QUEUE */}
      {activeTab === 'review' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-xs text-amber-900">
            <HelpCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Protected Screener Interception: </span>
              When an application wizard encounters a non-standard screener question (e.g. custom years of experience or security clearance), it pauses here so you can verify the answer rather than guessing.
            </div>
          </div>

          {reviewFeedback && (
            <div
              className={`p-3.5 rounded-xl text-xs font-semibold ${
                reviewFeedback.success
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {reviewFeedback.message}
            </div>
          )}

          {isReviewLoading ? (
            <div className="p-12 text-center text-xs text-charcoal-muted animate-pulse">
              Checking review queue...
            </div>
          ) : reviewQueue.length === 0 ? (
            <div className="p-12 text-center rounded-xl bg-surface border border-slate-200/90 shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-charcoal">Review Queue is Clear!</h3>
              <p className="text-xs text-charcoal-muted max-w-sm mx-auto">
                All screener questions have been answered. The Playwright automation robot is free to proceed autonomously.
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => refetchReview()}
                icon={RefreshCw}
              >
                Refresh Queue
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {reviewQueue.map((item) => (
                <div
                  key={item.id || item._id}
                  className="p-6 rounded-xl bg-surface border border-slate-200/90 shadow-sm space-y-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                        {item.job_title || 'Application Screener'} • {item.company_name || 'Employer'}
                      </div>
                      <h4 className="text-base font-bold text-charcoal mt-1">
                        {item.question_text || item.question}
                      </h4>
                    </div>
                    <Badge variant="warning" size="sm">
                      Requires Answer
                    </Badge>
                  </div>

                  <div className="flex gap-2">
                    <Input
                      placeholder="Type your answer (e.g. Yes, 5 years, Authorized)..."
                      value={reviewAnswers[item.id || item._id] || ''}
                      onChange={(e) =>
                        setReviewAnswers({
                          ...reviewAnswers,
                          [item.id || item._id]: e.target.value,
                        })
                      }
                      className="flex-1"
                    />
                    <Button
                      variant="primary"
                      size="md"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                      isLoading={submittingReviewId === (item.id || item._id)}
                      onClick={() => handleAnswerReview(item.id || item._id)}
                      icon={Send}
                    >
                      Answer & Resume
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SEARCH PROFILES */}
      {activeTab === 'profiles' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-charcoal">Automated Search Profiles</h3>
              <p className="text-xs text-charcoal-muted">
                Pre-configured criteria that scan Dice and discover newly posted matching roles.
              </p>
            </div>

            <Button
              variant="primary"
              size="sm"
              className="bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white font-bold"
              onClick={() => setIsProfileModalOpen(true)}
              icon={Plus}
            >
              New Search Profile
            </Button>
          </div>

          {isProfilesLoading ? (
            <div className="p-12 text-center text-xs text-charcoal-muted animate-pulse">
              Loading search profiles...
            </div>
          ) : searchProfiles.length === 0 ? (
            <div className="p-12 text-center rounded-xl bg-surface border border-slate-200/90 shadow-sm space-y-3">
              <Search className="w-8 h-8 text-indigo-400 mx-auto" />
              <h4 className="text-base font-bold text-charcoal">No Search Profiles Configured</h4>
              <p className="text-xs text-charcoal-muted max-w-sm mx-auto">
                Create a search profile with target keywords and locations to automatically discover and queue new jobs.
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsProfileModalOpen(true)}
                icon={Plus}
              >
                Create First Profile
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {searchProfiles.map((prof) => (
                <div
                  key={prof.id || prof._id}
                  className="p-5 rounded-xl bg-surface border border-slate-200/90 shadow-sm space-y-4 hover:border-indigo-400/50 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-base font-bold text-charcoal">
                        {prof.name}
                      </h4>
                      <div className="flex items-center gap-1.5 text-xs text-charcoal-muted mt-1">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{prof.location || 'United States'}</span>
                        <span>•</span>
                        <span className="font-semibold text-emerald-600">
                          {prof.easy_apply_only ? 'Easy Apply Only' : 'All Roles'}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteProfile(prof.id || prof._id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete profile"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Keywords pills */}
                  <div className="flex flex-wrap gap-1.5">
                    {prof.keywords?.map((k) => (
                      <span
                        key={k}
                        className="text-[11px] px-2 py-0.5 rounded-md font-medium bg-indigo-50 text-indigo-700 border border-indigo-200/60"
                      >
                        {k}
                      </span>
                    ))}
                  </div>

                  {/* Action & status */}
                  <div className="pt-2 border-t border-border-warm flex items-center justify-between">
                    <span className="text-[11px] text-charcoal-muted">
                      {profileRunFeedback?.profileId === (prof.id || prof._id) ? (
                        <span
                          className={`font-semibold ${
                            profileRunFeedback.isError ? 'text-rose-600' : 'text-emerald-600'
                          }`}
                        >
                          {profileRunFeedback.message}
                        </span>
                      ) : (
                        'Ready to execute'
                      )}
                    </span>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs font-bold text-indigo-600 hover:bg-indigo-50"
                      isLoading={runningProfileId === (prof.id || prof._id)}
                      onClick={() => handleRunProfile(prof.id || prof._id)}
                      icon={Play}
                    >
                      Run Search
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Create Modal */}
          {isProfileModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
              <div className="bg-surface rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-warm-lg border border-border-warm">
                <div className="flex items-center justify-between pb-3 border-b border-border-warm">
                  <h3 className="text-base font-bold text-charcoal">Create Search Profile</h3>
                  <button
                    type="button"
                    onClick={() => setIsProfileModalOpen(false)}
                    className="text-charcoal-muted hover:text-charcoal text-xs font-semibold"
                  >
                    Close
                  </button>
                </div>

                <form onSubmit={handleCreateSearchProfile} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-charcoal block mb-1">
                      Profile Name
                    </label>
                    <Input
                      placeholder="e.g. Senior Frontend Engineer - React"
                      value={newProfile.name}
                      onChange={(e) => setNewProfile({ ...newProfile, name: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-charcoal block mb-1">
                      Keywords (comma separated)
                    </label>
                    <Input
                      placeholder="e.g. React, TypeScript, Next.js, GraphQL"
                      value={newProfile.keywords}
                      onChange={(e) => setNewProfile({ ...newProfile, keywords: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-charcoal block mb-1">
                      Location
                    </label>
                    <Input
                      placeholder="e.g. Remote, San Francisco, CA"
                      value={newProfile.location}
                      onChange={(e) => setNewProfile({ ...newProfile, location: e.target.value })}
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="easyApply"
                      checked={newProfile.easy_apply_only}
                      onChange={(e) => setNewProfile({ ...newProfile, easy_apply_only: e.target.checked })}
                      className="rounded accent-indigo-600"
                    />
                    <label htmlFor="easyApply" className="text-xs font-semibold text-charcoal cursor-pointer">
                      Filter for Easy Apply roles only
                    </label>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsProfileModalOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                    >
                      Save Profile
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default AutoApplyPage;
