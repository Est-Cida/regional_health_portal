import { createContext, useContext, useState, useCallback, useMemo } from 'react'
import {
  getRawSurveillance, getRawOutbreaks, getRawLabCapacity,
  getRawReporting, getRawWorkforce, getRawFunding,
} from '../data/dataService'

const STORE_KEY = 'who_portal_store'

export function rowId(table, row) {
  switch (table) {
    case 'outbreaks':    return row.outbreak_id
    case 'surveillance': return `${row.iso_3_code}|${row.year}|${row.disease}`
    default:             return `${row.iso_3_code}|${row.year}`
  }
}

function tryLoad() {
  try {
    const s = localStorage.getItem(STORE_KEY)
    if (s) return JSON.parse(s)
  } catch {}
  return null
}

function trySave(store) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(store)) } catch {}
}

function defaultStore() {
  return {
    outbreaks:    getRawOutbreaks().map(r => ({ ...r })),
    surveillance: getRawSurveillance().map(r => ({ ...r })),
    labCapacity:  getRawLabCapacity().map(r => ({ ...r })),
    reporting:    getRawReporting().map(r => ({ ...r })),
    workforce:    getRawWorkforce().map(r => ({ ...r })),
    funding:      getRawFunding().map(r => ({ ...r })),
  }
}

const DataStoreCtx = createContext(null)

export function DataStoreProvider({ children }) {
  const [store, setStore] = useState(() => tryLoad() || defaultStore())

  const mutate = useCallback((table, fn) => {
    setStore(prev => {
      const next = { ...prev, [table]: fn(prev[table]) }
      trySave(next)
      return next
    })
  }, [])

  const update = useCallback((table, id, changes) => {
    mutate(table, arr =>
      arr.map(row => rowId(table, row) === id ? { ...row, ...changes } : row)
    )
  }, [mutate])

  const remove = useCallback((table, id) => {
    mutate(table, arr => arr.filter(row => rowId(table, row) !== id))
  }, [mutate])

  const add = useCallback((table, record) => {
    mutate(table, arr => [...arr, record])
  }, [mutate])

  const reset = useCallback(() => {
    const fresh = defaultStore()
    trySave(fresh)
    setStore(fresh)
  }, [])

  const value = useMemo(() => ({
    state: store,
    update,
    remove,
    add,
    reset,
  }), [store, update, remove, add, reset])

  return <DataStoreCtx.Provider value={value}>{children}</DataStoreCtx.Provider>
}

export function useDataStore() {
  return useContext(DataStoreCtx)
}
