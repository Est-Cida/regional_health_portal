import { createContext, useContext, useState, useMemo } from 'react'
import { useAuth } from './AuthContext'
import { getCountries, getCountriesBySubregion, getCountry } from '../data/dataService'

const CountryContext = createContext(null)

export function CountryProvider({ children }) {
  const { user } = useAuth()

  const availableCountries = useMemo(() => {
    if (user.role === 'country_admin')  return getCountries().filter(c => c.iso_3_code === user.country_code)
    if (user.role === 'regional_admin') return getCountriesBySubregion(user.subregion)
    return getCountries()
  }, [user])

  const defaultIsos = user.role === 'country_admin'
    ? [user.country_code]
    : availableCountries.slice(0, 1).map(c => c.iso_3_code)

  const [selectedIsos,  setSelectedIsos]  = useState(defaultIsos)
  const [selectedYears, setSelectedYears] = useState([2024])

  // Primary values for CRUD operations and labels
  const primaryIso  = selectedIsos[0]  ?? null
  const primaryYear = selectedYears[0] ?? 2025

  const country = useMemo(
    () => (primaryIso ? getCountry(primaryIso) : null),
    [primaryIso],
  )

  return (
    <CountryContext.Provider value={{
      selectedIsos,  setSelectedIsos,
      selectedYears, setSelectedYears,
      primaryIso,
      primaryYear,
      country,
      availableCountries,
    }}>
      {children}
    </CountryContext.Provider>
  )
}

export function useCountry() {
  const ctx = useContext(CountryContext)
  if (!ctx) throw new Error('useCountry must be used inside CountryProvider')
  return ctx
}
