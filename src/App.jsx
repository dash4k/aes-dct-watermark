import React from 'react'
import toast, { Toaster } from 'react-hot-toast'

import watermark from './utils/watermark.js'
import aes256gcm from './utils/seal.js'

import useInput from './hooks/useInput.js'
import useObjectUrl from './hooks/useObjectUrl.js'

import FilePicker from './components/FilePicker.jsx'
import Preview from './components/Preview.jsx'
import Section from './components/Section.jsx'

import { ui } from './utils/utils.js'

const { embed, extract } = watermark()
const { seal, open } = aes256gcm()

const App = () => {
    const [password, onPasswordChange] = useInput('')
    const [message, onMessageChange] = useInput('')
    const [sourceFile, setSourceFile] = React.useState(null)
    const [outputBlob, setOutputBlob] = React.useState(null)
    const [extractBlob, setExtractBlob] = React.useState(null)
    const [result, setResult] = React.useState(null)
    const [busy, setBusy] = React.useState(false)

    const sourceUrl = useObjectUrl(sourceFile)
    const outputUrl = useObjectUrl(outputBlob)
    const extractUrl = useObjectUrl(extractBlob)

    const timed = async (label, fn) => {
        setBusy(true)
        setResult(null)
        const toastId = toast.loading(label + '...')
        const start = performance.now()
        try {
            await fn()
            toast.success(
                `${label} finished (${Math.round(performance.now() - start)} ms)`,
                { id: toastId },
            )
        } catch (err) {
            toast.error(err.message, { id: toastId })
        } finally {
            setBusy(false)
        }
    }

    const handleEmbed = (e) => {
        e?.preventDefault()
        timed('Embedding', async () => {
            if (!sourceFile) throw new Error('Pick an image first')
            if (!password) throw new Error('Password is empty')

            const sealed = await seal(password, message)
            const blob = await embed(sourceFile, sealed)
            setOutputBlob(blob)
            setExtractBlob(blob)
        })
    }

    const handleExtract = () => {
        timed('Extracting', async () => {
            if (!extractBlob) throw new Error('Nothing to extract from')
            if (!password) throw new Error('Password is empty')

            const bytes = await extract(extractBlob)
            const text = bytes ? await open(password, bytes) : null
            setResult(text || false)
        })
    }

    const download = () => {
        const a = document.createElement('a')
        a.href = outputUrl
        a.download = 'watermarked.png'
        a.click()
    }

    return (
        <div className='min-h-screen bg-zinc-50 px-4 py-10 text-zinc-900'>
            <Toaster position='bottom-right' />
            <div className='mx-auto max-w-2xl space-y-5'>
                <header className='pb-2'>
                    <h1 className='text-xl font-semibold tracking-tight'>
                        Watermark Embedder
                    </h1>
                    <p className='mt-1 text-sm text-zinc-500'>
                        Hide an encrypted message inside an image.
                    </p>
                </header>

                <div className={`${ui.card} p-5`}>
                    <label htmlFor='password' className={ui.label}>
                        Password
                    </label>
                    <input
                        id='password'
                        type='password'
                        autoComplete='off'
                        className={ui.input}
                        value={password}
                        onChange={onPasswordChange}
                        placeholder='Used to encrypt and decrypt the message'
                    />
                </div>

                <Section styles={ui.card} step='01' title='Embed'>
                    <FilePicker
                        file={sourceFile}
                        onFile={setSourceFile}
                        hint='PNG, JPEG, WebP'
                    />

                    <form
                        onSubmit={handleEmbed}
                        className='flex items-end gap-3'
                    >
                        <div className='flex-1'>
                            <label htmlFor='message' className={ui.label}>
                                Message
                            </label>
                            <input
                                id='message'
                                className={ui.input}
                                value={message}
                                onChange={onMessageChange}
                                placeholder='Text to hide in the image'
                            />
                        </div>
                        <button
                            type='submit'
                            className={ui.primary}
                            disabled={busy}
                        >
                            Embed
                        </button>
                    </form>

                    {(sourceUrl || outputUrl) && (
                        <div className='grid grid-cols-2 gap-4'>
                            {sourceUrl && (
                                <Preview src={sourceUrl} label='Original' />
                            )}
                            {outputUrl && (
                                <Preview src={outputUrl} label='Watermarked' />
                            )}
                        </div>
                    )}

                    {outputUrl && (
                        <button className={ui.secondary} onClick={download}>
                            Download PNG
                        </button>
                    )}
                </Section>

                <Section
                    styles={ui.card}
                    step='02'
                    title='Extract'
                    description='Uses the watermarked image above, or pick a different file.'
                >
                    <FilePicker
                        file={extractBlob instanceof File ? extractBlob : null}
                        onFile={setExtractBlob}
                        hint='Optional, replaces the watermarked image'
                    />

                    {extractUrl && (
                        <div>
                            <Preview
                                src={extractUrl}
                                label='Extraction source'
                            />
                            <p className='mt-1.5 font-mono text-xs text-zinc-500'>
                                {extractBlob.type || 'unknown type'} ·{' '}
                                {(extractBlob.size / 1024).toFixed(1)} KB
                            </p>
                        </div>
                    )}

                    <button
                        className={ui.primary}
                        onClick={handleExtract}
                        disabled={busy || !extractBlob}
                    >
                        Extract
                    </button>

                    {result !== null && (
                        <div
                            role='status'
                            className={`rounded-md border px-3 py-2.5 text-sm ${
                                result === false
                                    ? 'border-amber-300 bg-amber-50 text-amber-900'
                                    : 'border-zinc-200 bg-zinc-50 text-zinc-900'
                            }`}
                        >
                            {result === false ? (
                                'Nothing found (no watermark, wrong password, or corrupted).'
                            ) : (
                                <>
                                    <div className='mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500'>
                                        Extracted message
                                    </div>
                                    <code className='break-all font-mono'>
                                        {result}
                                    </code>
                                </>
                            )}
                        </div>
                    )}
                </Section>
            </div>
        </div>
    )
}

export default App
