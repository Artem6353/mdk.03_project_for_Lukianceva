from django import forms
from django.contrib.auth.forms import AuthenticationForm, UserCreationForm
from .models import Patient, Appointment, Schedule


class LoginForm(AuthenticationForm):
    """Форма авторизации персонала"""
    
    username = forms.CharField(
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'Логин'
        }),
        label='Логин'
    )
    password = forms.CharField(
        widget=forms.PasswordInput(attrs={
            'class': 'form-control',
            'placeholder': 'Пароль'
        }),
        label='Пароль'
    )
    
    error_messages = {
        'invalid_login': "Неверный логин или пароль. Пожалуйста, попробуйте снова.",
        'inactive': "Ваша учетная запись не активна.",
    }


class PatientRegistrationForm(forms.ModelForm):
    """Форма регистрации пациента с валидацией по ТЗ 2.4.1"""
    
    class Meta:
        model = Patient
        fields = ['last_name', 'first_name', 'middle_name', 'date_of_birth', 
                  'gender', 'address', 'phone', 'oms_number', 'snils']
        widgets = {
            'last_name': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Фамилия'}),
            'first_name': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Имя'}),
            'middle_name': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Отчество'}),
            'date_of_birth': forms.DateInput(attrs={'class': 'form-control', 'type': 'date'}),
            'gender': forms.Select(attrs={'class': 'form-control'}),
            'address': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
            'phone': forms.TextInput(attrs={'class': 'form-control', 'placeholder': '+7(XXX)-XXX-XX-XX'}),
            'oms_number': forms.TextInput(attrs={'class': 'form-control', 'placeholder': '16 цифр'}),
            'snils': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'XXX-XXX-XXX XX'}),
        }
        labels = {
            'last_name': 'Фамилия',
            'first_name': 'Имя',
            'middle_name': 'Отчество',
            'date_of_birth': 'Дата рождения',
            'gender': 'Пол',
            'address': 'Адрес',
            'phone': 'Телефон',
            'oms_number': 'Полис ОМС',
            'snils': 'СНИЛС',
        }
    
    def clean(self):
        cleaned_data = super().clean()
        if not cleaned_data.get('last_name'):
            self.add_error('last_name', 'Поле обязательно для заполнения')
        if not cleaned_data.get('first_name'):
            self.add_error('first_name', 'Поле обязательно для заполнения')
        if not cleaned_data.get('date_of_birth'):
            self.add_error('date_of_birth', 'Поле обязательно для заполнения')
        return cleaned_data


class PatientSearchForm(forms.Form):
    """Форма поиска пациентов"""
    
    search_query = forms.CharField(
        required=False,
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'Поиск по ФИО, полису или телефону'
        }),
        label='Поиск'
    )


class AppointmentForm(forms.ModelForm):
    """Форма записи на прием"""
    
    class Meta:
        model = Appointment
        fields = ['patient', 'doctor', 'schedule', 'appointment_date', 'appointment_time']
        widgets = {
            'patient': forms.Select(attrs={'class': 'form-control'}),
            'doctor': forms.Select(attrs={'class': 'form-control'}),
            'schedule': forms.Select(attrs={'class': 'form-control'}),
            'appointment_date': forms.DateInput(attrs={'class': 'form-control', 'type': 'date'}),
            'appointment_time': forms.TimeInput(attrs={'class': 'form-control', 'type': 'time'}),
        }


class ScheduleForm(forms.ModelForm):
    """Форма управления расписанием"""
    
    class Meta:
        model = Schedule
        fields = ['doctor', 'date', 'start_time', 'end_time', 'is_available']
        widgets = {
            'doctor': forms.Select(attrs={'class': 'form-control'}),
            'date': forms.DateInput(attrs={'class': 'form-control', 'type': 'date'}),
            'start_time': forms.TimeInput(attrs={'class': 'form-control', 'type': 'time'}),
            'end_time': forms.TimeInput(attrs={'class': 'form-control', 'type': 'time'}),
            'is_available': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
        }
