import { useState, useEffect, useMemo, useRef } from 'react';
import watermark from './utils/watermark.js';
import aes256gcm from './utils/seal.js';

const { embed, extract } = watermark();
const { seal, open } = aes256gcm();


function useObjectUrl(blob) {
  const url = useMemo(() => (blob ? URL.createObjectURL(blob) : null), [blob]);

  useEffect(() => {
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [url]);

  return url;
}


function FilePicker({ file, onFile, hint }) {
  const ref = useRef(null);

  return (
    <div
      onClick={() => ref.current.click()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const f = e.dataTransfer.files[0];
        if (f) onFile(f);
      }}
      className="border-2 border-dashed border-gray-300 rounded p-6 text-center cursor-pointer hover:border-indigo-400"
    >
      <p className="text-sm">{file ? file.name : 'Click or drop an image'}</p>
      <p className="text-xs text-gray-500">{hint}</p>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          if (e.target.files[0]) onFile(e.target.files[0]);
          e.target.value = '';
        }}
      />
    </div>
  );
}


function Preview({ src, label }) {
  return (
    <figure className="border rounded overflow-hidden">
      <img src={src} alt={label} className="max-h-60 w-full object-contain bg-gray-100" />
      <figcaption className="text-xs text-gray-500 px-2 py-1 border-t">{label}</figcaption>
    </figure>
  );
}


export default function App() {
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('user:12345');
  const [sourceFile, setSourceFile] = useState(null);
  const [outputBlob, setOutputBlob] = useState(null);
  const [extractBlob, setExtractBlob] = useState(null);
  const [result, setResult] = useState(null); // null = nothing yet, false = failed
  const [status, setStatus] = useState('');
  const [isError, setIsError] = useState(false);
  const [busy, setBusy] = useState(false);

  const sourceUrl = useObjectUrl(sourceFile);
  const outputUrl = useObjectUrl(outputBlob);
  const extractUrl = useObjectUrl(extractBlob);

  async function timed(label, fn) {
    setBusy(true);
    setResult(null);
    setIsError(false);
    setStatus(label + '...');
    const start = performance.now();
    try {
      await fn();
      setStatus(`${label} finished (${Math.round(performance.now() - start)} ms)`);
    } catch (err) {
      setIsError(true);
      setStatus(err.message);
    }
    setBusy(false);
  }

  function handleEmbed() {
    timed('Embedding', async () => {
      if (!sourceFile) throw new Error('Pick an image first');
      if (!password) throw new Error('Password is empty');

      const sealed = await seal(password, message);
      const blob = await embed(sourceFile, sealed);
      setOutputBlob(blob);
      setExtractBlob(blob);
    });
  }

  function handleExtract() {
    timed('Extracting', async () => {
      if (!extractBlob) throw new Error('Nothing to extract from');
      if (!password) throw new Error('Password is empty');

      const bytes = await extract(extractBlob);
      const text = bytes ? await open(password, bytes) : null;
      setResult(text || false);
    });
  }

  function download() {
    const a = document.createElement('a');
    a.href = outputUrl;
    a.download = 'watermarked.png';
    a.click();
  }

  const btn = 'px-4 py-2 rounded text-sm text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50';
  const field = 'border rounded px-3 py-2 text-sm w-full';

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Watermark tester</h1>
          <p className="text-sm text-gray-500">
            Hide an encrypted message in an image and see if it survives re-compression.
          </p>
        </div>

        <div className="bg-white rounded p-4 shadow-sm">
          <label className="text-sm block mb-1">Password</label>
          <input
            type="password"
            className={field}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="bg-white rounded p-4 shadow-sm space-y-4">
          <h2 className="font-semibold">Embed</h2>
          <FilePicker file={sourceFile} onFile={setSourceFile} hint="PNG, JPEG, WebP" />

          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="text-sm block mb-1">Message</label>
              <input className={field} value={message} onChange={(e) => setMessage(e.target.value)} />
            </div>
            <button className={btn} onClick={handleEmbed} disabled={busy}>
              Embed
            </button>
          </div>

          {(sourceUrl || outputUrl) && (
            <div className="grid grid-cols-2 gap-4">
              {sourceUrl && <Preview src={sourceUrl} label="Original" />}
              {outputUrl && <Preview src={outputUrl} label="Watermarked" />}
            </div>
          )}

          {outputUrl && (
            <button className={btn} onClick={download}>
              Download PNG
            </button>
          )}
        </div>

        <div className="bg-white rounded p-4 shadow-sm space-y-4">
          <h2 className="font-semibold">Extract</h2>
          <p className="text-sm text-gray-500">
            Uses the watermarked image above, or pick a different file.
          </p>
          <FilePicker
            file={extractBlob instanceof File ? extractBlob : null}
            onFile={setExtractBlob}
            hint="Optional, replaces the watermarked image"
          />

          <button className={btn} onClick={handleExtract} disabled={busy}>
            Extract
          </button>

          {extractUrl && (
            <div>
              <Preview src={extractUrl} label="Extraction source" />
              <p className="text-xs text-gray-500 mt-1">
                {extractBlob.type || 'unknown type'}, {(extractBlob.size / 1024).toFixed(1)} KB
              </p>
            </div>
          )}

          {result !== null && (
            <div className={`rounded p-3 text-sm ${result === false ? 'bg-amber-100' : 'bg-green-100'}`}>
              {result === false
                ? 'Nothing found (no watermark, wrong password, or corrupted)'
                : <code className="break-all">{result}</code>}
            </div>
          )}
        </div>

        {status && (
          <p className={`text-sm ${isError ? 'text-red-600' : 'text-gray-600'}`}>{status}</p>
        )}
      </div>
    </div>
  );
}
