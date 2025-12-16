# Scenario Creation Agent

A professional web application for creating product scenario variations with AI-powered assistance. Built with React, Vite, Supabase, and deployed on Vercel.

## 🚀 Features

- **Dual File Upload**: Upload CSV and JSON files separately
- **Value Driver Filters**: Filter products based on value drivers extracted from product master
- **Range-Based Scenarios**: Create multiple scenarios with range inputs (e.g., 5% to 15%)
- **AI-Powered Creation**: Natural language interface for scenario creation (OpenAI integration)
- **Cloud Storage**: Automatic saving to Supabase database
- **Export Options**: Download individual scenarios or all as ZIP
- **Professional UI**: Modern, responsive design with smooth animations

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

## 🏗️ Tech Stack

- **Frontend**: React 19, Vite
- **Styling**: CSS3 with modern gradients and animations
- **Database**: Supabase (PostgreSQL)
- **AI**: OpenAI GPT-4o-mini (optional)
- **Deployment**: Vercel
- **Icons**: Lucide React

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account (free tier works)
- OpenAI API key (optional, for AI features)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/scenario-creation-agent.git
cd scenario-creation-agent
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Fill in your `.env` file with:
   - Supabase URL and anon key
   - OpenAI API key (optional)

5. Set up Supabase:
   - Create a new Supabase project
   - Run the SQL script from `supabase/schema.sql` in the SQL Editor

6. Start development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Production Build

```bash
npm run build
npm run preview
```

## 📦 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions to Vercel.

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
