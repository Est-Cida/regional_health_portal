import { Outlet } from 'react-router-dom'
import { CountryProvider, useCountry } from '../../context/CountryContext'
import { DataStoreProvider } from '../../context/DataStore'
import { useAuth } from '../../context/AuthContext'
import Sidebar from '../../components/Layout/Sidebar'
import Navbar from '../../components/Layout/Navbar'

const YEARS = [2021, 2022, 2023, 2024, 2025]
const PRIORITY_COLOR = { 1: '#C00000', 2: '#D97706', 3: '#059669' }
const PRIORITY_LABEL = { 1: 'High Priority', 2: 'Medium Priority', 3: 'Standard' }

function CountrySubHeader() {
  const { user } = useAuth()
  const {
    selectedIso, setSelectedIso,
    selectedYear, setSelectedYear,
    country, availableCountries,
  } = useCountry()

  return (
    <div className="country-subheader">
      <div className="country-subheader-left">
        {country ? (
          <>
            <div className="subheader-iso">{country.iso_3_code}</div>
            <div className="subheader-info">
              <span className="subheader-name">{country.country_name}</span>
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
        {user.role !== 'country_admin' && (
          <select
            className="select-control"
            value={selectedIso || ''}
            onChange={e => setSelectedIso(e.target.value)}
          >
            {availableCountries.map(c => (
              <option key={c.iso_3_code} value={c.iso_3_code}>{c.country_name}</option>
            ))}
          </select>
        )}
        <div className="year-tabs">
          {YEARS.map(y => (
            <button
              key={y}
              className={`year-tab${selectedYear === y ? ' active' : ''}`}
              onClick={() => setSelectedYear(y)}
            >
              {y}
            </button>
          ))}
        </div>
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
