from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import RegisterView, LoginView, ProfileView, GoogleLoginView, DeleteAccountView

urlpatterns = [
    path('register/', RegisterView.as_view()),
    path('login/', LoginView.as_view()),
    path('profile/', ProfileView.as_view()),
    path('token/refresh/', TokenRefreshView.as_view()),
    path('google/', GoogleLoginView.as_view()),
    path('delete/', DeleteAccountView.as_view()),
]
