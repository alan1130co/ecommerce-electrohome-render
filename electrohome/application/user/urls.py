# application/user/urls.py
from django.urls import path
from django.contrib.auth import views as auth_views
from . import views

app_name = 'user'

urlpatterns = [
    # ===== REGISTRO Y LOGIN =====
    path('register/', views.register_view, name='register'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    
    # ===== VERIFICACIÓN DE CORREO =====
    path('verification-sent/', views.verification_sent, name='verification_sent'),
    path('verify-email/<uidb64>/<token>/', views.verify_email, name='verify_email'),
    path('verification-success/', views.verification_success, name='verification_success'),
    path('verification-failed/', views.verification_failed, name='verification_failed'),
    path('resend-verification/', views.resend_verification, name='resend_verification'),
    
    # ===== PERFIL =====
    path('profile/', views.profile_view, name='profile'),
    path('profile/edit/', views.edit_profile, name='edit_profile'),
    
    # ===== RECUPERACIÓN DE CONTRASEÑA =====
    path('password-reset/', 
         auth_views.PasswordResetView.as_view(
             template_name='user/password_reset.html',
             email_template_name='user/password_reset_email.html',
             subject_template_name='user/password_reset_subject.txt',
             success_url='/user/password-reset/done/'
         ), 
         name='password_reset'),
    
    path('password-reset/done/', 
         auth_views.PasswordResetDoneView.as_view(
             template_name='user/password_reset_done.html'
         ), 
         name='password_reset_done'),
    
    path('password-reset-confirm/<uidb64>/<token>/', 
         auth_views.PasswordResetConfirmView.as_view(
             template_name='user/password_reset_confirm.html',
             success_url='/user/password-reset-complete/'
         ), 
         name='password_reset_confirm'),
    
    path('password-reset-complete/', 
         auth_views.PasswordResetCompleteView.as_view(
             template_name='user/password_reset_complete.html'
         ), 
         name='password_reset_complete'),
]