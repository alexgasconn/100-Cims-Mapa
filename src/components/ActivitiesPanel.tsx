import { useRef } from 'react';
import { Upload, Activity, Mountain, BarChart3 } from 'lucide-react';
import type { StravaActivity, Peak } from '../types';

const CHALLENGE_GOAL = 100;

interface ActivitiesPanelProps {
    onFileUpload: (file: File) => void;
    activities: StravaActivity[];
    loading: boolean;
    progress: number;
    progressMsg: string;
    peaks: Peak[];
    completedPeakIds: Set<string>;
    onOpenStats: () => void;
}

// Right-hand-side of the two sidebars: import activities and show a quick summary.
// Detailed breakdowns live behind "Estadístiques" (StatsPanel) so they don't clutter this view.
export default function ActivitiesPanel({
    onFileUpload, activities, loading, progress, progressMsg, peaks, completedPeakIds, onOpenStats
}: ActivitiesPanelProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const multiFileInputRef = useRef<HTMLInputElement>(null);

    const handleUploadClick = () => fileInputRef.current?.click();
    const handleMultiClick = () => multiFileInputRef.current?.click();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length === 1) {
            onFileUpload(files[0]);
        } else if (files && files.length > 1) {
            const evt = new CustomEvent('app-files-selected', { detail: files });
            window.dispatchEvent(evt);
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const totalPeaks = peaks.length;
    const donePeaks = peaks.filter(p => completedPeakIds.has(p.id)).length;
    const goalPct = Math.round((Math.min(donePeaks, CHALLENGE_GOAL) / CHALLENGE_GOAL) * 100);

    return (
        <div className="h-full w-full max-h-screen overflow-y-auto bg-slate-900/95 text-slate-100 border-r border-slate-800/50 p-5 flex flex-col gap-5">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                    <Activity className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h1 className="text-lg font-bold tracking-tight leading-none">100 cims</h1>
                    <p className="text-xs text-slate-400 mt-0.5">Repte 100 Cims · FEEC</p>
                </div>
            </div>

            <div className="flex flex-col gap-2">
                <button
                    onClick={handleUploadClick}
                    disabled={loading}
                    className="w-full bg-orange-600 hover:bg-orange-500 text-white font-medium py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Upload className="w-4 h-4" />
                    {loading ? 'Analitzant…' : 'Importar exportació (.zip)'}
                </button>
                <button
                    onClick={handleMultiClick}
                    disabled={loading}
                    className="w-full bg-slate-800/60 hover:bg-slate-800 text-slate-200 text-sm font-medium py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Carregar arxius (.gpx/.fit)
                </button>
                <input type="file" ref={fileInputRef} accept=".zip" onChange={handleFileChange} className="hidden" />
                <input
                    ref={multiFileInputRef}
                    type="file"
                    multiple
                    accept=".gpx,.tcx,.fit,.gz"
                    onChange={(e) => {
                        const files = e.target.files;
                        if (files && files.length > 0) {
                            const evt = new CustomEvent('app-files-selected', { detail: files });
                            window.dispatchEvent(evt);
                        }
                        if (e.currentTarget) e.currentTarget.value = '';
                    }}
                    className="hidden"
                />

                {loading && (
                    <div className="mt-1 text-sm text-slate-400">
                        <div className="flex justify-between mb-1">
                            <span className="truncate pr-2">{progressMsg}</span>
                            <span>{progress}%</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Quick summary */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                        <Activity className="w-3.5 h-3.5" /> Activitats
                    </div>
                    <div className="text-2xl font-bold text-orange-400 leading-none">{activities.length}</div>
                </div>
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                        <Mountain className="w-3.5 h-3.5" /> Cims fets
                    </div>
                    <div className="text-2xl font-bold text-emerald-400 leading-none">{donePeaks}<span className="text-sm text-slate-500 font-medium">/{totalPeaks}</span></div>
                </div>
            </div>

            <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Objectiu Repte 100 Cims</span>
                    <span className="font-medium text-slate-200">{Math.min(donePeaks, CHALLENGE_GOAL)}/{CHALLENGE_GOAL}</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-2 rounded-full transition-all duration-500" style={{ width: `${goalPct}%` }}></div>
                </div>
            </div>

            <button
                onClick={onOpenStats}
                className="mt-auto flex items-center justify-center gap-2 text-sm font-medium py-2.5 rounded-xl border border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-800 hover:text-orange-300 transition-colors"
            >
                <BarChart3 className="w-4 h-4" /> Veure estadístiques detallades
            </button>
        </div>
    );
}
