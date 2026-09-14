import { useRef, useState } from 'react';
import { Upload, X, ExternalLink } from 'lucide-react';

interface UploadFabProps {
  onFileUpload: (file: File) => void;
  loading: boolean;
  progress: number;
  progressMsg: string;
}

// Floating action button: opens a small popover with the import actions and a mini
// tutorial (same steps as the README) instead of taking up a whole sidebar.
export default function UploadFab({ onFileUpload, loading, progress, progressMsg }: UploadFabProps) {
  const [open, setOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const multiFileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => fileInputRef.current?.click();
  const handleMultiClick = () => multiFileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length === 1) {
      onFileUpload(files[0]);
      setOpen(false);
    } else if (files && files.length > 1) {
      const evt = new CustomEvent('app-files-selected', { detail: files });
      window.dispatchEvent(evt);
      setOpen(false);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="fixed bottom-6 right-6 z-30 flex items-center gap-2 rounded-full bg-orange-600 hover:bg-orange-500 text-white font-medium pl-4 pr-5 py-3 shadow-xl shadow-orange-950/40 transition-colors"
      >
        <Upload className="w-5 h-5" />
        {loading ? `Analitzant… ${progress}%` : 'Importar activitats'}
      </button>

      {open && (
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="absolute bottom-24 right-6 w-[min(92vw,380px)] max-h-[75vh] overflow-y-auto rounded-2xl bg-slate-900 border border-slate-700 text-slate-100 p-5 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-200">Importar activitats</h2>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800">
                <X className="w-4 h-4" />
              </button>
            </div>

            <ol className="space-y-1.5 text-xs text-slate-400 mb-4 list-decimal list-inside">
              <li>
                Ves a{' '}
                <a href="https://www.strava.com/account" target="_blank" rel="noreferrer" className="text-orange-300 underline inline-flex items-center gap-0.5">
                  strava.com/account <ExternalLink className="w-3 h-3" />
                </a>{' '}
                i clica "Descarrega el teu compte".
              </li>
              <li>Confirma la sol·licitud: Strava prepara l'arxiu al servidor.</li>
              <li>En menys d'1 minut rebràs un correu amb l'enllaç de descàrrega.</li>
              <li>Baixa el fitxer <strong className="text-slate-300">export_....zip</strong> i puja'l aquí — no cal descomprimir'l.</li>
            </ol>

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
                    setOpen(false);
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
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-gradient-to-r from-orange-500 to-amber-400 h-1.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
