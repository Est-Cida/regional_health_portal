import { createContext, useContext, useState, useEffect, useMemo } from 'react'
import { useAuth } from './AuthContext'
import {
  getCountries, getCountriesBySubregion, getCountry,
  getDiseaseList, SUBREGIONS,
} from '../data/dataService'

const CountryContext = createContext(null)

const ALL_DISEASES  = getDiseaseList()
const ALL_COUNTRIES = getCountries()

export function CountryProvider({ children }) {
  const { user } = useAuth()

  const isSuperAdmin     = user.role === 'super_admin'
  const isRegionalAdmin  = user.role === 'regional_admin'

  // Region filter — only meaningful for super_admin
  const [selectedRegions, setSelectedRegions] = useState(() =>
    isSuperAdmin ? [...SUBREGIONS] : []
  )
  const allRegionsSelected = selectedRegions.length === SUBREGIONS.length

  // Country pool scoped by role + (for super_admin) region filter
  const availableCountries = useMemo(() => {
    if (user.role === 'country_admin')
      return ALL_COUNTRIES.filter(c => c.iso_3_code === user.country_code)
    if (isRegionalAdmin)
      return getCountriesBySubregion(user.subregion)
    // super_admin — apply region filter
    if (allRegionsSelected) return ALL_COUNTRIES
    return ALL_COUNTRIES.filter(c => selectedRegions.includes(c.afro_subregion))
  }, [user, selectedRegions, allRegionsSelected, isRegionalAdmin])

  const defaultIsos = user.role === 'country_admin'
    ? [user.country_code]
    : availableCountries.slice(0, 1).map(c => c.iso_3_code)

  const [selectedIsos,     setSelectedIsos]     = useState(defaultIsos)
  const [selectedYears,    setSelectedYears]    = useState([2024])
  const [selectedDiseases, setSelectedDiseases] = useState([...ALL_DISEASES])

  // When the country pool changes (super_admin changed regions), keep valid
  // selections and fall back to the first country if nothing is still valid.
  useEffect(() => {
    setSelectedIsos(prev => {
      const valid = prev.filter(iso => availableCountries.some(c => c.iso_3_code === iso))
      return valid.length > 0 ? valid : availableCountries.slice(0, 1).map(c => c.iso_3_code)
    })
  }, [availableCountries])

  const primaryIso  = selectedIsos[0]  ?? null
  const primaryYear = selectedYears[0] ?? 2024

  const country = useMemo(
    () => (primaryIso ? getCountry(primaryIso) : null),
    [primaryIso],
  )

  return (
    <CountryContext.Provider value={{
      selectedRegions,  setSelectedRegions,
      selectedIsos,     setSelectedIsos,
      selectedYears,    setSelectedYears,
      selectedDiseases, setSelectedDiseases,
      allDiseases: ALL_DISEASES,
      allRegionsSelected,
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
