import { useRef, useState } from 'react'
import { Upload } from 'lucide-react'
import './FileUpload.css'

function FileUpload({ onUpload }) {
  const fileInputRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)

  const handleFileSelect = async (file) => {
    if (!file) return
    
    setUploading(true)
    try {
      await onUpload(file)
    } catch (error) {
      alert('Error uploading file: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  return (
    <div className="file-upload-container">
      <div
        className={`file-upload-area ${isDragging ? 'dragging' : ''} ${uploading ? 'uploading' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload size={48} className="upload-icon" />
        <h2>Upload Archive File</h2>
        <p>Drag and drop a zip archive containing:</p>
        <ul>
          <li>Base scenario CSV file</li>
          <li>Product master JSON file</li>
        </ul>
        <p className="or-text">or click to browse</p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".zip,.gz"
          onChange={(e) => handleFileSelect(e.target.files[0])}
          style={{ display: 'none' }}
        />
        {uploading && <div className="upload-spinner">Processing...</div>}
      </div>
    </div>
  )
}

export default FileUpload
