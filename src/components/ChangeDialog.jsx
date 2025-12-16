import { useState } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import './ChangeDialog.css'

function ChangeDialog({ filters, valueDrivers, productMaster, onClose, onCreate, initialChanges }) {
  const getDefaultChange = () => ({
    filters: {},
    csvFilters: {},
    priceChange: '',
    priceChangeRange: false,
    priceChangeFrom: '',
    priceChangeTo: '',
    priceChangeStep: '1',
    priceChangeType: 'Absolute',
    availabilityChange: '',
    availabilityChangeRange: false,
    availabilityChangeFrom: '',
    availabilityChangeTo: '',
    availabilityChangeStep: '1',
    availabilityChangeType: 'Absolute',
    costChange: '',
    costChangeRange: false,
    costChangeFrom: '',
    costChangeTo: '',
    costChangeStep: '1',
    costChangeType: 'Absolute'
  })

  const [changes, setChanges] = useState(initialChanges && initialChanges.length > 0 
    ? initialChanges.map(change => ({
        ...getDefaultChange(),
        ...change,
        // Ensure filters and csvFilters exist
        filters: change.filters || {},
        csvFilters: change.csvFilters || {}
      }))
    : [getDefaultChange()])

  const addChange = () => {
    setChanges([...changes, getDefaultChange()])
  }

  const removeChange = (index) => {
    setChanges(changes.filter((_, i) => i !== index))
  }

  const updateChange = (index, field, value) => {
    const newChanges = [...changes]
    newChanges[index] = { ...newChanges[index], [field]: value }
    setChanges(newChanges)
  }

  const updateChangeFilter = (changeIndex, driver, value, checked) => {
    const newChanges = [...changes]
    const currentFilters = newChanges[changeIndex].filters || {}
    
    if (!currentFilters[driver]) {
      currentFilters[driver] = []
    }
    
    const newFilterValues = checked
      ? [...currentFilters[driver], value]
      : currentFilters[driver].filter(v => v !== value)
    
    newChanges[changeIndex] = {
      ...newChanges[changeIndex],
      filters: { ...currentFilters, [driver]: newFilterValues }
    }
    
    setChanges(newChanges)
  }

  // Update CSV filters display (read-only for now, can be made editable later)
  const updateCsvFilter = (changeIndex, column, values) => {
    const newChanges = [...changes]
    newChanges[changeIndex] = {
      ...newChanges[changeIndex],
      csvFilters: { ...(newChanges[changeIndex].csvFilters || {}), [column]: values }
    }
    setChanges(newChanges)
  }

  const handleCreate = () => {
    // Generate all scenario combinations from ranges
    const scenarioCombinations = generateScenarioCombinations(changes)
    onCreate(scenarioCombinations)
  }

  const generateScenarioCombinations = (changes) => {
    // Collect all value ranges from all changes
    const allPriceValues = new Set()
    const allAvailabilityValues = new Set()
    const allCostValues = new Set()
    const allFilters = {}
    
    changes.forEach((change) => {
      // Merge filters
      if (change.filters) {
        Object.keys(change.filters).forEach(driver => {
          if (!allFilters[driver]) {
            allFilters[driver] = new Set()
          }
          change.filters[driver].forEach(val => allFilters[driver].add(val))
        })
      }
      
      // Collect price values
      if (change.priceChangeRange && change.priceChangeFrom && change.priceChangeTo) {
        const from = parseFloat(change.priceChangeFrom)
        const to = parseFloat(change.priceChangeTo)
        const step = parseFloat(change.priceChangeStep) || 1
        
        for (let val = from; val <= to; val += step) {
          allPriceValues.add(val)
        }
      } else if (change.priceChange) {
        allPriceValues.add(parseFloat(change.priceChange))
      }
      
      // Collect availability values
      if (change.availabilityChangeRange && change.availabilityChangeFrom && change.availabilityChangeTo) {
        const from = parseFloat(change.availabilityChangeFrom)
        const to = parseFloat(change.availabilityChangeTo)
        const step = parseFloat(change.availabilityChangeStep) || 1
        
        for (let val = from; val <= to; val += step) {
          allAvailabilityValues.add(val)
        }
      } else if (change.availabilityChange) {
        allAvailabilityValues.add(parseFloat(change.availabilityChange))
      }
      
      // Collect cost values
      if (change.costChangeRange && change.costChangeFrom && change.costChangeTo) {
        const from = parseFloat(change.costChangeFrom)
        const to = parseFloat(change.costChangeTo)
        const step = parseFloat(change.costChangeStep) || 1
        
        for (let val = from; val <= to; val += step) {
          allCostValues.add(val)
        }
      } else if (change.costChange) {
        allCostValues.add(parseFloat(change.costChange))
      }
    })
    
    // Convert Sets to Arrays
    const priceValues = Array.from(allPriceValues).sort((a, b) => a - b)
    const availabilityValues = Array.from(allAvailabilityValues).sort((a, b) => a - b)
    const costValues = Array.from(allCostValues).sort((a, b) => a - b)
    
    // Convert filter sets to arrays
    const mergedFilters = {}
    Object.keys(allFilters).forEach(driver => {
      mergedFilters[driver] = Array.from(allFilters[driver])
    })
    
    // Get change types from first change (assuming all changes use same type)
    const priceChangeType = changes[0]?.priceChangeType || 'Absolute'
    const availabilityChangeType = changes[0]?.availabilityChangeType || 'Absolute'
    const costChangeType = changes[0]?.costChangeType || 'Absolute'
    
    // Generate cartesian product of all combinations
    const combinations = []
    
    // If no ranges, create single combination
    if (priceValues.length === 0 && availabilityValues.length === 0 && costValues.length === 0) {
      return [{
        filters: mergedFilters,
        priceChange: undefined,
        priceChangeType: priceChangeType,
        availabilityChange: undefined,
        availabilityChangeType: availabilityChangeType,
        costChange: undefined,
        costChangeType: costChangeType
      }]
    }
    
    // Default to single null value if no range specified
    const finalPriceValues = priceValues.length > 0 ? priceValues : [null]
    const finalAvailabilityValues = availabilityValues.length > 0 ? availabilityValues : [null]
    const finalCostValues = costValues.length > 0 ? costValues : [null]
    
    finalPriceValues.forEach(priceVal => {
      finalAvailabilityValues.forEach(availVal => {
        finalCostValues.forEach(costVal => {
          // Only create combination if at least one value is set
          if (priceVal !== null || availVal !== null || costVal !== null) {
            combinations.push({
              filters: mergedFilters,
              priceChange: priceVal !== null ? priceVal : undefined,
              priceChangeType: priceChangeType,
              availabilityChange: availVal !== null ? availVal : undefined,
              availabilityChangeType: availabilityChangeType,
              costChange: costVal !== null ? costVal : undefined,
              costChangeType: costChangeType
            })
          }
        })
      })
    })
    
    return combinations.length > 0 ? combinations : [{
      filters: mergedFilters,
      priceChange: undefined,
      priceChangeType: priceChangeType,
      availabilityChange: undefined,
      availabilityChangeType: availabilityChangeType,
      costChange: undefined,
      costChangeType: costChangeType
    }]
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
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h2>Create New Scenario</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="dialog-body">
          {initialChanges && initialChanges.length > 0 && (
            <div className="ai-populated-banner">
              ✨ These settings were populated by AI. Please review and adjust as needed before creating scenarios.
            </div>
          )}
          <p className="dialog-description">
            Define one or more changes to apply. Each change can target specific products using filters
            and modify price, availability, and/or costs.
          </p>

          {changes.map((change, index) => (
            <div key={index} className="change-card">
              <div className="change-card-header">
                <h3>Change {index + 1}</h3>
                {changes.length > 1 && (
                  <button
                    className="remove-change-btn"
                    onClick={() => removeChange(index)}
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>

              <div className="change-section">
                <h4>CSV Column Filters</h4>
                <p className="section-description">Filter by CSV columns (e.g., Is Competitor, Region, Retailer)</p>
                {change.csvFilters && Object.keys(change.csvFilters).length > 0 ? (
                  <div className="csv-filters-display">
                    {Object.keys(change.csvFilters).map(column => (
                      <div key={column} className="csv-filter-badge">
                        <strong>{column}:</strong> {change.csvFilters[column].join(', ')}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-filters-text">No CSV column filters set</p>
                )}
              </div>

              <div className="change-section">
                <h4>Product Filters (Value Drivers)</h4>
                <p className="section-description">Select value drivers to target specific products</p>
                <div className="filter-grid">
                  {Object.keys(valueDrivers).map(driver => (
                    <div key={driver} className="filter-select-group">
                      <label className="filter-select-label">{formatDriverName(driver)}</label>
                      <div className="filter-select-options">
                        {valueDrivers[driver].slice(0, 5).map(value => (
                          <label key={value} className="filter-select-option">
                            <input
                              type="checkbox"
                              checked={(change.filters[driver] || []).includes(value)}
                              onChange={(e) => updateChangeFilter(index, driver, value, e.target.checked)}
                            />
                            <span>{formatValueName(value)}</span>
                          </label>
                        ))}
                        {valueDrivers[driver].length > 5 && (
                          <span className="more-options">+{valueDrivers[driver].length - 5} more</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="change-section">
                <h4>Price Changes</h4>
                <div className="range-toggle-group">
                  <label className="range-toggle-label">
                    <input
                      type="checkbox"
                      checked={change.priceChangeRange}
                      onChange={(e) => updateChange(index, 'priceChangeRange', e.target.checked)}
                    />
                    <span>Use range</span>
                  </label>
                </div>
                {change.priceChangeRange ? (
                  <div className="range-inputs">
                    <div className="range-input-group">
                      <label>From:</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Min"
                        value={change.priceChangeFrom}
                        onChange={(e) => updateChange(index, 'priceChangeFrom', e.target.value)}
                        className="change-input"
                      />
                    </div>
                    <div className="range-input-group">
                      <label>To:</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Max"
                        value={change.priceChangeTo}
                        onChange={(e) => updateChange(index, 'priceChangeTo', e.target.value)}
                        className="change-input"
                      />
                    </div>
                    <div className="range-input-group">
                      <label>Step:</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="1"
                        value={change.priceChangeStep}
                        onChange={(e) => updateChange(index, 'priceChangeStep', e.target.value)}
                        className="change-input"
                      />
                    </div>
                    <select
                      value={change.priceChangeType}
                      onChange={(e) => updateChange(index, 'priceChangeType', e.target.value)}
                      className="change-type-select"
                    >
                      <option value="Absolute">Amount (e.g., +5.00 or -2.50)</option>
                      <option value="Percentage">Percentage (e.g., +10% or -5%)</option>
                      <option value="Target">Target Price</option>
                    </select>
                  </div>
                ) : (
                  <div className="change-input-group">
                    <input
                      type="number"
                      step="0.01"
                      placeholder={change.priceChangeType === 'Target' ? 'Target price' : change.priceChangeType === 'Percentage' ? 'Change % (e.g., +10 or -5)' : 'Change amount (e.g., +5.00 or -2.50)'}
                      value={change.priceChange}
                      onChange={(e) => updateChange(index, 'priceChange', e.target.value)}
                      className="change-input"
                    />
                    <select
                      value={change.priceChangeType}
                      onChange={(e) => updateChange(index, 'priceChangeType', e.target.value)}
                      className="change-type-select"
                    >
                      <option value="Absolute">Amount (e.g., +5.00 or -2.50)</option>
                      <option value="Percentage">Percentage (e.g., +10% or -5%)</option>
                      <option value="Target">Target Price</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="change-section">
                <h4>Availability Changes</h4>
                <div className="range-toggle-group">
                  <label className="range-toggle-label">
                    <input
                      type="checkbox"
                      checked={change.availabilityChangeRange}
                      onChange={(e) => updateChange(index, 'availabilityChangeRange', e.target.checked)}
                    />
                    <span>Use range</span>
                  </label>
                </div>
                {change.availabilityChangeRange ? (
                  <div className="range-inputs">
                    <div className="range-input-group">
                      <label>From:</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Min"
                        value={change.availabilityChangeFrom}
                        onChange={(e) => updateChange(index, 'availabilityChangeFrom', e.target.value)}
                        className="change-input"
                      />
                    </div>
                    <div className="range-input-group">
                      <label>To:</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Max"
                        value={change.availabilityChangeTo}
                        onChange={(e) => updateChange(index, 'availabilityChangeTo', e.target.value)}
                        className="change-input"
                      />
                    </div>
                    <div className="range-input-group">
                      <label>Step:</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="1"
                        value={change.availabilityChangeStep}
                        onChange={(e) => updateChange(index, 'availabilityChangeStep', e.target.value)}
                        className="change-input"
                      />
                    </div>
                    <select
                      value={change.availabilityChangeType}
                      onChange={(e) => updateChange(index, 'availabilityChangeType', e.target.value)}
                      className="change-type-select"
                    >
                      <option value="Absolute">Amount (e.g., +5 or -10)</option>
                      <option value="Percentage">Percentage (e.g., +10% or -5%)</option>
                    </select>
                  </div>
                ) : (
                  <div className="change-input-group">
                    <input
                      type="number"
                      step="0.01"
                      placeholder={change.availabilityChangeType === 'Percentage' ? 'Change % (e.g., +10 or -5)' : 'Change amount (e.g., +5 or -10)'}
                      value={change.availabilityChange}
                      onChange={(e) => updateChange(index, 'availabilityChange', e.target.value)}
                      className="change-input"
                    />
                    <select
                      value={change.availabilityChangeType}
                      onChange={(e) => updateChange(index, 'availabilityChangeType', e.target.value)}
                      className="change-type-select"
                    >
                      <option value="Absolute">Amount (e.g., +5 or -10)</option>
                      <option value="Percentage">Percentage (e.g., +10% or -5%)</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="change-section">
                <h4>Cost Changes</h4>
                <div className="range-toggle-group">
                  <label className="range-toggle-label">
                    <input
                      type="checkbox"
                      checked={change.costChangeRange}
                      onChange={(e) => updateChange(index, 'costChangeRange', e.target.checked)}
                    />
                    <span>Use range</span>
                  </label>
                </div>
                {change.costChangeRange ? (
                  <div className="range-inputs">
                    <div className="range-input-group">
                      <label>From:</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Min"
                        value={change.costChangeFrom}
                        onChange={(e) => updateChange(index, 'costChangeFrom', e.target.value)}
                        className="change-input"
                      />
                    </div>
                    <div className="range-input-group">
                      <label>To:</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Max"
                        value={change.costChangeTo}
                        onChange={(e) => updateChange(index, 'costChangeTo', e.target.value)}
                        className="change-input"
                      />
                    </div>
                    <div className="range-input-group">
                      <label>Step:</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="1"
                        value={change.costChangeStep}
                        onChange={(e) => updateChange(index, 'costChangeStep', e.target.value)}
                        className="change-input"
                      />
                    </div>
                    <select
                      value={change.costChangeType}
                      onChange={(e) => updateChange(index, 'costChangeType', e.target.value)}
                      className="change-type-select"
                    >
                      <option value="Absolute">Amount (e.g., +0.50 or -0.25)</option>
                      <option value="Percentage">Percentage (e.g., +10% or -5%)</option>
                    </select>
                  </div>
                ) : (
                  <div className="change-input-group">
                    <input
                      type="number"
                      step="0.01"
                      placeholder={change.costChangeType === 'Percentage' ? 'Change % (e.g., +10 or -5)' : 'Change amount (e.g., +0.50 or -0.25)'}
                      value={change.costChange}
                      onChange={(e) => updateChange(index, 'costChange', e.target.value)}
                      className="change-input"
                    />
                    <select
                      value={change.costChangeType}
                      onChange={(e) => updateChange(index, 'costChangeType', e.target.value)}
                      className="change-type-select"
                    >
                      <option value="Absolute">Amount (e.g., +0.50 or -0.25)</option>
                      <option value="Percentage">Percentage (e.g., +10% or -5%)</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          ))}

          <button className="add-change-btn" onClick={addChange}>
            <Plus size={20} />
            Add Another Change
          </button>
        </div>

        <div className="dialog-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleCreate}>
            Create Scenarios
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChangeDialog
