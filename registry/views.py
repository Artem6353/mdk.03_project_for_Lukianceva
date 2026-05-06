from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.db.models import Q
from .models import Patient, Doctor, Appointment, Schedule
from .forms import PatientRegistrationForm, PatientSearchForm, AppointmentForm
from accounts.models import User


@login_required
def dashboard(request):
    """Главная страница (дашборд)"""
    context = {}
    
    if request.user.role == 'registrator' or request.user.role == 'admin':
        context['today_appointments'] = Appointment.objects.filter(
            appointment_date__exact='2025-01-01'  # Заглушка, будет динамически
        ).count()
        context['patients_count'] = Patient.objects.count()
    elif request.user.role == 'doctor':
        try:
            doctor = request.user.doctor_profile
            context['my_appointments'] = Appointment.objects.filter(
                doctor=doctor,
                status='scheduled'
            )[:5]
        except Doctor.DoesNotExist:
            pass
    
    return render(request, 'registry/dashboard.html', context)


@login_required
def patient_list(request):
    """Страница регистратора - список пациентов (Рисунок 9)"""
    
    # Только регистраторы и админы могут просматривать всех пациентов
    if request.user.role not in ['registrator', 'admin']:
        messages.error(request, 'У вас нет доступа к этой странице')
        return redirect('registry:dashboard')
    
    search_form = PatientSearchForm(request.GET or None)
    patients = Patient.objects.all()
    
    if search_form.is_valid() and search_form.cleaned_data.get('search_query'):
        query = search_form.cleaned_data['search_query']
        patients = patients.filter(
            Q(last_name__icontains=query) |
            Q(first_name__icontains=query) |
            Q(middle_name__icontains=query) |
            Q(phone__icontains=query) |
            Q(oms_number__icontains=query)
        )
    
    context = {
        'patients': patients,
        'search_form': search_form,
    }
    return render(request, 'registry/patient_list.html', context)


@login_required
def patient_create(request):
    """Страница регистрации пациента (Рисунок 5)"""
    
    if request.user.role not in ['registrator', 'admin']:
        messages.error(request, 'У вас нет доступа к этой странице')
        return redirect('registry:dashboard')
    
    if request.method == 'POST':
        form = PatientRegistrationForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, 'Пациент успешно зарегистрирован')
            return redirect('registry:patient_list')
    else:
        form = PatientRegistrationForm()
    
    context = {'form': form}
    return render(request, 'registry/patient_form.html', context)


@login_required
def patient_detail(request, pk):
    """Детальная информация о пациенте"""
    
    patient = get_object_or_404(Patient, pk=pk)
    appointments = patient.appointments.all()[:10]
    
    context = {
        'patient': patient,
        'appointments': appointments,
    }
    return render(request, 'registry/patient_detail.html', context)


@login_required
def patient_edit(request, pk):
    """Редактирование данных пациента"""
    
    if request.user.role not in ['registrator', 'admin']:
        messages.error(request, 'У вас нет доступа к этой странице')
        return redirect('registry:dashboard')
    
    patient = get_object_or_404(Patient, pk=pk)
    
    if request.method == 'POST':
        form = PatientRegistrationForm(request.POST, instance=patient)
        if form.is_valid():
            form.save()
            messages.success(request, 'Данные пациента обновлены')
            return redirect('registry:patient_detail', pk=patient.pk)
    else:
        form = PatientRegistrationForm(instance=patient)
    
    context = {'form': form, 'patient': patient}
    return render(request, 'registry/patient_form.html', context)


@login_required
def appointment_list(request):
    """Список записей на прием"""
    
    if request.user.role not in ['registrator', 'admin', 'doctor']:
        messages.error(request, 'У вас нет доступа к этой странице')
        return redirect('registry:dashboard')
    
    appointments = Appointment.objects.select_related('patient', 'doctor').all()
    
    if request.user.role == 'doctor':
        try:
            doctor = request.user.doctor_profile
            appointments = appointments.filter(doctor=doctor)
        except Doctor.DoesNotExist:
            appointments = Appointment.objects.none()
    
    context = {'appointments': appointments}
    return render(request, 'registry/appointment_list.html', context)


@login_required
def appointment_create(request):
    """Создание записи на прием"""
    
    if request.user.role not in ['registrator', 'admin']:
        messages.error(request, 'У вас нет доступа к этой странице')
        return redirect('registry:dashboard')
    
    if request.method == 'POST':
        form = AppointmentForm(request.POST)
        if form.is_valid():
            appointment = form.save(commit=False)
            appointment.save()
            messages.success(request, 'Запись создана')
            return redirect('registry:appointment_list')
    else:
        form = AppointmentForm()
    
    context = {'form': form}
    return render(request, 'registry/appointment_form.html', context)


@login_required
def appointment_detail(request, pk):
    """Детали записи на прием"""
    
    appointment = get_object_or_404(Appointment, pk=pk)
    context = {'appointment': appointment}
    return render(request, 'registry/appointment_detail.html', context)


@login_required
def appointment_cancel(request, pk):
    """Отмена записи на прием"""
    
    if request.user.role not in ['registrator', 'admin']:
        messages.error(request, 'У вас нет доступа к этой операции')
        return redirect('registry:dashboard')
    
    appointment = get_object_or_404(Appointment, pk=pk)
    appointment.status = 'cancelled'
    appointment.save()
    messages.success(request, 'Запись отменена')
    return redirect('registry:appointment_list')


@login_required
def doctor_list(request):
    """Список врачей (для администратора)"""
    
    if request.user.role != 'admin':
        messages.error(request, 'У вас нет доступа к этой странице')
        return redirect('registry:dashboard')
    
    doctors = Doctor.objects.select_related('user').all()
    context = {'doctors': doctors}
    return render(request, 'registry/doctor_list.html', context)


@login_required
def schedule_list(request):
    """Расписание врачей (Таблица 3)"""
    
    if request.user.role not in ['registrator', 'admin', 'doctor']:
        messages.error(request, 'У вас нет доступа к этой странице')
        return redirect('registry:dashboard')
    
    schedules = Schedule.objects.select_related('doctor').all()
    
    if request.user.role == 'doctor':
        try:
            doctor = request.user.doctor_profile
            schedules = schedules.filter(doctor=doctor)
        except Doctor.DoesNotExist:
            schedules = Schedule.objects.none()
    
    context = {'schedules': schedules}
    return render(request, 'registry/schedule_list.html', context)


@login_required
def my_appointments(request):
    """Личный кабинет пациента (Рисунок 8) - мои записи"""
    
    # Для пациентов (если бы была отдельная модель)
    # Пока показываем все записи для авторизованных пользователей
    appointments = Appointment.objects.filter(status='scheduled')
    context = {'appointments': appointments}
    return render(request, 'registry/my_appointments.html', context)
