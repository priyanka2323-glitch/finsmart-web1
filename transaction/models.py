from django.db import models
from django.contrib.auth.models import User
# Create your models here.
class Category(models.Model):
    CATEGORY_TYPES = [
        ('income', 'Income'),
        ('expense', 'Expense'),
    ]
    name = models.CharField(max_length=100)
    icon=models.CharField(max_length=100)
    color=models.CharField(max_length=7,default='#e85d04')
    type=models.CharField(max_length=10, choices=CATEGORY_TYPES, db_column='category_type')
    is_default = models.BooleanField(default=False)
    

    def __str__(self):
        return self.name
class Transaction(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateField()
    description = models.TextField(blank=True)
    note = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.category.name} - {self.amount}"
