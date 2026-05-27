import { useState, useCallback, useRef } from 'react'
import client from '../api/client'

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const abortControllerRef = useRef(null)

  // Backend returns { data: { items: [], has_more: bool } }
  const fetchBookmarks = useCallback(async (keyword = '', tag = '') => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (keyword) params.set('keyword', keyword)
      if (tag) params.set('tag', tag)

      const url = keyword || tag
        ? `/api/search?${params}`
        : '/api/bookmarks'

      const res = await client.get(url, {
        signal: abortControllerRef.current.signal,
      })

      // Backend returns { data: { items: [...], has_more: bool } }
      const payload = res.data?.data
      let items = []
      if (Array.isArray(payload)) {
        items = payload
      } else if (payload?.items) {
        items = payload.items
      } else if (Array.isArray(res.data)) {
        items = res.data
      }

      setBookmarks(items)
    } catch (err) {
      if (err.name === 'CanceledError' || err.message === 'canceled') return
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // POST /api/bookmarks → { data: { bookmark: {} } }
  const addBookmark = useCallback(async (data) => {
    const tags = data.tags
      ? data.tags.split(',').map((t) => t.trim()).filter(Boolean)
      : []

    // Optimistic add
    const tempId = `temp-${Date.now()}`
    const optimistic = {
      id: tempId,
      title: data.title,
      url: data.url,
      notes: data.description,
      tags,
      created_at: new Date().toISOString(),
    }
    setBookmarks((prev) => [optimistic, ...prev])

    try {
      const res = await client.post('/api/bookmarks', {
        title: data.title,
        url: data.url,
        notes: data.description,
        tags,
      })
      const created = res.data?.data?.bookmark || res.data?.bookmark
      setBookmarks((prev) => prev.map((b) => (b.id === tempId ? created : b)))
      return created
    } catch (e) {
      setBookmarks((prev) => prev.filter((b) => b.id !== tempId))
      throw e
    }
  }, [])

  // PUT /api/bookmarks/<id> → { data: { bookmark: {} } }
  const updateBookmark = useCallback(async (id, data) => {
    const tags = data.tags
      ? data.tags.split(',').map((t) => t.trim()).filter(Boolean)
      : []

    setBookmarks((prev) =>
      prev.map((b) =>
        b.id === id
          ? { ...b, title: data.title, url: data.url, notes: data.description, tags }
          : b
      )
    )

    try {
      const res = await client.put(`/api/bookmarks/${id}`, {
        title: data.title,
        url: data.url,
        notes: data.description,
        tags,
      })
      const updated = res.data?.data?.bookmark || res.data?.bookmark
      setBookmarks((prev) => prev.map((b) => (b.id === id ? updated : b)))
      return updated
    } catch (e) {
      fetchBookmarks()
      throw e
    }
  }, [fetchBookmarks])

  // DELETE /api/bookmarks/<id>
  const deleteBookmark = useCallback(async (id) => {
    setBookmarks((prev) => prev.filter((b) => b.id !== id))
    try {
      await client.delete(`/api/bookmarks/${id}`)
    } catch (e) {
      fetchBookmarks()
      throw e
    }
  }, [fetchBookmarks])

  return {
    bookmarks,
    loading,
    error,
    fetchBookmarks,
    addBookmark,
    updateBookmark,
    deleteBookmark,
  }
}
