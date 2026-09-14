import { useMemo, useState } from 'react';
import { ArrowLeft, BarChart3 } from 'lucide-react';
import type { Peak } from '../types';
import comarquesData from '../../comarques.json';

interface StatsPageProps {
    peaks: Peak[];
    completedPeakIds: Set<string>;
    onBack: () => void;
}

type Tab = 'resum' | 'comarca' | 'provincia' | 'alcada';

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

    const totalPeaks = peaks.length;
    const donePeaks = peaks.filter(p => completedPeakIds.has(p.id)).length;
    const completionRate = totalPeaks > 0 ? Math.round((donePeaks / totalPeaks) * 100) : 0;
    const essentialPeaks = peaks.filter(p => p.essencial).length;
    const essentialCompleted = peaks.filter(p => p.essencial && completedPeakIds.has(p.id)).length;
    const avgHeight = totalPeaks > 0 ? Math.round(peaks.reduce((sum, p) => sum + (Number(p.height || 0)), 0) / totalPeaks) : 0;
    const tallestPending = [...peaks].filter(p => !completedPeakIds.has(p.id)).sort((a, b) => (Number(b.height || 0) - Number(a.height || 0)))[0];

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
                            onClick={() => setTab(key)}
                            className={`text-sm font-medium px-4 py-2 rounded-lg transition-all ${tab === key ? 'bg-orange-500 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {tab === 'resum' && (
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <span className="text-xs uppercase tracking-[0.16em] text-slate-400">Progrés global</span>
                            <span className="text-sm font-semibold text-orange-300">{completionRate}%</span>
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
                    </div>
                )}

                {tab === 'comarca' && (
                    <div className="space-y-3">
                        {regionStats.map(({ region, total, done, pct }) => (
                            <div key={region} className="space-y-1">
                                <div className="flex items-center justify-between text-xs text-slate-300">
                                    <span className="truncate pr-2">{region}</span>
                                    <span>{pct}% ({done}/{total})</span>
                                </div>
                                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                                    <div className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400" style={{ width: `${pct}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {tab === 'provincia' && (
                    <div className="space-y-3">
                        {provinciaStats.map(({ provincia, total, done, pct }) => (
                            <div key={provincia} className="space-y-1">
                                <div className="flex items-center justify-between text-xs text-slate-300">
                                    <span className="truncate pr-2">{provincia}</span>
                                    <span>{pct}% ({done}/{total})</span>
                                </div>
                                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                                    <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400" style={{ width: `${pct}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {tab === 'alcada' && (
                    <div className="space-y-3">
                        {heightStats.map(({ label, total, done, pct }) => (
                            <div key={label} className="space-y-1">
                                <div className="flex items-center justify-between text-xs text-slate-300">
                                    <span>{label} m</span>
                                    <span>{pct}% ({done}/{total})</span>
                                </div>
                                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                                    <div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-400" style={{ width: `${pct}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
