import { useMemo, useState } from 'react';
import { X, BarChart3 } from 'lucide-react';
import type { Peak } from '../types';

interface StatsPanelProps {
    open: boolean;
    onClose: () => void;
    peaks: Peak[];
    completedPeakIds: Set<string>;
}

type Tab = 'resum' | 'comarca' | 'alcada';

// Hidden-by-default drawer with the detailed stats, reachable via a button so it
// doesn't clutter the always-visible sidebars.
export default function StatsPanel({ open, onClose, peaks, completedPeakIds }: StatsPanelProps) {
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

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-30 flex justify-end">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative h-full w-full max-w-md bg-slate-900 border-l border-slate-800 text-slate-100 flex flex-col shadow-2xl">
                <div className="flex items-center justify-between p-5 border-b border-slate-800">
                    <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-300 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-orange-400" /> Estadístiques
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex gap-1.5 p-3 border-b border-slate-800">
                    {([['resum', 'Resum'], ['comarca', 'Per comarca'], ['alcada', 'Per alçada']] as const).map(([key, label]) => (
                        <button
                            key={key}
                            onClick={() => setTab(key)}
                            className={`flex-1 text-xs font-medium py-2 rounded-lg transition-all ${tab === key ? 'bg-orange-500 text-white shadow' : 'bg-slate-800/50 text-slate-400 hover:text-slate-200'}`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto p-5">
                    {tab === 'resum' && (
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs uppercase tracking-[0.16em] text-slate-400">Progrés global</span>
                                <span className="text-sm font-semibold text-orange-300">{completionRate}%</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="rounded-xl bg-slate-800/70 p-3 border border-slate-700/50">
                                    <div className="text-[10px] uppercase tracking-wide text-slate-400">Completats</div>
                                    <div className="mt-1 text-xl font-bold text-emerald-400">{donePeaks}/{totalPeaks}</div>
                                </div>
                                <div className="rounded-xl bg-slate-800/70 p-3 border border-slate-700/50">
                                    <div className="text-[10px] uppercase tracking-wide text-slate-400">Essencials</div>
                                    <div className="mt-1 text-xl font-bold text-amber-400">{essentialCompleted}/{essentialPeaks}</div>
                                </div>
                                <div className="rounded-xl bg-slate-800/70 p-3 border border-slate-700/50">
                                    <div className="text-[10px] uppercase tracking-wide text-slate-400">Altura mitja</div>
                                    <div className="mt-1 text-xl font-bold text-sky-400">{avgHeight} m</div>
                                </div>
                                <div className="rounded-xl bg-slate-800/70 p-3 border border-slate-700/50">
                                    <div className="text-[10px] uppercase tracking-wide text-slate-400">Més alt pendent</div>
                                    <div className="mt-1 text-sm font-bold text-violet-300 truncate">{tallestPending ? tallestPending.name : '—'}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {tab === 'comarca' && (
                        <div className="space-y-2">
                            {regionStats.map(({ region, total, done, pct }) => (
                                <div key={region} className="space-y-1">
                                    <div className="flex items-center justify-between text-[11px] text-slate-300">
                                        <span className="truncate pr-2">{region}</span>
                                        <span>{pct}% ({done}/{total})</span>
                                    </div>
                                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-700/80">
                                        <div className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400" style={{ width: `${pct}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {tab === 'alcada' && (
                        <div className="space-y-2">
                            {heightStats.map(({ label, total, done, pct }) => (
                                <div key={label} className="space-y-1">
                                    <div className="flex items-center justify-between text-[11px] text-slate-300">
                                        <span>{label} m</span>
                                        <span>{pct}% ({done}/{total})</span>
                                    </div>
                                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-700/80">
                                        <div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-400" style={{ width: `${pct}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
