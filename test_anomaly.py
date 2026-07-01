import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'finsmart.settings')
django.setup()

from django.urls import reverse
from reports.urls import urlpatterns

print("Reports URL patterns:")
for pattern in urlpatterns:
    print(f"  {pattern.pattern}")

# Also check main urls
from django.urls import get_resolver
resolver = get_resolver()
print("\nAll registered URLs containing 'anomaly':")
for pattern in resolver.url_patterns:
    if 'anomaly' in str(pattern):
        print(f"  {pattern}")
