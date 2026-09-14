import { useMemo, useState } from 'react';
import { ArrowLeft, BarChart3, CheckCircle2, ChevronRight, Flag, MapPin, Mountain, Target, Trophy } from 'lucide-react';
import type { Peak } from '../types';
import comarquesData from '../../comarques.json';

interface StatsPageProps {
    peaks: Peak[];
    completedPeakIds: Set<string>;
    onBack: () => void;
}

type Tab = 'resum' | 'comarca' | 'provincia' | 'alcada';
const CHALLENGE_GOAL = 100;

// Reverse lookup: comarca name (normalized) -> província name
const COMARCA_TO_PROVINCIA = new Map<string, string>();
for (const [provincia, comarques] of Object.entries(comarquesData as Record<string, string[]>)) {
    for (const comarca of comarques) {
        COMARCA_TO_PROVINCIA.set(comarca.trim().toLowerCase(), provincia);
    }
}
function provinciaOf(comarca: string): string {
    return COMARCA_TO_PROVINCIA.get(comarca.trim().toLowerCase()) || 'Sense província';
}

// Full separate page (not an overlay) for the detailed stats, reachable from the sidebar.
export default function StatsPage({ peaks, completedPeakIds, onBack }: StatsPageProps) {
    const [tab, setTab] = useState<Tab>('resum');
    const [selectedComarca, setSelectedComarca] = useState<string | null>(null);
    const [selectedProvincia, setSelectedProvincia] = useState<string | null>(null);
    const [selectedHeightRange, setSelectedHeightRange] = useState<string | null>(null);

    const changeTab = (next: Tab) => {
        setTab(next);
        setSelectedComarca(null);
        setSelectedProvincia(null);
        setSelectedHeightRange(null);
    };

    const peaksOfComarca = (comarca: string) => peaks.filter(p =>
        (p.region || '').split(',').map(s => s.trim()).includes(comarca)
    ).sort((a, b) => a.name.localeCompare(b.name));

    const totalPeaks = peaks.length;
    const donePeaks = peaks.filter(p => completedPeakIds.has(p.id)).length;
    const completionRate = totalPeaks > 0 ? Math.round((donePeaks / totalPeaks) * 100) : 0;
    const essentialPeaks = peaks.filter(p => p.essencial).length;
    const essentialCompleted = peaks.filter(p => p.essencial && completedPeakIds.has(p.id)).length;
    const essentialRate = essentialPeaks > 0 ? Math.round((essentialCompleted / essentialPeaks) * 100) : 0;
    const challengeProgress = Math.min(donePeaks, CHALLENGE_GOAL);
    const challengeRate = Math.round((challengeProgress / CHALLENGE_GOAL) * 100);
    const remainingForChallenge = Math.max(CHALLENGE_GOAL - challengeProgress, 0);
    const completedRegions = new Set(peaks.filter(p => completedPeakIds.has(p.id)).flatMap(p =>
        (p.region || '').split(',').map(region => region.trim()).filter(Boolean)
    )).size;
    const avgHeight = totalPeaks > 0 ? Math.round(peaks.reduce((sum, p) => sum + (Number(p.height || 0)), 0) / totalPeaks) : 0;
    const completedHeights = peaks.filter(p => completedPeakIds.has(p.id)).map(p => Number(p.height || 0));
    const completedHeightTotal = completedHeights.reduce((sum, height) => sum + height, 0);
    const completedHeightAverage = completedHeights.length > 0 ? Math.round(completedHeightTotal / completedHeights.length) : 0;
    const tallestCompleted = [...peaks].filter(p => completedPeakIds.has(p.id)).sort((a, b) => Number(b.height || 0) - Number(a.height || 0))[0];
    const tallestPending = [...peaks].filter(p => !completedPeakIds.has(p.id)).sort((a, b) => (Number(b.height || 0) - Number(a.height || 0)))[0];
    const nextMilestone = Math.min(CHALLENGE_GOAL, Math.max(10, Math.ceil((challengeProgress + 1) / 10) * 10));

    const regionStats = useMemo(() => Array.from(
        peaks.reduce((map, peak) => {
            const regions = (peak.region || '').split(',').map(s => s.trim()).filter(Boolean);
            if (regions.length === 0) {
                const prev = map.get('Sense comarca') || { total: 0, done: 0 };
                prev.total += 1;
                if (completedPeakIds.has(peak.id)) prev.done += 1;
                map.set('Sense comarca', prev);
                return map;
            }
            for (const region of regions) {
                const prev = map.get(region) || { total: 0, done: 0 };
                prev.total += 1;
                if (completedPeakIds.has(peak.id)) prev.done += 1;
                map.set(region, prev);
            }
            return map;
        }, new Map<string, { total: number; done: number }>()),
        ([region, stats]) => ({
            region,
            total: stats.total,
            done: stats.done,
            pct: stats.total ? Math.round((stats.done / stats.total) * 100) : 0,
        })
    ).sort((a, b) => b.total - a.total || b.pct - a.pct), [peaks, completedPeakIds]);

    const provinciaStats = useMemo(() => Array.from(
        peaks.reduce((map, peak) => {
            const regions = (peak.region || '').split(',').map(s => s.trim()).filter(Boolean);
            const provincies = regions.length > 0
                ? Array.from(new Set(regions.map(provinciaOf)))
                : ['Sense província'];
            for (const provincia of provincies) {
                const prev = map.get(provincia) || { total: 0, done: 0 };
                prev.total += 1;
                if (completedPeakIds.has(peak.id)) prev.done += 1;
                map.set(provincia, prev);
            }
            return map;
        }, new Map<string, { total: number; done: number }>()),
        ([provincia, stats]) => ({
            provincia,
            total: stats.total,
            done: stats.done,
            pct: stats.total ? Math.round((stats.done / stats.total) * 100) : 0,
        })
    ).sort((a, b) => b.total - a.total || b.pct - a.pct), [peaks, completedPeakIds]);

    const heightRanges = [
        { label: '0-500', min: 0, max: 500 },
        { label: '500-1000', min: 500, max: 1000 },
        { label: '1000-1500', min: 1000, max: 1500 },
        { label: '1500-2000', min: 1500, max: 2000 },
        { label: '2000-2500', min: 2000, max: 2500 },
        { label: '2500-3000', min: 2500, max: 3000 },
        { label: '3000+', min: 3000, max: Infinity },
    ];

    const peaksOfHeightRange = (rangeLabel: string) => {
        const range = heightRanges.find(item => item.label === rangeLabel);
        if (!range) return [];
        return peaks.filter(peak => {
            const height = Number(peak.height || 0);
            return height >= range.min && (range.max === Infinity || height < range.max);
        }).sort((a, b) => Number(b.height || 0) - Number(a.height || 0));
    };

    const heightStats = useMemo(() => heightRanges.map(range => {
        const items = peaks.filter(peak => {
            const height = Number(peak.height || 0);
            if (height < range.min) return false;
            if (range.max === Infinity) return height >= range.min;
            return height < range.max;
        });
        const done = items.filter(peak => completedPeakIds.has(peak.id)).length;
        return {
            label: range.label,
            total: items.length,
            done,
            pct: items.length ? Math.round((done / items.length) * 100) : 0,
        };
    }).filter(item => item.total > 0), [peaks, completedPeakIds]);

    const strongestRegion = regionStats.filter(item => item.done > 0)
        .sort((a, b) => b.done - a.done || b.pct - a.pct)[0];
    const strongestHeightRange = heightStats.filter(item => item.done > 0)
        .sort((a, b) => b.done - a.done || b.pct - a.pct)[0];

    return (
        <div className="h-screen w-screen overflow-y-auto bg-slate-950 text-slate-100">
            <div className="mx-auto max-w-3xl px-6 py-8">
                <div className="flex items-center gap-3 mb-6">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-1.5 text-sm font-medium text-slate-300 hover:text-orange-300 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" /> Tornar al mapa
                    </button>
                    <h1 className="text-lg font-bold flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-orange-400" /> Estadístiques
                    </h1>
                </div>

                <div className="flex gap-1.5 mb-6 bg-slate-900/60 border border-slate-800 p-1 rounded-xl w-fit">
                    {([['resum', 'Resum'], ['comarca', 'Per comarca'], ['provincia', 'Per província'], ['alcada', 'Per alçada']] as const).map(([key, label]) => (
                        <button
                            key={key}
                            onClick={() => changeTab(key)}
                            className={`text-sm font-medium px-4 py-2 rounded-lg transition-all ${tab === key ? 'bg-orange-500 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {tab === 'resum' && (
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <span className="text-xs uppercase tracking-[0.16em] text-slate-400">Progrés del repte</span>
                            <span className="text-sm font-semibold text-orange-300">{challengeRate}%</span>
                        </div>
                        <div className="h-3 w-full overflow-hidden rounded-full bg-slate-800 border border-slate-700/60">
                            <div className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-500" style={{ width: `${challengeRate}%` }} />
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="rounded-xl bg-slate-900/70 p-4 border border-slate-800">
                                <div className="text-[10px] uppercase tracking-wide text-slate-400">Completats</div>
                                <div className="mt-1 text-2xl font-bold text-emerald-400">{donePeaks}/{totalPeaks}</div>
                            </div>
                            <div className="rounded-xl bg-slate-900/70 p-4 border border-slate-800">
                                <div className="text-[10px] uppercase tracking-wide text-slate-400">Essencials</div>
                                <div className="mt-1 text-2xl font-bold text-amber-400">{essentialCompleted}/{essentialPeaks}</div>
                            </div>
                            <div className="rounded-xl bg-slate-900/70 p-4 border border-slate-800">
                                <div className="text-[10px] uppercase tracking-wide text-slate-400">Altura mitja</div>
                                <div className="mt-1 text-2xl font-bold text-sky-400">{avgHeight} m</div>
                            </div>
                            <div className="rounded-xl bg-slate-900/70 p-4 border border-slate-800">
                                <div className="text-[10px] uppercase tracking-wide text-slate-400">Més alt pendent</div>
                                <div className="mt-1 text-sm font-bold text-violet-300 truncate">{tallestPending ? tallestPending.name : '—'}</div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 px-4 py-3">
                                <div className="flex items-center gap-2 text-xs text-orange-200"><Target className="h-4 w-4" /> Fins als 100 cims</div>
                                <div className="mt-1 text-xl font-bold text-orange-300">{remainingForChallenge === 0 ? 'Objectiu assolit' : `${remainingForChallenge} pendents`}</div>
                            </div>
                            <div className="rounded-lg border border-slate-800 bg-slate-900/70 px-4 py-3">
                                <div className="text-xs text-slate-400">Comarques trepitjades</div>
                                <div className="mt-1 text-xl font-bold text-emerald-400">{completedRegions}<span className="text-sm font-medium text-slate-500">/{regionStats.length}</span></div>
                            </div>
                            <div className="rounded-lg border border-slate-800 bg-slate-900/70 px-4 py-3">
                                <div className="text-xs text-slate-400">Essencials completats</div>
                                <div className="mt-1 text-xl font-bold text-amber-400">{essentialRate}%</div>
                            </div>
                        </div>
                        <div className="border-t border-slate-800 pt-5">
                            <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">La teva progressió</h2>
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
                                    <Mountain className="h-4 w-4 text-sky-400" />
                                    <div className="mt-2 text-[10px] uppercase tracking-wide text-slate-400">Altitud sumada</div>
                                    <div className="mt-1 text-lg font-bold text-sky-300">{(completedHeightTotal / 1000).toLocaleString('ca-ES', { maximumFractionDigits: 1 })} km</div>
                                </div>
                                <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
                                    <Target className="h-4 w-4 text-orange-400" />
                                    <div className="mt-2 text-[10px] uppercase tracking-wide text-slate-400">Mitjana feta</div>
                                    <div className="mt-1 text-lg font-bold text-orange-300">{completedHeightAverage.toLocaleString('ca-ES')} m</div>
                                </div>
                                <div className="min-w-0 rounded-lg border border-slate-800 bg-slate-900/70 p-3">
                                    <Trophy className="h-4 w-4 text-amber-400" />
                                    <div className="mt-2 text-[10px] uppercase tracking-wide text-slate-400">Cim més alt fet</div>
                                    <div className="mt-1 truncate text-sm font-bold text-amber-300" title={tallestCompleted?.name}>{tallestCompleted ? `${tallestCompleted.name} (${tallestCompleted.height} m)` : 'Encara cap'}</div>
                                </div>
                                <div className="min-w-0 rounded-lg border border-slate-800 bg-slate-900/70 p-3">
                                    <MapPin className="h-4 w-4 text-emerald-400" />
                                    <div className="mt-2 text-[10px] uppercase tracking-wide text-slate-400">Comarca destacada</div>
                                    <div className="mt-1 truncate text-sm font-bold text-emerald-300" title={strongestRegion?.region}>{strongestRegion ? `${strongestRegion.region} (${strongestRegion.done})` : 'Encara cap'}</div>
                                </div>
                            </div>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/50 p-3">
                                <Flag className="h-5 w-5 shrink-0 text-orange-400" />
                                <div>
                                    <div className="text-xs text-slate-400">Proper hito</div>
                                    <div className="text-sm font-semibold text-slate-100">{challengeProgress >= CHALLENGE_GOAL ? 'Repte de 100 cims completat' : `${nextMilestone - challengeProgress} cims per arribar als ${nextMilestone}`}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/50 p-3">
                                <Mountain className="h-5 w-5 shrink-0 text-cyan-400" />
                                <div>
                                    <div className="text-xs text-slate-400">Franja més conquistada</div>
                                    <div className="text-sm font-semibold text-slate-100">{strongestHeightRange ? `${strongestHeightRange.label} m · ${strongestHeightRange.done} cims` : 'Encara cap cim completat'}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {tab === 'comarca' && (
                    selectedComarca ? (
                        <PeakDrillList
                            title={selectedComarca}
                            peaks={peaksOfComarca(selectedComarca)}
                            completedPeakIds={completedPeakIds}
                            onBack={() => setSelectedComarca(null)}
                        />
                    ) : (
                        <div className="space-y-3">
                            {regionStats.map(({ region, total, done, pct }) => (
                                <button
                                    key={region}
                                    onClick={() => setSelectedComarca(region)}
                                    className="group w-full space-y-2 text-left rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2.5 hover:border-orange-500/60 hover:bg-orange-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 transition-colors"
                                >
                                    <div className="flex items-center justify-between text-xs text-slate-300">
                                        <span className="flex min-w-0 items-center gap-2 font-semibold"><MapPin className="h-3.5 w-3.5 shrink-0 text-orange-400" /><span className="truncate">{region}</span></span>
                                        <span className="shrink-0">{pct}% ({done}/{total})</span>
                                    </div>
                                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                                        <div className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400" style={{ width: `${pct}%` }} />
                                    </div>
                                    <div className="flex items-center justify-end gap-1 text-[11px] font-semibold text-orange-300 opacity-80 group-hover:opacity-100">Veure cims <ChevronRight className="h-3.5 w-3.5" /></div>
                                </button>
                            ))}
                        </div>
                    )
                )}

                {tab === 'provincia' && (
                    selectedComarca ? (
                        <PeakDrillList
                            title={selectedComarca}
                            peaks={peaksOfComarca(selectedComarca)}
                            completedPeakIds={completedPeakIds}
                            onBack={() => setSelectedComarca(null)}
                        />
                    ) : selectedProvincia ? (
                        <div className="space-y-3">
                            <button
                                onClick={() => setSelectedProvincia(null)}
                                className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-orange-300 mb-1"
                            >
                                <ArrowLeft className="w-3.5 h-3.5" /> Totes les províncies
                            </button>
                            <h3 className="text-sm font-semibold text-slate-200 mb-2">{selectedProvincia}</h3>
                            {regionStats
                                .filter(({ region }) => provinciaOf(region) === selectedProvincia)
                                .map(({ region, total, done, pct }) => (
                                    <button
                                        key={region}
                                        onClick={() => setSelectedComarca(region)}
                                        className="group block w-full space-y-2 rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2.5 text-left hover:border-orange-500/60 hover:bg-orange-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 transition-colors"
                                    >
                                        <div className="flex items-center justify-between text-xs text-slate-300">
                                            <span className="flex min-w-0 items-center gap-2 font-semibold"><MapPin className="h-3.5 w-3.5 shrink-0 text-orange-400" /><span className="truncate">{region}</span></span>
                                            <span className="shrink-0">{pct}% ({done}/{total})</span>
                                        </div>
                                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                                            <div className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400" style={{ width: `${pct}%` }} />
                                        </div>
                                        <div className="flex items-center justify-end gap-1 text-[11px] font-semibold text-orange-300 opacity-80 group-hover:opacity-100">Veure cims <ChevronRight className="h-3.5 w-3.5" /></div>
                                    </button>
                                ))}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {provinciaStats.map(({ provincia, total, done, pct }) => (
                                <button
                                    key={provincia}
                                    onClick={() => setSelectedProvincia(provincia)}
                                    className="w-full space-y-1 text-left rounded-lg -mx-2 px-2 py-1.5 hover:bg-slate-900/60 transition-colors"
                                >
                                    <div className="flex items-center justify-between text-xs text-slate-300">
                                        <span className="truncate pr-2">{provincia}</span>
                                        <span>{pct}% ({done}/{total})</span>
                                    </div>
                                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                                        <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400" style={{ width: `${pct}%` }} />
                                    </div>
                                </button>
                            ))}
                        </div>
                    )
                )}

                {tab === 'alcada' && (
                    selectedHeightRange ? (
                        <PeakDrillList
                            title={`${selectedHeightRange} m`}
                            peaks={peaksOfHeightRange(selectedHeightRange)}
                            completedPeakIds={completedPeakIds}
                            onBack={() => setSelectedHeightRange(null)}
                        />
                    ) : (
                        <div className="space-y-3">
                            {heightStats.map(({ label, total, done, pct }) => (
                                <button
                                    key={label}
                                    onClick={() => setSelectedHeightRange(label)}
                                    className="group w-full space-y-2 rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2.5 text-left hover:border-sky-400/70 hover:bg-sky-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 transition-colors"
                                >
                                    <div className="flex items-center justify-between text-xs text-slate-300">
                                        <span className="font-semibold">{label} m</span>
                                        <span>{pct}% ({done}/{total})</span>
                                    </div>
                                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                                        <div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-400" style={{ width: `${pct}%` }} />
                                    </div>
                                    <div className="flex items-center justify-end gap-1 text-[11px] font-semibold text-sky-300 opacity-80 group-hover:opacity-100">Veure cims <ChevronRight className="h-3.5 w-3.5" /></div>
                                </button>
                            ))}
                        </div>
                    )
                )}
            </div>
        </div>
    );
}

// List of peaks belonging to a comarca, reached by drilling down from the comarca/província tabs.
function PeakDrillList({ title, peaks, completedPeakIds, onBack }: {
    title: string;
    peaks: Peak[];
    completedPeakIds: Set<string>;
    onBack: () => void;
}) {
    const done = peaks.filter(p => completedPeakIds.has(p.id)).length;
    return (
        <div className="space-y-3">
            <button
                onClick={onBack}
                className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-orange-300 mb-1"
            >
                <ArrowLeft className="w-3.5 h-3.5" /> Enrere
            </button>
            <h3 className="text-sm font-semibold text-slate-200">{title} <span className="text-slate-500 font-normal">({done}/{peaks.length})</span></h3>
            <div className="flex flex-col gap-1 -mx-1">
                {peaks.length === 0 && (
                    <div className="text-center text-sm text-slate-500 py-6">Cap cim en aquesta comarca.</div>
                )}
                {peaks.map(p => {
                    const isDone = completedPeakIds.has(p.id);
                    return (
                        <div key={p.id} className={`flex items-center gap-2.5 px-2 py-2 rounded-lg ${isDone ? 'bg-emerald-500/5' : ''}`}>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-sm font-medium truncate">{p.name}</span>
                                    {p.essencial && <span className="text-amber-400 text-xs shrink-0">★</span>}
                                </div>
                                <div className="text-xs text-slate-500 truncate">{p.height ? `${p.height} m` : ''}</div>
                            </div>
                            {isDone
                                ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                : <span className="w-4 h-4 rounded-full border border-slate-600 shrink-0" />}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
