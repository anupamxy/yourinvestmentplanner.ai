import json
import time
from .base_agent import BaseAgent, AgentContext


class LLMAgent(BaseAgent):
    name = "llm"

    def __init__(self):
        self._client = None

    @property
    def client(self):
        if self._client is None:
            from core.llm.huggingface_client import HuggingFaceClient
            self._client = HuggingFaceClient()
        return self._client

    def run(self, context: AgentContext) -> AgentContext:
        t0 = time.time()
        try:
            prompt = self._build_prompt(context)
            response = self.client.generate(prompt, max_new_tokens=1024)
            context.llm_response = response

            duration = int((time.time() - t0) * 1000)
            self._log_step(
                context, 'done',
                {'response_length': len(response)},
                duration,
            )

        except Exception as e:
            context.errors.append(f"LLMAgent error: {str(e)}")
            context.llm_response = self._fallback_report(context)
            duration = int((time.time() - t0) * 1000)
            self._log_step(context, 'error', {'error': str(e)}, duration)

        return context

    def _build_prompt(self, context: AgentContext) -> str:
        profile = context.profile
        analysis = context.analysis
        past_memories = context.memory_context

        currency = profile.get('currency', 'USD')
        currency_symbol = '₹' if currency == 'INR' else '$'
        market = analysis.get('market', 'NYSE/NASDAQ')
        is_india = (currency == 'INR')

        past_context_str = (
            "\n\n".join(f"- {m}" for m in past_memories)
            if past_memories else "No prior investment history for this user."
        )

        top_picks_str = json.dumps(analysis.get('top_picks', []), indent=2)
        allocations_str = json.dumps(analysis.get('allocations', {}), indent=2)
        risk_summary = analysis.get('risk_summary', {})

        india_context = """
### Indian Market Context
- All tickers are NSE-listed (National Stock Exchange of India)
- Prices are in Indian Rupees (INR)
- Regulatory body: SEBI (Securities and Exchange Board of India)
- Mention relevant Indian economic factors: RBI policy, FII/DII flows, Budget impact, Sensex/Nifty 50 trends
- Include tax considerations: STCG (15%), LTCG (10% above ₹1L), STT
""" if is_india else ""

        return f"""<s>[INST] You are a professional investment advisor AI. Generate a detailed, personalized investment report in Markdown format.

## USER PROFILE
- **Name**: {profile.get('username', 'Investor')}
- **Risk Tolerance**: {profile.get('risk_tolerance', 'moderate')}
- **Investment Goal**: {profile.get('investment_goal', 'Grow wealth')}
- **Budget**: {currency_symbol}{profile.get('budget', 0):,} {currency}
- **Time Horizon**: {profile.get('time_horizon', 'medium')}
- **Preferred Sectors**: {', '.join(profile.get('sectors', []))}
- **Market**: {market}

## MARKET ANALYSIS (Real-time Data)
### Top Scored Tickers
{top_picks_str}

### Suggested Allocations
{allocations_str}

### Risk Assessment
{risk_summary.get('risk_description', '')}
{risk_summary.get('horizon_note', '')}
{risk_summary.get('market_note', '')}
{india_context}
## PAST CONTEXT (Long-Term Memory)
{past_context_str}

## INSTRUCTIONS
Generate a complete investment report in Markdown with these exact sections:
1. **Executive Summary** (2-3 sentences)
2. **Current Market Conditions** (key trends observed{"for Indian markets: Nifty 50, Sensex, FII activity" if is_india else ""})
3. **Top 5 Recommended Tickers** (with price in {currency}, rationale, risk level for each)
4. **Portfolio Allocation Table** (ticker, allocation %, amount in {currency_symbol})
5. **Risk Warnings** (specific to user's profile{"and Indian market risks: currency risk, regulatory changes, monsoon/macro factors" if is_india else ""})
6. **Outlook** (30-day, 90-day, 1-year projections)
7. **Action Items** (concrete next steps for the investor)

Be specific, cite the data, and tailor every recommendation to the user's risk profile and goal. [/INST]"""

    def _fallback_report(self, context: AgentContext) -> str:
        """Generate a basic report when LLM call fails."""
        profile = context.profile
        top_picks = context.analysis.get('top_picks', [])
        allocations = context.analysis.get('allocations', {})
        currency = profile.get('currency', 'USD')
        currency_symbol = '₹' if currency == 'INR' else '$'
        market = context.analysis.get('market', 'NYSE/NASDAQ')

        tickers_md = "\n".join(
            f"- **{p['ticker']}** — Score: {p['score']}, Price Change: {p['price_change_pct']}%"
            for p in top_picks[:5]
        )
        alloc_md = "\n".join(
            f"| {t} | {d['weight']*100:.0f}% | {currency_symbol}{d['amount']:,.2f} |"
            for t, d in allocations.items()
        )

        return f"""# Investment Report

## Executive Summary
Based on your {profile.get('risk_tolerance')} risk profile and {currency_symbol}{profile.get('budget'):,} {currency} budget targeting {', '.join(profile.get('sectors', []))} on **{market}**, we have identified the following investment opportunities.

## Top Recommendations
{tickers_md}

## Portfolio Allocation
| Ticker | Weight | Amount ({currency}) |
|--------|--------|-------------|
{alloc_md}

## Risk Warning
*This report was generated with limited AI analysis. Please consult a licensed financial advisor before making investment decisions.*

*Note: LLM service was temporarily unavailable. Data-driven analysis above is based on real market data.*
"""
