import Papa from 'papaparse'
import pako from 'pako'
import JSZip from 'jszip'

export async function parseArchive(file) {
  const arrayBuffer = await file.arrayBuffer()
  
  // Try as zip archive first (most common case)
  try {
    const zip = new JSZip()
    const zipData = await zip.loadAsync(arrayBuffer)
    
    let csvData = null
    let jsonData = null
    
    // Find CSV and JSON files in the archive
    for (const [filename, fileEntry] of Object.entries(zipData.files)) {
      // Skip directories
      if (fileEntry.dir) continue
      
      if (filename.endsWith('.csv') || filename.endsWith('.csv.gz') || filename.includes('.csv')) {
        let content
        if (filename.endsWith('.gz')) {
          const binary = await fileEntry.async('uint8array')
          content = pako.ungzip(binary, { to: 'string' })
        } else {
          content = await fileEntry.async('string')
        }
        
      // Parse CSV with semicolon delimiter (required for European number formats)
      csvData = Papa.parse(content, {
        header: true,
        skipEmptyLines: true,
        delimiter: ';',
        quoteChar: '"',
        escapeChar: '"'
      }).data
      } else if (filename.endsWith('.json')) {
        const content = await fileEntry.async('string')
        jsonData = JSON.parse(content)
      }
    }
    
    if (csvData && jsonData) {
      return { csvData, jsonData }
    }
    
    if (!csvData && !jsonData) {
      throw new Error('No CSV or JSON files found in archive')
    }
    
    if (!csvData) {
      throw new Error('CSV file not found in archive')
    }
    
    if (!jsonData) {
      throw new Error('JSON file not found in archive')
    }
  } catch (zipError) {
    // Not a zip file, try as single gzip file
    try {
      const decompressedData = pako.ungzip(new Uint8Array(arrayBuffer), { to: 'string' })
      // If it's a single gzip, we can't extract both CSV and JSON
      throw new Error('Please upload a zip archive containing both CSV and JSON files. If you have a gzipped CSV, please create a zip file with both the CSV (gzipped or not) and the JSON file.')
    } catch (gzipError) {
      throw new Error('File is neither a valid zip archive nor a gzip file. Please upload a zip archive containing both CSV and JSON files.')
    }
  }
}

// Parse individual CSV file (can be gzipped)
export async function parseCsvFile(file) {
  const arrayBuffer = await file.arrayBuffer()
  let content
  
  // Check if it's gzipped
  if (file.name.endsWith('.gz') || file.name.endsWith('.csv.gz')) {
    try {
      content = pako.ungzip(new Uint8Array(arrayBuffer), { to: 'string' })
    } catch (error) {
      throw new Error('Failed to decompress gzip file: ' + error.message)
    }
  } else {
    // Regular CSV file
    const decoder = new TextDecoder('utf-8')
    content = decoder.decode(arrayBuffer)
  }
  
  // Parse CSV with semicolon delimiter (required for European number formats)
  const csvData = Papa.parse(content, {
    header: true,
    skipEmptyLines: true,
    delimiter: ';',
    quoteChar: '"',
    escapeChar: '"'
  }).data
  
  return csvData
}

// Parse individual JSON file
export async function parseJsonFile(file) {
  const arrayBuffer = await file.arrayBuffer()
  const decoder = new TextDecoder('utf-8')
  const content = decoder.decode(arrayBuffer)
  
  try {
    const jsonData = JSON.parse(content)
    return jsonData
  } catch (error) {
    throw new Error('Failed to parse JSON file: ' + error.message)
  }
}

// Alternative parser for when files are uploaded separately or as a zip
export async function parseZipArchive(file) {
  const zip = new JSZip()
  const arrayBuffer = await file.arrayBuffer()
  const zipData = await zip.loadAsync(arrayBuffer)
  
  let csvData = null
  let jsonData = null
  
  for (const [filename, file] of Object.entries(zipData.files)) {
    if (filename.endsWith('.csv') || filename.endsWith('.csv.gz')) {
      let content
      if (filename.endsWith('.gz')) {
        const binary = await file.async('uint8array')
        content = pako.ungzip(binary, { to: 'string' })
      } else {
        content = await file.async('string')
      }
      
      // Parse CSV with semicolon delimiter (required for European number formats)
      csvData = Papa.parse(content, {
        header: true,
        skipEmptyLines: true,
        delimiter: ';',
        quoteChar: '"',
        escapeChar: '"'
      }).data
    } else if (filename.endsWith('.json')) {
      const content = await file.async('string')
      jsonData = JSON.parse(content)
    }
  }
  
  if (!csvData || !jsonData) {
    throw new Error('Archive must contain both CSV and JSON files')
  }
  
  return { csvData, jsonData }
}

