from django import forms
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from accounts.models import User


class PatientRegistrationForm(UserCreationForm):
    """Форма регистрации пациента"""
    first_name = forms.CharField(max_length=30, required=True, label='Имя')
    last_name = forms.CharField(max_length=30, required=True, label='Фамилия')
    middle_name = forms.CharField(max_length=30, required=False, label='Отчество')
    phone = forms.CharField(
        max_length=20, 
        required=True, 
        label='Телефон',
        help_text='Формат: +7(XXX)-XXX-XX-XX'
    )
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
    oms_number = forms.CharField(
        max_length=16, 
        required=True, 
        label='Номер ОМС',
        help_text='16 цифр'
    )
    snils = forms.CharField(
        max_length=15, 
        required=False, 
        label='СНИЛС',
        help_text='Формат: XXX-XXX-XXX XX'
    )
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

    def clean_phone(self):
        """Приводим телефон к нужному формату"""
        phone = self.cleaned_data.get('phone')
        # Удаляем все нецифровые символы
        digits = ''.join(filter(str.isdigit, phone))
        
        # Если телефон начинается с 8, заменяем на 7
        if len(digits) == 11 and digits[0] == '8':
            digits = '7' + digits[1:]
        
        # Проверяем длину (должно быть 11 цифр для +7)
        if len(digits) != 11:
            raise forms.ValidationError('Телефон должен содержать 11 цифр.')
        
        # Форматируем в нужный вид: +7(XXX)-XXX-XX-XX
        formatted_phone = f'+7({digits[1:4]})-{digits[4:7]}-{digits[7:9]}-{digits[9:11]}'
        
        return formatted_phone

    def clean_oms_number(self):
        """Проверяем, что ОМС содержит только 16 цифр"""
        oms = self.cleaned_data.get('oms_number')
        # Удаляем все нецифровые символы
        digits = ''.join(filter(str.isdigit, oms))
        
        if len(digits) != 16:
            raise forms.ValidationError('Полис ОМС должен содержать 16 цифр.')
        
        return digits

    def clean_snils(self):
        """Приводим СНИЛС к нужному формату"""
        snils = self.cleaned_data.get('snils')
        if not snils:
            return ''
        
        # Удаляем все нецифровые символы
        digits = ''.join(filter(str.isdigit, snils))
        
        if len(digits) != 11:
            raise forms.ValidationError('СНИЛС должен содержать 11 цифр.')
        
        # Форматируем в нужный вид: XXX-XXX-XXX XX
        formatted_snils = f'{digits[0:3]}-{digits[3:6]}-{digits[6:9]} {digits[9:11]}'
        
        return formatted_snils

    def clean_first_name(self):
        """Проверяем, что имя содержит только кириллицу"""
        first_name = self.cleaned_data.get('first_name')
        import re
        if not re.match(r'^[а-яА-ЯёЁ\s]+$', first_name):
            raise forms.ValidationError('Имя должно содержать только символы кириллицы и пробелы.')
        return first_name

    def clean_last_name(self):
        """Проверяем, что фамилия содержит только кириллицу"""
        last_name = self.cleaned_data.get('last_name')
        import re
        if not re.match(r'^[а-яА-ЯёЁ\s]+$', last_name):
            raise forms.ValidationError('Фамилия должна содержать только символы кириллицы и пробелы.')
        return last_name

    def clean_middle_name(self):
        """Проверяем, что отчество содержит только кириллицу (если указано)"""
        middle_name = self.cleaned_data.get('middle_name')
        if middle_name:
            import re
            if not re.match(r'^[а-яА-ЯёЁ\s]+$', middle_name):
                raise forms.ValidationError('Отчество должно содержать только символы кириллицы и пробелы.')
        return middle_name

    def save(self, commit=True):
        user = super().save(commit=False)
        user.role = 'patient'
        if commit:
            user.save()
            # Создаем профиль пациента
            from registry.models import Patient
            # Используем filter().first() вместо get_or_create с user для избежания FieldError
            patient = Patient.objects.filter(user=user).first()
            if not patient:
                Patient.objects.create(
                    user=user,
                    first_name=self.cleaned_data.get('first_name'),
                    last_name=self.cleaned_data.get('last_name'),
                    middle_name=self.cleaned_data.get('middle_name') or '',
                    phone=self.cleaned_data.get('phone'),
                    date_of_birth=self.cleaned_data.get('date_of_birth'),
                    gender=self.cleaned_data.get('gender'),
                    oms_number=self.cleaned_data.get('oms_number'),
                    snils=self.cleaned_data.get('snils') or '',
                    address=self.cleaned_data.get('address') or '',
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
