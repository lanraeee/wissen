'use client'

import { useState, useEffect } from 'react'

// Reads a message aloud with the browser's own speech synthesis. No API key,
// no audio stored, no per-play cost -- which matters both for a foundation's
// budget and for a reader on a metered connection, since nothing is
// downloaded. Renders nothing at all where the API is missing rather than
// showing a button that would do nothing.
export default function SpeakButton({ text }: { text: string }) {
  const [supported, setSupported] = useState(false)
  const [speaking, setSpeaking] = useState(false)

  useEffect(() => {
    setSupported(typeof window !== 'undefined' && 'speechSynthesis' in window)
    // Speech carries on after the component unmounts otherwise -- navigate
    // away mid-sentence and the page keeps talking.
    return () => { if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel() }
  }, [])

  if (!supported || !text.trim()) return null

  function toggle() {
    if (speaking) {
      window.speechSynthesis.cancel()
      setSpeaking(false)
      return
    }
    // Any queued utterance is dropped first, so tapping play on a second
    // message interrupts the first instead of queueing behind it.
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.95
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)
    setSpeaking(true)
    window.speechSynthesis.speak(utterance)
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={speaking ? 'Stop reading this message' : 'Read this message aloud'}
      style={{
        border: 'none', background: 'none', cursor: 'pointer', padding: '2px 4px',
        fontSize: '.76rem', color: '#6b7a70', display: 'inline-flex', alignItems: 'center', gap: 4,
      }}
    >
      <span aria-hidden="true">{speaking ? '◼' : '▶'}</span>
      {speaking ? 'Stop' : 'Listen'}
    </button>
  )
}
