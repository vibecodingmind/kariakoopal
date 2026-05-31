import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  const merged = twMerge(clsx(inputs))
  // twMerge v3 doesn't always strip axis-spanning padding/margin classes
  // (px-*/py-*/p-*/mx-*/my-*/m-*) when directional overrides exist on the
  // same axis. Post-process to remove them and avoid CSS cascade conflicts.
  const tokens = merged.split(/\s+/)

  // Detect directional padding overrides
  const pDir = {
    l: tokens.some(t => /^pl-/.test(t)),
    r: tokens.some(t => /^pr-/.test(t)),
    t: tokens.some(t => /^pt-/.test(t)),
    b: tokens.some(t => /^pb-/.test(t)),
    s: tokens.some(t => /^ps-/.test(t)),
    e: tokens.some(t => /^pe-/.test(t)),
  }
  const hasPxOverride = pDir.l || pDir.r || pDir.s || pDir.e
  const hasPyOverride = pDir.t || pDir.b
  const hasPOverride = hasPxOverride || hasPyOverride

  // Detect directional margin overrides
  const mDir = {
    l: tokens.some(t => /^ml-/.test(t)),
    r: tokens.some(t => /^mr-/.test(t)),
    t: tokens.some(t => /^mt-/.test(t)),
    b: tokens.some(t => /^mb-/.test(t)),
    s: tokens.some(t => /^ms-/.test(t)),
    e: tokens.some(t => /^me-/.test(t)),
  }
  const hasMxOverride = mDir.l || mDir.r || mDir.s || mDir.e
  const hasMyOverride = mDir.t || mDir.b
  const hasMOverride = hasMxOverride || hasMyOverride

  const filtered = tokens.filter(t => {
    if (/^px-/.test(t) && hasPxOverride) return false
    if (/^py-/.test(t) && hasPyOverride) return false
    if (/^p-(?!x|y)/.test(t) && hasPOverride) return false
    if (/^mx-/.test(t) && hasMxOverride) return false
    if (/^my-/.test(t) && hasMyOverride) return false
    if (/^m-(?!x|y)/.test(t) && hasMOverride) return false
    return true
  })

  return filtered.join(' ')
}
