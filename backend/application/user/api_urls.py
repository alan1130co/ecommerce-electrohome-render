from django.urls import path

from . import api_views

app_name = 'user_api'

urlpatterns = [
    path('login/', api_views.LoginAPIView.as_view(), name='login'),
    path('logout/', api_views.LogoutAPIView.as_view(), name='logout'),
    path('me/', api_views.MeAPIView.as_view(), name='me'),
    path('register/', api_views.RegisterAPIView.as_view(), name='register'),
    path('verify-email/<uidb64>/<token>/', api_views.VerifyEmailAPIView.as_view(), name='verify_email'),
    path('resend-verification/', api_views.ResendVerificationAPIView.as_view(), name='resend_verification'),
    path('password-reset/', api_views.PasswordResetRequestAPIView.as_view(), name='password_reset'),
    path(
        'password-reset-confirm/<uidb64>/<token>/',
        api_views.PasswordResetConfirmAPIView.as_view(),
        name='password_reset_confirm',
    ),
    path('profile/', api_views.ProfileAPIView.as_view(), name='profile'),
]
