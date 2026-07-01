from django.core.management.base import BaseCommand
from transaction.models import Category

class Command(BaseCommand):
    help = 'Seed default Indian categories'

    def handle(self, *args, **kwargs):
        categories = [
            # Expense
            {'name': 'Food',             'icon': '🍛', 'color': '#e85d04', 'type': 'expense'},
            {'name': 'Home Expenses',    'icon': '🏠', 'color': '#dc2626', 'type': 'expense'},
            {'name': 'Transportation',   'icon': '🚗', 'color': '#d97706', 'type': 'expense'},
            {'name': 'Shopping',         'icon': '🛍️', 'color': '#c026d3', 'type': 'expense'},
            {'name': 'Healthcare',       'icon': '🏥', 'color': '#dc2626', 'type': 'expense'},
            {'name': 'Education',        'icon': '📚', 'color': '#0284c7', 'type': 'expense'},
            {'name': 'Entertainment',    'icon': '🎬', 'color': '#db2777', 'type': 'expense'},
            {'name': 'Travel',           'icon': '✈️', 'color': '#0d9488', 'type': 'expense'},
            {'name': 'Rent',             'icon': '🏘️', 'color': '#7c3aed', 'type': 'expense'},
            {'name': 'Electricity',      'icon': '💡', 'color': '#f59e0b', 'type': 'expense'},
            {'name': 'Mobile/Internet',  'icon': '📱', 'color': '#0891b2', 'type': 'expense'},
            {'name': 'Insurance',        'icon': '🛡️', 'color': '#4f46e5', 'type': 'expense'},
            {'name': 'Taxes',            'icon': '📋', 'color': '#64748b', 'type': 'expense'},
            # Income
            {'name': 'Salary',           'icon': '💼', 'color': '#16a34a', 'type': 'income'},
            {'name': 'Freelance',        'icon': '💻', 'color': '#0891b2', 'type': 'income'},
            {'name': 'Business',         'icon': '🏪', 'color': '#d97706', 'type': 'income'},
            {'name': 'Investment',       'icon': '📈', 'color': '#7c3aed', 'type': 'income'},
            {'name': 'Rental Income',    'icon': '🏘️', 'color': '#0d9488', 'type': 'income'},
            {'name': 'Other',            'icon': '💰', 'color': '#64748b', 'type': 'income'},
        ]

        for cat in categories:
            Category.objects.get_or_create(
                name=cat['name'],
                defaults={**cat, 'is_default': True}
            )
            self.stdout.write(f"✅ {cat['name']}")

        self.stdout.write(self.style.SUCCESS('Categories seeded!'))
        
