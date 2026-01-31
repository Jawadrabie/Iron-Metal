import { useCallback, useEffect, useMemo, useState } from "react"

type VisitorCountry = {
  country: string
  count: number
}

type VisitorStats = {
  count: number
  countries: VisitorCountry[]
}

const DEFAULT_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://iron-metal.net"
const FALLBACK_INTERVAL = 5 * 60 * 1000

export function useVisitorStats(pollInterval = FALLBACK_INTERVAL) {
  const [stats, setStats] = useState<VisitorStats>({ count: 0, countries: [] })
  const [loading, setLoading] = useState(true)

  const endpoint = useMemo(() => {
    const normalizedBase = DEFAULT_BASE_URL.replace(/\/$/, "")
    return `${normalizedBase}/api/visitors/stats`
  }, [])

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(endpoint)
      if (!response.ok) throw new Error("Failed to load visitor stats")
      const data = await response.json()
      const countries = Array.isArray(data?.countries) ? data.countries : []
      setStats({ count: data?.count ?? 0, countries })
    } catch (error) {
      console.warn("useVisitorStats", error)
    } finally {
      setLoading(false)
    }
  }, [endpoint])

  useEffect(() => {
    let mounted = true
    fetchStats()
    if (!pollInterval) return () => {
      mounted = false
    }
    const intervalId = setInterval(() => {
      if (mounted) fetchStats()
    }, pollInterval)
    return () => {
      mounted = false
      clearInterval(intervalId)
    }
  }, [fetchStats, pollInterval])

  return { stats, loading }
}
