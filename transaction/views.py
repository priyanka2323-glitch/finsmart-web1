from django.shortcuts import render
from rest_framework import generics, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Sum
from .models import Transaction, Category
from .serializers import TransactionSerializer, CategorySerializer

DEFAULT_CATEGORIES = [
    {'name': 'Food', 'icon': 'FO', 'color': '#e85d04', 'type': 'expense'},
    {'name': 'Home Expenses', 'icon': 'HM', 'color': '#dc2626', 'type': 'expense'},
    {'name': 'Transportation', 'icon': 'TR', 'color': '#d97706', 'type': 'expense'},
    {'name': 'Shopping', 'icon': 'SH', 'color': '#c026d3', 'type': 'expense'},
    {'name': 'Healthcare', 'icon': 'HC', 'color': '#dc2626', 'type': 'expense'},
    {'name': 'Education', 'icon': 'ED', 'color': '#0284c7', 'type': 'expense'},
    {'name': 'Entertainment', 'icon': 'EN', 'color': '#db2777', 'type': 'expense'},
    {'name': 'Travel', 'icon': 'TV', 'color': '#0d9488', 'type': 'expense'},
    {'name': 'Rent', 'icon': 'RT', 'color': '#7c3aed', 'type': 'expense'},
    {'name': 'Electricity', 'icon': 'EL', 'color': '#f59e0b', 'type': 'expense'},
    {'name': 'Mobile/Internet', 'icon': 'MB', 'color': '#0891b2', 'type': 'expense'},
    {'name': 'Insurance', 'icon': 'IN', 'color': '#4f46e5', 'type': 'expense'},
    {'name': 'Taxes', 'icon': 'TX', 'color': '#64748b', 'type': 'expense'},
    {'name': 'Salary', 'icon': 'SA', 'color': '#16a34a', 'type': 'income'},
    {'name': 'Freelance', 'icon': 'FR', 'color': '#0891b2', 'type': 'income'},
    {'name': 'Business', 'icon': 'BU', 'color': '#d97706', 'type': 'income'},
    {'name': 'Investment', 'icon': 'IV', 'color': '#7c3aed', 'type': 'income'},
    {'name': 'Rental Income', 'icon': 'RI', 'color': '#0d9488', 'type': 'income'},
    {'name': 'Other', 'icon': 'OT', 'color': '#64748b', 'type': 'income'},
]


def ensure_default_categories():
    if Category.objects.exists():
        return
    Category.objects.bulk_create([
        Category(**category, is_default=True)
        for category in DEFAULT_CATEGORIES
    ])

class CategoryListView(generics.ListAPIView): 
    serializer_class = CategorySerializer 
    permission_classes = [permissions.AllowAny] 
    def get_queryset(self): 
        ensure_default_categories() 
        return Category.objects.all().order_by('type', 'name')

class TransactionListCreateView(generics.ListCreateAPIView):
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Transaction.objects.filter(user=self.request.user).select_related('category')
        month = self.request.query_params.get('month')
        year = self.request.query_params.get('year')
        category_type = self.request.query_params.get('type')
        if month and year:
            qs = qs.filter(date__month=month, date__year=year)
        if category_type:
            qs = qs.filter(category__type=category_type)
        return qs.order_by('-date')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class TransactionDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user)
# Create your views here.
