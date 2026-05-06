from django.urls import path
from . import views

app_name = 'accounts'

urlpatterns = [
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('register/', views.register_patient_view, name='register'),
    path('cabinet/', views.patient_cabinet_view, name='patient_cabinet'),
]
