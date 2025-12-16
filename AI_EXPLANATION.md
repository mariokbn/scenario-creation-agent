# 🤖 AI Scenario Creator - How It Works

## Overview

The AI Scenario Creator uses **OpenAI's GPT-4o-mini** API to interpret natural language prompts and automatically configure scenario creation parameters.

## How It Currently Works

### 1. **API Connection**
- Uses OpenAI GPT-4o-mini model
- Requires `VITE_OPENAI_API_KEY` environment variable
- Falls back to heuristic parsing if no API key is provided

### 2. **What the AI Understands**

The AI is trained on two types of filters:

#### **A. CSV Column Filters** (Direct column matching)
- **Is Competitor**: "competitor" → filters rows where `Is Competitor = "Yes"`
- **Region**: "North region" → filters rows where `Region = "North"`
- **Retailer**: "Retailer 1" → filters rows where `Retailer = "Retailer 1"`
- **Subsegment**: "Ice Tea" → filters rows where `Subsegment = "Ice Tea"`
- **Product Name**: Direct product name matching
- And any other CSV columns

#### **B. Value Driver Filters** (From Product Master JSON)
- **Brand**: "competitor_01" products
- **Format**: "1.00l" products
- **Material**: "pet" products
- **Pack Size**: "6" pack products
- And other value drivers from product master

### 3. **Change Types Supported**

- **Price Changes**:
  - Absolute: "+5.00" or "-2.50"
  - Percentage: "+10%" or "-5%"
  - Target Price: "set price to 4.99"
  - Ranges: "increase price from 5% to 15%"

- **Availability Changes**:
  - Absolute: "+5" or "-10"
  - Percentage: "+10%" or "-5%"
  - Ranges: "increase availability from 5 to 15"

- **Cost Changes**:
  - Absolute: "+0.50" or "-0.25"
  - Percentage: "+10%" or "-5%"
  - Ranges: "increase cost from 0.50 to 1.00"

## Example Prompts

### CSV Column Filters

✅ **"Increase price by 10% for all competitor products"**
- Interprets: `csvFilters: {"Is Competitor": ["Yes"]}`
- Applies: Price change +10%

✅ **"Decrease availability by 5 for our own products in North region"**
- Interprets: 
  - `csvFilters: {"Is Competitor": ["No"], "Region": ["North"]}`
- Applies: Availability change -5

✅ **"Increase price by 5% for Retailer 1 products"**
- Interprets: `csvFilters: {"Retailer": ["Retailer 1"]}`
- Applies: Price change +5%

✅ **"Set target price to 4.99 for competitor products in Central region"**
- Interprets:
  - `csvFilters: {"Is Competitor": ["Yes"], "Region": ["Central"]}`
- Applies: Target price 4.99

### Value Driver Filters

✅ **"Increase price by 10% for all 1.00l format products"**
- Interprets: `filters: {"format": ["format_1.00l"]}`
- Applies: Price change +10%

✅ **"Decrease availability for competitor_01 brand products"**
- Interprets: `filters: {"brand": ["brand_competitor_01"]}`
- Applies: Availability decrease

### Combined Filters

✅ **"Increase price by 15% for competitor products with format 1.00l"**
- Interprets:
  - `csvFilters: {"Is Competitor": ["Yes"]}`
  - `filters: {"format": ["format_1.00l"]}`
- Applies: Price change +15%

## How It Works Technically

### 1. **Prompt Processing**
```
User Input: "Increase price by 10% for competitor products"
    ↓
LLM API Call (GPT-4o-mini)
    ↓
JSON Response: {
  "csvFilters": {"Is Competitor": ["Yes"]},
  "priceChange": 10,
  "priceChangeType": "Percentage"
}
    ↓
Scenario Creation
```

### 2. **Matching Logic**

The system matches rows using a two-step process:

1. **CSV Column Filters** (checked first)
   - Direct column value matching
   - Example: `row["Is Competitor"] === "Yes"`

2. **Value Driver Filters** (checked second)
   - Product name lookup → Product master → Attributes
   - Example: Product name → brand attribute → check if matches

### 3. **Change Application**

Once rows are matched:
- Changes are applied to matching rows only
- Non-matching rows keep original values
- New scenario CSV is generated with all columns preserved

## Training the AI

The AI is automatically trained on:

1. **CSV Column Structure**: All column names and sample values
2. **Value Drivers**: All value drivers from product master JSON
3. **Change Patterns**: Recognizes common phrases like:
   - "competitor" → `Is Competitor = "Yes"`
   - "own products" → `Is Competitor = "No"`
   - "North region" → `Region = "North"`
   - "increase by X%" → Percentage change
   - "set to X" → Target price

## Fallback Mode

If no OpenAI API key is provided:
- Uses heuristic pattern matching
- Recognizes basic patterns (competitor, region, percentages)
- Less accurate but still functional

## Improving Accuracy

To improve AI understanding:

1. **Be Specific**: 
   - ✅ "Increase price by 10% for competitor products"
   - ❌ "Change prices"

2. **Use Column Names**:
   - ✅ "Is Competitor = Yes"
   - ✅ "Region = North"

3. **Combine Filters**:
   - ✅ "Competitor products in North region"
   - ✅ "Retailer 1 products with format 1.00l"

## Current Limitations

- Requires OpenAI API key for best results
- Heuristic fallback is less accurate
- Complex nested conditions may need manual refinement

## Future Enhancements

- Fine-tune model on your specific data
- Add more column understanding
- Support for complex boolean logic
- Multi-language support
