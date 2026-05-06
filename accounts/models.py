from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Пользователь системы с ролями"""
    
    ROLE_CHOICES = (
        ('registrator', 'Медицинский регистратор'),
        ('doctor', 'Врач'),
        ('admin', 'Администратор'),
        ('patient', 'Пациент'),
    )
    
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='registrator',
        verbose_name='Роль'
    )
    phone = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name='Телефон'
    )
    middle_name = models.CharField(
        max_length=30,
        blank=True,
        verbose_name='Отчество'
    )
    
    class Meta:
        verbose_name = 'Пользователь'
        verbose_name_plural = 'Пользователи'
    
    def __str__(self):
        return f"{self.get_full_name()} ({self.get_role_display()})"
