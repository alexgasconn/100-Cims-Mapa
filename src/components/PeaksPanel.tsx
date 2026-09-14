import { useState } from 'react';
import { Mountain, Search, MapPin, CheckCircle2, Activity, BarChart3 } from 'lucide-react';
import type { Peak } from '../types';

const CHALLENGE_GOAL = 100;

interface PeaksPanelProps {
    peaks: Peak[];
    activitiesCount: number;
    showPeaks: boolean;
    setShowPeaks: (v: boolean) => void;
    onlyEssential: boolean;
    setOnlyEssential: (v: boolean) => void;
    peakSearch: string;
    setPeakSearch: (s: string) => void;
    completionFilter: 'all' | 'done' | 'todo';
    setCompletionFilter: (f: 'all' | 'done' | 'todo') => void;
    completedPeakIds: Set<string>;
    proximityMeters: number;
    setProximityMeters: (n: number) => void;
    onSelectPeak?: (p: any) => void;
    onOpenStats: () => void;
}

// The single sidebar: app header, a quick-glance summary, the peaks catalog and its filters.
export default function PeaksPanel({
    peaks, activitiesCount, showPeaks, setShowPeaks, onlyEssential, setOnlyEssential, peakSearch, setPeakSearch,
    completionFilter, setCompletionFilter, completedPeakIds, proximityMeters, setProximityMeters, onSelectPeak, onOpenStats
}: PeaksPanelProps) {
    const [sortBy, setSortBy] = useState<'name' | 'height' | 'comarca' | 'essencial' | 'status'>('name');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
    const [comarcaFilter, setComarcaFilter] = useState<string>('all');

    const comarcaOptions = Array.from(new Set(
        peaks.flatMap(p => (p.region || '').split(',').map(s => s.trim()).filter(Boolean))
    )).sort();

    const toggleSort = (col: typeof sortBy) => {
        if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortBy(col); setSortDir('asc'); }
    };

    const filteredPeaks = peaks.filter(p => {
        if (onlyEssential && !p.essencial) return false;
        if (peakSearch && !p.name.toLowerCase().includes(peakSearch.toLowerCase())) return false;
        if (completionFilter === 'done' && !completedPeakIds.has(p.id)) return false;
        if (completionFilter === 'todo' && completedPeakIds.has(p.id)) return false;
        if (comarcaFilter !== 'all') {
            const regions = (p.region || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
            if (!regions.includes(comarcaFilter.toLowerCase())) return false;
        }
        return true;
    });

    const sortedPeaks = filteredPeaks.sort((a, b) => {
        const dir = sortDir === 'asc' ? 1 : -1;
        if (sortBy === 'name') return dir * a.name.localeCompare(b.name);
        if (sortBy === 'height') return dir * (Number(a.height || 0) - Number(b.height || 0));
        if (sortBy === 'comarca') return dir * ((a.region || '').localeCompare(b.region || ''));
        if (sortBy === 'essencial') return dir * ((a.essencial ? 1 : 0) - (b.essencial ? 1 : 0));
        if (sortBy === 'status') return dir * ((completedPeakIds.has(a.id) ? 1 : 0) - (completedPeakIds.has(b.id) ? 1 : 0));
        return 0;
    });

    const totalPeaks = peaks.length;
    const donePeaks = peaks.filter(p => completedPeakIds.has(p.id)).length;
    const goalPct = Math.round((Math.min(donePeaks, CHALLENGE_GOAL) / CHALLENGE_GOAL) * 100);

    return (
        <div className="h-full w-full max-h-screen overflow-y-auto bg-slate-900/95 text-slate-100 border-r border-slate-800/50 p-5 flex flex-col gap-4">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                    <Activity className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h1 className="text-lg font-bold tracking-tight leading-none">100 cims</h1>
                    <p className="text-xs text-slate-400 mt-0.5">Repte 100 Cims · FEEC</p>
                </div>
            </div>

            {/* Quick summary */}
            <div className="grid grid-cols-3 gap-2">
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-2.5 flex flex-col gap-0.5">
                    <div className="text-[10px] text-slate-400">Activitats</div>
                    <div className="text-lg font-bold text-orange-400 leading-none">{activitiesCount}</div>
                </div>
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-2.5 flex flex-col gap-0.5">
                    <div className="text-[10px] text-slate-400">Cims fets</div>
                    <div className="text-lg font-bold text-emerald-400 leading-none">{donePeaks}<span className="text-[11px] text-slate-500 font-medium">/{totalPeaks}</span></div>
                </div>
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-2.5 flex flex-col gap-0.5">
                    <div className="text-[10px] text-slate-400">Objectiu</div>
                    <div className="text-lg font-bold text-sky-400 leading-none">{Math.min(donePeaks, CHALLENGE_GOAL)}<span className="text-[11px] text-slate-500 font-medium">/{CHALLENGE_GOAL}</span></div>
                </div>
            </div>
            <div className="-mt-2">
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-1.5 rounded-full transition-all duration-500" style={{ width: `${goalPct}%` }}></div>
                </div>
            </div>

            <button
                onClick={onOpenStats}
                className="flex items-center justify-center gap-2 text-xs font-medium py-2 rounded-lg border border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-800 hover:text-orange-300 transition-colors"
            >
                <BarChart3 className="w-3.5 h-3.5" /> Veure estadístiques
            </button>

            <div>
                <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Mountain className="w-4 h-4 text-orange-400" /> Cims ({sortedPeaks.length})
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Catàleg i filtres del Repte 100 Cims</p>
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-2 gap-2">
                <button
                    onClick={() => setShowPeaks(!showPeaks)}
                    className={`flex items-center justify-center gap-1.5 text-xs font-medium py-2 rounded-lg border transition-all ${showPeaks ? 'bg-orange-500/20 border-orange-500 text-orange-300' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800'}`}
                >
                    <MapPin className="w-3.5 h-3.5" /> {showPeaks ? 'Visibles' : 'Ocults'}
                </button>
                <button
                    onClick={() => setOnlyEssential(!onlyEssential)}
                    className={`flex items-center justify-center gap-1.5 text-xs font-medium py-2 rounded-lg border transition-all ${onlyEssential ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800'}`}
                >
                    ★ Només essencials
                </button>
            </div>

            {/* Search */}
            <div className="flex items-center gap-2 bg-slate-800/50 border border-slate-700/50 rounded-lg px-3">
                <Search className="w-4 h-4 text-slate-500 shrink-0" />
                <input value={peakSearch} onChange={e => setPeakSearch(e.target.value)} placeholder="Cercar cim…" className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-slate-500" />
            </div>

            {/* Completion filter chips */}
            <div className="grid grid-cols-3 gap-1.5 bg-slate-800/40 p-1 rounded-lg">
                {([['all', 'Tots'], ['done', 'Fets'], ['todo', 'Pendents']] as const).map(([key, label]) => (
                    <button
                        key={key}
                        onClick={() => setCompletionFilter(key)}
                        className={`text-xs font-medium py-1.5 rounded-md transition-all ${completionFilter === key ? 'bg-orange-500 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Comarca filter */}
            <div className="flex items-center gap-2">
                <select value={comarcaFilter} onChange={e => setComarcaFilter(e.target.value)} className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded-lg px-2 py-1.5 text-sm outline-none">
                    <option value="all">Totes les comarques</option>
                    {comarcaOptions.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>

            {/* Proximity slider */}
            <div className="flex flex-col gap-1.5">
                <label className="flex justify-between text-xs text-slate-400">
                    <span>Llindar de proximitat</span>
                    <span className="font-medium text-slate-200">{proximityMeters} m</span>
                </label>
                <input type="range" min={20} max={500} step={5} value={proximityMeters} onChange={e => setProximityMeters(Number(e.target.value))} className="w-full accent-orange-500" />
            </div>

            {/* Sort */}
            <div className="flex items-center gap-1 text-xs text-slate-400">
                <span>Ordenar:</span>
                {([['name', 'Nom'], ['height', 'Altura'], ['status', 'Estat']] as const).map(([key, label]) => (
                    <button
                        key={key}
                        onClick={() => toggleSort(key)}
                        className={`px-1.5 py-0.5 rounded ${sortBy === key ? 'text-orange-300' : 'hover:text-slate-200'}`}
                    >
                        {label}{sortBy === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
                    </button>
                ))}
            </div>

            {/* Peak list */}
            <div className="flex flex-col gap-1 -mx-1">
                {sortedPeaks.length === 0 && (
                    <div className="text-center text-sm text-slate-500 py-6">No hi ha cims que coincideixin.</div>
                )}
                {sortedPeaks.map(p => {
                    const done = completedPeakIds.has(p.id);
                    return (
                        <div
                            key={p.id}
                            className={`group flex items-center gap-2.5 px-2 py-2 rounded-lg transition-colors cursor-pointer ${done ? 'hover:bg-emerald-500/10' : 'hover:bg-slate-800/60'}`}
                            onClick={() => onSelectPeak?.(p)}
                        >
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-sm font-medium truncate group-hover:text-orange-300">{p.name}</span>
                                    {p.essencial && <span className="text-amber-400 text-xs shrink-0">★</span>}
                                </div>
                                <div className="text-xs text-slate-500 truncate">
                                    {p.height ? `${p.height} m` : ''}{p.height && p.region ? ' · ' : ''}{p.region || ''}
                                </div>
                            </div>
                            {done
                                ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                : <span className="w-4 h-4 rounded-full border border-slate-600 shrink-0" />}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
