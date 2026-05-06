from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from .forms import LoginForm, PatientRegistrationForm


def login_view(request):
    """Страница авторизации"""
    
    if request.user.is_authenticated:
        if request.user.role == 'patient':
            return redirect('accounts:patient_cabinet')
        return redirect('registry:dashboard')
    
    if request.method == 'POST':
        form = LoginForm(request, data=request.POST)
        if form.is_valid():
            username = form.cleaned_data.get('username')
            password = form.cleaned_data.get('password')
            user = authenticate(username=username, password=password)
            if user is not None:
                login(request, user)
                if user.role == 'patient':
                    return redirect('accounts:patient_cabinet')
                return redirect('registry:dashboard')
        else:
            messages.error(request, 'Неверный логин или пароль.')
    else:
        form = LoginForm()
    
    return render(request, 'accounts/login.html', {'form': form})


def register_patient_view(request):
    """Страница регистрации пациента"""
    
    if request.user.is_authenticated:
        return redirect('accounts:patient_cabinet')
    
    if request.method == 'POST':
        form = PatientRegistrationForm(request.POST)
        if form.is_valid():
            user = form.save()
            messages.success(request, 'Регистрация успешна! Теперь вы можете войти.')
            return redirect('accounts:login')
        else:
            messages.error(request, 'Ошибка при регистрации. Проверьте правильность ввода данных.')
    else:
        form = PatientRegistrationForm()
    
    return render(request, 'accounts/register.html', {'form': form})


def logout_view(request):
    """Выход из системы"""
    logout(request)
    return redirect('accounts:login')


@login_required
def patient_cabinet_view(request):
    """Личный кабинет пациента"""
    
    if request.user.role != 'patient':
        messages.error(request, 'Доступ только для пациентов.')
        return redirect('registry:dashboard')
    
    # Получаем профиль пациента
    from registry.models import Patient
    patient_profile, created = Patient.objects.get_or_create(
        user=request.user,
        defaults={
            'first_name': request.user.first_name,
            'last_name': request.user.last_name,
            'middle_name': request.user.middle_name,
            'phone': request.user.phone,
        }
    )
    
    # Получаем записи на прием
    appointments = patient_profile.appointments.all().order_by('-appointment_date', '-appointment_time')
    
    context = {
        'user': request.user,
        'patient_profile': patient_profile,
        'appointments': appointments,
    }
    
    return render(request, 'accounts/patient_cabinet.html', context)
