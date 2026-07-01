from django.db import models
from django.db import models
from django.contrib.auth.models import User
from transaction.models import Category

class RecurringBill(models.Model):
    FREQUENCY_CHOICES = [
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
        ('yearly', 'Yearly'),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=200)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True)
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES)
    due_day = models.IntegerField()  # day of month (1-31)
    next_due_date = models.DateField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user} - {self.name} - ₹{self.amount}"

class BillPayment(models.Model):
    STATUS_CHOICES = [
        ('created', 'Created'),
        ('paid', 'Paid'),
        ('failed', 'Failed'),
        ('missed', 'Missed'),
        ('upcoming', 'Upcoming'),
    ]
    bill = models.ForeignKey(RecurringBill, on_delete=models.CASCADE)
    amount_paid = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    paid_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='upcoming')
    razorpay_order_id = models.CharField(max_length=128, blank=True, null=True)
    razorpay_payment_id = models.CharField(max_length=128, blank=True, null=True)
    razorpay_signature = models.CharField(max_length=256, blank=True, null=True)

    def __str__(self):
        return f"{self.bill.name} - {self.status}"
# Create your models here.
