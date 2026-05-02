import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CSVLink } from "react-csv";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  ComposedChart
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  RefreshCw, ChevronDown, Check, Sun, Moon, Download, Printer,
} from "lucide-react";
import {
  useGetMovieStats,
  useGetTopGenres,
  useGetYearlyTrends,
  useGetCountryDistribution,
  useGetMovieRankings,
  useGetRatingBreakdown,
  useGetTopMoviesByGenre,
  getGetMovieStatsQueryKey,
  getGetTopGenresQueryKey,
  getGetYearlyTrendsQueryKey,
  getGetCountryDistributionQueryKey,
  getGetMovieRankingsQueryKey,
  getGetRatingBreakdownQueryKey,
  getGetTopMoviesByGenreQueryKey,
} from "@workspace/api-client-react";
import { CHART_COLORS, CHART_COLOR_LIST, DATA_SOURCES, SQL_QUERIES } from "@/lib/constants";
import { SqlBlock } from "@/components/sql-block";
import { KPICard } from "@/components/kpi-card";

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div style={{ backgroundColor: "hsl(var(--card))", borderRadius: "6px", padding: "10px 14px", border: "1px solid hsl(var(--border))", color: "hsl(var(--foreground))", fontSize: "13px", boxShadow: "var(--shadow-md)" }}>
      <div style={{ marginBottom: "6px", fontWeight: 500, display: "flex", alignItems: "center", gap: "6px" }}>
        {payload.length === 1 && payload[0].color && payload[0].color !== "#ffffff" && (
          <span style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "2px", backgroundColor: payload[0].color, flexShrink: 0 }} />
        )}
        {label}
      </div>
      {payload.map((entry: any, index: number) => (
        <div key={index} style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "3px" }}>
          {payload.length > 1 && entry.color && entry.color !== "#ffffff" && (
            <span style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "2px", backgroundColor: entry.color, flexShrink: 0 }} />
          )}
          <span style={{ color: "hsl(var(--muted-foreground))" }}>{entry.name}</span>
          <span style={{ marginLeft: "auto", fontWeight: 600, fontFamily: "var(--font-mono)" }}>
            {typeof entry.value === "number" ? entry.value.toLocaleString() : entry.value}
            {entry.payload && entry.payload.percentage !== undefined && entry.name === 'Count' ? ` (${entry.payload.percentage}%)` : ''}
          </span>
        </div>
      ))}
    </div>
  );
}

