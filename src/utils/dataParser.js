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
        
        csvData = Papa.parse(content, {
          header: true,
          skipEmptyLines: true,
          delimiter: ';'
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
  
  const csvData = Papa.parse(content, {
    header: true,
    skipEmptyLines: true,
    delimiter: ';'
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
      
      csvData = Papa.parse(content, {
        header: true,
        skipEmptyLines: true,
        delimiter: ';'
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
    if (product.attributes && Array.isArray(product.attributes)) {
      product.attributes.forEach(attr => {
        const driverId = attr.valueDriverReferenceId
        if (driverId) {
          if (!drivers[driverId]) {
            drivers[driverId] = new Set()
          }
          drivers[driverId].add(attr.referenceId)
        }
      })
    }
  })
  
  // Convert Sets to Arrays and sort
  const result = {}
  Object.keys(drivers).forEach(key => {
    result[key] = Array.from(drivers[key]).sort()
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
