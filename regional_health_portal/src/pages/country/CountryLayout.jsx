import { Outlet } from 'react-router-dom'
import { CountryProvider, useCountry } from '../../context/CountryContext'
import { DataStoreProvider } from '../../context/DataStore'
import { useAuth } from '../../context/AuthContext'
import Sidebar from '../../components/Layout/Sidebar'
import Navbar from '../../components/Layout/Navbar'
import MultiSelectDropdown from '../../components/MultiSelectDropdown'
import { SUBREGIONS } from '../../data/dataService'

const YEARS = [2021, 2022, 2023, 2024, 2025]
const PRIORITY_COLOR = { 1: '#C00000', 2: '#D97706', 3: '#059669' }
const PRIORITY_LABEL = { 1: 'High Priority', 2: 'Medium Priority', 3: 'Standard' }

function CountrySubHeader() {
  const { user } = useAuth()
  const {
    selectedRegions,  setSelectedRegions,
    selectedIsos,     setSelectedIsos,
    selectedYears,    setSelectedYears,
    selectedDiseases, setSelectedDiseases,
    allDiseases,
    country, availableCountries,
  } = useCountry()

  const extraCount = selectedIsos.length > 1 ? selectedIsos.length - 1 : 0

  return (
    <div className="country-subheader">
      <div className="country-subheader-left">
        {country ? (
          <>
            <div className="subheader-iso">{country.iso_3_code}</div>
            <div className="subheader-info">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="subheader-name">{country.country_name}</span>
                {extraCount > 0 && (
                  <span className="subheader-tag" style={{ background: '#E8F0FE', color: '#0071BC', fontWeight: 600 }}>
                    +{extraCount} more
                  </span>
                )}
              </div>
              <div className="subheader-tags">
                <span className="subheader-tag">AFRO {country.afro_subregion}</span>
                <span
                  className="subheader-tag subheader-priority"
                  style={{ color: PRIORITY_COLOR[country.priority_country], borderColor: PRIORITY_COLOR[country.priority_country] + '55' }}
                >
                  {PRIORITY_LABEL[country.priority_country]}
                </span>
              </div>
            </div>
          </>
        ) : (
          <span className="subheader-name">Select a country</span>
        )}
      </div>

      <div className="country-subheader-controls">
        {user.role === 'super_admin' && (
          <MultiSelectDropdown
            options={SUBREGIONS.map(s => ({ value: s, label: `${s} Africa` }))}
            selected={selectedRegions}
            onChange={setSelectedRegions}
            placeholder="Select region…"
            allLabel="All Regions"
          />
        )}
        {user.role !== 'country_admin' && (
          <MultiSelectDropdown
            options={availableCountries.map(c => ({ value: c.iso_3_code, label: c.country_name }))}
            selected={selectedIsos}
            onChange={setSelectedIsos}
            placeholder="Select country…"
            allLabel="All Countries"
          />
        )}
        <MultiSelectDropdown
          options={allDiseases.map(d => ({ value: d, label: d }))}
          selected={selectedDiseases}
          onChange={setSelectedDiseases}
          placeholder="Select disease…"
          allLabel="All Diseases"
        />
        <MultiSelectDropdown
          options={YEARS.map(y => ({ value: y, label: String(y) }))}
          selected={selectedYears}
          onChange={setSelectedYears}
          placeholder="Select year…"
          allLabel="All Years"
        />
      </div>
    </div>
  )
}

export default function CountryLayout() {
  return (
    <DataStoreProvider>
    <CountryProvider>
      <div className="app-layout">
        <Sidebar />
        <div className="page-wrapper">
          <Navbar />
          <CountrySubHeader />
          <main className="page-main">
            <Outlet />
          </main>
        </div>
      </div>
    </CountryProvider>
    </DataStoreProvider>
  )
}