function CustomLegend({ payload }: any) {
  if (!payload || payload.length === 0) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "8px 16px", fontSize: "13px", marginTop: "10px" }}>
      {payload.map((entry: any, index: number) => (
        <div key={index} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "2px", backgroundColor: entry.color, flexShrink: 0 }} />
          <span style={{ color: "hsl(var(--muted-foreground))" }}>{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedIntervalMs, setSelectedIntervalMs] = useState(5 * 60 * 1000);
  const [genreFilter, setGenreFilter] = useState<string>("All");

  const queryClient = useQueryClient();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const statsQuery = useGetMovieStats({ query: { queryKey: getGetMovieStatsQueryKey() } });
  const topGenresQuery = useGetTopGenres({ query: { queryKey: getGetTopGenresQueryKey() } });
  const yearlyTrendsQuery = useGetYearlyTrends({ query: { queryKey: getGetYearlyTrendsQueryKey() } });
  const countryDistQuery = useGetCountryDistribution({ query: { queryKey: getGetCountryDistributionQueryKey() } });
  const movieRankingsQuery = useGetMovieRankings({ query: { queryKey: getGetMovieRankingsQueryKey() } });
  const ratingBreakdownQuery = useGetRatingBreakdown({ query: { queryKey: getGetRatingBreakdownQueryKey() } });
  const topMoviesGenreQuery = useGetTopMoviesByGenre({ query: { queryKey: getGetTopMoviesByGenreQueryKey() } });

  const loading = 
    statsQuery.isLoading || statsQuery.isFetching ||
    topGenresQuery.isLoading || topGenresQuery.isFetching ||
    yearlyTrendsQuery.isLoading || yearlyTrendsQuery.isFetching ||
    countryDistQuery.isLoading || countryDistQuery.isFetching ||
    movieRankingsQuery.isLoading || movieRankingsQuery.isFetching ||
    ratingBreakdownQuery.isLoading || ratingBreakdownQuery.isFetching ||
    topMoviesGenreQuery.isLoading || topMoviesGenreQuery.isFetching;

  useEffect(() => {
    if (loading) {
      setIsSpinning(true);
    } else {
      const t = setTimeout(() => setIsSpinning(false), 600);
      return () => clearTimeout(t);
    }
  }, [loading]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (autoRefresh) {
      interval = setInterval(() => handleRefresh(), selectedIntervalMs);
    }
    return () => clearInterval(interval);
  }, [autoRefresh, selectedIntervalMs]);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: getGetMovieStatsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetTopGenresQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetYearlyTrendsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetCountryDistributionQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetMovieRankingsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetRatingBreakdownQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetTopMoviesByGenreQueryKey() });
  };

  const statsData = statsQuery.data;
  const topGenresData = topGenresQuery.data || [];
  const yearlyTrendsData = yearlyTrendsQuery.data || [];
  const countryDistData = countryDistQuery.data || [];
  const movieRankingsData = movieRankingsQuery.data || [];
  const ratingBreakdownData = ratingBreakdownQuery.data || [];
  const topMoviesGenreData = topMoviesGenreQuery.data || [];

  const filteredRankings = genreFilter === "All" 
    ? movieRankingsData 
    : movieRankingsData.filter(m => m.genre === genreFilter);

  const uniqueGenres = Array.from(new Set(movieRankingsData.map(m => m.genre))).sort();

  const gridColor = isDark ? "rgba(255,255,255,0.08)" : "#e5e5e5";
  const tickColor = isDark ? "#98999C" : "#71717a";

  const lastRefreshed = statsQuery.dataUpdatedAt
    ? (() => {
        const d = new Date(statsQuery.dataUpdatedAt);
        const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }).toLowerCase();
        const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        return `${time} on ${date}`;
      })()
    : null;

  return (
    <div className="min-h-screen bg-background px-5 py-4 pt-[32px] pb-[32px] pl-[24px] pr-[24px] font-sans">
      <div className="max-w-[1400px] mx-auto">
        
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <div className="pt-2">
            <h1 className="font-bold text-[32px] tracking-tight">Movie SQL Analytics</h1>
            <p className="text-muted-foreground mt-1.5 text-[14px]">Explore a Netflix-style catalog with advanced SQL queries.</p>
            
            {DATA_SOURCES.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-[12px] text-muted-foreground shrink-0">Data Sources:</span>
                {DATA_SOURCES.map((source) => (
                  <span
                    key={source}
                    className="text-[12px] font-bold rounded px-2 py-0.5 truncate print:!bg-[rgb(229,231,235)] print:!text-[rgb(75,85,99)]"
                    title={source}
                    style={{
                      maxWidth: "20ch",
                      backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgb(229, 231, 235)",
                      color: isDark ? "#c8c9cc" : "rgb(75, 85, 99)",
                    }}
                  >
                    {source}
                  </span>
                ))}
              </div>
            )}
            {lastRefreshed && <p className="text-[12px] text-muted-foreground mt-3 font-mono">Last refresh: {lastRefreshed}</p>}
          </div>
          
          <div className="flex items-center gap-3 pt-2 print:hidden">
            <div className="relative" ref={dropdownRef}>
              <div
                className="flex items-center rounded-[6px] overflow-hidden h-[26px] text-[12px]"
                style={{
                  backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#F0F1F2",
                  color: isDark ? "#c8c9cc" : "#4b5563",
                }}
              >
                <button onClick={handleRefresh} disabled={loading} className="flex items-center gap-1 px-2 h-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors disabled:opacity-50">
                  <RefreshCw className={`w-3.5 h-3.5 ${isSpinning ? "animate-spin" : ""}`} />
                  Refresh
                </button>
                <div className="w-px h-4 shrink-0" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)" }} />
                <button onClick={() => setDropdownOpen((o) => !o)} className="flex items-center justify-center px-1.5 h-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-popover border border-border rounded-md shadow-md z-50 py-1 text-[13px]">
                  <div className="px-3 py-2 flex items-center justify-between border-b border-border mb-1">
                    <span className="font-medium text-foreground">Auto-refresh</span>
                    <button 
                      onClick={() => setAutoRefresh(!autoRefresh)}
                      className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${autoRefresh ? 'bg-primary' : 'bg-muted'}`}
                    >
                      <span className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${autoRefresh ? 'translate-x-3' : 'translate-x-0'}`} />
                    </button>
                  </div>
                  {[
                    { label: "Every 5 min", ms: 5 * 60 * 1000 },
                    { label: "Every 15 min", ms: 15 * 60 * 1000 },
                    { label: "Every 1 hour", ms: 60 * 60 * 1000 },
                  ].map((opt) => (
                    <button
                      key={opt.ms}
                      onClick={() => { setSelectedIntervalMs(opt.ms); setDropdownOpen(false); setAutoRefresh(true); }}
                      className="w-full text-left px-3 py-1.5 hover:bg-muted/50 flex items-center justify-between text-muted-foreground hover:text-foreground"
                    >
                      {opt.label}
                      {selectedIntervalMs === opt.ms && autoRefresh && <Check className="w-3.5 h-3.5 text-primary" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => window.print()}
              disabled={loading}
              className="flex items-center justify-center w-[26px] h-[26px] rounded-[6px] transition-colors disabled:opacity-50"
              style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#F0F1F2", color: isDark ? "#c8c9cc" : "#4b5563" }}
              aria-label="Export as PDF"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsDark((d) => !d)}
              className="flex items-center justify-center w-[26px] h-[26px] rounded-[6px] transition-colors"
              style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#F0F1F2", color: isDark ? "#c8c9cc" : "#4b5563" }}
              aria-label="Toggle dark mode"
            >
              {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KPICard title="Total Titles" value={statsData?.totalTitles ?? '--'} loading={loading} />
          <KPICard title="Total Movies" value={statsData?.totalMovies ?? '--'} loading={loading} />
          <KPICard title="Total TV Shows" value={statsData?.totalTvShows ?? '--'} loading={loading} />
          <KPICard title="Countries Covered" value={statsData?.totalCountries ?? '--'} loading={loading} color={CHART_COLORS.purple} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          {/* Yearly Trends */}
          <Card>
            <CardHeader className="px-5 pt-5 pb-2 flex-row items-start justify-between space-y-0">
              <div className="w-full pr-4">
                <CardTitle className="text-base">Yearly Content Production</CardTitle>
                <SqlBlock query={SQL_QUERIES.yearlyTrends} />
              </div>
              {!loading && yearlyTrendsData.length > 0 && (
                <CSVLink data={yearlyTrendsData} filename="yearly-trends.csv" className="print:hidden flex-shrink-0 flex items-center justify-center w-[26px] h-[26px] rounded-[6px] transition-colors hover:opacity-80" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#F0F1F2", color: isDark ? "#c8c9cc" : "#4b5563" }}>
                  <Download className="w-3.5 h-3.5" />
                </CSVLink>
              )}
            </CardHeader>
            <CardContent className="px-5 pb-5">
              {loading ? <Skeleton className="w-full h-[300px]" /> : (
                <ResponsiveContainer width="100%" height={300} debounce={0}>
                  <AreaChart data={yearlyTrendsData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorMovies" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS.blue} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={CHART_COLORS.blue} stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorTv" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS.purple} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={CHART_COLORS.purple} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                    <XAxis dataKey="year" tick={{ fontSize: 12, fill: tickColor, fontFamily: "var(--font-mono)" }} stroke={tickColor} minTickGap={20} />
                    <YAxis tick={{ fontSize: 12, fill: tickColor, fontFamily: "var(--font-mono)" }} stroke={tickColor} />
                    <RechartsTooltip content={<CustomTooltip />} isAnimationActive={false} cursor={{ fill: 'rgba(0,0,0,0.05)', stroke: 'none' }} />
                    <Legend content={<CustomLegend />} verticalAlign="bottom" height={36} />
                    <Area type="monotone" dataKey="movies" name="Movies" stroke={CHART_COLORS.blue} fillOpacity={1} fill="url(#colorMovies)" strokeWidth={2} isAnimationActive={false} />
                    <Area type="monotone" dataKey="tvShows" name="TV Shows" stroke={CHART_COLORS.purple} fillOpacity={1} fill="url(#colorTv)" strokeWidth={2} isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Rating Breakdown */}
          <Card>
            <CardHeader className="px-5 pt-5 pb-2 flex-row items-start justify-between space-y-0">
              <div className="w-full pr-4">
                <CardTitle className="text-base">Rating Distribution</CardTitle>
                <SqlBlock query={SQL_QUERIES.ratingBreakdown} />
              </div>
              {!loading && ratingBreakdownData.length > 0 && (
                <CSVLink data={ratingBreakdownData} filename="rating-breakdown.csv" className="print:hidden flex-shrink-0 flex items-center justify-center w-[26px] h-[26px] rounded-[6px] transition-colors hover:opacity-80" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#F0F1F2", color: isDark ? "#c8c9cc" : "#4b5563" }}>
                  <Download className="w-3.5 h-3.5" />
                </CSVLink>
              )}
            </CardHeader>
            <CardContent className="px-5 pb-5">
              {loading ? <Skeleton className="w-full h-[300px]" /> : (
                <ResponsiveContainer width="100%" height={300} debounce={0}>
                  <PieChart>
                    <Pie
                      data={ratingBreakdownData.slice(0, 6)}
                      dataKey="count"
                      nameKey="rating"
                      cx="50%"
                      cy="45%"
                      innerRadius={80}
                      outerRadius={110}
                      paddingAngle={2}
                      cornerRadius={2}
                      stroke="none"
                      isAnimationActive={false}
                    >
                      {ratingBreakdownData.slice(0, 6).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLOR_LIST[index % CHART_COLOR_LIST.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<CustomTooltip />} isAnimationActive={false} />
                    <Legend content={<CustomLegend />} verticalAlign="bottom" />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          {/* Top Genres Chart & Table */}
          <Card>
            <CardHeader className="px-5 pt-5 pb-2 flex-row items-start justify-between space-y-0">
              <div className="w-full pr-4">
                <CardTitle className="text-base">Top Genres by Content Type</CardTitle>
                <SqlBlock query={SQL_QUERIES.topGenres} />
              </div>
              {!loading && topGenresData.length > 0 && (
                <CSVLink data={topGenresData} filename="top-genres.csv" className="print:hidden flex-shrink-0 flex items-center justify-center w-[26px] h-[26px] rounded-[6px] transition-colors hover:opacity-80" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#F0F1F2", color: isDark ? "#c8c9cc" : "#4b5563" }}>
                  <Download className="w-3.5 h-3.5" />
                </CSVLink>
              )}
            </CardHeader>
            <CardContent className="px-5 pb-5">
              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="w-full h-[300px]" />
                  <Skeleton className="w-full h-[150px]" />
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={320} debounce={0}>
                    <BarChart data={topGenresData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 12, fill: tickColor, fontFamily: "var(--font-mono)" }} stroke={tickColor} />
                      <YAxis dataKey="genre" type="category" tick={{ fontSize: 12, fill: tickColor }} stroke={tickColor} width={100} />
                      <RechartsTooltip content={<CustomTooltip />} isAnimationActive={false} cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }} />
                      <Legend content={<CustomLegend />} verticalAlign="bottom" />
                      <Bar dataKey="movieCount" name="Movies" stackId="a" fill={CHART_COLORS.blue} fillOpacity={0.8} activeBar={{ fillOpacity: 1 }} isAnimationActive={false} />
                      <Bar dataKey="tvShowCount" name="TV Shows" stackId="a" fill={CHART_COLORS.purple} fillOpacity={0.8} activeBar={{ fillOpacity: 1 }} isAnimationActive={false} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  
                  <div className="mt-6 rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead>Genre</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead className="text-right">Movies</TableHead>
                          <TableHead className="text-right">TV Shows</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {topGenresData.slice(0, 5).map((g) => (
                          <TableRow key={g.genre}>
                            <TableCell className="font-medium">{g.genre}</TableCell>
                            <TableCell className="text-right font-mono text-[13px]">{g.count.toLocaleString()}</TableCell>
                            <TableCell className="text-right font-mono text-[13px] text-blue-600 dark:text-blue-400">{g.movieCount.toLocaleString()}</TableCell>
                            <TableCell className="text-right font-mono text-[13px] text-purple-600 dark:text-purple-400">{g.tvShowCount.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Country Distribution Chart & Table */}
          <Card>
            <CardHeader className="px-5 pt-5 pb-2 flex-row items-start justify-between space-y-0">
              <div className="w-full pr-4">
                <CardTitle className="text-base">Country Distribution</CardTitle>
                <SqlBlock query={SQL_QUERIES.countryDistribution} />
              </div>
              {!loading && countryDistData.length > 0 && (
                <CSVLink data={countryDistData} filename="country-distribution.csv" className="print:hidden flex-shrink-0 flex items-center justify-center w-[26px] h-[26px] rounded-[6px] transition-colors hover:opacity-80" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#F0F1F2", color: isDark ? "#c8c9cc" : "#4b5563" }}>
                  <Download className="w-3.5 h-3.5" />
                </CSVLink>
              )}
            </CardHeader>
            <CardContent className="px-5 pb-5">
              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="w-full h-[300px]" />
                  <Skeleton className="w-full h-[150px]" />
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={320} debounce={0}>
                    <BarChart data={countryDistData.slice(0, 10)} margin={{ top: 15, right: 5, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                      <XAxis dataKey="country" tick={{ fontSize: 11, fill: tickColor }} stroke={tickColor} angle={-45} textAnchor="end" height={60} />
                      <YAxis tick={{ fontSize: 12, fill: tickColor, fontFamily: "var(--font-mono)" }} stroke={tickColor} />
                      <RechartsTooltip content={<CustomTooltip />} isAnimationActive={false} cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }} />
                      <Bar dataKey="count" name="Count" fill={CHART_COLORS.green} fillOpacity={0.8} activeBar={{ fillOpacity: 1 }} isAnimationActive={false} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  
                  <div className="mt-6 rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead className="w-16">Rank</TableHead>
                          <TableHead>Country</TableHead>
                          <TableHead className="text-right">Titles</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {countryDistData.slice(0, 5).map((c) => (
                          <TableRow key={c.country}>
                            <TableCell className="font-mono text-muted-foreground">#{c.rank}</TableCell>
                            <TableCell className="font-medium">{c.country}</TableCell>
                            <TableCell className="text-right font-mono text-[13px]">{c.count.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Window Function Rankings */}
        <Card className="mb-4">
          <CardHeader className="px-5 pt-5 pb-2 flex-row items-start justify-between space-y-0">
            <div className="w-full pr-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
                <div>
                  <CardTitle className="text-base">Window Function Rankings</CardTitle>
                  <p className="text-[13px] text-muted-foreground mt-1">Top 5 newest titles ranked within their genre</p>
                </div>
                <div className="w-full sm:w-[200px] shrink-0 print:hidden">
                  <Select value={genreFilter} onValueChange={setGenreFilter} disabled={loading}>
                    <SelectTrigger className="h-8 text-[13px]">
                      <SelectValue placeholder="Filter by Genre" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Genres</SelectItem>
                      {uniqueGenres.map(g => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <SqlBlock query={SQL_QUERIES.movieRankings} />
            </div>
            {!loading && filteredRankings.length > 0 && (
              <CSVLink data={filteredRankings} filename="window-rankings.csv" className="print:hidden flex-shrink-0 flex items-center justify-center w-[26px] h-[26px] rounded-[6px] transition-colors hover:opacity-80" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#F0F1F2", color: isDark ? "#c8c9cc" : "#4b5563" }}>
                <Download className="w-3.5 h-3.5" />
              </CSVLink>
            )}
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {loading ? (
               <div className="space-y-2">
                 <Skeleton className="h-10 w-full" />
                 {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
               </div>
            ) : (
              <div className="rounded-md border max-h-[500px] overflow-auto relative">
                <Table>
                  <TableHeader className="bg-muted/80 sticky top-0 z-10 backdrop-blur-sm">
                    <TableRow>
                      <TableHead className="w-16 whitespace-nowrap">Rk</TableHead>
                      <TableHead className="w-16 whitespace-nowrap">Row#</TableHead>
                      <TableHead>Genre</TableHead>
                      <TableHead className="min-w-[200px]">Title</TableHead>
                      <TableHead className="whitespace-nowrap">Type</TableHead>
                      <TableHead className="text-right">Year</TableHead>
                      <TableHead className="whitespace-nowrap text-right">Rating</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRankings.map((r, i) => (
                      <TableRow key={`${r.id}-${i}`}>
                        <TableCell className="font-mono text-[13px] text-purple-600 dark:text-purple-400">{r.rankInGenre}</TableCell>
                        <TableCell className="font-mono text-[13px] text-muted-foreground">{r.rowNum}</TableCell>
                        <TableCell className="whitespace-nowrap text-[13px] font-medium">{r.genre}</TableCell>
                        <TableCell className="font-medium text-[14px]">{r.title}</TableCell>
                        <TableCell className="text-[13px] text-muted-foreground">{r.type}</TableCell>
                        <TableCell className="text-right font-mono text-[13px]">{r.releaseYear}</TableCell>
                        <TableCell className="text-right text-[13px]">{r.rating}</TableCell>
                      </TableRow>
                    ))}
                    {filteredRankings.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                          No results found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Title per Genre */}
        <Card>
          <CardHeader className="px-5 pt-5 pb-2 flex-row items-start justify-between space-y-0">
            <div className="w-full pr-4">
              <CardTitle className="text-base">Latest Release per Genre</CardTitle>
              <p className="text-[13px] text-muted-foreground mt-1">Using ROW_NUMBER() = 1 to deduplicate</p>
              <SqlBlock query={SQL_QUERIES.topByGenre} />
            </div>
            {!loading && topMoviesGenreData.length > 0 && (
              <CSVLink data={topMoviesGenreData} filename="latest-by-genre.csv" className="print:hidden flex-shrink-0 flex items-center justify-center w-[26px] h-[26px] rounded-[6px] transition-colors hover:opacity-80" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#F0F1F2", color: isDark ? "#c8c9cc" : "#4b5563" }}>
                <Download className="w-3.5 h-3.5" />
              </CSVLink>
            )}
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {loading ? (
               <div className="space-y-2">
                 <Skeleton className="h-10 w-full" />
                 {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
               </div>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Genre</TableHead>
                      <TableHead>Latest Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Year</TableHead>
                      <TableHead className="text-right">Rating</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topMoviesGenreData.slice(0, 10).map((r, i) => (
                      <TableRow key={`${r.genre}-${i}`}>
                        <TableCell className="font-medium text-[13px]">{r.genre}</TableCell>
                        <TableCell className="font-medium">{r.title}</TableCell>
                        <TableCell className="text-[13px] text-muted-foreground">{r.type}</TableCell>
                        <TableCell className="text-right font-mono text-[13px]">{r.releaseYear}</TableCell>
                        <TableCell className="text-right text-[13px]">{r.rating}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
