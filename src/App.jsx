import { useState, useEffect } from 'react'
import DualFileUpload from './components/DualFileUpload'
import FilterPanel from './components/FilterPanel'
import ChangeDialog from './components/ChangeDialog'
import ScenarioList from './components/ScenarioList'
import LLMPrompt from './components/LLMPrompt'
import { parseCsvFile, parseJsonFile, extractValueDrivers, createAttributeLookup, createProductNameLookup } from './utils/dataParser'
import { saveScenario, getScenarios } from './services/supabase'
import './App.css'

function App() {
  const [baseScenario, setBaseScenario] = useState(null)
  const [productMaster, setProductMaster] = useState(null)
  const [valueDrivers, setValueDrivers] = useState({})
  const [filters, setFilters] = useState({})
  const [filteredData, setFilteredData] = useState([])
  const [showChangeDialog, setShowChangeDialog] = useState(false)
  const [showLLMPrompt, setShowLLMPrompt] = useState(false)
  const [scenarios, setScenarios] = useState([])
  const [attributeLookup, setAttributeLookup] = useState(null)
  const [productNameLookup, setProductNameLookup] = useState(null)
  const [csvFile, setCsvFile] = useState(null)
  const [jsonFile, setJsonFile] = useState(null)
  const [csvColumns, setCsvColumns] = useState([])
  const [csvColumnValues, setCsvColumnValues] = useState({})

  const handleCsvUpload = async (file) => {
    try {
      const csvData = await parseCsvFile(file)
      setBaseScenario(csvData)
      setCsvFile(file)
      
      // Extract column names and unique values for AI training
      if (csvData && csvData.length > 0) {
        const columns = Object.keys(csvData[0])
        setCsvColumns(columns)
        
        // Extract unique values for each column (for AI context)
        const columnValues = {}
        columns.forEach(col => {
          const uniqueValues = [...new Set(csvData.map(row => row[col]).filter(val => val !== '' && val !== null && val !== undefined))].slice(0, 20)
          columnValues[col] = uniqueValues
        })
        setCsvColumnValues(columnValues)
      }
      
      // If JSON is already loaded, update filtered data
      if (productMaster) {
        setFilteredData(csvData)
      }
    } catch (error) {
      console.error('Error parsing CSV:', error)
      alert('Error parsing CSV file: ' + error.message)
    }
  }

  const handleJsonUpload = async (file) => {
    try {
      const jsonData = await parseJsonFile(file)
      setProductMaster(jsonData)
      setJsonFile(file)
      
      // Extract value drivers from product master
      const drivers = extractValueDrivers(jsonData)
      setValueDrivers(drivers)
      
      // Create attribute lookup for fast filtering (by variant ID)
      const lookup = createAttributeLookup(jsonData)
      setAttributeLookup(lookup)
      
      // Create product name lookup for scenario creation (by Product Name)
      const nameLookup = createProductNameLookup(jsonData)
      setProductNameLookup(nameLookup)
      
      // Initialize filters
      const initialFilters = {}
      Object.keys(drivers).forEach(key => {
        initialFilters[key] = []
      })
      setFilters(initialFilters)
      
      // If CSV is already loaded, update filtered data
      if (baseScenario) {
        setFilteredData(baseScenario)
      }
    } catch (error) {
      console.error('Error parsing JSON:', error)
      alert('Error parsing JSON file: ' + error.message)
    }
  }

  // Update filtered data when both files are loaded
  useEffect(() => {
    if (baseScenario && productMaster) {
      setFilteredData(baseScenario)
    }
  }, [baseScenario, productMaster])

  // Load saved scenarios from Supabase on mount
  useEffect(() => {
    const loadScenarios = async () => {
      const { data } = await getScenarios()
      if (data && data.length > 0) {
        // Transform Supabase data to match our format
        const transformed = data.map(item => ({
          name: item.name,
          data: item.data,
          id: item.id
        }))
        setScenarios(transformed)
      }
    }
    loadScenarios()
  }, [])

  // Helper function to determine change type string
  const getChangeTypeString = (changeValue, changeType, isPrice = false, isTargetPrice = false) => {
    if (isPrice && isTargetPrice) {
      return 'TARGET_PRICE'
    }
    
    const value = parseFloat(changeValue)
    if (isNaN(value)) return ''
    
    if (changeType === 'Percentage') {
      return value >= 0 ? 'INCREASE_PERCENT' : 'DECREASE_PERCENT'
    } else {
      return value >= 0 ? 'INCREASE_AMOUNT' : 'DECREASE_AMOUNT'
    }
  }

  // Optimized filtering using attribute lookup
  const handleFilterChange = (driver, values) => {
    const newFilters = { ...filters, [driver]: values }
    setFilters(newFilters)
    
    // Check if any filters are active
    const hasActiveFilters = Object.values(newFilters).some(f => f.length > 0)
    
    if (!hasActiveFilters || !attributeLookup) {
      setFilteredData(baseScenario || [])
      return
    }
    
    // Apply filters using the lookup map (much faster)
    const filtered = (baseScenario || []).filter(row => {
      const productId = row['Product Variant Id']
      const attributes = attributeLookup.get(productId)
      
      if (!attributes) return false
      
      // Check all active filters
      for (const driverKey of Object.keys(newFilters)) {
        if (newFilters[driverKey].length > 0) {
          const attributeValue = attributes[driverKey]
          if (!attributeValue || !newFilters[driverKey].includes(attributeValue)) {
            return false
          }
        }
      }
      
      return true
    })
    
    setFilteredData(filtered)
  }

  const handleCreateScenario = (scenarioCombinations) => {
    // Create multiple scenarios from combinations
    const newScenarios = []
    
    console.log('Creating scenarios from combinations:', scenarioCombinations.length)
    console.log('Filtered data rows:', filteredData.length)
    console.log('Product name lookup size:', productNameLookup?.size)
    
    scenarioCombinations.forEach((change, comboIndex) => {
      // Create a new scenario based on filtered data and this change combination
      // Use attribute lookup for fast matching
      const newScenario = filteredData.map(row => {
        // Create a copy to preserve all original columns
        const newRow = {}
        // Copy all original columns first
        Object.keys(row).forEach(key => {
          newRow[key] = row[key]
        })
        
        // Check if this row matches the change criteria
        let matches = true
        
        // Check CSV column filters first (direct column matching)
        if (change.csvFilters && Object.keys(change.csvFilters).length > 0) {
          for (const column of Object.keys(change.csvFilters)) {
            if (change.csvFilters[column].length > 0) {
              const rowValue = row[column]
              if (!change.csvFilters[column].includes(rowValue)) {
                matches = false
                break
              }
            }
          }
        }
        
        // Then check product master filters (if CSV filters passed or not set)
        if (matches && change.filters && Object.keys(change.filters).length > 0) {
          // Match by Product Name (not Product Variant Id)
          const productName = row['Product Name']
          const productData = productNameLookup?.get(productName)
          
          if (productData && productData.attributes) {
            // Check all filters in the change
            const attributes = productData.attributes
            for (const driver of Object.keys(change.filters)) {
              if (change.filters[driver].length > 0) {
                const attributeValue = attributes[driver]
                if (!attributeValue || !change.filters[driver].includes(attributeValue)) {
                  matches = false
                  break
                }
              }
            }
          } else {
            // Product not found in master, don't match
            matches = false
          }
        }
        
        // If no filters at all, match all rows
        if (!change.csvFilters && !change.filters) {
          matches = true
        } else if (change.csvFilters && Object.keys(change.csvFilters).length === 0 && 
                   change.filters && Object.keys(change.filters).length === 0) {
          matches = true
        }
        
        if (matches) {
          // Apply changes - ensure column names match exactly
          // Check for price change
          if (change.priceChange !== undefined && change.priceChange !== null && change.priceChange !== '' && !isNaN(change.priceChange)) {
            const currentPrice = parseFloat(row['Current Price']) || 0
            const changeValue = parseFloat(change.priceChange)
            const changeType = change.priceChangeType || 'Absolute'
            
            let newPrice
            let priceChangeValue = changeValue
            
            if (changeType === 'Target') {
              // Target price: the change value IS the target price
              newPrice = changeValue
              priceChangeValue = changeValue - currentPrice // Calculate the difference
            } else if (changeType === 'Percentage') {
              newPrice = currentPrice * (1 + changeValue / 100)
            } else {
              // Absolute amount
              newPrice = currentPrice + changeValue
            }
            
            // Use exact column names from CSV (matching the original format)
            newRow['Price Change'] = priceChangeValue
            newRow['Price Change Type'] = getChangeTypeString(priceChangeValue, changeType, true, changeType === 'Target')
            newRow['Current Price'] = newPrice.toFixed(2)
          }
          
          // Check for availability change
          if (change.availabilityChange !== undefined && change.availabilityChange !== null && change.availabilityChange !== '' && !isNaN(change.availabilityChange)) {
            const currentAvailability = parseFloat(row['Current Availability']) || 0
            const changeValue = parseFloat(change.availabilityChange)
            const changeType = change.availabilityChangeType || 'Absolute'
            
            let newAvailability
            if (changeType === 'Percentage') {
              newAvailability = currentAvailability * (1 + changeValue / 100)
            } else {
              newAvailability = currentAvailability + changeValue
            }
            
            // Use exact column names from CSV (matching the original format)
            newRow['Availability Change'] = changeValue
            newRow['Availability Change Type'] = getChangeTypeString(changeValue, changeType, false)
            newRow['Current Availability'] = Math.max(0, Math.min(100, newAvailability)).toFixed(2)
          }
          
          // Check for cost change
          if (change.costChange !== undefined && change.costChange !== null && change.costChange !== '' && !isNaN(change.costChange)) {
            const currentCost = parseFloat(row['Current Cost']) || 0
            const changeValue = parseFloat(change.costChange)
            const changeType = change.costChangeType || 'Absolute'
            
            let newCost
            if (changeType === 'Percentage') {
              newCost = currentCost * (1 + changeValue / 100)
            } else {
              newCost = currentCost + changeValue
            }
            
            // Use exact column names from CSV (matching the original format)
            newRow['Cost Change'] = changeValue
            newRow['Cost Change Type'] = getChangeTypeString(changeValue, changeType, false)
            newRow['Current Cost'] = newCost.toFixed(2)
          }
        }
        
        return newRow
      })
      
      // Count how many rows were actually modified
      const modifiedRows = newScenario.filter(row => {
        return (row['Price Change'] !== '' && row['Price Change'] !== undefined) ||
               (row['Availability Change'] !== '' && row['Availability Change'] !== undefined) ||
               (row['Cost Change'] !== '' && row['Cost Change'] !== undefined)
      }).length
      
      console.log(`Scenario ${comboIndex + 1}: Modified ${modifiedRows} rows out of ${newScenario.length}`)
      
      // Generate scenario name with change values
      const changeParts = []
      if (change.priceChange !== undefined && change.priceChange !== null && change.priceChange !== '' && !isNaN(change.priceChange)) {
        changeParts.push(`P${change.priceChange}${change.priceChangeType === 'Percentage' ? '%' : ''}`)
      }
      if (change.availabilityChange !== undefined && change.availabilityChange !== null && change.availabilityChange !== '' && !isNaN(change.availabilityChange)) {
        changeParts.push(`A${change.availabilityChange}${change.availabilityChangeType === 'Percentage' ? '%' : ''}`)
      }
      if (change.costChange !== undefined && change.costChange !== null && change.costChange !== '' && !isNaN(change.costChange)) {
        changeParts.push(`C${change.costChange}${change.costChangeType === 'Percentage' ? '%' : ''}`)
      }
      
      const scenarioName = `Scenario_${scenarios.length + newScenarios.length + 1}_${changeParts.join('_')}_${new Date().toISOString().split('T')[0]}`
      
      // Save to Supabase (async, don't block)
      saveScenario({
        name: scenarioName,
        data: newScenario,
        metadata: {
          changeParts,
          modifiedRows,
          totalRows: newScenario.length
        }
      }).then(({ data: savedData, error }) => {
        if (error) {
          console.error('Error saving scenario to Supabase:', error)
        } else {
          console.log('Scenario saved to Supabase:', savedData?.id)
        }
      })
      
      // Add to local state immediately
      newScenarios.push({ name: scenarioName, data: newScenario })
    })
    
    setScenarios([...scenarios, ...newScenarios])
    setShowChangeDialog(false)
    
    if (newScenarios.length > 1) {
      alert(`Created ${newScenarios.length} scenarios!`)
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Scenario Creation Agent</h1>
        <p>Upload a gzip archive with base scenario CSV and product master JSON</p>
      </header>

      <div className="app-content">
        {!baseScenario || !productMaster ? (
          <DualFileUpload
            onCsvUpload={handleCsvUpload}
            onJsonUpload={handleJsonUpload}
            csvFile={csvFile}
            jsonFile={jsonFile}
          />
        ) : (
          <>
            <div className="main-panel">
              <FilterPanel
                valueDrivers={valueDrivers}
                filters={filters}
                onFilterChange={handleFilterChange}
                productMaster={productMaster}
              />
              
              <div className="actions-panel">
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowChangeDialog(true)}
                >
                  Create New Scenario
                </button>
                <button 
                  className="btn btn-primary btn-ai"
                  onClick={() => setShowLLMPrompt(true)}
                >
                  🤖 AI Scenario Creator
                </button>
                <div className="data-info">
                  <p>Filtered rows: {filteredData.length}</p>
                  <p>Total rows: {baseScenario.length}</p>
                </div>
              </div>
            </div>

            {showChangeDialog && (
              <ChangeDialog
                filters={filters}
                valueDrivers={valueDrivers}
                productMaster={productMaster}
                onClose={() => setShowChangeDialog(false)}
                onCreate={handleCreateScenario}
              />
            )}

            {showLLMPrompt && (
              <LLMPrompt
                valueDrivers={valueDrivers}
                productMaster={productMaster}
                csvColumns={csvColumns}
                csvColumnValues={csvColumnValues}
                onApplyChanges={handleCreateScenario}
                onClose={() => setShowLLMPrompt(false)}
              />
            )}

            <ScenarioList scenarios={scenarios} />
          </>
        )}
      </div>
    </div>
  )
}

export default App
