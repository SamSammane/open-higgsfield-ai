'use client';

import { useState, useEffect } from 'react';
import { theomax } from '@/lib/theomax';

/**
 * Pill showing "N engines ready" from the Theomax backend /engines endpoint.
 * Click to open a modal listing each engine and its availability.
 *
 * Intentionally self-contained: no props, independent error state. Fails quietly
 * if the backend is offline — the rest of the UI continues to work directly
 * against Muapi.
 */
export default function EnginesStatus() {
    const [engines, setEngines] = useState(null);
    const [error, setError] = useState(null);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        let cancelled = false;
        theomax.listEngines()
            .then((data) => { if (!cancelled) setEngines(data); })
            .catch((e) => { if (!cancelled) setError(e.message); });
        return () => { cancelled = true; };
    }, []);

    if (error) {
        return (
            <div
                title={`Theomax backend offline: ${error}`}
                className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/5 opacity-60"
            >
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-xs font-medium text-white/60">API off</span>
            </div>
        );
    }

    if (!engines) {
        return (
            <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                <div className="w-2 h-2 rounded-full bg-white/20 animate-pulse" />
                <span className="text-xs font-medium text-white/60">Engines…</span>
            </div>
        );
    }

    const readyCount = engines.filter(e => e.available).length;

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/5 hover:bg-white/10 transition-colors"
                title="Click to see engines"
            >
                <div className={`w-2 h-2 rounded-full ${readyCount > 0 ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
                <span className="text-xs font-bold text-white/90">
                    {readyCount}/{engines.length} engines
                </span>
            </button>

            {open && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
                     onClick={() => setOpen(false)}>
                    <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-6 w-full max-w-sm shadow-2xl"
                         onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-white font-bold text-lg mb-1">Theomax Engines</h2>
                        <p className="text-white/40 text-xs mb-6">
                            Backend status for each generation engine.
                        </p>
                        <ul className="space-y-2 mb-6">
                            {engines.map((e) => (
                                <li key={e.name} className="flex items-center justify-between bg-white/5 border border-white/[0.03] rounded-md p-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${e.available ? 'bg-green-500' : 'bg-white/20'}`} />
                                        <div>
                                            <div className="text-sm font-medium text-white/90">{e.name}</div>
                                            <div className="text-xs text-white/40">{e.is_cloud ? 'cloud' : 'local'}</div>
                                        </div>
                                    </div>
                                    <span className={`text-xs ${e.available ? 'text-green-400' : 'text-white/30'}`}>
                                        {e.available ? 'ready' : 'offline'}
                                    </span>
                                </li>
                            ))}
                        </ul>
                        <button
                            onClick={() => setOpen(false)}
                            className="w-full h-10 rounded-md bg-white/5 text-white/80 hover:bg-white/10 text-xs font-semibold transition-all border border-white/5"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
