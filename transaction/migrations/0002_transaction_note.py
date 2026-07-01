# Generated migration for adding note field to Transaction

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('transaction', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='transaction',
            name='note',
            field=models.TextField(blank=True, null=True),
        ),
    ]
