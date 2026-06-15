import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = (searchParams.get("symbol") || "NIFTYBEES.NS").trim().toUpperCase();
  const period = searchParams.get("period") || "5 Years";
  
  try {
    // Map planning periods to Yahoo finance chart ranges
    let range = "5y";
    let interval = "1mo";
    if (period === "1 Year") {
      range = "1y";
      interval = "1wk";
    } else if (period === "10 Years (Max)") {
      range = "10y";
      interval = "3mo";
    }

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });

    if (!res.ok) {
      return NextResponse.json({ success: false, error: "Symbol not found on exchange." }, { status: 404 });
    }

    const data = await res.json();
    const result = data.chart?.result?.[0];
    
    if (!result) {
      return NextResponse.json({ success: false, error: "Invalid exchange result." }, { status: 404 });
    }

    const timestamps = result.timestamp || [];
    const closes = result.indicators?.quote?.[0]?.close || [];
    
    const chartData = timestamps.map((ts: number, idx: number) => {
      const date = new Date(ts * 1000);
      let dateStr = date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      if (period === "10 Years (Max)") {
        dateStr = date.getFullYear().toString();
      }
      return {
        date: dateStr,
        price: closes[idx] ? parseFloat(closes[idx].toFixed(2)) : null
      };
    }).filter((item: any) => item.price !== null);

    return NextResponse.json({ success: true, chartData });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
