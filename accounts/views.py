from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from .forms import LoginForm


def login_view(request):
    """Страница авторизации персонала (Рисунок 6)"""
    
    if request.user.is_authenticated:
        return redirect('registry:dashboard')
    
    if request.method == 'POST':
        form = LoginForm(request, data=request.POST)
        if form.is_valid():
            username = form.cleaned_data.get('username')
            password = form.cleaned_data.get('password')
            user = authenticate(username=username, password=password)
            if user is not None:
                login(request, user)
                return redirect('registry:dashboard')
        else:
            # Сообщения об ошибках при неверном вводе
            pass
    else:
        form = LoginForm()
    
    return render(request, 'accounts/login.html', {'form': form})


def logout_view(request):
    """Выход из системы"""
    logout(request)
    return redirect('accounts:login')
