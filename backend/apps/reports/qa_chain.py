import logging
from django.conf import settings

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are an expert investment advisor AI assistant. A user has received an investment report and wants to ask follow-up questions about it.

## User Investment Profile
- Risk Tolerance: {risk_tolerance}
- Investment Budget: ${budget}
- Sectors of Interest: {sectors}
- Investment Horizon: {time_horizon}
- Investment Goal: {investment_goal}

## Their Investment Report
{full_report}

## Past Investment Context (from memory)
{memory_context}

Guidelines for your response:
- Be specific — reference actual tickers, percentages, and numbers from the report
- Structure answers with headers, bullet points, and **bold text** where helpful
- Always relate your answer back to the user's risk profile and goals
- If the question is outside the scope of the report, acknowledge it and answer generally
- Keep a professional but friendly tone
- If asked about risks, be honest and thorough
- If asked to compare options, lay them out clearly in a table or list"""


def _build_chain():
    """Build LangChain LCEL chain: prompt | ChatGroq | StrOutputParser."""
    from langchain_groq import ChatGroq
    from langchain_core.prompts import ChatPromptTemplate
    from langchain_core.output_parsers import StrOutputParser

    llm = ChatGroq(
        groq_api_key=settings.GROQ_API_KEY,
        model_name="llama-3.1-8b-instant",
        temperature=0.3,
        streaming=True,
    )
    prompt = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT),
        ("human", "{question}"),
    ])
    return prompt | llm | StrOutputParser()


def stream_qa_answer(report, profile, memory_context, question):
    """
    Stream answer tokens for a Q&A question about an investment report.

    Yields string chunks as they arrive from the LLM.
    Falls back to the existing requests-based LLM client if LangChain fails.
    """
    inputs = {
        "risk_tolerance": profile.get("risk_tolerance", "moderate"),
        "budget": profile.get("budget", "N/A"),
        "sectors": ", ".join(profile.get("sectors") or []) or "general",
        "time_horizon": profile.get("time_horizon", "medium"),
        "investment_goal": profile.get("investment_goal", "wealth growth"),
        # Truncate report to stay within token limits (llama-3.1-8b has 128k ctx)
        "full_report": (report.full_report or "")[:10000],
        "memory_context": "\n\n".join(
            str(m.get("document", "")) for m in (memory_context or [])[:4]
        ) or "No prior investment history found.",
        "question": question,
    }

    try:
        chain = _build_chain()
        yield from chain.stream(inputs)
    except Exception as e:
        logger.warning(f"LangChain Q&A failed, using fallback: {e}")
        yield from _fallback_answer(inputs, question)


def _fallback_answer(inputs, question):
    """
    Non-streaming fallback using the existing Groq/HuggingFace client
    when LangChain is unavailable.
    """
    try:
        from core.llm.huggingface_client import LLMClient

        prompt = f"""You are an investment advisor. Answer the following question based on this investment report.

PROFILE: Risk={inputs['risk_tolerance']}, Budget=${inputs['budget']}, Sectors={inputs['sectors']}

REPORT:
{inputs['full_report'][:6000]}

QUESTION: {question}

Provide a detailed, structured answer:"""

        client = LLMClient()
        answer = client.generate(prompt, max_tokens=800)
        yield answer
    except Exception as e:
        yield f"Unable to answer at this time. Error: {str(e)}"
