/**
 * Theomax backend API client.
 *
 * Talks to the FastAPI server (api/server.py). Separate from MuapiClient —
 * Muapi goes direct-to-vendor, Theomax goes through our engine-agnostic
 * backend which proxies to ComfyUI, Muapi, EachLabs, or Google Veo.
 */

const DEFAULT_BASE_URL =
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_THEOMAX_API_URL) ||
    'http://localhost:9000';

const DEFAULT_API_KEY =
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_THEOMAX_API_KEY) ||
    null;

export class TheomaxClient {
    constructor(baseUrl = DEFAULT_BASE_URL, apiKey = DEFAULT_API_KEY) {
        this.baseUrl = baseUrl.replace(/\/$/, '');
        this.apiKey = apiKey;
    }

    _apiKey() {
        if (this.apiKey) return this.apiKey;
        if (typeof window !== 'undefined') {
            return window.__THEOMAX_KEY__ || localStorage.getItem('theomax_key');
        }
        return null;
    }

    async _req(path, opts = {}) {
        const key = this._apiKey();
        const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
        if (key) headers['X-API-Key'] = key;

        const res = await fetch(`${this.baseUrl}${path}`, { ...opts, headers });
        if (!res.ok) {
            let detail = '';
            try { detail = (await res.json()).detail; } catch {}
            throw new Error(`${res.status} ${detail || res.statusText}`);
        }
        return res.json();
    }

    health() {
        return this._req('/health');
    }

    listEngines() {
        return this._req('/engines');
    }

    generate({ engine, prompt, image_url, params = {} }) {
        return this._req('/generate', {
            method: 'POST',
            body: JSON.stringify({ engine, prompt, image_url, params }),
        });
    }

    pollJob(apiJobId) {
        return this._req(`/jobs/${apiJobId}`);
    }

    /**
     * Subscribe to Server-Sent Events for a job.
     * @param {string} apiJobId
     * @param {(evt: object) => void} onEvent  receives one parsed event per tick
     * @returns {() => void}  call to close the stream
     *
     * Note: native EventSource can't send custom headers, so auth uses a query
     * param fallback when an API key is configured.
     */
    streamJob(apiJobId, onEvent) {
        const key = this._apiKey();
        const qs = key ? `?api_key=${encodeURIComponent(key)}` : '';
        const url = `${this.baseUrl}/jobs/${apiJobId}/stream${qs}`;
        const es = new EventSource(url);
        es.onmessage = (ev) => {
            try { onEvent(JSON.parse(ev.data)); }
            catch (e) { console.error('SSE parse error', e); }
        };
        es.onerror = () => es.close();
        return () => es.close();
    }
}

export const theomax = new TheomaxClient();
