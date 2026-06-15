import sys
import yfinance as yf
from datetime import datetime
from search_utils import get_fund_news_and_web
from llm_utils import analyze_with_llm

def get_fund_ticker_data(ticker_symbol: str) -> dict:
    """
    Fetches details for a given ETF or Mutual Fund ticker using yfinance.
    Uses .history() to fetch the exact last traded price instead of previous close.
    Returns a dict with key metrics or empty/basic info if not found.
    """
    symbol = ticker_symbol.strip().upper()
    try:
        ticker = yf.Ticker(symbol)
        info = ticker.info
        
        # If no longName, it might not be a valid ticker or yfinance failed
        if not info or ("longName" not in info and "shortName" not in info):
            # Try a quick fallback using fast_info or history if ticker is valid but lacks metadata
            try:
                hist = ticker.history(period="5d")
                if not hist.empty:
                    last_price = hist['Close'].iloc[-1]
                    return {
                        "ticker": symbol,
                        "name": symbol,
                        "category": "Indian Fund",
                        "fund_family": "N/A",
                        "summary": "N/A",
                        "expense_ratio": None,
                        "yield": None,
                        "total_assets": None,
                        "beta": None,
                        "price": float(round(last_price, 2)),
                        "fifty_two_week_range": "N/A",
                        "three_year_return": "N/A",
                        "five_year_return": "N/A",
                        "valid": True,
                        "expense_ratio_pct": "N/A",
                        "yield_pct": "N/A",
                        "total_assets_str": "N/A"
                    }
            except Exception:
                pass
                
            return {
                "ticker": symbol,
                "valid": False,
                "error": "Ticker not found or metadata unavailable."
            }
        
        # Try to get the actual live last close / current market price using history as first preference
        last_price = None
        try:
            hist = ticker.history(period="1d")
            if not hist.empty:
                last_price = hist['Close'].iloc[-1]
        except Exception:
            pass
            
        if last_price is None:
            last_price = info.get("currentPrice") or info.get("navPrice") or info.get("previousClose") or info.get("regularMarketPrice") or 0.0

        # Extract fund characteristics
        data = {
            "ticker": symbol,
            "name": info.get("longName") or info.get("shortName") or symbol,
            "category": info.get("category", "N/A"),
            "fund_family": info.get("fundFamily", "N/A"),
            "summary": info.get("longBusinessSummary", "N/A"),
            "expense_ratio": info.get("feesInstantialData", {}).get("expenseRatio") or info.get("annualReportExpenseRatio") or info.get("expenseRatio"),
            "yield": info.get("yield") or info.get("trailingAnnualDividendYield") or info.get("dividendYield"),
            "total_assets": info.get("totalAssets") or info.get("navPrice"),
            "beta": info.get("beta") or info.get("beta3Year"),
            "price": float(round(last_price, 2)) if last_price else "N/A",
            "fifty_two_week_range": f"₹{info.get('fiftyTwoWeekLow', 'N/A')} - ₹{info.get('fiftyTwoWeekHigh', 'N/A')}",
            "three_year_return": info.get("threeYearAverageReturn", "N/A"),
            "five_year_return": info.get("fiveYearAverageReturn", "N/A"),
            "valid": True
        }
        
        # Clean up some formats
        if data["expense_ratio"] and data["expense_ratio"] < 1.0:
            # yfinance sometimes returns 0.0003 for 0.03%
            data["expense_ratio_pct"] = f"{data['expense_ratio'] * 100:.3f}%" if data["expense_ratio"] < 0.1 else f"{data['expense_ratio']}%"
        elif data["expense_ratio"]:
            data["expense_ratio_pct"] = f"{data['expense_ratio']}%"
        else:
            data["expense_ratio_pct"] = "N/A"
            
        if data["yield"] and data["yield"] < 1.0:
            data["yield_pct"] = f"{data['yield'] * 100:.2f}%"
        elif data["yield"]:
            data["yield_pct"] = f"{data['yield']}%"
        else:
            data["yield_pct"] = "N/A"
            
        if isinstance(data["total_assets"], (int, float)):
            data["total_assets_str"] = f"₹{data['total_assets'] / 1e7:.2f} Crore" if data["total_assets"] >= 1e7 else f"₹{data['total_assets'] / 1e5:.2f} Lakh"
        else:
            data["total_assets_str"] = "N/A"
            
        return data
    except Exception as e:
        print(f"yfinance error for ticker {symbol}: {e}", file=sys.stderr)
        return {
            "ticker": symbol,
            "valid": False,
            "error": str(e)
        }

