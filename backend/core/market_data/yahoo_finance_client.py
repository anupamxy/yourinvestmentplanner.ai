class YahooFinanceClient:
    """Fallback market data client using yfinance (no API key required)."""

    def get_quote(self, ticker: str) -> dict:
        try:
            import yfinance as yf
            t = yf.Ticker(ticker)
            info = t.fast_info
            prev_close = getattr(info, 'previous_close', None) or 1
            last_price = getattr(info, 'last_price', None) or 0
            change_pct = ((last_price / prev_close) - 1) * 100 if prev_close else 0
            return {
                'Global Quote': {
                    '01. symbol': ticker,
                    '05. price': str(round(last_price, 2)),
                    '10. change percent': f"{round(change_pct, 2)}%",
                    '06. volume': str(getattr(info, 'three_month_average_volume', 0)),
                    '08. previous close': str(round(prev_close, 2)),
                },
                '_source': 'yfinance',
            }
        except Exception as e:
            return {
                'Global Quote': {
                    '01. symbol': ticker,
                    '05. price': '0',
                    '10. change percent': '0%',
                },
                '_source': 'yfinance_error',
                '_error': str(e),
            }

    def get_history(self, ticker: str, period: str = '3mo') -> list:
        try:
            import yfinance as yf
            t = yf.Ticker(ticker)
            hist = t.history(period=period)
            return hist.reset_index().to_dict(orient='records')
        except Exception:
            return []

    def get_info(self, ticker: str) -> dict:
        try:
            import yfinance as yf
            return yf.Ticker(ticker).info
        except Exception:
            return {}
