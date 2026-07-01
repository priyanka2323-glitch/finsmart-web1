from django.contrib import admin
from .models import RecurringBill, BillPayment

admin.site.register(RecurringBill)
admin.site.register(BillPayment)
# Register your models here.
