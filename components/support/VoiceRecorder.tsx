'use client'

import { useState, useRef, useEffect } from 'react'

const MAX_MS = 60_000

// Minimal shape of the browser speech-recognition API. It is unprefixed in
// standards-track browsers and webkit-prefixed in Chrome/Safari, and is absent
// entirely in Firefox -- the transcript is therefore best-effort, never
// assumed. The audio upload does not depend on it.
type SpeechRecognitionLike = {
  lang: string
  continuous: boolean
  interimResults: boolean
  start(): void
  stop(): void
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
  onerror: (() => void) | null
}

function getRecognition(): SpeechRecognitionLike | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as Record<string, unknown>
  const Ctor = (w.SpeechRecognition ?? w.webkitSpeechRecognition) as
    | (new () => SpeechRecognitionLike)
    | undefined
  if (!Ctor) return null
  const rec = new Ctor()
  rec.lang = 'en-NG'
  rec.continuous = true
  rec.interimResults = false
  return rec
}

export default function VoiceRecorder({
  onRecorded,
  disabled,
}: {
  onRecorded: (result: { audioId: string; transcript: string; durationMs: number }) => void
  disabled?: boolean
}) {
  const [recording, setRecording] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const transcriptRef = useRef('')
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const startedAtRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Release the microphone if the component goes away mid-recording --
  // otherwise the browser keeps showing the recording indicator on a page
  // that no longer has a recorder.
  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current)
    recorderRef.current?.stream.getTracks().forEach(t => t.stop())
    try { recognitionRef.current?.stop() } catch { /* already stopped */ }
  }, [])

  async function start() {
    setError('')
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      setError('We could not reach your microphone. Check the permission and try again.')
      return
    }

    chunksRef.current = []
    transcriptRef.current = ''

    const recorder = new MediaRecorder(stream)
    recorderRef.current = recorder
    recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
    recorder.onstop = () => { void upload(stream) }
    recorder.start()

    const recognition = getRecognition()
    if (recognition) {
      recognition.onresult = e => {
        for (let i = 0; i < e.results.length; i++) {
          transcriptRef.current = Array.from({ length: e.results.length }, (_, n) => e.results[n][0].transcript).join(' ')
        }
      }
      recognition.onerror = () => { /* transcript stays empty; audio still sends */ }
      try { recognition.start() } catch { /* some browsers throw on double start */ }
      recognitionRef.current = recognition
    }

    startedAtRef.current = Date.now()
    setElapsed(0)
    setRecording(true)
    timerRef.current = setInterval(() => {
      const ms = Date.now() - startedAtRef.current
      setElapsed(ms)
      if (ms >= MAX_MS) stop()
    }, 200)
  }

  function stop() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    try { recognitionRef.current?.stop() } catch { /* already stopped */ }
    recorderRef.current?.stop()
    setRecording(false)
  }

  async function upload(stream: MediaStream) {
    stream.getTracks().forEach(t => t.stop())
    const durationMs = Date.now() - startedAtRef.current
    const blob = new Blob(chunksRef.current, { type: recorderRef.current?.mimeType || 'audio/webm' })
    if (!blob.size) { setError('That recording came out empty. Try again.'); return }

    setBusy(true)
    try {
      const form = new FormData()
      form.append('audio', blob, 'note.webm')
      form.append('durationMs', String(durationMs))
      const res = await fetch('/api/support/voice', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Could not save that recording'); return }
      onRecorded({ audioId: data.id, transcript: transcriptRef.current.trim(), durationMs })
    } catch {
      setError('Could not upload that recording. Check your connection.')
    } finally {
      setBusy(false)
    }
  }

  const seconds = Math.floor(elapsed / 1000)

  return (
    <div>
      <button
        type="button"
        onClick={recording ? stop : start}
        disabled={disabled || busy}
        aria-label={recording ? 'Stop recording' : 'Record a voice note'}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '8px 14px', borderRadius: 99, cursor: busy ? 'wait' : 'pointer',
          border: `1px solid ${recording ? '#a33' : 'var(--line, #e8e4dc)'}`,
          background: recording ? '#fdecea' : '#fff',
          color: recording ? '#a33' : 'inherit',
          fontSize: '.82rem', fontWeight: 600,
        }}
      >
        <span aria-hidden="true">{recording ? '■' : '🎤'}</span>
        {busy ? 'Sending…' : recording ? `Stop · ${seconds}s` : 'Voice note'}
      </button>
      {recording && (
        <span style={{ marginLeft: 10, fontSize: '.76rem', color: '#6b7a70' }}>
          up to 60 seconds
        </span>
      )}
      {error && <p style={{ color: '#a33', fontSize: '.8rem', marginTop: 6 }}>{error}</p>}
    </div>
  )
}
