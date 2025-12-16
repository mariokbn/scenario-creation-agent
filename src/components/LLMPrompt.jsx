import { useState } from 'react'
import { Sparkles, X, Loader } from 'lucide-react'
import './LLMPrompt.css'

function LLMPrompt({ valueDrivers, productMaster, csvColumns, csvColumnValues, onApplyChanges, onClose }) {
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Call LLM API to interpret the prompt
      const changes = await interpretPrompt(prompt, valueDrivers, productMaster, csvColumns, csvColumnValues)
      
      if (changes && changes.length > 0) {
        // Pass changes to populate the dialog instead of directly creating scenarios
        onApplyChanges(changes)
        onClose()
      } else {
        setError('Could not interpret the prompt. Please try rephrasing your request.')
      }
    } catch (err) {
      console.error('LLM error:', err)
      setError(err.message || 'Failed to process prompt. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const interpretPrompt = async (userPrompt, valueDrivers, productMaster, csvColumns, csvColumnValues) => {
    // Extract available value drivers and their options for context
    const valueDriverContext = Object.keys(valueDrivers)
      .filter(driver => driver != null && typeof driver === 'string')
      .map(driver => ({
        name: driver,
        displayName: driver.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        options: (valueDrivers[driver] || []).filter(v => v != null).slice(0, 10) // Limit to first 10 for context
      }))

    // Extract CSV column information
    const csvColumnContext = csvColumns ? csvColumns.map(col => ({
      name: col,
      displayName: col,
      sampleValues: csvColumnValues && csvColumnValues[col] ? csvColumnValues[col].slice(0, 10) : []
    })) : []

    // Create a system prompt that helps the LLM understand the structure
    const systemPrompt = `You are a scenario creation assistant. Your task is to interpret user requests and convert them into structured scenario change parameters.

Available CSV columns (for direct filtering):
${JSON.stringify(csvColumnContext, null, 2)}

Available value drivers (from product master, for product-level filtering):
${JSON.stringify(valueDriverContext, null, 2)}

You need to return a JSON array of change objects. Each change object should have this structure:
{
  "filters": {
    "valueDriverReferenceId": ["option1", "option2"]
  },
  "csvFilters": {
    "Column Name": ["value1", "value2"]
  },
  "priceChange": number or null,
  "priceChangeType": "Absolute" | "Percentage" | "Target",
  "priceChangeRange": boolean,
  "priceChangeFrom": number or null,
  "priceChangeTo": number or null,
  "priceChangeStep": number or "1",
  "availabilityChange": number or null,
  "availabilityChangeType": "Absolute" | "Percentage",
  "availabilityChangeRange": boolean,
  "availabilityChangeFrom": number or null,
  "availabilityChangeTo": number or null,
  "availabilityChangeStep": number or "1",
  "costChange": number or null,
  "costChangeType": "Absolute" | "Percentage",
  "costChangeRange": boolean,
  "costChangeFrom": number or null,
  "costChangeTo": number or null,
  "costChangeStep": number or "1"
}

Rules:
- If user mentions a range (e.g., "5% to 15%"), set the Range fields and leave the single value null
- If user mentions a single value, set the single value field and set Range to false
- For filters, you can use TWO types:
  1. "filters" - for product master value drivers (brand, format, material, etc.)
  2. "csvFilters" - for CSV column filters (Is Competitor, Region, Retailer, etc.)
- CSV column examples:
  - "competitor" or "competitors" → csvFilters: {"Is Competitor": ["Yes"]}
  - "own products" or "our products" → csvFilters: {"Is Competitor": ["No"]}
  - "North region" → csvFilters: {"Region": ["North"]}
  - "Retailer 1" → csvFilters: {"Retailer": ["Retailer 1"]}
- Use "Absolute" for fixed amounts, "Percentage" for percentages
- For price, use "Target" if user specifies a target price
- Return only valid JSON, no markdown or explanations`

    // For now, we'll use a local LLM simulation or OpenAI API
    // You'll need to add your API key in environment variables
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY
    
    if (!apiKey) {
      // Fallback: Try to parse the prompt using simple heuristics
      return parsePromptHeuristically(userPrompt, valueDrivers, csvColumns, csvColumnValues)
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.3,
          response_format: { type: 'json_object' }
        })
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`)
      }

      const data = await response.json()
      const content = data.choices[0].message.content
      
      // Parse JSON response
      let parsed
      try {
        parsed = JSON.parse(content)
      } catch (parseError) {
        // Try to extract JSON from markdown code blocks
        const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/)
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[1])
        } else {
          throw new Error('Invalid JSON response from LLM')
        }
      }
      
      // Ensure it's an array
      if (Array.isArray(parsed)) {
        return parsed
      } else if (parsed.changes && Array.isArray(parsed.changes)) {
        return parsed.changes
      } else if (parsed.changes) {
        return [parsed.changes]
      } else if (typeof parsed === 'object') {
        // Single change object
        return [parsed]
      } else {
        throw new Error('Unexpected response format from LLM')
      }
    } catch (apiError) {
      console.error('OpenAI API error:', apiError)
      // Fallback to heuristic parsing
      return parsePromptHeuristically(userPrompt, valueDrivers)
    }
  }

  const parsePromptHeuristically = (prompt, valueDrivers, csvColumns, csvColumnValues) => {
    // Simple heuristic parser as fallback
    const lowerPrompt = prompt.toLowerCase()
    const changes = [{
      filters: {},
      csvFilters: {},
      priceChange: null,
      priceChangeType: 'Absolute',
      priceChangeRange: false,
      priceChangeFrom: null,
      priceChangeTo: null,
      priceChangeStep: '1',
      availabilityChange: null,
      availabilityChangeType: 'Absolute',
      availabilityChangeRange: false,
      availabilityChangeFrom: null,
      availabilityChangeTo: null,
      availabilityChangeStep: '1',
      costChange: null,
      costChangeType: 'Absolute',
      costChangeRange: false,
      costChangeFrom: null,
      costChangeTo: null,
      costChangeStep: '1'
    }]

    // Extract CSV column filters
    if (csvColumns) {
      // Check for competitor mentions
      if (lowerPrompt.includes('competitor') || lowerPrompt.includes('competitors')) {
        const competitorCol = csvColumns.find(col => col.toLowerCase().includes('competitor'))
        if (competitorCol) {
          changes[0].csvFilters[competitorCol] = ['Yes']
        }
      }
      
      if (lowerPrompt.includes('own product') || lowerPrompt.includes('our product') || lowerPrompt.includes('own brand')) {
        const competitorCol = csvColumns.find(col => col.toLowerCase().includes('competitor'))
        if (competitorCol) {
          changes[0].csvFilters[competitorCol] = ['No']
        }
      }

      // Check for region mentions
      csvColumns.forEach(col => {
        if (col.toLowerCase().includes('region')) {
          const regionValues = csvColumnValues && csvColumnValues[col] ? csvColumnValues[col] : []
          regionValues.forEach(val => {
            if (lowerPrompt.includes(val.toLowerCase())) {
              if (!changes[0].csvFilters[col]) {
                changes[0].csvFilters[col] = []
              }
              if (!changes[0].csvFilters[col].includes(val)) {
                changes[0].csvFilters[col].push(val)
              }
            }
          })
        }
      })

      // Check for retailer mentions
      csvColumns.forEach(col => {
        if (col.toLowerCase().includes('retailer')) {
          const retailerValues = csvColumnValues && csvColumnValues[col] ? csvColumnValues[col] : []
          retailerValues.forEach(val => {
            if (lowerPrompt.includes(val.toLowerCase())) {
              if (!changes[0].csvFilters[col]) {
                changes[0].csvFilters[col] = []
              }
              if (!changes[0].csvFilters[col].includes(val)) {
                changes[0].csvFilters[col].push(val)
              }
            }
          })
        }
      })
    }

    // Extract filters - try to match value driver names and their options
    Object.keys(valueDrivers).filter(driver => driver != null && typeof driver === 'string').forEach(driver => {
      const driverName = driver.toLowerCase().replace(/_/g, ' ')
      const driverWords = driverName.split(' ')
      
      // Check if prompt mentions this driver
      if (driverWords.some(word => lowerPrompt.includes(word)) || lowerPrompt.includes(driver)) {
        // Try to find matching options
        (valueDrivers[driver] || []).filter(option => option != null && typeof option === 'string').forEach(option => {
          const optionName = option.toLowerCase().replace(/_/g, ' ')
          const optionWords = optionName.split(' ')
          
          // Check if prompt mentions this option
          if (optionWords.some(word => lowerPrompt.includes(word)) || lowerPrompt.includes(option)) {
            if (!changes[0].filters[driver]) {
              changes[0].filters[driver] = []
            }
            if (!changes[0].filters[driver].includes(option)) {
              changes[0].filters[driver].push(option)
            }
          }
        })
      }
    })

    // Extract price changes
    const priceMatch = lowerPrompt.match(/(?:price|cost)\s*(?:increase|decrease|change|by|to)?\s*([+-]?\d+(?:\.\d+)?)\s*%?/i)
    if (priceMatch) {
      const value = parseFloat(priceMatch[1])
      if (lowerPrompt.includes('%') || lowerPrompt.includes('percent')) {
        changes[0].priceChangeType = 'Percentage'
        changes[0].priceChange = value
      } else {
        changes[0].priceChangeType = 'Absolute'
        changes[0].priceChange = value
      }
    }

    // Extract availability changes
    const availMatch = lowerPrompt.match(/(?:availability|stock)\s*(?:increase|decrease|change|by)?\s*([+-]?\d+(?:\.\d+)?)\s*%?/i)
    if (availMatch) {
      const value = parseFloat(availMatch[1])
      if (lowerPrompt.includes('%') || lowerPrompt.includes('percent')) {
        changes[0].availabilityChangeType = 'Percentage'
        changes[0].availabilityChange = value
      } else {
        changes[0].availabilityChangeType = 'Absolute'
        changes[0].availabilityChange = value
      }
    }

    // Extract cost changes
    const costMatch = lowerPrompt.match(/(?:cost|manufacturing cost)\s*(?:increase|decrease|change|by)?\s*([+-]?\d+(?:\.\d+)?)\s*%?/i)
    if (costMatch) {
      const value = parseFloat(costMatch[1])
      if (lowerPrompt.includes('%') || lowerPrompt.includes('percent')) {
        changes[0].costChangeType = 'Percentage'
        changes[0].costChange = value
      } else {
        changes[0].costChangeType = 'Absolute'
        changes[0].costChange = value
      }
    }

    // Extract ranges
    const rangeMatch = prompt.match(/(\d+(?:\.\d+)?)\s*(?:to|-|through)\s*(\d+(?:\.\d+)?)\s*%?/i)
    if (rangeMatch) {
      const from = parseFloat(rangeMatch[1])
      const to = parseFloat(rangeMatch[2])
      const isPercent = prompt.includes('%')
      
      if (lowerPrompt.includes('price')) {
        changes[0].priceChangeRange = true
        changes[0].priceChangeFrom = from
        changes[0].priceChangeTo = to
        changes[0].priceChangeType = isPercent ? 'Percentage' : 'Absolute'
        changes[0].priceChange = null
      } else if (lowerPrompt.includes('availability')) {
        changes[0].availabilityChangeRange = true
        changes[0].availabilityChangeFrom = from
        changes[0].availabilityChangeTo = to
        changes[0].availabilityChangeType = isPercent ? 'Percentage' : 'Absolute'
        changes[0].availabilityChange = null
      } else if (lowerPrompt.includes('cost')) {
        changes[0].costChangeRange = true
        changes[0].costChangeFrom = from
        changes[0].costChangeTo = to
        changes[0].costChangeType = isPercent ? 'Percentage' : 'Absolute'
        changes[0].costChange = null
      }
    }

    return changes
  }

  return (
    <div className="llm-prompt-overlay" onClick={onClose}>
      <div className="llm-prompt-content" onClick={(e) => e.stopPropagation()}>
        <div className="llm-prompt-header">
          <div className="llm-prompt-title">
            <Sparkles size={24} />
            <h2>AI Scenario Creator</h2>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="llm-prompt-body">
          <p className="llm-prompt-description">
            Describe your scenario changes in natural language. For example:
          </p>
          <ul className="llm-examples">
            <li>"Increase price by 10% for all competitor products"</li>
            <li>"Decrease availability by 5 for products with brand competitor_01"</li>
            <li>"Increase price from 5% to 15% for format 1.00l products"</li>
            <li>"Set target price to 4.99 for competitor products"</li>
          </ul>

          <div className="llm-input-group">
            <textarea
              className="llm-textarea"
              placeholder="E.g., Increase price by 10% for all ice tea products with format 1.00l..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={5}
              disabled={loading}
            />
            {error && (
              <div className="llm-error">
                {error}
              </div>
            )}
          </div>

          <div className="llm-prompt-footer">
            <button
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary llm-submit-btn"
              onClick={handleSubmit}
              disabled={loading || !prompt.trim()}
            >
              {loading ? (
                <>
                  <Loader size={18} className="spinning" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Create Scenarios
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LLMPrompt
