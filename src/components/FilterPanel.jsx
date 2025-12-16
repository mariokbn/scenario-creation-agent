import { useState } from 'react'
import { Filter, ChevronDown, ChevronUp } from 'lucide-react'
import './FilterPanel.css'

function FilterPanel({ valueDrivers, filters, onFilterChange, productMaster }) {
  const [expanded, setExpanded] = useState({})

  const toggleDriver = (driver) => {
    setExpanded({ ...expanded, [driver]: !expanded[driver] })
  }

  const handleCheckboxChange = (driver, value, checked) => {
    const currentValues = filters[driver] || []
    const newValues = checked
      ? [...currentValues, value]
      : currentValues.filter(v => v !== value)
    
    onFilterChange(driver, newValues)
  }

  const formatDriverName = (driver) => {
    return driver
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const formatValueName = (value) => {
    return value
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  return (
    <div className="filter-panel">
      <div className="filter-header">
        <Filter size={20} />
        <h2>Value Driver Filters</h2>
      </div>
      
      {Object.keys(valueDrivers).length === 0 ? (
        <p className="no-filters">No value drivers found in product master</p>
      ) : (
        <div className="filter-list">
          {Object.keys(valueDrivers).map(driver => (
            <div key={driver} className="filter-group">
              <div 
                className="filter-group-header"
                onClick={() => toggleDriver(driver)}
              >
                <span className="filter-group-title">
                  {formatDriverName(driver)}
                  {filters[driver]?.length > 0 && (
                    <span className="filter-count">({filters[driver].length})</span>
                  )}
                </span>
                {expanded[driver] ? (
                  <ChevronUp size={20} />
                ) : (
                  <ChevronDown size={20} />
                )}
              </div>
              
              {expanded[driver] && (
                <div className="filter-options">
                  {valueDrivers[driver].map(value => (
                    <label key={value} className="filter-option">
                      <input
                        type="checkbox"
                        checked={(filters[driver] || []).includes(value)}
                        onChange={(e) => handleCheckboxChange(driver, value, e.target.checked)}
                      />
                      <span>{formatValueName(value)}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {Object.keys(filters).some(key => filters[key]?.length > 0) && (
        <button
          className="clear-filters-btn"
          onClick={() => {
            Object.keys(filters).forEach(driver => {
              onFilterChange(driver, [])
            })
          }}
        >
          Clear All Filters
        </button>
      )}
    </div>
  )
}

export default FilterPanel
