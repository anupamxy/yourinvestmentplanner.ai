import time
from datetime import datetime
from .base_agent import BaseAgent, AgentContext

# Sector -> representative tickers mapping
SECTOR_TICKERS = {
    'technology': ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'META'],
    'healthcare': ['JNJ', 'PFE', 'UNH', 'ABT', 'MRK'],
    'finance': ['JPM', 'BAC', 'GS', 'MS', 'WFC'],
    'energy': ['XOM', 'CVX', 'COP', 'SLB', 'EOG'],
    'consumer': ['AMZN', 'TSLA', 'HD', 'MCD', 'NKE'],
    'industrials': ['CAT', 'BA', 'HON', 'UPS', 'GE'],
    'utilities': ['NEE', 'DUK', 'SO', 'D', 'AEP'],
    'real_estate': ['AMT', 'PLD', 'CCI', 'EQIX', 'SPG'],
    'materials': ['LIN', 'APD', 'SHW', 'FCX', 'NEM'],
    'communication': ['T', 'VZ', 'CMCSA', 'NFLX', 'DIS'],
}


class MarketDataAgent(BaseAgent):
    name = "market_data"

    def run(self, context: AgentContext) -> AgentContext:
        t0 = time.time()
        try:
            from core.market_data.alpha_vantage_client import AlphaVantageClient, RateLimitError
            from core.market_data.yahoo_finance_client import YahooFinanceClient

            sectors = context.profile.get('sectors', ['technology'])
            tickers = self._resolve_tickers(sectors)

            av_client = AlphaVantageClient()
            yf_client = YahooFinanceClient()

            # Sector performance (one call covers all)
            sector_perf = {}
            try:
                sector_perf = av_client.get_sector_performance()
            except Exception:
                sector_perf = {'note': 'Sector data unavailable'}

            quotes = {}
            news = {}
            for ticker in tickers[:10]:  # Limit to 10 to respect free tier
                try:
                    quotes[ticker] = av_client.get_global_quote(ticker)
                    time.sleep(0.5)  # Respect 5 req/min rate limit
                except (RateLimitError, Exception):
                    quotes[ticker] = yf_client.get_quote(ticker)

                try:
                    news[ticker] = av_client.get_news_sentiment(ticker)
                    time.sleep(0.5)
                except Exception:
                    news[ticker] = {'note': 'News unavailable'}

            context.market_data = {
                'sector_performance': sector_perf,
                'quotes': quotes,
                'news_sentiment': news,
                'tickers_analyzed': tickers[:10],
                'fetched_at': datetime.utcnow().isoformat(),
            }

            duration = int((time.time() - t0) * 1000)
            self._log_step(context, 'done', {'tickers': tickers[:10]}, duration)

        except Exception as e:
            context.errors.append(f"MarketDataAgent error: {str(e)}")
            duration = int((time.time() - t0) * 1000)
            self._log_step(context, 'error', {'error': str(e)}, duration)

        return context

    def _resolve_tickers(self, sectors: list) -> list:
        tickers = []
        for sector in sectors:
            tickers.extend(SECTOR_TICKERS.get(sector, []))
        return list(dict.fromkeys(tickers))  # Deduplicate, preserve order
