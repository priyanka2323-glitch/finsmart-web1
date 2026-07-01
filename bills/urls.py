from django.urls import path
from . import views   
urlpatterns = [
    path('recurring/', views.RecurringBillListCreateView.as_view()),
    path('recurring/<int:pk>/', views.RecurringBillDetailView.as_view()),
    path('upcoming/', views.UpcomingBillsView.as_view()),
    path('pay/<int:pk>/', views.PayBillView.as_view()),
    path('pay-order/<int:pk>/', views.CreateBillOrderView.as_view()),
    path('pay-verify/<int:pk>/', views.VerifyBillPaymentView.as_view()),
    path('webhook/', views.razorpay_webhook),
]
