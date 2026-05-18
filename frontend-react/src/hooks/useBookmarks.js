import { useState, useCallback } from 'react'
import client from '../api/client'

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchBookmarks = useCallback(async (keyword = '', tag = '') => {
    setLoading(true)
    setError(null)
    try {
      let url = '/api/bookmarks'
      if (keyword || tag) {
        const params = new URLSearchParams()
        if (keyword) params.set('keyword', keyword)
        if (tag) params.set('tag', tag)
        url = `/api/search?${params}`
      }
      const res = await client.get(url)
      setBookmarks(res.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const addBookmark = useCallback(async (data) => {
    const res = await client.post('/api/bookmarks', {
      title: data.title,
      url: data.url,
      notes: data.description,
      tags: data.tags
        ? data.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : [],
    })
    setBookmarks((prev) => [res.data.bookmark, ...prev])
    return res.data.bookmark
  }, [])

  const updateBookmark = useCallback(async (id, data) => {
    const res = await client.put(`/api/bookmarks/${id}`, {
      title: data.title,
      url: data.url,
      notes: data.description,
      tags: data.tags
        ? data.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : [],
    })
    setBookmarks((prev) =>
      prev.map((b) => (b.id === id ? res.data.bookmark : b))
    )
    return res.data.bookmark
  }, [])

  const deleteBookmark = useCallback(async (id) => {
    await client.delete(`/api/bookmarks/${id}`)
    setBookmarks((prev) => prev.filter((b) => b.id !== id))
  }, [])

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