export function extractValueDrivers(productMaster) {
  const drivers = {}
  
  if (!Array.isArray(productMaster)) {
    return drivers
  }
  
  productMaster.forEach(product => {
    // Extract from product-level attributes
    if (product && product.attributes && Array.isArray(product.attributes)) {
      product.attributes.forEach(attr => {
        if (attr && attr.valueDriverReferenceId && attr.referenceId) {
          const driverId = attr.valueDriverReferenceId
          const referenceId = attr.referenceId
          
          // Ensure both are strings
          if (typeof driverId === 'string' && typeof referenceId === 'string') {
            if (!drivers[driverId]) {
              drivers[driverId] = new Set()
            }
            drivers[driverId].add(referenceId)
          }
        }
      })
    }
    
    // Extract from variant-level attributes
    if (product && product.variants && Array.isArray(product.variants)) {
      product.variants.forEach(variant => {
        if (variant && variant.attributes && Array.isArray(variant.attributes)) {
          variant.attributes.forEach(attr => {
            if (attr && attr.valueDriverReferenceId && attr.referenceId) {
              const driverId = attr.valueDriverReferenceId
              const referenceId = attr.referenceId
              
              // Ensure both are strings
              if (typeof driverId === 'string' && typeof referenceId === 'string') {
                if (!drivers[driverId]) {
                  drivers[driverId] = new Set()
                }
                drivers[driverId].add(referenceId)
              }
            }
          })
        }
        
        // Extract from variant aggregations (e.g., pack_size in aggregations object)
        if (variant && variant.aggregations && typeof variant.aggregations === 'object') {
          Object.keys(variant.aggregations).forEach(driverId => {
            const value = variant.aggregations[driverId]
            
            // Only process if it's a valid value driver key and has a value
            if (driverId && value != null && value !== '') {
              const valueStr = String(value)
              
              if (typeof driverId === 'string') {
                if (!drivers[driverId]) {
                  drivers[driverId] = new Set()
                }
                
                // Check if the value already starts with the driverId (e.g., "pack_size_6")
                // If so, use it as-is; otherwise, format it as "driverId_value"
                let referenceId
                if (valueStr.startsWith(`${driverId}_`)) {
                  // Value already has the driver name prefix, use as-is
                  referenceId = valueStr
                } else {
                  // Value is just the raw value (e.g., "6"), format it
                  referenceId = `${driverId}_${valueStr}`
                }
                
                // Only add the formatted referenceId (don't add raw value separately)
                drivers[driverId].add(referenceId)
              }
            }
          })
        }
      })
    }
  })
  
  // Convert Sets to Arrays and sort, filtering out any null/undefined values
  const result = {}
  Object.keys(drivers).forEach(key => {
    if (key != null) {
      const values = Array.from(drivers[key]).filter(v => v != null && typeof v === 'string')
      if (values.length > 0) {
        result[key] = values.sort()
      }
    }
  })
  
  return result
}

// Create a lookup map for fast product matching
export function createProductLookup(productMaster) {
  const lookup = new Map()
  
  if (!Array.isArray(productMaster)) {
    return lookup
  }
  
  productMaster.forEach(product => {
    // Map product referenceId
    if (product.referenceId) {
      lookup.set(product.referenceId, product)
    }
    
    // Map variant referenceIds
    if (product.variants && Array.isArray(product.variants)) {
      product.variants.forEach(variant => {
        if (variant.referenceId) {
          lookup.set(variant.referenceId, product)
        }
      })
    }
  })
  
  return lookup
}

// Create attribute lookup for each product variant (by variant ID)
export function createAttributeLookup(productMaster) {
  const lookup = new Map()
  
  if (!Array.isArray(productMaster)) {
    return lookup
  }
  
  productMaster.forEach(product => {
    // Create attribute map for product
    const productAttributes = {}
    if (product.attributes && Array.isArray(product.attributes)) {
      product.attributes.forEach(attr => {
        productAttributes[attr.valueDriverReferenceId] = attr.referenceId
      })
    }
    
    // Map product referenceId
    if (product.referenceId) {
      lookup.set(product.referenceId, productAttributes)
    }
    
    // Map variant referenceIds (variants inherit product attributes)
    if (product.variants && Array.isArray(product.variants)) {
      product.variants.forEach(variant => {
        if (variant.referenceId) {
          // Merge variant-specific attributes if any
          const variantAttributes = { ...productAttributes }
          if (variant.attributes && Array.isArray(variant.attributes)) {
            variant.attributes.forEach(attr => {
              variantAttributes[attr.valueDriverReferenceId] = attr.referenceId
            })
          }
          
          // Include aggregations (e.g., pack_size from aggregations object)
          if (variant.aggregations && typeof variant.aggregations === 'object') {
            Object.keys(variant.aggregations).forEach(driverId => {
              const value = variant.aggregations[driverId]
              if (value != null && value !== '') {
                // Store both the formatted referenceId and the raw value for matching
                const formattedRefId = `${driverId}_${String(value)}`
                variantAttributes[driverId] = formattedRefId
                // Also store raw value with a different key for flexible matching
                variantAttributes[`${driverId}_raw`] = String(value)
              }
            })
          }
          
          lookup.set(variant.referenceId, variantAttributes)
        }
      })
    }
  })
  
  return lookup
}

// Create attribute lookup by Product Name (for matching CSV Product Name column)
export function createProductNameLookup(productMaster) {
  const lookup = new Map()
  
  if (!Array.isArray(productMaster)) {
    return lookup
  }
  
  productMaster.forEach(product => {
    // Create attribute map for product
    const productAttributes = {}
    if (product.attributes && Array.isArray(product.attributes)) {
      product.attributes.forEach(attr => {
        productAttributes[attr.valueDriverReferenceId] = attr.referenceId
      })
    }
    
    // Map by product name (from the 'name' field)
    if (product.name) {
      // Store both the attributes and the product itself for reference
      lookup.set(product.name, {
        attributes: productAttributes,
        product: product
      })
    }
  })
  
  return lookup
}
