from rest_framework import serializers
from .models import Transaction, Category


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'icon', 'color', 'type', 'is_default']


class TransactionSerializer(serializers.ModelSerializer):
    category_detail = CategorySerializer(source='category', read_only=True)

    class Meta:
        model = Transaction
        fields = ['id', 'amount', 'category', 'category_detail', 'date', 'description', 'user']
        read_only_fields = ['user']
