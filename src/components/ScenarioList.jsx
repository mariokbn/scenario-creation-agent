import { Download, FileText, DownloadCloud } from 'lucide-react'
import Papa from 'papaparse'
import JSZip from 'jszip'
import './ScenarioList.css'

function ScenarioList({ scenarios }) {
  const downloadScenario = (scenario) => {
    // Convert data to CSV format - MUST use semicolon delimiter
    // Using comma would break with European number formats (e.g., 1,234.56)
    const csv = Papa.unparse(scenario.data, {
      delimiter: ';',
      header: true,
      quotes: false,
      escapeChar: '"',
      newline: '\n'
    })
    
    // Create blob and download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `${scenario.name}.csv`)
    link.style.visibility = 'hidden'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    URL.revokeObjectURL(url)
  }

  const downloadAllScenarios = async () => {
    if (scenarios.length === 0) {
      alert('No scenarios to download')
      return
    }

    try {
      const zip = new JSZip()
      
      // Add each scenario as a CSV file to the zip - MUST use semicolon delimiter
      scenarios.forEach((scenario) => {
        const csv = Papa.unparse(scenario.data, {
          delimiter: ';',
          header: true,
          quotes: false,
          escapeChar: '"',
          newline: '\n'
        })
        
        // Add CSV file to zip with scenario name as filename
        zip.file(`${scenario.name}.csv`, csv)
      })
      
      // Generate zip file
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      
      // Create download link
      const link = document.createElement('a')
      const url = URL.createObjectURL(zipBlob)
      
      const timestamp = new Date().toISOString().split('T')[0]
      link.setAttribute('href', url)
      link.setAttribute('download', `scenarios_${timestamp}.zip`)
      link.style.visibility = 'hidden'
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error creating zip file:', error)
      alert('Error creating zip file: ' + error.message)
    }
  }

  if (scenarios.length === 0) {
    return null
  }

  return (
    <div className="scenario-list">
      <div className="scenario-list-header">
        <h2>Created Scenarios</h2>
        <button
          className="download-all-btn"
          onClick={downloadAllScenarios}
          disabled={scenarios.length === 0}
        >
          <DownloadCloud size={20} />
          Download All as ZIP
        </button>
      </div>
      <div className="scenario-grid">
        {scenarios.map((scenario, index) => (
          <div key={index} className="scenario-card">
            <div className="scenario-card-header">
              <FileText size={24} className="scenario-icon" />
              <div className="scenario-info">
                <h3>{scenario.name}</h3>
                <p>{scenario.data.length} rows</p>
              </div>
            </div>
            <button
              className="download-btn"
              onClick={() => downloadScenario(scenario)}
            >
              <Download size={18} />
              Download CSV
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ScenarioList
