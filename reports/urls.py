from django.urls import path
from . import views
from .views import Investment80CView, MonthlyReportView, YearlyReportView, TaxEstimatorView, SpendingAnomalyView, AIFinancialAdvisorView
urlpatterns = [
    path('monthly/', MonthlyReportView.as_view()),
    path('yearly/', YearlyReportView.as_view()),
    path('tax/estimate/', TaxEstimatorView.as_view()),
    path('tax/80c/', Investment80CView.as_view()),
    path('anomalies/', SpendingAnomalyView.as_view()),
    path('ai/chat/', AIFinancialAdvisorView.as_view()),
]
