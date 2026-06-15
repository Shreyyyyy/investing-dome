# 🇮🇳 ETF & Mutual Fund AI Planner (India)

An intelligent, minimal, and fully-featured financial planning and analysis dashboard customized specifically for Indian markets. This tool fetches key fund metrics (like expense ratios, assets, and beta volatility) in Indian Rupees (₹) alongside live web/news data from free search APIs, and passes them to a customizable Large Language Model (local Ollama, free-tier Groq, or OpenAI) to generate expert comparison sheets, tax pointers, and clear investment recommendations.

**100% Free Option Enabled**: Works fully offline/locally using **Ollama**, or in the cloud for free using **Groq** and **DuckDuckGo Search**.

---

## ✨ Features

- **📊 Comprehensive Indian Fund Metrics**: Leverages `yfinance` to automatically pull structural details (Expense Ratios, Dividend Yields, Assets Under Management, and Volatility Beta scores) for any NSE-listed ETF (e.g., `NIFTYBEES.NS`, `JUNIORBEES.NS`, `MON100.NS`) or Mutual Fund name.
- **🔍 100% Free Web & News Search**: Uses DuckDuckGo search queries to scour Indian financial news outlets and global market publications for both current headlines and previous news. Optional **Tavily** integration is supported as well.
- **🤖 Highly Customizable LLM Brain**:
  - **Ollama**: Connects to your local machine (e.g. `llama3`, `mistral`, `gemma2`) for private, offline, and free intelligence.
  - **Groq API**: Offers insanely fast speeds using highly capable models (like `llama-3.3-70b-versatile`, `mixtral`) completely free (under their standard rate-limits).
  - **OpenAI**: Easily drop in standard API keys to use `gpt-4o` or `gpt-4o-mini`.
  - **Custom API Endpoint**: Compatible with any OpenAI-style gateway (such as OpenRouter, LM Studio, or local servers).
- **💡 One-Click Presets**: Preloaded with core Indian market comparisons (Nifty 50 Core, US Tech Index exposure from India, and Liquid Cash/Gold hedges).
- **💼 Taxation & Risk Breakdown**: Outlines simple risk categories (High Risk, Low Risk, Balanced) alongside Indian mutual fund taxation summaries (STCG, LTCG).
- **📥 Audit Trails & Downloads**: View raw scraped search articles and raw factsheets used by the LLM, and download the finished report as a Markdown document.

---

## 🛠️ Installation & Setup

### 1. Prerequisites
Ensure you have Python 3.8+ installed. You can verify this by running:
```bash
python3 --version
```

### 2. Setup Project Folder & Install Dependencies
Run the following commands to install the dependencies:
```bash
# Install the required libraries
pip3 install -r requirements.txt
```

### 3. (Optional) Run Local LLM using Ollama
To use local LLMs:
1. Download and install **Ollama** from [ollama.com](https://ollama.com).
2. Start the Ollama application.
3. Open a terminal and download your preferred model, e.g.:
   ```bash
   ollama pull llama3
   ```
4. Keep Ollama running. It will be automatically detected by the app!

### 4. (Optional) Get a Free Groq API Key
If you prefer a cloud model with zero setup and lightning-fast speeds:
1. Go to [console.groq.com](https://console.groq.com) and sign up.
2. Generate an API Key under **API Keys**.
3. Paste it directly in the app's sidebar when running, or set it as an environment variable:
   ```bash
   export GROQ_API_KEY="your-groq-key"
   ```

---

## 🚀 Running the App

Start the Streamlit dashboard by running:
```bash
streamlit run app.py
```

Streamlit will spin up a local development server and automatically open the application in your web browser (usually at `http://localhost:8501`).

---

## 📁 Project Structure

```
.
├── app.py              # Main Streamlit UI and layout
├── fund_analyzer.py    # Coordination logic, yfinance loader, prompt builder
├── llm_utils.py        # Connectors for Groq, Ollama, OpenAI, and custom endpoints
├── search_utils.py     # Integrates DuckDuckGo and Tavily search
└── requirements.txt    # Package dependencies
```

---

## ⚠️ Financial Disclaimer

*This application is strictly for educational, informational, and research purposes. It does not constitute formal financial, tax, or investment advice. Do not buy or sell securities based solely on AI-generated responses. Always perform your own due diligence or consult with a Certified Financial Planner (CFP) before making real financial investments.*
# investing-dome
