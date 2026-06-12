/**
 * LocaleEngine — render-path localization (English / Spanish).
 *
 * IMPORTANT: this engine deliberately performs NO DOM mutation and uses NO
 * MutationObserver. Rewriting text nodes under a React-rendered tree is the
 * classic "Google-Translate-crashes-React" bug (removeChild / hydration
 * errors). Instead, translations flow through React's own render: components
 * call `t(text)`; misses are fetched from the secure /api/translate proxy,
 * cached, and surfaced via a change notification so React re-renders.
 *
 * Lookups are keyed by the English source string, so wiring a component is
 * just `t('Book Inspection')` — no separate key namespace to maintain.
 */
import { emitDiversityEvent } from './telemetry'

export type Locale = 'en' | 'es'

export const LOCALE_STORAGE_KEY = 'psi-locale'
const CACHE_STORAGE_KEY = 'psi-locale-cache'
const SUPPORTED: Locale[] = ['en', 'es']

export type LocaleDictionary = Partial<Record<Locale, Record<string, string>>>

/** Seed dictionary — instant, offline coverage of high-visibility strings.
 *  Anything not listed here falls through to the Google Translation proxy. */
const DEFAULT_DICTIONARY: LocaleDictionary = {
  es: {
    // Header / nav
    Services: 'Servicios',
    Pricing: 'Precios',
    'Utility Locating': 'Localización de Servicios',
    About: 'Acerca de',
    FAQ: 'Preguntas Frecuentes',
    Contact: 'Contacto',
    'Book Inspection': 'Reservar Inspección',
    // Hero
    "Central Indiana's Trusted Choice": 'La Opción de Confianza del Centro de Indiana',
    'Book Inspection — 60 Seconds': 'Reservar Inspección — 60 Segundos',
    'See Sample Footage': 'Ver Video de Muestra',
    'Google Rating': 'Calificación de Google',
    'Hour Delivery': 'Entrega en Horas',
    'No Upselling': 'Sin Ventas Adicionales',
    'Hidden Fees': 'Tarifas Ocultas',
    // Toolbar
    Accessibility: 'Accesibilidad',
    'Accessibility & language options': 'Opciones de accesibilidad e idioma',
    Theme: 'Tema',
    Light: 'Claro',
    Dark: 'Oscuro',
    System: 'Sistema',
    Language: 'Idioma',
    English: 'Inglés',
    Spanish: 'Español',
    'Dyslexia-friendly text': 'Texto adaptado para dislexia',
    'Machine / agent mode': 'Modo máquina / agente',
    Close: 'Cerrar',
  },
}

export class LocaleEngine {
  private storageKey: string
  private locale: Locale
  private proxyEndpoint: string
  private dictionary: LocaleDictionary
  private cache: Record<string, string> = {} // key: `${locale}:${source}`
  private inFlight = new Map<string, Promise<string>>()
  private listeners = new Set<() => void>()

  constructor(
    config: {
      storageKey?: string
      proxyEndpoint?: string
      dictionary?: LocaleDictionary
    } = {}
  ) {
    this.storageKey = config.storageKey || LOCALE_STORAGE_KEY
    this.proxyEndpoint = config.proxyEndpoint || '/api/translate'
    this.dictionary = mergeDictionaries(DEFAULT_DICTIONARY, config.dictionary)
    // NOTE: default to 'en' here (not the stored value). The constructor runs
    // during React render on both server and client-first-render; reading
    // localStorage here would make the client render Spanish while the server
    // rendered English → hydration mismatch. The stored locale is adopted in
    // init(), which runs post-mount in an effect.
    this.locale = 'en'
  }

  getLocale(): Locale {
    return this.locale
  }

  /** Post-mount: adopt the persisted locale + cache and sync <html lang>. */
  init(): void {
    this.cache = this.readCache()
    this.locale = this.readStoredLocale()
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('lang', this.locale)
    }
  }

  setLocale(locale: Locale): void {
    if (!SUPPORTED.includes(locale)) return
    this.locale = locale
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(this.storageKey, locale)
    }
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('lang', locale)
    }
    this.notify()

    emitDiversityEvent({
      event: 'locale_change',
      params: { locale_value: locale },
    })
  }

  /**
   * Synchronous lookup for the CURRENT locale. Returns the translated string
   * if known (seed dictionary or cache), else null. Never triggers I/O.
   */
  translateSync(source: string): string | null {
    if (this.locale === 'en') return source
    const fromDict = this.dictionary[this.locale]?.[source]
    if (fromDict) return fromDict
    const cached = this.cache[this.cacheKey(source)]
    return cached ?? null
  }

  /**
   * Resolve a translation, fetching from the proxy on a miss. Resolves to the
   * source text on any failure (graceful degradation). Populates the cache and
   * notifies listeners so React can re-render with the result.
   */
  async translateAsync(source: string): Promise<string> {
    if (this.locale === 'en' || !source.trim()) return source

    const sync = this.translateSync(source)
    if (sync !== null) return sync

    const key = this.cacheKey(source)
    const existing = this.inFlight.get(key)
    if (existing) return existing

    const promise = this.fetchTranslation(source, this.locale)
      .then((translated) => {
        const value = translated || source
        if (translated) {
          this.cache[key] = translated
          this.persistCache()
          this.notify()
        }
        return value
      })
      .catch(() => source)
      .finally(() => this.inFlight.delete(key))

    this.inFlight.set(key, promise)
    return promise
  }

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  destroy(): void {
    this.listeners.clear()
    this.inFlight.clear()
  }

  // ---- internals ----

  private cacheKey(source: string): string {
    return `${this.locale}:${source}`
  }

  private notify(): void {
    this.listeners.forEach((fn) => fn())
  }

  private async fetchTranslation(text: string, target: Locale): Promise<string | null> {
    try {
      const res = await fetch(this.proxyEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, target, source: 'en' }),
      })
      if (!res.ok) return null
      const data = (await res.json()) as { translatedText?: string }
      return data.translatedText?.trim() || null
    } catch {
      return null
    }
  }

  private readStoredLocale(): Locale {
    if (typeof window === 'undefined') return 'en'
    const stored = window.localStorage.getItem(this.storageKey) as Locale | null
    return stored && SUPPORTED.includes(stored) ? stored : 'en'
  }

  private readCache(): Record<string, string> {
    if (typeof window === 'undefined') return {}
    try {
      const raw = window.localStorage.getItem(CACHE_STORAGE_KEY)
      return raw ? (JSON.parse(raw) as Record<string, string>) : {}
    } catch {
      return {}
    }
  }

  private persistCache(): void {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(this.cache))
    } catch {
      /* quota / private-mode — cache stays in memory only */
    }
  }
}

function mergeDictionaries(base: LocaleDictionary, extra?: LocaleDictionary): LocaleDictionary {
  if (!extra) return { ...base, es: { ...base.es } }
  const merged: LocaleDictionary = {}
  for (const locale of SUPPORTED) {
    merged[locale] = { ...(base[locale] || {}), ...(extra[locale] || {}) }
  }
  return merged
}
