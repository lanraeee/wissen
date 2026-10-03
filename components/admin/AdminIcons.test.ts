import { describe, it, expect } from 'vitest'
import { NAV } from './AdminNav'
import { NAV_ICONS } from './AdminIcons'

describe('admin nav icons', () => {
  it('has an icon for every nav entry', () => {
    const missing = NAV.map(([, href]) => href).filter(href => !NAV_ICONS[href])
    expect(missing).toEqual([])
  })
})
