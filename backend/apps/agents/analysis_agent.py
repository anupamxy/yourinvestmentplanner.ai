import time
from .base_agent import BaseAgent, AgentContext

RISK_WEIGHTS = {
    'conservative': {'sentiment': 0.5, 'volatility': 0.3, 'sector_perf': 0.2},
    'moderate':     {'sentiment': 0.4, 'volatility': 0.2, 'sector_perf': 0.4},
    'aggressive':   {'sentiment': 0.3, 'volatility': 0.1, 'sector_perf': 0.6},
}


class AnalysisAgent(BaseAgent):
    name = "analysis"

    def run(self, context: AgentContext) -> AgentContext:
        t0 = time.time()
        try:
            profile = context.profile
            risk = profile.get('risk_tolerance', 'moderate')
            budget = float(profile.get('budget', 10000))
            horizon = profile.get('time_horizon', 'medium')
            currency = profile.get('currency', 'USD')
            market = context.market_data.get('market', 'NYSE/NASDAQ')
            quotes = context.market_data.get('quotes', {})
            news = context.market_data.get('news_sentiment', {})

            scored = self._score_tickers(quotes, news, risk)
            top_picks = sorted(scored, key=lambda x: x['score'], reverse=True)[:5]
            allocations = self._allocate_budget(top_picks, budget, risk, currency)

            context.analysis = {
                'top_picks': top_picks,
                'allocations': allocations,
                'risk_summary': self._build_risk_summary(risk, horizon, market),
                'total_tickers_evaluated': len(scored),
                'budget': budget,
                'currency': currency,
                'market': market,
            }

            duration = int((time.time() - t0) * 1000)
            self._log_step(context, 'done', {'top_picks': [p['ticker'] for p in top_picks]}, duration)

        except Exception as e:
            context.errors.append(f"AnalysisAgent error: {str(e)}")
            duration = int((time.time() - t0) * 1000)
            self._log_step(context, 'error', {'error': str(e)}, duration)

        return context

    def _score_tickers(self, quotes: dict, news: dict, risk: str) -> list:
        weights = RISK_WEIGHTS.get(risk, RISK_WEIGHTS['moderate'])
        scored = []

        for ticker, quote_data in quotes.items():
            score = 0.0

            # Sentiment score from news
            sentiment_score = self._extract_sentiment(news.get(ticker, {}))
            score += sentiment_score * weights['sentiment']

            # Price change as momentum signal
            change_pct = self._extract_change(quote_data)
            momentum = (change_pct + 10) / 20  # Normalize -10%..+10% to 0..1
            momentum = max(0.0, min(1.0, momentum))
            score += momentum * weights['sector_perf']

            # Volatility penalty for conservative investors (use abs change as proxy)
            volatility_penalty = abs(change_pct) / 10.0
            score -= volatility_penalty * weights['volatility']

            scored.append({
                'ticker': ticker,
                'score': round(score, 4),
                'sentiment_score': round(sentiment_score, 4),
                'price_change_pct': round(change_pct, 2),
                'current_price': self._extract_price(quote_data),
            })

        return scored

    def _allocate_budget(self, top_picks: list, budget: float, risk: str, currency: str = 'USD') -> dict:
        if not top_picks:
            return {}
        if risk == 'conservative':
            weights = [0.35, 0.25, 0.20, 0.12, 0.08]
        elif risk == 'aggressive':
            weights = [0.40, 0.30, 0.15, 0.10, 0.05]
        else:
            weights = [0.30, 0.25, 0.20, 0.15, 0.10]

        allocations = {}
        for i, pick in enumerate(top_picks):
            w = weights[i] if i < len(weights) else 0
            allocations[pick['ticker']] = {
                'weight': w,
                'amount': round(budget * w, 2),
                'currency': currency,
                'score': pick['score'],
            }
        return allocations

    def _build_risk_summary(self, risk: str, horizon: str, market: str = 'NYSE/NASDAQ') -> dict:
        is_india = 'NSE' in market

        summaries = {
            'conservative': (
                'Low risk. Focus on large-cap Nifty 50 stocks, PSU banks, and dividend-paying blue chips.'
                if is_india else
                'Low risk. Focus on blue-chip, dividend-paying stocks with stable earnings.'
            ),
            'moderate': (
                'Balanced risk. Mix of Nifty 50 leaders and mid-cap growth stocks across sectors.'
                if is_india else
                'Balanced risk. Mix of growth and value stocks across diversified sectors.'
            ),
            'aggressive': (
                'High risk / high reward. Growth-oriented — includes mid/small-cap NSE stocks and emerging sectors like EV, renewables, and fintech.'
                if is_india else
                'High risk / high reward. Growth-oriented, may include volatile tech and emerging sectors.'
            ),
        }
        horizon_notes = {
            'short': 'Short time horizon — prioritize liquidity and avoid illiquid positions.',
            'medium': 'Medium horizon allows for some recovery from short-term volatility.',
            'long': 'Long horizon — can tolerate volatility for higher expected long-term returns.',
        }
        market_note = (
            'Data sourced from NSE (National Stock Exchange of India) via Yahoo Finance.'
            if is_india else
            'Data sourced from NYSE/NASDAQ via Alpha Vantage and Yahoo Finance.'
        )
        return {
            'risk_description': summaries.get(risk, ''),
            'horizon_note': horizon_notes.get(horizon, ''),
            'market_note': market_note,
        }

    def _extract_sentiment(self, news_data: dict) -> float:
        try:
            feed = news_data.get('feed', [])
            if not feed:
                return 0.5
            scores = []
            for item in feed[:5]:
                label = item.get('overall_sentiment_label', 'Neutral')
                score_val = item.get('overall_sentiment_score', 0.0)
                if isinstance(score_val, (int, float)):
                    scores.append(float(score_val))
            return sum(scores) / len(scores) if scores else 0.5
        except Exception:
            return 0.5

    def _extract_change(self, quote_data: dict) -> float:
        try:
            gq = quote_data.get('Global Quote', {})
            val = gq.get('10. change percent', '0%').replace('%', '')
            return float(val)
        except Exception:
            return quote_data.get('change_percent', 0.0)

    def _extract_price(self, quote_data: dict) -> float:
        try:
            gq = quote_data.get('Global Quote', {})
            return float(gq.get('05. price', 0.0))
        except Exception:
            return float(quote_data.get('price', 0.0))
