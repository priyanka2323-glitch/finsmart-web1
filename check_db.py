import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'finsmart.settings')
django.setup()

from django.db import connection
from django.db.backends.utils import truncate_name

# List all tables
with connection.cursor() as cur:
    cur.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
    """)
    tables = [t[0] for t in cur.fetchall()]
    print(f"Tables in database: {len(tables)}")
    for t in tables:
        print(f"  - {t}")

# Check bills_recurringbill
from bills.models import RecurringBill
print(f"\nRecurringBill count: {RecurringBill.objects.count()}")
print(f"RecurringBill.objects.all(): {RecurringBill.objects.values('id', 'name', 'user_id', 'is_active')}")
