from django.urls import path
from . import views

app_name = 'registry'

urlpatterns = [
    path('', views.dashboard, name='dashboard'),
    path('patients/', views.patient_list, name='patient_list'),
    path('patients/create/', views.patient_create, name='patient_create'),
    path('patients/<int:pk>/', views.patient_detail, name='patient_detail'),
    path('patients/<int:pk>/edit/', views.patient_edit, name='patient_edit'),
    path('appointments/', views.appointment_list, name='appointment_list'),
    path('appointments/create/', views.appointment_create, name='appointment_create'),
    path('appointments/<int:pk>/', views.appointment_detail, name='appointment_detail'),
    path('appointments/<int:pk>/cancel/', views.appointment_cancel, name='appointment_cancel'),
    path('doctors/', views.doctor_list, name='doctor_list'),
    path('schedules/', views.schedule_list, name='schedule_list'),
    path('my-appointments/', views.my_appointments, name='my_appointments'),
]
