# Scenario Creation Agent

A web application for creating product scenario variations based on a base scenario CSV and product master JSON file.

## Features

- **Upload Archive**: Upload a zip archive containing:
  - Base scenario CSV file (can be gzipped)
  - Product master JSON file
- **Value Driver Filters**: Filter products based on value drivers extracted from the product master
- **Scenario Creation**: Create new scenarios with multiple changes to:
  - Price (absolute or percentage)
  - Availability (absolute or percentage)
  - Costs (absolute or percentage)
- **Export**: Download created scenarios as CSV files

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Build

```bash
npm run build
```

## Usage

1. **Prepare your files**: Upload separately:
   - Your base scenario CSV file (semicolon-delimited, can be gzipped)
   - Your product master JSON file

2. **Upload**: Drag and drop or click to upload each file

3. **Filter**: Use the value driver filters to narrow down which products you want to modify

4. **Create Scenario**: You have two options:
   
   **Option A - Manual Creation**: Click "Create New Scenario" and define your changes:
   - Select product filters (optional)
   - Set price changes (amount and type: absolute, percentage, or target price)
   - Set availability changes (amount and type: absolute or percentage)
   - Set cost changes (amount and type: absolute or percentage)
   - Use ranges to create multiple scenarios (e.g., 5% to 15% with step 1)
   - Add multiple changes if needed
   
   **Option B - AI-Powered Creation**: Click "🤖 AI Scenario Creator" and describe your changes in natural language:
   - Example: "Increase price by 10% for all competitor products"
   - Example: "Decrease availability by 5 for products with brand competitor_01"
   - Example: "Increase price from 5% to 15% for format 1.00l products"
   - The AI will automatically interpret your request and set the parameters

5. **Download**: Download individual scenarios or use "Download All as ZIP" to get all scenarios in one file

## AI Features (Optional)

To use the AI Scenario Creator, you need to set up an OpenAI API key:

1. Get an API key from https://platform.openai.com/api-keys
2. Create a `.env` file in the project root:
   ```
   VITE_OPENAI_API_KEY=your_api_key_here
   ```
3. Restart the development server

**Note**: If no API key is provided, the AI feature will use a simple heuristic parser as a fallback.

## File Format

### Base Scenario CSV
- Semicolon-delimited (`;`)
- Must include columns: `Product Variant Id`, `Current Price`, `Current Availability`, `Current Cost`
- Can include additional columns that will be preserved in output scenarios

### Product Master JSON
- Array of product objects
- Each product should have:
  - `attributes`: Array of attribute objects with `valueDriverReferenceId` and `referenceId`
  - `variants`: Array of variant objects (optional)

## Example Archive Structure

```
archive.zip
├── price-changes.csv (or price-changes.csv.gz)
└── products.json
```
