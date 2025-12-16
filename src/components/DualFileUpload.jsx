import { useRef, useState } from 'react'
import { Upload, FileText, Database } from 'lucide-react'
import './DualFileUpload.css'

function DualFileUpload({ onCsvUpload, onJsonUpload, csvFile, jsonFile }) {
  const csvInputRef = useRef(null)
  const jsonInputRef = useRef(null)
  const [csvDragging, setCsvDragging] = useState(false)
  const [jsonDragging, setJsonDragging] = useState(false)
  const [csvUploading, setCsvUploading] = useState(false)
  const [jsonUploading, setJsonUploading] = useState(false)

  const handleCsvSelect = async (file) => {
    if (!file) return
    
    setCsvUploading(true)
    try {
      await onCsvUpload(file)
    } catch (error) {
      alert('Error uploading CSV file: ' + error.message)
    } finally {
      setCsvUploading(false)
    }
  }

  const handleJsonSelect = async (file) => {
    if (!file) return
    
    setJsonUploading(true)
    try {
      await onJsonUpload(file)
    } catch (error) {
      alert('Error uploading JSON file: ' + error.message)
    } finally {
      setJsonUploading(false)
    }
  }

  const handleCsvDrop = (e) => {
    e.preventDefault()
    setCsvDragging(false)
    
    const file = e.dataTransfer.files[0]
    if (file) {
      handleCsvSelect(file)
    }
  }

  const handleJsonDrop = (e) => {
    e.preventDefault()
    setJsonDragging(false)
    
    const file = e.dataTransfer.files[0]
    if (file) {
      handleJsonSelect(file)
    }
  }

  return (
    <div className="dual-upload-container">
      <div className="upload-grid">
        <div
          className={`upload-area ${csvDragging ? 'dragging' : ''} ${csvUploading ? 'uploading' : ''} ${csvFile ? 'uploaded' : ''}`}
          onDrop={handleCsvDrop}
          onDragOver={(e) => { e.preventDefault(); setCsvDragging(true) }}
          onDragLeave={(e) => { e.preventDefault(); setCsvDragging(false) }}
          onClick={() => csvInputRef.current?.click()}
        >
          <FileText size={48} className="upload-icon" />
          <h2>Base Scenario CSV</h2>
          <p>Upload your base scenario CSV file</p>
          <p className="file-hint">(can be gzipped: .csv.gz)</p>
          {csvFile && (
            <div className="file-info">
              <span className="file-name">✓ {csvFile.name}</span>
            </div>
          )}
          {!csvFile && (
            <p className="or-text">Drag & drop or click to browse</p>
          )}
          <input
            ref={csvInputRef}
            type="file"
            accept=".csv,.csv.gz,.gz"
            onChange={(e) => handleCsvSelect(e.target.files[0])}
            style={{ display: 'none' }}
          />
          {csvUploading && <div className="upload-spinner">Processing...</div>}
        </div>

        <div
          className={`upload-area ${jsonDragging ? 'dragging' : ''} ${jsonUploading ? 'uploading' : ''} ${jsonFile ? 'uploaded' : ''}`}
          onDrop={handleJsonDrop}
          onDragOver={(e) => { e.preventDefault(); setJsonDragging(true) }}
          onDragLeave={(e) => { e.preventDefault(); setJsonDragging(false) }}
          onClick={() => jsonInputRef.current?.click()}
        >
          <Database size={48} className="upload-icon" />
          <h2>Product Master JSON</h2>
          <p>Upload your product master JSON file</p>
          <p className="file-hint">(.json)</p>
          {jsonFile && (
            <div className="file-info">
              <span className="file-name">✓ {jsonFile.name}</span>
            </div>
          )}
          {!jsonFile && (
            <p className="or-text">Drag & drop or click to browse</p>
          )}
          <input
            ref={jsonInputRef}
            type="file"
            accept=".json"
            onChange={(e) => handleJsonSelect(e.target.files[0])}
            style={{ display: 'none' }}
          />
          {jsonUploading && <div className="upload-spinner">Processing...</div>}
        </div>
      </div>
    </div>
  )
}

export default DualFileUpload
