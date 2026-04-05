import json
import logging
from django.conf import settings
from .context import LifeAdvisorContext

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are a world-class personal financial life advisor AI. You have deep expertise in personal finance, career growth, family financial planning, investment strategies, and life goal planning.

You will receive:
1. A complete life profile of the user
2. Real community research snippets from Reddit, Quora, and financial websites
3. Their life goals and financial situation

Your task: Generate a comprehensive, personalized financial life plan as a JSON object.

IMPORTANT: Respond ONLY with valid JSON. No markdown, no explanation outside the JSON.

Return this exact JSON structure:
{
  "financial_health_score": <integer 0-100>,
  "financial_health_label": "<Poor|Fair|Good|Excellent>",
  "summary": "<2-3 sentence personalized overview>",
  "monthly_breakdown": {
    "income": <number>,
    "expenses": <number>,
    "total_emi": <number>,
    "disposable": <number>,
    "recommended_savings": <number>,
    "savings_rate_pct": <number>
  },
  "immediate_actions": [
    {
      "priority": "<critical|high|medium>",
      "title": "<short title>",
      "description": "<1-2 sentences>",
      "timeline": "<e.g. This month / Next 3 months>",
      "amount": <number or 0>
    }
  ],
  "goals_timeline": [
    {
      "goal": "<goal name>",
      "icon": "<single emoji>",
      "target_year": <year>,
      "corpus_needed": <number>,
      "monthly_saving_needed": <number>,
      "strategy": "<specific strategy in 1-2 sentences>"
    }
  ],
  "investment_plan": [
    {
      "instrument": "<instrument name e.g. SIP - NIFTY 50 Index Fund>",
      "monthly_amount": <number>,
      "expected_annual_return": "<e.g. 12%>",
      "risk_level": "<low|medium|high>",
      "why": "<1 sentence rationale>"
    }
  ],
  "community_insights": [
    {
      "source": "<Reddit|Quora|LinkedIn|Web>",
      "insight": "<1-2 sentence insight from community research>",
      "url": "<url or empty string>"
    }
  ],
  "risk_flags": ["<risk warning 1>", "<risk warning 2>"],
  "tax_tips": ["<tax tip 1>", "<tax tip 2>"],
  "motivation": "<1-2 sentences personalized motivation>"
}"""


def _build_user_message(profile: dict, web_research: list) -> str:
    currency = profile.get('currency', 'INR')
    symbol = '₹' if currency == 'INR' else '$'
    goals = profile.get('life_goals', [])
    goals_detail = profile.get('goals_detail', {})
    loans = profile.get('existing_loans', [])

    loans_str = "\n".join(
        f"  - {l.get('type','Loan')}: {symbol}{l.get('emi_amount',0)}/month, {l.get('remaining_months',0)} months left"
        for l in loans
    ) or "  None"

    goals_str = "\n".join(
        f"  - {g}: {goals_detail.get(g, {})}" for g in goals
    ) or "  None specified"

    research_str = "\n\n".join(
        f"[{r['source']}] {r['title']}\n{r['snippet']}"
        for r in web_research[:8]
    ) or "No community research available."

    return f"""## USER LIFE PROFILE

**Professional**
- Profession: {profile.get('profession', 'N/A')}
- Employer: {profile.get('employer', 'N/A')}
- Monthly Salary: {symbol}{profile.get('monthly_salary', 0):,} {currency}
- Years of Experience: {profile.get('years_of_experience', 0)}

**Personal**
- Age: {profile.get('age', 'N/A')}
- City: {profile.get('city', 'N/A')}
- Marital Status: {profile.get('marital_status', 'N/A')}
- Family Members: {profile.get('family_members', 1)} (Dependents: {profile.get('dependents', 0)})

**Current Finances**
- Monthly Expenses: {symbol}{profile.get('monthly_expenses', 0):,}
- Existing Savings: {symbol}{profile.get('existing_savings', 0):,}
- Existing Loans / EMIs:
{loans_str}

**Life Goals**
{goals_str}

**Currency / Market**: {currency}

---

## COMMUNITY RESEARCH (Reddit, Quora, Financial Sites)

{research_str}

---

Generate the comprehensive financial life plan JSON now."""


def run_life_llm(context: LifeAdvisorContext) -> dict:
    """
    Call Groq (LangChain) with JSON mode to get a structured life advisor report.
    Falls back to a requests-based call if LangChain fails.
    """
    try:
        return _run_langchain(context)
    except Exception as e:
        logger.warning(f"LangChain life advisor failed: {e}. Trying fallback.")
        try:
            return _run_requests_fallback(context)
        except Exception as e2:
            logger.error(f"Life advisor LLM fallback also failed: {e2}")
            return _minimal_fallback(context)


def _run_langchain(context: LifeAdvisorContext) -> dict:
    from langchain_groq import ChatGroq
    from langchain_core.prompts import ChatPromptTemplate
    from langchain_core.output_parsers import JsonOutputParser

    llm = ChatGroq(
        groq_api_key=settings.GROQ_API_KEY,
        model_name="llama-3.3-70b-versatile",   # larger model for structured JSON
        temperature=0.2,
        model_kwargs={"response_format": {"type": "json_object"}},
    )

    prompt = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT),
        ("human", "{user_message}"),
    ])

    chain = prompt | llm | JsonOutputParser()
    return chain.invoke({
        "user_message": _build_user_message(context.life_profile, context.web_research)
    })


def _run_requests_fallback(context: LifeAdvisorContext) -> dict:
    import requests

    user_msg = _build_user_message(context.life_profile, context.web_research)
    payload = {
        "model": "llama-3.1-8b-instant",
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_msg},
        ],
        "temperature": 0.2,
        "response_format": {"type": "json_object"},
    }
    headers = {"Authorization": f"Bearer {settings.GROQ_API_KEY}", "Content-Type": "application/json"}
    resp = requests.post("https://api.groq.com/openai/v1/chat/completions", json=payload, headers=headers, timeout=60)
    resp.raise_for_status()
    return json.loads(resp.json()["choices"][0]["message"]["content"])


def _minimal_fallback(context: LifeAdvisorContext) -> dict:
    """Return a basic structured report when all LLM calls fail."""
    p = context.life_profile
    salary = float(p.get('monthly_salary', 0))
    expenses = float(p.get('monthly_expenses', 0))
    loans_total = sum(float(l.get('emi_amount', 0)) for l in p.get('existing_loans', []))
    disposable = salary - expenses - loans_total
    savings_rate = (disposable / salary * 100) if salary else 0
    score = min(100, max(0, int(savings_rate * 1.5 + 30)))
    return {
        "financial_health_score": score,
        "financial_health_label": "Fair",
        "summary": f"Based on your profile as a {p.get('profession','professional')} with a salary of {p.get('monthly_salary',0)}, here is your financial overview.",
        "monthly_breakdown": {
            "income": salary, "expenses": expenses, "total_emi": loans_total,
            "disposable": disposable, "recommended_savings": disposable * 0.5,
            "savings_rate_pct": round(savings_rate, 1),
        },
        "immediate_actions": [
            {"priority": "high", "title": "Build Emergency Fund", "description": "Save 6 months of expenses.", "timeline": "Next 6 months", "amount": expenses * 6}
        ],
        "goals_timeline": [],
        "investment_plan": [],
        "community_insights": [],
        "risk_flags": ["LLM service unavailable — report is approximate"],
        "tax_tips": [],
        "motivation": "Every financial journey starts with a single step. You're already ahead by planning!",
    }
