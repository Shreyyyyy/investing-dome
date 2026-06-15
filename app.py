import streamlit as st
import os
import pandas as pd
import yfinance as yf
from datetime import datetime
from fund_analyzer import analyze_funds, get_fund_ticker_data
from llm_utils import get_ollama_models, test_ollama_connection

@st.cache_data(show_spinner="Fetching historical performance chart...")
def get_historical_chart_data(symbol: str) -> pd.DataFrame:
    """
    Fetches the last 10 years of historical closing prices from Yahoo Finance.
    """
    try:
        ticker = yf.Ticker(symbol.strip().upper())
        hist = ticker.history(period="10y")
        if hist.empty:
            return None
        df = hist[['Close']].copy()
        df = df.reset_index()
        # Ensure timezone-naive dates
        df['Date'] = pd.to_datetime(df['Date']).dt.tz_localize(None)
        return df
    except Exception:
        return None

# Page configuration
st.set_page_config(
    page_title="ETF & Mutual Fund Intelligent Finder",
    page_icon="📈",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for modern styling
st.markdown("""
<style>
    .report-container {
        background-color: #f8f9fa;
        padding: 20px;
        border-radius: 10px;
        border: 1px solid #e9ecef;
    }
    .metric-card {
        background-color: #ffffff;
        padding: 15px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.05);
        border-top: 4px solid #1f77b4;
        margin-bottom: 10px;
    }
    .footer {
        text-align: center;
        padding: 20px;
        color: #6c757d;
        font-size: 0.85em;
        margin-top: 40px;
        border-top: 1px solid #dee2e6;
    }
</style>
""", unsafe_allow_html=True)

# App Title
st.title("🇮🇳 ETF & Mutual Fund AI Planner (India)")
st.markdown(
    "Search, compare, and analyze Indian ETFs or Mutual Funds using real-time news, "
    "historical articles, and state-of-the-art LLMs. **Tailored for Indian markets with 100% free-tier & local model options.**"
)

# Sidebar Configuration
st.sidebar.header("🛠️ Configuration Panel")

# Section 1: LLM Settings
st.sidebar.subheader("🤖 LLM Settings")

llm_provider = st.sidebar.selectbox(
    "LLM Provider",
    ["Groq (Free Cloud)", "Ollama (Free Local)", "OpenAI (Cloud)", "Custom OpenAI Endpoint"],
    help="Select which Large Language Model to use. Groq provides high speed and a generous free tier. Ollama is 100% local."
)

llm_model = ""
llm_api_key = ""
custom_endpoint_url = ""

# Map display text to internal keys
provider_key = {
    "Groq (Free Cloud)": "groq",
    "Ollama (Free Local)": "ollama",
    "OpenAI (Cloud)": "openai",
    "Custom OpenAI Endpoint": "custom"
}[llm_provider]

if provider_key == "groq":
    # Groq setup
    default_groq_key = os.environ.get("GROQ_API_KEY", "")
    llm_api_key = st.sidebar.text_input(
        "Groq API Key", 
        type="password", 
        value=default_groq_key,
        help="Get a free API key at console.groq.com"
    )
    if not llm_api_key:
        st.sidebar.info("🔑 [Get a free Groq API key](https://console.groq.com/keys)")
        
    groq_model_choice = st.sidebar.selectbox(
        "Groq Model",
        [
            "llama-3.3-70b-versatile",
            "llama-3.1-8b-instant",
            "llama-3.1-70b-versatile",
            "mixtral-8x7b-32768",
            "Custom (Specify below)"
        ],
        index=0
    )
    if groq_model_choice == "Custom (Specify below)":
        llm_model = st.sidebar.text_input("Custom Groq Model Name", value="llama-3.3-70b-versatile")
    else:
        llm_model = groq_model_choice

elif provider_key == "ollama":
    # Ollama setup
    ollama_host = st.sidebar.text_input("Ollama Host URL", value="http://localhost:11434")
    
    # Test connection and fetch models
    is_connected = test_ollama_connection(ollama_host)
    if is_connected:
        st.sidebar.success("✅ Connected to Ollama!")
        ollama_models = get_ollama_models(ollama_host)
        if ollama_models:
            llm_model = st.sidebar.selectbox("Local Model", ollama_models)
        else:
            st.sidebar.warning("⚠️ No local models found. Pull a model using e.g., 'ollama pull llama3'")
            llm_model = st.sidebar.text_input("Model Name manually", value="llama3")
    else:
        st.sidebar.error("❌ Ollama not running")
        st.sidebar.info("💡 Start Ollama on your computer or specify correct host URL.")
        llm_model = st.sidebar.text_input("Model Name manually", value="llama3")
        
    custom_endpoint_url = ollama_host

elif provider_key == "openai":
    # OpenAI setup
    default_openai_key = os.environ.get("OPENAI_API_KEY", "")
    llm_api_key = st.sidebar.text_input("OpenAI API Key", type="password", value=default_openai_key)
    llm_model = st.sidebar.selectbox(
        "OpenAI Model",
        ["gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo"],
        index=0
    )

elif provider_key == "custom":
    # Custom Endpoint Setup
    custom_endpoint_url = st.sidebar.text_input("Base URL", placeholder="https://api.yourhost.com/v1")
    llm_api_key = st.sidebar.text_input("API Key (Optional)", type="password", value="")
    llm_model = st.sidebar.text_input("Model Name", value="custom-model")

# Section 2: Search Settings
st.sidebar.subheader("🔍 Search & Context Settings")
search_engine = st.sidebar.selectbox(
    "Search Engine",
    ["Tavily (API Key Needed)", "DuckDuckGo (Free, No Key)"],
    index=0
)

search_api_key = ""
search_engine_key = "Tavily"
if search_engine == "Tavily (API Key Needed)":
    search_engine_key = "Tavily"
    default_tavily_key = os.environ.get("TAVILY_API_KEY", "")
    search_api_key = st.sidebar.text_input("Tavily API Key", type="password", value=default_tavily_key)
    if not search_api_key:
        st.sidebar.info("🔑 [Get a free Tavily API key](https://tavily.com)")
else:
    search_engine_key = "DuckDuckGo"

max_results = st.sidebar.slider("Number of News Articles per Fund", min_value=2, max_value=10, value=5)
temperature = st.sidebar.slider("LLM Temperature (Creativity)", min_value=0.0, max_value=1.0, value=0.2, step=0.05)


# Main Workspace split into two tabs: 1. Analyzer, 2. Interactive Guide
tab_analyzer, tab_guide = st.tabs(["🚀 Straightforward Plan Generator", "📖 Guide & Instructions"])

with tab_analyzer:
    st.markdown("### 🎯 Enter details to get an instant straightforward investment plan")
    
    col_amount, col_timeframe, col_risk = st.columns(3)
    with col_amount:
        investment_amount = st.number_input(
            "How much money do you want to invest in Rupees (₹)?",
            min_value=100.0,
            value=10000.0,
            step=500.0,
            help="Your total investable capital in INR (₹). This helps the AI suggest optimal allocations."
        )
    with col_timeframe:
        investment_timeframe = st.selectbox(
            "What is your investment timeframe (horizon)?",
            ["1 Week", "1 Month", "6 Months", "1 Year", "3 Years", "5 Years", "10+ Years"],
            index=3,
            help="Very short terms (like 1 week) are high risk for equities and best for Liquid funds. Long terms can afford high-risk equities."
        )
    with col_risk:
        risk_profile = st.selectbox(
            "What is your risk tolerance?",
            ["Low Risk (Safe, preserve capital)", "Balanced (Moderate growth and risk)", "High Risk (Maximum growth, high volatility)"],
            index=1,
            help="Determines your asset mix (debt, gold, domestic and international equities)."
        )

    # Allocation choice
    allocation_style = st.selectbox(
        "Where do you want to allocate your money?",
        ["Multiple Stocks/ETFs (Diversified portfolio - Safer/Recommended)", "Single Stock/ETF (Concentrated - Higher focus & potential)"],
        index=0,
        help="Choose whether you want your capital spread across a diversified plan or placed into one single optimal selection."
    )

    user_goal_input = st.text_area(
        "Any specific goals, comments, or details? (Optional)",
        value="",
        placeholder="Example: I am saving for a vacation / retirement / buying a car. Keep it super simple.",
        height=70
    )

    st.info("💡 **Dynamic Return Calculation**: The AI engine will read the latest market news, historical trends, inflation parameters, and other macroeconomic factors to compute and recommend a highly accurate customized Estimated Rate of Return (% p.a.) in your final plan.")

    # Main Action Button
    st.markdown("### 🚀 Step 2: Get Recommendation")
    analyze_button = st.button("⚡ Generate My Investment Plan", type="primary")

    if analyze_button:
        if provider_key in ["groq", "openai"] and not llm_api_key:
            st.error(f"Please provide an API Key for {llm_provider} in the sidebar.")
        elif search_engine_key == "Tavily" and not search_api_key:
            st.error("Please provide a Tavily API Key or switch search engine to DuckDuckGo in the sidebar.")
        else:
            # Execute Pipeline
            with st.spinner("🕵️‍♂️ Fetching latest Indian market metrics and matching news trends..."):
                status_placeholder = st.empty()
                status_placeholder.info("🌐 Querying latest NSE ticker data and live headlines...")
                
                # Run the actual full pipeline
                res = analyze_funds(
                    focus_area=user_goal_input,
                    search_engine=search_engine_key,
                    search_api_key=search_api_key,
                    llm_provider=provider_key,
                    llm_model=llm_model,
                    llm_api_key=llm_api_key,
                    custom_endpoint_url=custom_endpoint_url,
                    temperature=temperature,
                    news_count=max_results,
                    investment_amount=investment_amount,
                    investment_timeframe=investment_timeframe,
                    risk_profile=risk_profile,
                    allocation_style=allocation_style
                )
                
                status_placeholder.empty()
                
                if res.get("success"):
                    st.success("✅ Your Plan is Ready!")
                    
                    # Display the final beautiful LLM Report
                    st.markdown("### 📋 Straightforward Investment Plan")
                    st.markdown(f'<div class="report-container">', unsafe_allow_html=True)
                    st.markdown(res["report"])
                    st.markdown('</div>', unsafe_allow_html=True)
                    
                    # Download button
                    st.download_button(
                        label="📥 Download Plan as Markdown",
                        data=res["report"],
                        file_name=f"investment_plan_{datetime.now().strftime('%Y%m%d_%H%M%S')}.md",
                        mime="text/markdown"
                    )

                    # Beautiful Live News Card Panel (Direct Visibility)
                    if res.get("raw_news_items"):
                        st.markdown("### 📰 Latest Live News Affecting Your Recommended Assets")
                        st.markdown("These are the live market headlines and articles analysed by the AI:")
                        
                        for item in res["raw_news_items"]:
                            st.markdown(f"""
                            <div style="background-color: #ffffff; padding: 12px; border-radius: 8px; margin-bottom: 10px; border-left: 5px solid #ff4b4b; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                                <h5 style="margin: 0 0 3px 0;"><a href="{item['url']}" target="_blank" style="color: #ff4b4b; text-decoration: none;">🔗 {item['title']}</a></h5>
                                <span style="font-size: 0.8em; color: #6c757d; font-weight: bold;">Source: {item['source']} | Date: {item['date']}</span>
                            </div>
                            """, unsafe_allow_html=True)
                    
                    # Expandable audits (very professional)
                    with st.expander("🔍 Audit Trail: View Raw Search News & Web Context"):
                        for ctx in res.get("search_context", []):
                            st.markdown(f"#### Sector: {ctx['fund']}")
                            st.markdown(f"**Query Used:** `{ctx['query']}`")
                            st.code(ctx["news"], language="text")
                            st.markdown("---")
                            
                    with st.expander("📊 Audit Trail: View Raw Market Factsheets"):
                        for td in res.get("tickers_data", []):
                            st.markdown(f"#### {td['name']} ({td['ticker']})")
                            st.write(td)
                            st.markdown("---")
                else:
                    st.error(f"Failed to complete AI analysis. Error details: {res.get('error')}")
                    
                    # Still show loaded specs or search results for debugging
                    with st.expander("View partial loaded metrics"):
                        st.write(res.get("tickers_data"))
                    with st.expander("View partial search queries & articles"):
                        st.write(res.get("search_context"))

    # Beautiful interactive historical performance audit charts section (Empirical evidence)
    st.markdown("---")
    st.markdown("### 📈 10-Year Empirical Performance Audit Panel")
    st.markdown(
        "Verify the real historical performance of Indian benchmark assets or any custom stock/ETF from the exchange below. "
        "No theory—just raw, audited price history."
    )

    col_chart_sel, col_chart_period = st.columns([2, 1])
    with col_chart_sel:
        chart_asset = st.selectbox(
            "Select an Asset to Audit:",
            [
                "NIFTYBEES.NS (Nifty 50 Equity ETF)",
                "MON100.NS (Nasdaq 100 Tech ETF)",
                "GOLDBEES.NS (Gold Safe Hedge ETF)",
                "LIQUIDBEES.NS (Nippon Liquid ETF)",
                "Custom Ticker (Enter below)"
            ],
            index=0,
            help="Benchmarks represent core Indian market equity, international tech, safe gold, and liquid cash alternatives."
        )
        if chart_asset == "Custom Ticker (Enter below)":
            ticker_to_chart = st.text_input("Enter NSE Ticker Symbol (e.g., RELIANCE.NS, TCS.NS, INFIBEAM.NS):", value="RELIANCE.NS").strip().upper()
        else:
            ticker_to_chart = chart_asset.split(" ")[0]

    with col_chart_period:
        chart_period = st.radio(
            "Select Audit Period:",
            ["1 Year", "5 Years", "10 Years (Max)"],
            index=1,
            horizontal=True
        )

    # Fetch and plot chart
    with st.spinner(f"Loading empirical price history for {ticker_to_chart}..."):
        hist_df = get_historical_chart_data(ticker_to_chart)
        
        if hist_df is not None and not hist_df.empty:
            now_dt = datetime.now()
            
            if chart_period == "1 Year":
                cutoff_dt = now_dt - pd.Timedelta(days=365)
            elif chart_period == "5 Years":
                cutoff_dt = now_dt - pd.Timedelta(days=5*365)
            else:
                cutoff_dt = now_dt - pd.Timedelta(days=10*365)
                
            filtered_df = hist_df[hist_df['Date'] >= cutoff_dt].copy()
            
            if not filtered_df.empty:
                filtered_df = filtered_df.set_index('Date')
                
                # Plot standard Streamlit line chart
                st.line_chart(filtered_df['Close'], color="#1f77b4")
                
                # Core Growth Return Calculations
                first_val = float(filtered_df['Close'].iloc[0])
                last_val = float(filtered_df['Close'].iloc[-1])
                growth_pct = ((last_val - first_val) / first_val) * 100
                
                st.info(
                    f"📊 **Audited Performance Summary for {ticker_to_chart}** ({chart_period}):\n"
                    f"- **Starting Value (at start of period)**: ₹{first_val:,.2f}\n"
                    f"- **Current Value (Last traded price)**: ₹{last_val:,.2f}\n"
                    f"- **Compounded Total Growth Rate**: **{growth_pct:+.2f}%**"
                )
            else:
                st.warning("No price logs matching this specific timeframe.")
        else:
            st.warning(f"Could not load data for '{ticker_to_chart}'. Please check if the ticker suffix is correct (NSE tickers require '.NS').")


with tab_guide:
    st.markdown("""
    ### 📖 User Guide & Quick Instructions

    This tool is designed to help you bypass costly subscriptions and financial fees by leveraging:
    1. **Real-time Free News APIs**: Uses the DuckDuckGo engine to query recent news, market analyses, and trends.
    2. **Free/Local LLM Compute**: 
       - **Groq API**: Offers extremely fast inference speeds with a highly generous free tier (usually free for normal individual use).
       - **Ollama**: Allows running highly capable models (like Llama3, Mistral, Gemma, Phi3) directly on your own computer 100% offline and free of cost.
    3. **Quantitative Facts**: Automatically grabs Expense Ratios, Total Assets, Dividend Yields, and Volatility Beta scores from financial records.

    ---

    #### 💡 Tips for Best Results

    1. **Using Local LLMs (Ollama)**:
       - Install Ollama from [ollama.com](https://ollama.com).
       - Open your terminal and run `ollama pull llama3-gradient` or `ollama pull llama3` or `ollama pull mistral`.
       - Keep Ollama application running on your system.
       - Select **Ollama (Free Local)** in the configuration sidebar. The app will automatically list your installed models.
       
    2. **Using Groq (Cloud Free)**:
       - Sign up at [console.groq.com](https://console.groq.com). It takes 30 seconds.
       - Generate an API Key under **API Keys**.
       - Paste it in the sidebar. Select **llama3-70b-8192** or **gemma2-9b-it** for outstanding comparative analyses.
       
    3. **How to Input Funds**:
       - **For Indian ETFs**: Use NSE tickers with the `.NS` suffix like `NIFTYBEES.NS` (Nifty 50), `JUNIORBEES.NS` (Nifty Next 50), `GOLDBEES.NS` (Gold), `MON100.NS` (Nasdaq 100 in INR), or `ITBEES.NS` (IT Index).
       - **For Mutual Funds**: Type out the full name of the mutual fund, such as `Parag Parikh Flexi Cap Fund`, `HDFC Index Nifty 50 Fund`, or `SBI Bluechip Fund`. The background search utility will scan the web/news for real-time and historical news for that fund name.
       - **For Indian Stocks**: You can also enter direct stock tickers like `RELIANCE.NS`, `TCS.NS`, `INFY.NS`, or `HDFCBANK.NS`.

    ---

    #### ⚖️ Financial Disclaimer
    *This application is strictly for educational, informational, and research purposes. It does not constitute formal financial, tax, or investment advice. It is tailored to Indian personal finance concepts but does not substitute for licensed investment advisors registered under SEBI.*
    """)

# Footer
st.markdown("""
<div class="footer">
    Developed with ❤️ for Smart Investors. Powered by Streamlit, DuckDuckGo Search, yFinance, Groq, and Ollama.
</div>
""", unsafe_allow_html=True)
