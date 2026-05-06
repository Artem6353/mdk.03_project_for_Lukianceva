from django import forms
from django.contrib.auth.forms import AuthenticationForm


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
