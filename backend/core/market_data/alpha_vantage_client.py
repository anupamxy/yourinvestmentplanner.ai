import requests
from django.conf import settings


class RateLimitError(Exception):
    pass


class AlphaVantageClient:
    BASE_URL = "https://www.alphavantage.co/query"

    def __init__(self):
        self.api_key = settings.ALPHA_VANTAGE_API_KEY

    def get_global_quote(self, ticker: str) -> dict:
        data = self._call({'function': 'GLOBAL_QUOTE', 'symbol': ticker})
        if 'Global Quote' not in data or not data['Global Quote']:
            raise ValueError(f"No quote data for {ticker}")
        return data

    def get_sector_performance(self) -> dict:
        return self._call({'function': 'SECTOR'})

    def get_news_sentiment(self, ticker: str) -> dict:
        return self._call({
            'function': 'NEWS_SENTIMENT',
            'tickers': ticker,
            'limit': '10',
            'sort': 'LATEST',
        })

    def get_daily_series(self, ticker: str) -> dict:
        return self._call({
            'function': 'TIME_SERIES_DAILY',
            'symbol': ticker,
            'outputsize': 'compact',
        })

    def _call(self, params: dict) -> dict:
        if not self.api_key:
            raise ValueError("ALPHA_VANTAGE_API_KEY is not set in .env")
        params['apikey'] = self.api_key
        response = requests.get(self.BASE_URL, params=params, timeout=15)
        response.raise_for_status()
        data = response.json()

        # Alpha Vantage signals rate limiting via a Note or Information key
        if 'Note' in data:
            raise RateLimitError(f"Alpha Vantage rate limit: {data['Note']}")
        if 'Information' in data and 'call frequency' in data['Information'].lower():
            raise RateLimitError(f"Alpha Vantage limit: {data['Information']}")

        return data
