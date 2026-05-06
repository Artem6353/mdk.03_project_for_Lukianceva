from django.contrib import admin
from .models import Patient, Doctor, Schedule, Appointment


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ('last_name', 'first_name', 'middle_name', 'date_of_birth', 'gender', 'phone', 'oms_number', 'created_at')
    list_filter = ('gender', 'created_at')
    search_fields = ('last_name', 'first_name', 'middle_name', 'phone', 'oms_number', 'snils')
    ordering = ('last_name', 'first_name')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        ('Персональные данные', {
            'fields': ('last_name', 'first_name', 'middle_name', 'date_of_birth', 'gender')
        }),
        ('Контактная информация', {
            'fields': ('address', 'phone')
        }),
        ('Документы', {
            'fields': ('oms_number', 'snils')
        }),
        ('Даты', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Doctor)
class DoctorAdmin(admin.ModelAdmin):
    list_display = ('user', 'specialty', 'cabinet', 'work_schedule')
    list_filter = ('specialty',)
    search_fields = ('user__first_name', 'user__last_name', 'specialty')
    ordering = ('user__last_name',)


@admin.register(Schedule)
class ScheduleAdmin(admin.ModelAdmin):
    list_display = ('doctor', 'date', 'start_time', 'end_time', 'is_available')
    list_filter = ('date', 'is_available', 'doctor')
    search_fields = ('doctor__user__first_name', 'doctor__user__last_name')
    ordering = ('date', 'start_time')
    date_hierarchy = 'date'


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ('patient', 'doctor', 'appointment_date', 'appointment_time', 'status', 'created_at')
    list_filter = ('status', 'appointment_date', 'doctor')
    search_fields = ('patient__last_name', 'patient__first_name', 'doctor__user__first_name', 'doctor__user__last_name')
    ordering = ('-appointment_date', '-appointment_time')
    date_hierarchy = 'appointment_date'
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        ('Основная информация', {
            'fields': ('patient', 'doctor', 'schedule', 'appointment_date', 'appointment_time', 'status')
        }),
        ('Медицинская информация', {
            'fields': ('complaint', 'diagnosis', 'notes')
        }),
        ('Даты', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
