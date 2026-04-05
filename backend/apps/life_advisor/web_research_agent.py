import logging
import time
from .context import LifeAdvisorContext

logger = logging.getLogger(__name__)


class WebResearchAgent:
    name = "web_research"

    def run(self, context: LifeAdvisorContext) -> LifeAdvisorContext:
        profile = context.life_profile
        queries = self._build_queries(profile)
        results = []

        # ── Try DuckDuckGo ──
        try:
            from duckduckgo_search import DDGS
            with DDGS() as ddgs:
                for i, query in enumerate(queries):
                    try:
                        logger.info(f"[WebResearch] Query {i+1}/{len(queries)}: {query}")
                        hits = list(ddgs.text(query, max_results=3))
                        logger.info(f"[WebResearch] Got {len(hits)} hits")
                        for h in hits:
                            results.append({
                                'title':   h.get('title', ''),
                                'url':     h.get('href', ''),
                                'snippet': h.get('body', '')[:500],
                                'source':  self._detect_source(h.get('href', '')),
                                'query':   query,
                            })
                        if i < len(queries) - 1:
                            time.sleep(1.5)   # rate-limit buffer
                    except Exception as e:
                        logger.warning(f"[WebResearch] Query failed '{query}': {type(e).__name__}: {e}")
                        time.sleep(2)
        except ImportError:
            logger.warning("[WebResearch] duckduckgo-search not installed")
            context.errors.append("duckduckgo-search unavailable")
        except Exception as e:
            logger.error(f"[WebResearch] DDGS session error: {type(e).__name__}: {e}")

        logger.info(f"[WebResearch] Live results: {len(results)}")

        # ── Fallback: always return curated sources if live search empty ──
        if not results:
            logger.info("[WebResearch] Using curated fallback sources")
            results = self._fallback_sources(profile)

        context.web_research = results[:15]
        return context

    # ── Query builder ──────────────────────────────────────────────────────────
    def _build_queries(self, profile: dict) -> list:
        profession = profile.get('profession', 'professional')
        currency   = profile.get('currency', 'INR')
        goals      = profile.get('life_goals', [])
        salary     = profile.get('monthly_salary', 0)
        country    = 'India' if currency == 'INR' else 'US'

        queries = [
            f"{profession} financial planning {country} salary investment tips site:reddit.com",
            f"how to manage salary {profession} {country} personal finance advice",
            f"monthly salary {salary} {currency} investment strategy {country} site:quora.com",
        ]
        if 'house' in goals:
            queries.append(f"home loan down payment planning {country} tips site:reddit.com")
        if 'retirement' in goals:
            queries.append(f"early retirement planning {country} {profession} SIP NPS")
        if 'education' in goals:
            queries.append(f"child education fund SIP investment {country} planning")
        if 'business' in goals:
            queries.append(f"startup funding {profession} {country} tips Reddit")
        if 'marriage' in goals:
            queries.append(f"marriage savings plan {country} budget advice")

        return queries[:5]

    # ── Source detector ────────────────────────────────────────────────────────
    def _detect_source(self, url: str) -> str:
        url = url.lower()
        if 'reddit.com'      in url: return 'Reddit'
        if 'quora.com'       in url: return 'Quora'
        if 'linkedin.com'    in url: return 'LinkedIn'
        if 'moneycontrol'    in url: return 'MoneyControl'
        if 'economictimes'   in url: return 'Economic Times'
        if 'zerodha'         in url: return 'Zerodha Varsity'
        if 'investopedia'    in url: return 'Investopedia'
        if 'personalfn'      in url: return 'PersonalFN'
        if 'valueresearch'   in url: return 'Value Research'
        if 'jagoinvestor'    in url: return 'Jago Investor'
        return 'Web'

    # ── Curated fallback sources ───────────────────────────────────────────────
    def _fallback_sources(self, profile: dict) -> list:
        currency   = profile.get('currency', 'INR')
        profession = profile.get('profession', 'professional')
        goals      = profile.get('life_goals', [])
        is_india   = currency == 'INR'

        sources = []

        if is_india:
            sources += [
                {
                    'title':   'Personal Finance Basics — Zerodha Varsity',
                    'url':     'https://zerodha.com/varsity/module/personalfinance/',
                    'snippet': 'Covers budgeting, insurance, EPF, PPF, NPS, SIP and tax-saving instruments. '
                               'One of the most comprehensive free personal finance guides for Indians.',
                    'source':  'Zerodha Varsity',
                    'query':   f'{profession} India financial planning',
                },
                {
                    'title':   'r/IndiaInvestments — Monthly Salary Allocation Guide',
                    'url':     'https://www.reddit.com/r/IndiaInvestments/wiki/index/',
                    'snippet': 'Community-driven wiki covering 50/30/20 budgeting rule adapted for Indian salaries, '
                               'how to split salary between SIP, emergency fund, insurance and discretionary spending.',
                    'source':  'Reddit',
                    'query':   f'{profession} salary India investment allocation',
                },
                {
                    'title':   'Quora: How should a ₹1 lakh salary be invested in India?',
                    'url':     'https://www.quora.com/How-should-a-1-lakh-salary-be-invested-in-India',
                    'snippet': 'Top answers recommend: 3-6 months emergency fund first, term insurance, '
                               'health insurance, then 15-20% in equity SIPs (ELSS for tax saving), '
                               'followed by NPS for retirement and FD/debt for stability.',
                    'source':  'Quora',
                    'query':   'India salary investment strategy',
                },
                {
                    'title':   'Tax Saving Investments Under Section 80C — ClearTax',
                    'url':     'https://cleartax.in/s/80c-deductions',
                    'snippet': 'Section 80C allows ₹1.5 lakh deduction via ELSS, PPF, EPF, NPS, '
                               'life insurance premiums and home loan principal. ELSS has shortest lock-in (3 yrs) '
                               'and highest return potential.',
                    'source':  'Web',
                    'query':   'India tax saving investment 80C',
                },
                {
                    'title':   'SIP Investment Strategy for Beginners — Moneycontrol',
                    'url':     'https://www.moneycontrol.com/mutual-funds/sip/',
                    'snippet': 'Systematic Investment Plans allow you to invest as low as ₹500/month in mutual funds. '
                               'Equity SIPs have historically delivered 12-15% CAGR over 10+ year horizons. '
                               'Use SIP calculators to plan goal-based investing.',
                    'source':  'MoneyControl',
                    'query':   'SIP mutual fund India beginner',
                },
                {
                    'title':   'Emergency Fund — How Much & Where to Keep It',
                    'url':     'https://www.reddit.com/r/IndiaInvestments/comments/emergency_fund/',
                    'snippet': 'Most Reddit India Finance community members recommend 3-6 months of expenses '
                               'in a liquid fund or high-interest savings account. Avoid FD for emergency fund '
                               'due to premature withdrawal penalties.',
                    'source':  'Reddit',
                    'query':   'India emergency fund savings strategy',
                },
            ]

            if 'house' in goals:
                sources.append({
                    'title':   'Home Loan Planning in India — EMI vs Rent Decision',
                    'url':     'https://www.reddit.com/r/IndiaInvestments/search/?q=home+loan',
                    'snippet': 'Reddit community consensus: save 20-30% down payment first, '
                               'keep home loan EMI under 40% of take-home. '
                               'Compare pre-EMI vs full EMI carefully. Use SBI/HDFC loan calculator.',
                    'source':  'Reddit',
                    'query':   'India home loan planning down payment',
                })

            if 'retirement' in goals:
                sources.append({
                    'title':   'NPS vs PPF for Retirement Planning — Detailed Comparison',
                    'url':     'https://zerodha.com/varsity/chapter/nps/',
                    'snippet': 'NPS offers additional ₹50,000 tax deduction under 80CCD(1B). '
                               'Equity allocation (E tier) has delivered ~12% CAGR since 2009. '
                               'PPF provides guaranteed 7.1% with full tax exemption under EEE.',
                    'source':  'Zerodha Varsity',
                    'query':   'NPS PPF retirement planning India',
                })

            if 'education' in goals:
                sources.append({
                    'title':   "Child Education Planning — Sukanya/SIP Strategy",
                    'url':     'https://www.moneycontrol.com/news/business/personal-finance/',
                    'snippet': "Start early with Sukanya Samriddhi Yojana (8.2% for girl child) or "
                               "equity SIP. A ₹5,000/month SIP started at child's birth grows to ~₹35L by age 18 "
                               "at 12% CAGR — enough for a good college degree.",
                    'source':  'MoneyControl',
                    'query':   'child education fund India SIP Sukanya',
                })

        else:
            # International / USD sources
            sources += [
                {
                    'title':   'r/personalfinance — Prime Directive (Financial Order of Operations)',
                    'url':     'https://www.reddit.com/r/personalfinance/wiki/commontopics/',
                    'snippet': "Reddit's personal finance community recommends: budget first, "
                               '3-6 month emergency fund, 401(k) match, pay off high-interest debt, '
                               'max Roth IRA ($7,000/yr), then max 401(k), then taxable brokerage.',
                    'source':  'Reddit',
                    'query':   f'{profession} US personal finance',
                },
                {
                    'title':   '3-Fund Portfolio — Bogleheads Wiki',
                    'url':     'https://www.bogleheads.org/wiki/Three-fund_portfolio',
                    'snippet': 'The simplest diversified long-term portfolio: Total US Market index (60%), '
                               'Total International index (30%), Total Bond Market (10%). '
                               'Low fees, automatic rebalancing, outperforms most active managers over 20 years.',
                    'source':  'Web',
                    'query':   'US index fund investment strategy',
                },
                {
                    'title':   'Investopedia: How to Build Wealth on a Salary',
                    'url':     'https://www.investopedia.com/articles/personal-finance/building-wealth/',
                    'snippet': 'Key principles: maximize employer 401(k) match (free money), '
                               'invest in low-cost index funds, avoid lifestyle inflation, '
                               'diversify across asset classes, automate savings.',
                    'source':  'Investopedia',
                    'query':   f'{profession} build wealth salary',
                },
                {
                    'title':   'Quora: How should I invest my first $10,000?',
                    'url':     'https://www.quora.com/What-should-I-do-with-my-first-10000-in-savings',
                    'snippet': 'Top financial advisors on Quora recommend: pay off any debt over 7% interest, '
                               'keep 3 months expenses liquid, put rest in S&P 500 ETF (VOO/VTI). '
                               'Time in market > timing the market.',
                    'source':  'Quora',
                    'query':   'US invest first savings',
                },
            ]

            if 'retirement' in goals:
                sources.append({
                    'title':   'Early Retirement Planning — FIRE Movement Guide',
                    'url':     'https://www.reddit.com/r/financialindependence/wiki/index/',
                    'snippet': 'FIRE (Financial Independence, Retire Early) requires 25x annual expenses saved '
                               '(4% withdrawal rule). With $60K/yr expenses, target $1.5M. '
                               'Track savings rate: retiring at 40 requires ~50% savings rate.',
                    'source':  'Reddit',
                    'query':   'FIRE retirement planning US',
                })

        return sources
