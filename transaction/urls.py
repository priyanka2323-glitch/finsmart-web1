from django.urls import path
from .views import (
    CategoryListView,
    TransactionListCreateView,
    TransactionDetailView,
)

urlpatterns = [
    path('categories/', CategoryListView.as_view()),
    path('transactions/', TransactionListCreateView.as_view()),
    path('transactions/<int:pk>/', TransactionDetailView.as_view()),
]