def analyze_funds(
    focus_area: str,
    search_engine: str,
    search_api_key: str,
    llm_provider: str,
    llm_model: str,
    llm_api_key: str,
    custom_endpoint_url: str = "",
    temperature: float = 0.2,
    news_count: int = 5,
    investment_amount: float = 10000.0,
    investment_timeframe: str = "1 Year",
    risk_profile: str = "Balanced",
    allocation_style: str = "Multiple Stocks/ETFs (Diversified portfolio - Safer/Recommended)"
) -> dict:
    """
    Runs the straightforward analysis pipeline:
    1. Fetches standard benchmark Indian ETF stats (LIQUIDBEES.NS, GOLDBEES.NS, NIFTYBEES.NS, MON100.NS)
    2. Searches news/web for Indian market outlook and trend matching risk/duration
    3. Assembles simple prompt for a direct, straightforward recommendation
    4. Runs LLM and returns the structured markdown report
    """
    tickers_to_load = ["LIQUIDBEES.NS", "GOLDBEES.NS", "NIFTYBEES.NS", "MON100.NS"]
    tickers_data = []
    
    # Step 1: Gather Quantitative Data for benchmarks
    for symbol in tickers_to_load:
        ticker_data = get_fund_ticker_data(symbol)
        if ticker_data.get("valid"):
            tickers_data.append(ticker_data)
            
    # Step 2: Formulate short, robust search queries to ensure 100% search engine hits for both current & historical trends
    if "Low Risk" in risk_profile:
        target_asset_label = "LIQUIDBEES.NS (Nippon India ETF Nifty 1D Rate Liquid BeES)"
        primary_query = "LIQUIDBEES.NS RBI interest rate news"
        secondary_query = "Indian liquid mutual fund historical return drivers news"
    elif "Balanced" in risk_profile:
        target_asset_label = "NIFTYBEES.NS (Nifty BeES) & GOLDBEES.NS (Gold BeES)"
        primary_query = "NIFTYBEES.NS GOLDBEES.NS inflation news"
        secondary_query = "Indian stock market gold historical performance trends"
    else:
        target_asset_label = "MON100.NS (Motilal Oswal Nasdaq 100 ETF) & NIFTYBEES.NS (Nifty BeES)"
        primary_query = "MON100.NS Nasdaq tech market news"
        secondary_query = "Nifty index MON100 historical returns drivers"

    print(f"Searching highly specific primary news: {primary_query}...")
    news_items = get_fund_news_and_web(
        query=primary_query, 
        search_engine=search_engine, 
        api_key=search_api_key, 
        max_results=news_count
    )
    
    # Smart Fallback & Supplement: Fetch historical/previous driver news to ensure comprehensive context
    if len(news_items) < 3:
        print(f"Primary search returned few results. Querying historical and macro drivers: {secondary_query}...")
        supplemental_items = get_fund_news_and_web(
            query=secondary_query,
            search_engine=search_engine,
            api_key=search_api_key,
            max_results=(news_count - len(news_items)) if len(news_items) > 0 else news_count
        )
        # Merge items avoiding duplicates by title
        existing_titles = {item["title"].lower().strip() for item in news_items}
        for item in supplemental_items:
            if item["title"].lower().strip() not in existing_titles:
                news_items.append(item)

    news_text_list = []
    for i, item in enumerate(news_items, 1):
        news_text_list.append(
            f"Source [{i}]:\n"
            f"- Title: {item['title']}\n"
            f"- Publisher: {item['source']}\n"
            f"- Date: {item['date']}\n"
            f"- URL: {item['url']}\n"
            f"- Snippet: {item['snippet']}\n"
        )
    news_context = "\n".join(news_text_list) if news_text_list else "No recent or historical market news found."

    # Step 2b: Dedicated Groww-specific specification search to resolve N/As
    groww_specs_query = "LIQUIDBEES NIFTYBEES GOLDBEES MON100 Groww expense ratio assets"
    print(f"Fetching exact Groww specs using search query: {groww_specs_query}...")
    groww_items = get_fund_news_and_web(
        query=groww_specs_query,
        search_engine=search_engine,
        api_key=search_api_key,
        max_results=4
    )
    
    groww_text_list = []
    for i, item in enumerate(groww_items, 1):
        groww_text_list.append(
            f"Groww Spec Reference [{i}]:\n"
            f"- Title: {item['title']}\n"
            f"- Details: {item['snippet']}\n"
        )
    groww_context = "\n".join(groww_text_list) if groww_text_list else "No Groww specific search results found."

    # Step 3: Build the Prompt
    system_prompt = (
        "You are an expert Certified Financial Planner (CFP) specialized in Indian personal finance and active macro-economic research.\n"
        "Your goal is to give a single, extremely straightforward, and highly credible investment recommendation with zero fluff.\n"
        "You must explain EXACTLY WHY you chose the recommended assets, giving a deep logical reasoning backed by empirical market facts.\n"
        "IMPORTANT on Data Overrides:\n"
        "1. Do NOT print 'N/A' or 'None' for the expense ratio, assets size (AUM), or beta of the recommended fund. Instead, extract and estimate these metrics directly from the Groww Spec References provided in the prompt context.\n"
        "2. Ensure you state the exact current buying price of the funds (e.g. Liquid BeES trades at ~₹1,000, Nifty BeES trades at ~₹250-300, etc.) based on standard market rates or the quantitative reference, rather than defaulting to N/As.\n"
        "CRITICAL Horizon Factual Logic & Latest News Requirement:\n"
        "You must supply a highly factual, concrete logic of why this fund will rise or remain stable over the next week. You must cite specific, active market parameters: recent RBI Monetary Policy decisions (Repo rates), CPI inflation records, corporate index updates, FII (Foreign Institutional Investors) or DII inflows, and matching market momentum headlines from the news references provided. Under the news section, clearly state: 'Latest News Affecting Your Recommended Fund:' and write a 3-bullet-point logical evaluation of the exact headlines, describing how they mechanically impact your selected assets. Explain the mechanical 'why' behind the prediction.\n"
        "You must explicitly cite the credible sources provided (mentioning titles, publishers, URLs, or dates where relevant) to build high confidence.\n"
        "If the user wants single-asset allocation, recommend EXACTLY one best stock, ETF, or fund. Do NOT diversify.\n"
        "If the user wants multi-asset allocation, recommend a highly tailored diversified portfolio of specific funds/stocks/ETFs.\n"
        "Explain everything in plain, simple English with absolutely no complex jargon, keeping it fully beginner-friendly."
    )
    
    # Compile quantitative fund details for reference
    quantitative_summary = "=== REFERENCE INDIAN BENCHMARK ETFS (YFINANCE) ===\n"
    for td in tickers_data:
        quantitative_summary += (
            f"- Ticker: {td['ticker']} ({td['name']})\n"
            f"  Last Closing Buying Price: ₹{td['price']}\n"
            f"  Expense Ratio: {td['expense_ratio_pct']}\n"
            f"  Dividend/Yield: {td['yield_pct']}\n"
            f"  Assets: {td['total_assets_str']}\n"
            f"  Beta (Volatility): {td['beta']}\n\n"
        )
        
    user_prompt = (
        f"Create a straightforward, direct, and highly logical investment recommendation for the following scenario:\n\n"
        f"=== USER PROFILE ===\n"
        f"- **Investment Amount**: ₹{investment_amount:,.2f} INR\n"
        f"- **Timeframe / Duration**: {investment_timeframe}\n"
        f"- **User Risk Profile**: {risk_profile}\n"
        f"- **Requested Allocation Style**: {allocation_style}\n"
        f"- **Specific Goals / Comments**: {focus_area if focus_area else 'None'}\n\n"
        f"{quantitative_summary}\n"
        f"=== GROWW SPECIFICATION REFERENCE (FOR FILLING METRICS) ===\n"
        f"{groww_context}\n\n"
        f"=== RECENT & HISTORICAL TARGET-SPECIFIC NEWS FOR RECOMMENDED ASSETS ===\n"
        f"{news_context}\n\n"
        f"Please write a straightforward report containing the following sections:\n"
        f"1. **🎯 Your Simple Investment Strategy**: A simple 2-3 sentence overview explaining what is the most logical plan for this timeframe ({investment_timeframe}) and budget.\n\n"
        f"2. **💰 How to Allocate Your ₹{investment_amount:,.2f}**:\n"
        f"   - If they chose 'Single Stock/ETF', allocate 100% of the ₹{investment_amount:,.2f} to EXACTLY ONE specific, named stock or ETF (with ticker, e.g. NIFTYBEES.NS or RELIANCE.NS) that perfectly matches their horizon and risk tolerance.\n"
        f"   - If they chose 'Multiple Stocks/ETFs', allocate the ₹{investment_amount:,.2f} across a diversified split of 2 to 3 specific named stocks/ETFs (such as Nifty Index + Liquid ETF + Gold ETF). Clearly state the exact percentage and rupee amount to place into each!\n\n"
        f"3. **📰 News Drivers & Asset Price Impact Analysis (Previous & Latest News Synthesis)**:\n"
        f"   - Analyze both the **previous/historical news drivers** and the **latest news** loaded in the context above.\n"
        f"   - Explain the structural correlation: look at what has historically caused this specific fund to rise or fall in previous cycles (e.g. past RBI rate adjustments for Liquid BeES, tech cycle corrections for Nasdaq MON100, or historical inflation spikes for Gold BeES).\n"
        f"   - Based on those historical factual patterns, explain what the **latest/current news headlines** predict for this fund's direction over the next week or short term.\n"
        f"   - Connect these outcomes with raw facts, concrete dates, and numbers rather than general theories.\n\n"
        f"4. **🧮 Dynamic AI Growth & Returns Projection (Post-Analysis Estimation)**:\n"
        f"   - Based on your news and trend evaluation, compute a highly justified Expected Rate of Return (% p.a.) for the plan.\n"
        f"   - Perform the mathematical compounding or simple interest calculation to show: \n"
        f"     * Predicted Annualized Rate of Return (% p.a.)\n"
        f"     * Expected Gains (₹ Profit) over their specific timeframe of {investment_timeframe}\n"
        f"     * Projected Total Portfolio Maturity Value (₹) at the end of {investment_timeframe} on their ₹{investment_amount:,.2f} principal.\n"
        f"   - Present these numbers in a clear, formatted comparison or summary card inside this section.\n\n"
        f"5. **🧠 Detailed & Logical Justification**: Provide a highly detailed and logical explanation of why these specific fund(s) or stock(s) are chosen. (IMPORTANT: Use the Groww Reference data to fill in and explain the exact buy price, expense ratio, and asset size/AUM of the funds you select—do NOT output N/A or None!).\n\n"
        f"6. **📰 Credible Source Citations**: List ONLY the clean hyperlinked titles and names of the credible news sites/articles from the 'RECENT LIVE MARKET NEWS' context that back up your logical decision. DO NOT write or repeat paragraphs of news text or summaries under this section. Keep it clean with direct Markdown hyperlinks to the source URLs.\n\n"
        f"7. **⚖️ Simple Risk Explanation**: Explain in 2 bullet points why this is safe or what minimal risk exists, suitable for an absolute beginner.\n\n"
        f"8. **💼 Indian Tax Impact**: A simple explanation of what taxes they will pay when they withdraw their money after {investment_timeframe}.\n\n"
        f"9. **⚠️ Financial Disclaimer**: Standard educational disclaimer."
    )
    
    try:
        report = analyze_with_llm(
            prompt=user_prompt,
            system_prompt=system_prompt,
            provider=llm_provider,
            model=llm_model,
            api_key=llm_api_key,
            host_or_url=custom_endpoint_url,
            temperature=temperature
        )
        return {
            "success": True,
            "report": report,
            "tickers_data": tickers_data,
            "search_context": [{"fund": "Indian Market Strategy", "query": f"{primary_query} | Fallback: {secondary_query}", "news": news_context}],
            "raw_news_items": news_items
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "tickers_data": tickers_data,
            "search_context": []
        }
