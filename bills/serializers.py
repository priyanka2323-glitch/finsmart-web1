from rest_framework import serializers
from .models import BillPayment, RecurringBill


class RecurringBillSerializer(serializers.ModelSerializer):
    class Meta:
        model = RecurringBill
        fields = [
            'id', 'name', 'amount', 'category',
            'frequency', 'due_day', 'next_due_date',
            'is_active', 'created_at', 'user',
        ]
        read_only_fields = ['created_at', 'user']


class BillPaymentSerializer(serializers.ModelSerializer):
    bill_detail = RecurringBillSerializer(source='bill', read_only=True)

    class Meta:
        model = BillPayment
        fields = ['id', 'bill', 'bill_detail', 'amount_paid', 'paid_date', 'status']