from dataclasses import dataclass, field


@dataclass
class LifeAdvisorContext:
    user_id: str
    run_id: str
    life_profile: dict
    web_research: list = field(default_factory=list)   # [{title, url, snippet, source}]
    structured_report: dict = field(default_factory=dict)
    errors: list = field(default_factory=list)
