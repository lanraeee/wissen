'use client'

import { useState, useEffect } from 'react'

interface FounderContent {
  name: string
  role: string
  quote: string
  paragraphs: string[]
  photo?: string
}

const DEFAULTS: FounderContent = {
  name: 'Benz Olagbaye',
  role: 'Founder & Executive Director',
  quote: 'I grew up watching brilliant young minds in Nigeria with unlimited potential, yet they had limited access to the right guidance, mentorship, and opportunities.',
  paragraphs: [
    "Year after year, I saw the same pattern: talented students excelling in classrooms yet struggling to bridge the gap between academic knowledge and real-world readiness. They knew what they wanted to achieve, but lacked the roadmap to get there. They had the desire to succeed, but didn't know which doors to knock on. It broke my heart then, and it still drives me today.",
    "Moving to the UK opened my eyes to a deeper truth about the real nature of the skills gap. It wasn't about intelligence or capability. The real issue was access. Young Nigerians deserve the same global exposure, career mentorship, and skill development opportunities as their peers anywhere in the world. They deserve more than just hope; they deserve a proven path to economic independence.",
    "That's why I founded Wissen-Haus.",
    "I started this foundation because I refused to accept that your zip code should limit your potential and determine your destiny. I've mentored over 50 young people, watching them grow into confident professionals who now lead their own journeys with belief in themselves and their abilities.",
    "Every member of the Wissen-Haus community is proof that when young people are equipped with the right skills, guidance, and belief in themselves, they don't just succeed—they transform their entire communities.",
    "This is just the beginning.",
  ],
}

const inp = { padding: '8px 12px', fontSize: '.88rem', border: '1px solid #d0ccc4', borderRadius: 6, width: '100%', boxSizing: 'border-box' as const }
const lbl = { fontSize: '.72rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' as const, color: '#8a9a8f', display: 'block', marginBottom: 4 }
const s = (bg: string, color = '#fff') => ({ padding: '4px 10px', borderRadius: 6, fontSize: '.72rem', fontWeight: 600, background: bg, color, border: 'none', cursor: 'pointer' })

export default function FounderEditor() {
  const [data, setData] = useState<FounderContent>(DEFAULTS)
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/admin/content/founder_bio').then(r => r.json()).then(res => {
      if (res.value) setData({ ...DEFAULTS, ...res.value })
      setLoaded(true)
    })
  }, [])

  async function save() {
    setSaving(true)
    await fetch('/api/admin/content/founder_bio', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: data }),
    })
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2500)
  }

  function updatePara(i: number, val: string) {
    setData(d => ({ ...d, paragraphs: d.paragraphs.map((p, j) => j === i ? val : p) }))
  }
  function addPara() { setData(d => ({ ...d, paragraphs: [...d.paragraphs, ''] })) }
  function removePara(i: number) { setData(d => ({ ...d, paragraphs: d.paragraphs.filter((_, j) => j !== i) })) }
  function movePara(i: number, dir: -1 | 1) {
    const arr = [...data.paragraphs];
    [arr[i], arr[i + dir]] = [arr[i + dir], arr[i]]
    setData(d => ({ ...d, paragraphs: arr }))
  }

  if (!loaded) return <div style={{ padding: 24, color: '#8a9a8f' }}>Loading…</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Founder Bio</h2>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {saved && <span style={{ fontSize: '.8rem', color: '#16a34a' }}>Saved!</span>}
          <button onClick={save} disabled={saving} style={{ padding: '7px 16px', borderRadius: 7, fontSize: '.82rem', fontWeight: 600, background: '#1a3c2e', color: '#fff', border: 'none', cursor: 'pointer' }}>{saving ? 'Saving…' : 'Save Changes'}</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
        {(['name', 'role'] as const).map(k => (
          <div key={k}>
            <label style={lbl}>{k === 'name' ? 'Full Name' : 'Title / Role'}</label>
            <input style={inp} value={data[k]} onChange={e => setData(d => ({ ...d, [k]: e.target.value }))} />
          </div>
        ))}
        <div style={{ gridColumn: '1/-1' }}>
          <label style={lbl}>Photo</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {data.photo
              ? <img src={data.photo} alt="Founder" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '2px solid #d0ccc4' }} />
              : <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,#0F2D1D,#1a4a2e)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: 800, color: '#B8952A' }}>BO</div>
            }
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ ...s('#1a3c2e'), display: 'inline-block', cursor: 'pointer' }}>
                Upload photo
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
                  const file = e.target.files?.[0]; if (!file) return
                  const reader = new FileReader()
                  reader.onload = () => setData(d => ({ ...d, photo: reader.result as string }))
                  reader.readAsDataURL(file)
                }} />
              </label>
              {data.photo && <button style={s('#dc2626')} onClick={() => setData(d => ({ ...d, photo: undefined }))}>Remove</button>}
            </div>
          </div>
        </div>
        <div style={{ gridColumn: '1/-1' }}>
          <label style={lbl}>Opening Quote</label>
          <textarea style={{ ...inp, minHeight: 80, resize: 'vertical' }} value={data.quote} onChange={e => setData(d => ({ ...d, quote: e.target.value }))} />
        </div>
      </div>

      <label style={{ ...lbl, marginBottom: 10 }}>Bio Paragraphs</label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {data.paragraphs.map((p, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <textarea style={{ ...inp, minHeight: 72, resize: 'vertical', flex: 1 }} value={p} onChange={e => updatePara(i, e.target.value)} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {i > 0 && <button style={s('#e8e4dc', '#3a4a3f')} onClick={() => movePara(i, -1)}>↑</button>}
              {i < data.paragraphs.length - 1 && <button style={s('#e8e4dc', '#3a4a3f')} onClick={() => movePara(i, 1)}>↓</button>}
              <button style={s('#dc2626')} onClick={() => removePara(i)}>✕</button>
            </div>
          </div>
        ))}
        <button onClick={addPara} style={{ ...s('#1a3c2e'), alignSelf: 'flex-start' }}>+ Add Paragraph</button>
      </div>
    </div>
  )
}
