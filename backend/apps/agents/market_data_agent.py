import time
from datetime import datetime
from .base_agent import BaseAgent, AgentContext

# US sector -> representative tickers (NYSE/NASDAQ)
SECTOR_TICKERS = {
    'technology':    ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'META'],
    'healthcare':    ['JNJ', 'PFE', 'UNH', 'ABT', 'MRK'],
    'finance':       ['JPM', 'BAC', 'GS', 'MS', 'WFC'],
    'energy':        ['XOM', 'CVX', 'COP', 'SLB', 'EOG'],
    'consumer':      ['AMZN', 'TSLA', 'HD', 'MCD', 'NKE'],
    'industrials':   ['CAT', 'BA', 'HON', 'UPS', 'GE'],
    'utilities':     ['NEE', 'DUK', 'SO', 'D', 'AEP'],
    'real_estate':   ['AMT', 'PLD', 'CCI', 'EQIX', 'SPG'],
    'materials':     ['LIN', 'APD', 'SHW', 'FCX', 'NEM'],
    'communication': ['T', 'VZ', 'CMCSA', 'NFLX', 'DIS'],
}

# Indian sector -> NSE tickers (Yahoo Finance .NS suffix)
INDIAN_SECTOR_TICKERS = {
    'technology':    ['TCS.NS', 'INFY.NS', 'WIPRO.NS', 'HCLTECH.NS', 'TECHM.NS'],
    'healthcare':    ['SUNPHARMA.NS', 'DRREDDY.NS', 'CIPLA.NS', 'DIVISLAB.NS', 'APOLLOHOSP.NS'],
    'finance':       ['HDFCBANK.NS', 'ICICIBANK.NS', 'SBIN.NS', 'KOTAKBANK.NS', 'AXISBANK.NS'],
    'energy':        ['RELIANCE.NS', 'ONGC.NS', 'NTPC.NS', 'POWERGRID.NS', 'BPCL.NS'],
    'consumer':      ['HINDUNILVR.NS', 'ITC.NS', 'NESTLEIND.NS', 'DABUR.NS', 'BRITANNIA.NS'],
    'industrials':   ['LT.NS', 'ADANIENT.NS', 'SIEMENS.NS', 'ABB.NS', 'BHEL.NS'],
    'utilities':     ['NTPC.NS', 'POWERGRID.NS', 'TATAPOWER.NS', 'ADANIGREEN.NS', 'CESC.NS'],
    'real_estate':   ['DLF.NS', 'GODREJPROP.NS', 'OBEROIRLTY.NS', 'PRESTIGE.NS', 'BRIGADE.NS'],
    'materials':     ['TATASTEEL.NS', 'JSWSTEEL.NS', 'HINDALCO.NS', 'VEDL.NS', 'COALINDIA.NS'],
    'communication': ['BHARTIARTL.NS', 'TATACOMM.NS', 'HFCL.NS', 'GTLINFRA.NS', 'INDIAMART.NS'],
}


class MarketDataAgent(BaseAgent):
    name = "market_data"

    def run(self, context: AgentContext) -> AgentContext:
        t0 = time.time()
        try:
            sectors = context.profile.get('sectors', ['technology'])
            currency = context.profile.get('currency', 'USD')
            use_india = (currency == 'INR')

            tickers = self._resolve_tickers(sectors, use_india)

            if use_india:
                market_data = self._fetch_indian_market(tickers)
            else:
                market_data = self._fetch_global_market(tickers)

            context.market_data = {
                **market_data,
                'tickers_analyzed': tickers[:10],
                'market': 'NSE' if use_india else 'NYSE/NASDAQ',
                'currency': currency,
                'fetched_at': datetime.utcnow().isoformat(),
            }

            duration = int((time.time() - t0) * 1000)
            self._log_step(context, 'done', {'tickers': tickers[:10], 'market': context.market_data['market']}, duration)

        except Exception as e:
            context.errors.append(f"MarketDataAgent error: {str(e)}")
            duration = int((time.time() - t0) * 1000)
            self._log_step(context, 'error', {'error': str(e)}, duration)

        return context

    def _fetch_global_market(self, tickers: list) -> dict:
        """Fetch US/global market data using Alpha Vantage with yfinance fallback."""
        from core.market_data.alpha_vantage_client import AlphaVantageClient, RateLimitError
        from core.market_data.yahoo_finance_client import YahooFinanceClient

        av_client = AlphaVantageClient()
        yf_client = YahooFinanceClient()

        sector_perf = {}
        try:
            sector_perf = av_client.get_sector_performance()
        except Exception:
            sector_perf = {'note': 'Sector data unavailable'}

        quotes, news = {}, {}
        for ticker in tickers[:10]:
            try:
                quotes[ticker] = av_client.get_global_quote(ticker)
                time.sleep(0.5)
            except (RateLimitError, Exception):
                quotes[ticker] = yf_client.get_quote(ticker)

            try:
                news[ticker] = av_client.get_news_sentiment(ticker)
                time.sleep(0.5)
            except Exception:
                news[ticker] = {'note': 'News unavailable'}

        return {
            'sector_performance': sector_perf,
            'quotes': quotes,
            'news_sentiment': news,
        }

    def _fetch_indian_market(self, tickers: list) -> dict:
        """
        Fetch Indian NSE market data using yfinance (.NS tickers).
        Alpha Vantage sector data is US-only so it is skipped here.
        """
        from core.market_data.yahoo_finance_client import YahooFinanceClient

        yf_client = YahooFinanceClient()

        quotes, news = {}, {}
        for ticker in tickers[:10]:
            quotes[ticker] = yf_client.get_quote(ticker)
            # News sentiment is AV-only and US-focused; mark as unavailable for NSE
            news[ticker] = {'note': 'News sentiment not available for NSE tickers'}
            time.sleep(0.2)

        return {
            'sector_performance': {
                'note': 'Sector performance data is US-market specific. Indian market data sourced from NSE via Yahoo Finance.'
            },
            'quotes': quotes,
            'news_sentiment': news,
        }

    def _resolve_tickers(self, sectors: list, use_india: bool = False) -> list:
        ticker_map = INDIAN_SECTOR_TICKERS if use_india else SECTOR_TICKERS
        tickers = []
        for sector in sectors:
            tickers.extend(ticker_map.get(sector, []))
        return list(dict.fromkeys(tickers))  # deduplicate, preserve order
