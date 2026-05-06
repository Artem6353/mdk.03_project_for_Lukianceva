from django import forms
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from accounts.models import User


class PatientRegistrationForm(UserCreationForm):
    """Форма регистрации пациента"""
    first_name = forms.CharField(max_length=30, required=True, label='Имя')
    last_name = forms.CharField(max_length=30, required=True, label='Фамилия')
    middle_name = forms.CharField(max_length=30, required=False, label='Отчество')
    phone = forms.CharField(max_length=20, required=True, label='Телефон')
    date_of_birth = forms.DateField(
        widget=forms.DateInput(attrs={'type': 'date'}),
        required=True,
        label='Дата рождения'
    )
    gender = forms.ChoiceField(
        choices=[('M', 'Мужской'), ('F', 'Женский')],
        required=True,
        label='Пол'
    )
    oms_number = forms.CharField(max_length=20, required=True, label='Номер ОМС')
    snils = forms.CharField(max_length=20, required=False, label='СНИЛС')
    address = forms.CharField(widget=forms.Textarea, required=False, label='Адрес')

    class Meta:
        model = User
        fields = ('username', 'email', 'first_name', 'last_name', 'middle_name', 
                  'phone', 'date_of_birth', 'gender', 'oms_number', 'snils', 'address', 'password1', 'password2')

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['username'].label = 'Логин'
        self.fields['email'].label = 'Email'
        # Настраиваем виджеты для Bootstrap
        for field_name in self.fields:
            if field_name not in ['role', 'date_of_birth', 'gender']:  # Пропускаем поля с особыми виджетами
                self.fields[field_name].widget.attrs.update({'class': 'form-control'})
            if field_name in ['password1', 'password2']:
                self.fields[field_name].widget = forms.PasswordInput(attrs={'class': 'form-control'})
        
        # Скрываем или фиксируем роль как пациент
        if 'role' in self.fields:
            self.fields['role'].widget = forms.HiddenInput()
            self.fields['role'].initial = 'patient'

    def save(self, commit=True):
        user = super().save(commit=False)
        user.role = 'patient'
        if commit:
            user.save()
            # Создаем профиль пациента
            from registry.models import Patient
            Patient.objects.get_or_create(
                user=user,
                defaults={
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'middle_name': user.middle_name,
                    'phone': user.phone,
                    'date_of_birth': self.cleaned_data.get('date_of_birth'),
                    'gender': self.cleaned_data.get('gender'),
                    'oms_number': self.cleaned_data.get('oms_number'),
                    'snils': self.cleaned_data.get('snils'),
                    'address': self.cleaned_data.get('address'),
                }
            )
        return user


class LoginForm(AuthenticationForm):
    """Форма авторизации"""
    
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
