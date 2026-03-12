from django.urls import path
from . import views

app_name = 'chatbot'

urlpatterns = [
    path('api/message/', views.chat_message, name='api_message'),
    path('historial/<str:session_id>/', views.get_conversation_history, name='chat_history'),
]