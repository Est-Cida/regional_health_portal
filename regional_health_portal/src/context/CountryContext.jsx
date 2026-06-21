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

  const defaultIso = user.role === 'country_admin'
    ? user.country_code
    : (availableCountries[0]?.iso_3_code ?? null)

  const [selectedIso, setSelectedIso]   = useState(defaultIso)
  const [selectedYear, setSelectedYear] = useState(2024)

  const country = useMemo(
    () => (selectedIso ? getCountry(selectedIso) : null),
    [selectedIso],
  )

  return (
    <CountryContext.Provider value={{
      selectedIso, setSelectedIso,
      selectedYear, setSelectedYear,
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
