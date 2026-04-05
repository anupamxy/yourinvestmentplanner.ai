from django.apps import AppConfig


class DiscussionsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.discussions'

    def ready(self):
        from django.db.models.signals import post_migrate
        post_migrate.connect(self._seed_rooms, sender=self)

    def _seed_rooms(self, **kwargs):
        try:
            from .models import Room
            defaults = [
                ('Indian Stocks',   'stocks',       'indian-stocks',   'Discuss NSE/BSE listed stocks, earnings, sector trends'),
                ('Mutual Funds',    'mutual_funds', 'mutual-funds',    'SIP strategies, fund comparisons, NAV tracking'),
                ('US & Global',     'stocks',       'us-global',       'S&P 500, NASDAQ, global ETFs and world markets'),
                ('Crypto',          'crypto',       'crypto',          'Bitcoin, altcoins, DeFi, portfolio strategies'),
                ('Tax & Planning',  'tax',          'tax-planning',    'Section 80C, LTCG/STCG, tax-saving instruments'),
                ('Financial Goals', 'goals',        'financial-goals', 'Home, retirement, education — share your goal plans'),
                ('General Chat',    'general',      'general',         'Anything finance — news, opinions, questions'),
            ]
            for name, cat, slug, desc in defaults:
                Room.objects.get_or_create(slug=slug, defaults={
                    'name': name, 'category': cat, 'description': desc,
                })
        except Exception:
            pass
