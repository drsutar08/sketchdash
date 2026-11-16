import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Award, RefreshCw, TrendingUp, Trophy, X } from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { LeaderboardDayPoint, LeaderboardEntry, SupportedLanguage } from '../../shared/gameData';
import { getUIText } from '../i18n/translations';
import { soundEngine } from '../utils/sound';
import { ProceduralAvatar } from './ProceduralAvatar';

interface TopPlayersLeaderboardProps {
  isOpen: boolean;
  language: SupportedLanguage;
  onClose: () => void;
}

function buildFallback7Days(entry: LeaderboardEntry): LeaderboardDayPoint[] {
  const now = new Date();
  const points: LeaderboardDayPoint[] = [];
  for (let offset = 6; offset >= 0; offset--) {
    const d = new Date(now);
    d.setUTCDate(now.getUTCDate() - offset);
    const key = d.toISOString().slice(0, 10);
    const isToday = offset === 0;
    points.push({
      date: key,
      label: isToday
        ? 'Today'
        : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }),
      earned: isToday ? entry.totalPoints : 0,
      cumulative: isToday ? entry.totalPoints : 0,
    });
  }
  return points;
}

export const TopPlayersLeaderboard: React.FC<TopPlayersLeaderboardProps> = ({
  isOpen,
  language,
  onClose,
}) => {
  const [players, setPlayers] = useState<LeaderboardEntry[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [chartMetric, setChartMetric] = useState<'cumulative' | 'earned'>('cumulative');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const t = getUIText(language);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/leaderboard');
      if (!res.ok) {
        throw new Error('Failed to load leaderboard');
      }
      const data = (await res.json()) as { players?: LeaderboardEntry[] };
      const list = Array.isArray(data.players) ? data.players.slice(0, 10) : [];
      setPlayers(list);
      setSelectedId((prev) => {
        if (prev && list.some((p) => p.id === prev)) return prev;
        return list[0]?.id ?? null;
      });
    } catch {
      setError(t.leaderboard.fetchError);
    } finally {
      setLoading(false);
    }
  }, [t.leaderboard.fetchError]);

  useEffect(() => {
    if (isOpen) {
      fetchLeaderboard();
    }
  }, [isOpen, fetchLeaderboard]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const selectedPlayer = useMemo(() => {
    if (players.length === 0) return null;
    return players.find((p) => p.id === selectedId) || players[0];
  }, [players, selectedId]);

  const chartData = useMemo(() => {
    if (!selectedPlayer) return [];
    return selectedPlayer.history7Days && selectedPlayer.history7Days.length > 0
      ? selectedPlayer.history7Days
      : buildFallback7Days(selectedPlayer);
  }, [selectedPlayer]);

  const sevenDayGain = useMemo(
    () => chartData.reduce((sum, pt) => sum + pt.earned, 0),
    [chartData]
  );

  if (!isOpen) return null;

  const strokeColor = selectedPlayer?.avatarColor || '#FF5A36';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t.leaderboard.title}
    >
      <div className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl bg-[#1A1E28] border border-white/10 shadow-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-white/8 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400 shrink-0" />
              <h2 className="font-display text-2xl font-bold text-white tracking-tight">
                {t.leaderboard.title}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              {t.leaderboard.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                fetchLeaderboard();
              }}
              disabled={loading}
              aria-label={t.common.refresh}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#14171F] hover:bg-white/10 border border-white/8 text-xs font-medium text-slate-200 whitespace-nowrap shrink-0 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{t.common.refresh}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                onClose();
              }}
              aria-label={t.common.close}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {error ? (
            <div className="p-5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-center space-y-3">
              <p className="text-sm text-rose-200">{error}</p>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  fetchLeaderboard();
                }}
                className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-semibold text-white cursor-pointer"
              >
                {t.common.tryAgain}
              </button>
            </div>
          ) : loading && players.length === 0 ? (
            <div className="space-y-2.5">
              {Array.from({ length: 5 }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-14 rounded-xl bg-[#14171F] border border-white/5 animate-pulse"
                />
              ))}
            </div>
          ) : players.length === 0 ? (
            <div className="py-12 px-4 text-center space-y-2 rounded-xl bg-[#14171F] border border-white/8">
              <Trophy className="w-8 h-8 text-slate-500 mx-auto" />
              <div className="font-display text-lg font-bold text-white">
                {t.leaderboard.emptyTitle}
              </div>
              <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto">
                {t.leaderboard.emptyDesc}
              </p>
            </div>
          ) : (
            <>
              {selectedPlayer && (
                <div className="rounded-xl bg-[#14171F] border border-white/8 p-4 sm:p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <ProceduralAvatar
                        avatar={selectedPlayer.avatar}
                        color={selectedPlayer.avatarColor}
                        name={selectedPlayer.name}
                        className="w-9 h-9"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 text-sm font-bold text-white truncate">
                          <TrendingUp className="w-4 h-4 text-[#FF5A36] shrink-0" />
                          <span className="truncate">
                            {selectedPlayer.name} · {t.leaderboard.growthSuffix}
                          </span>
                          {selectedPlayer.hasDailyBadge && (
                            <span title={t.daily.badgeTooltip} className="inline-flex shrink-0">
                              <Award className="w-4 h-4 text-amber-400" />
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-2 tabular-nums">
                          <span>
                            {t.leaderboard.totalLabel} {selectedPlayer.totalPoints.toLocaleString()} {t.common.pts}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="text-emerald-400">
                            +{sevenDayGain.toLocaleString()} {t.leaderboard.last7dSuffix}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 p-1 rounded-lg bg-[#1A1E28] border border-white/6 self-start sm:self-auto shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          soundEngine.playClick();
                          setChartMetric('cumulative');
                        }}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                          chartMetric === 'cumulative'
                            ? 'bg-[#FF5A36] text-white'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {t.leaderboard.totalTrend}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          soundEngine.playClick();
                          setChartMetric('earned');
                        }}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                          chartMetric === 'earned'
                            ? 'bg-[#FF5A36] text-white'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {t.leaderboard.dailyEarned}
                      </button>
                    </div>
                  </div>

                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                        <defs>
                          <linearGradient id="playerGrowthFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={strokeColor} stopOpacity={0.38} />
                            <stop offset="95%" stopColor={strokeColor} stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" vertical={false} />
                        <XAxis
                          dataKey="label"
                          stroke="#64748B"
                          tick={{ fill: '#94A3B8', fontSize: 11 }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          stroke="#64748B"
                          tick={{ fill: '#94A3B8', fontSize: 11 }}
                          tickLine={false}
                          axisLine={false}
                          width={52}
                          allowDecimals={false}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (!active || !payload || payload.length === 0) return null;
                            const pt = payload[0].payload as LeaderboardDayPoint;
                            return (
                              <div className="rounded-xl bg-[#1A1E28] border border-white/12 px-3 py-2 shadow-xl text-xs space-y-1">
                                <div className="font-semibold text-white">{pt.label}</div>
                                <div className="font-mono text-slate-300 tabular-nums">
                                  {t.leaderboard.totalLabel}{' '}
                                  <span className="text-white font-bold">
                                    {pt.cumulative.toLocaleString()} {t.common.pts}
                                  </span>
                                </div>
                                <div className="font-mono text-emerald-400 tabular-nums">
                                  {t.leaderboard.earnedLabel} +{pt.earned.toLocaleString()} {t.common.pts}
                                </div>
                              </div>
                            );
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey={chartMetric}
                          stroke={strokeColor}
                          strokeWidth={2.5}
                          fillOpacity={1}
                          fill="url(#playerGrowthFill)"
                          activeDot={{ r: 5, strokeWidth: 0, fill: strokeColor }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <div className="grid grid-cols-[44px_1fr_auto] items-center px-3 pb-1 text-xs font-medium text-slate-500">
                  <span>{t.leaderboard.rankCol}</span>
                  <span>{t.leaderboard.playerCol}</span>
                  <span className="text-right">{t.leaderboard.pointsCol}</span>
                </div>

                {players.map((entry, idx) => {
                  const rank = idx + 1;
                  const isTopThree = rank <= 3;
                  const isSelected = selectedPlayer?.id === entry.id;
                  return (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => {
                        soundEngine.playClick();
                        setSelectedId(entry.id);
                      }}
                      className={`w-full text-left grid grid-cols-[44px_1fr_auto] items-center gap-2 px-3 py-2.5 rounded-xl border transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#222735] border-[#FF5A36]'
                          : rank === 1
                          ? 'bg-amber-500/10 border-amber-400/30 hover:bg-amber-500/15'
                          : 'bg-[#14171F] border-white/6 hover:border-white/15'
                      }`}
                    >
                      <span
                        className={`font-mono text-sm font-bold tabular-nums ${
                          rank === 1
                            ? 'text-amber-300'
                            : rank === 2
                            ? 'text-slate-200'
                            : rank === 3
                            ? 'text-orange-300'
                            : 'text-slate-500'
                        }`}
                      >
                        #{rank}
                      </span>

                      <div className="flex items-center gap-3 min-w-0">
                        <ProceduralAvatar
                          avatar={entry.avatar}
                          color={entry.avatarColor}
                          name={entry.name}
                          className="w-9 h-9"
                        />
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-white truncate flex items-center gap-1.5">
                            <span className="truncate">{entry.name}</span>
                            {entry.hasDailyBadge && (
                              <span title={t.daily.badgeTooltip} className="inline-flex shrink-0">
                                <Award className="w-3.5 h-3.5 text-amber-400" />
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 flex items-center gap-1.5 tabular-nums">
                            <span>
                              {entry.gamesPlayed}{' '}
                              {entry.gamesPlayed === 1
                                ? t.leaderboard.gameSingular
                                : t.leaderboard.gamePlural}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>
                              {entry.wins}{' '}
                              {entry.wins === 1 ? t.leaderboard.winSingular : t.leaderboard.winPlural}
                            </span>
                            {isTopThree && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="text-amber-300">
                                  {rank === 1
                                    ? t.leaderboard.place1
                                    : rank === 2
                                    ? t.leaderboard.place2
                                    : t.leaderboard.place3}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right font-mono text-sm font-bold text-white tabular-nums whitespace-nowrap">
                        {entry.totalPoints.toLocaleString()} {t.common.pts}
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
