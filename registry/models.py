from django.db import models
from django.core.validators import RegexValidator, MinLengthValidator


class Patient(models.Model):
    """Пациент медицинского учреждения"""
    
    GENDER_CHOICES = (
        ('M', 'Мужской'),
        ('F', 'Женский'),
    )
    
    # Валидаторы согласно техническому заданию 2.4.1
    cyrillic_validator = RegexValidator(
        regex=r'^[а-яА-ЯёЁ\s]+$',
        message='ФИО должно содержать только символы кириллицы и пробелы'
    )
    
    phone_validator = RegexValidator(
        regex=r'^\+7\(\d{3}\)-\d{3}-\d{2}-\d{2}$',
        message='Телефон должен быть в формате +7(XXX)-XXX-XX-XX'
    )
    
    oms_validator = RegexValidator(
        regex=r'^\d{16}$',
        message='Полис ОМС должен содержать 16 цифр'
    )
    
    snils_validator = RegexValidator(
        regex=r'^\d{3}-\d{3}-\d{3} \d{2}$',
        message='СНИЛС должен быть в формате XXX-XXX-XXX XX'
    )
    
    last_name = models.CharField(
        max_length=100,
        validators=[cyrillic_validator],
        verbose_name='Фамилия'
    )
    first_name = models.CharField(
        max_length=100,
        validators=[cyrillic_validator],
        verbose_name='Имя'
    )
    middle_name = models.CharField(
        max_length=100,
        blank=True,
        validators=[cyrillic_validator],
        verbose_name='Отчество'
    )
    date_of_birth = models.DateField(
        verbose_name='Дата рождения'
    )
    gender = models.CharField(
        max_length=1,
        choices=GENDER_CHOICES,
        verbose_name='Пол'
    )
    address = models.TextField(
        verbose_name='Адрес'
    )
    phone = models.CharField(
        max_length=20,
        validators=[phone_validator],
        unique=True,
        verbose_name='Телефон'
    )
    oms_number = models.CharField(
        max_length=16,
        validators=[oms_validator],
        unique=True,
        verbose_name='Полис ОМС'
    )
    snils = models.CharField(
        max_length=15,
        validators=[snils_validator],
        unique=True,
        verbose_name='СНИЛС'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Дата регистрации'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Дата обновления'
    )
    
    class Meta:
        verbose_name = 'Пациент'
        verbose_name_plural = 'Пациенты'
        ordering = ['last_name', 'first_name']
    
    def __str__(self):
        return f"{self.last_name} {self.first_name} {self.middle_name}"
    
    @property
    def full_name(self):
        return f"{self.last_name} {self.first_name} {self.middle_name}"


class Doctor(models.Model):
    """Врач медицинского учреждения"""
    
    user = models.OneToOneField(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='doctor_profile',
        verbose_name='Пользователь'
    )
    specialty = models.CharField(
        max_length=100,
        verbose_name='Специальность'
    )
    cabinet = models.CharField(
        max_length=20,
        blank=True,
        verbose_name='Кабинет'
    )
    work_schedule = models.TextField(
        blank=True,
        verbose_name='График работы'
    )
    
    class Meta:
        verbose_name = 'Врач'
        verbose_name_plural = 'Врачи'
    
    def __str__(self):
        return f"Д-р {self.user.get_full_name()} - {self.specialty}"


class Schedule(models.Model):
    """Расписание врачей (Таблица 3)"""
    
    doctor = models.ForeignKey(
        Doctor,
        on_delete=models.CASCADE,
        related_name='schedules',
        verbose_name='Врач'
    )
    date = models.DateField(
        verbose_name='Дата приема'
    )
    start_time = models.TimeField(
        verbose_name='Начало приема'
    )
    end_time = models.TimeField(
        verbose_name='Конец приема'
    )
    is_available = models.BooleanField(
        default=True,
        verbose_name='Доступен для записи'
    )
    
    class Meta:
        verbose_name = 'Запись в расписании'
        verbose_name_plural = 'Расписание врачей'
        ordering = ['date', 'start_time']
        unique_together = ['doctor', 'date', 'start_time']
    
    def __str__(self):
        return f"{self.doctor} - {self.date} {self.start_time}-{self.end_time}"


class Appointment(models.Model):
    """Запись на приём (Таблица 4)"""
    
    STATUS_CHOICES = (
        ('scheduled', 'Запланирован'),
        ('completed', 'Завершен'),
        ('cancelled', 'Отменён'),
        ('no_show', 'Не явился'),
    )
    
    patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        related_name='appointments',
        verbose_name='Пациент'
    )
    doctor = models.ForeignKey(
        Doctor,
        on_delete=models.CASCADE,
        related_name='appointments',
        verbose_name='Врач'
    )
    schedule = models.ForeignKey(
        Schedule,
        on_delete=models.CASCADE,
        related_name='appointments',
        verbose_name='Расписание'
    )
    appointment_date = models.DateField(
        verbose_name='Дата приема'
    )
    appointment_time = models.TimeField(
        verbose_name='Время приема'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='scheduled',
        verbose_name='Статус'
    )
    complaint = models.TextField(
        blank=True,
        verbose_name='Жалобы'
    )
    diagnosis = models.TextField(
        blank=True,
        verbose_name='Диагноз'
    )
    notes = models.TextField(
        blank=True,
        verbose_name='Заметки врача'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Дата создания записи'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Дата обновления'
    )
    
    class Meta:
        verbose_name = 'Запись на приём'
        verbose_name_plural = 'Записи на приём'
        ordering = ['-appointment_date', '-appointment_time']
    
    def __str__(self):
        return f"{self.patient.full_name} -> {self.doctor} ({self.appointment_date} {self.appointment_time})"
