from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.db.models import Sum, Count
from reports.tax import add_cess, calculate_new_regime, calculate_old_regime
from transaction.models import Transaction, Category
from bills.models import RecurringBill, BillPayment
from datetime import date, timedelta
import calendar
import os
from django.conf import settings


def build_local_financial_advice(user_message, income, expense, bills, categories):
    savings = income - expense
    savings_rate = (savings / income * 100) if income else 0
    query = (user_message or '').lower()
    top_category = categories[0] if categories else None

    if any(word in query for word in ['bill', 'rent', 'emi']):
        return (
            f"Your active recurring bills are about Rs. {bills}/month. Keep those fixed costs separate first, "
            "then spend from what remains so bills do not eat into the rest of your month."
        )

    if any(word in query for word in ['save', 'saving', 'budget']):
        if income and savings_rate < 20:
            return (
                f"Your savings rate is about {savings_rate:.1f}%. Start by setting an automatic transfer right after income arrives "
                "and trim one flexible category each week until you are comfortably above 20%."
            )
        return (
            f"You are saving about Rs. {savings}. Keep fixed bills on autopay, cap discretionary spending, "
            "and move savings out before daily expenses begin."
        )

    if any(word in query for word in ['spend', 'expense', 'manage', 'track']):
        if top_category:
            return (
                f"Your biggest visible category is {top_category['category__name']} at Rs. {top_category['total']}. "
                "That is the best place to set a weekly limit and look for unnecessary purchases."
            )
        return (
            "Start by tagging every transaction with a category. Once the list has some history, review essentials, "
            "bills, and optional spending separately to see where the leaks are."
        )

    return (
        f"This month you have income of Rs. {income}, expenses of Rs. {expense}, and savings of Rs. {savings}. "
        "Track expenses by category, reserve bill money first, and review your top spending area every week."
    )


class MonthlyReportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        month = int(request.query_params.get('month', date.today().month))
        year = int(request.query_params.get('year', date.today().year))
        user = request.user

        transactions = Transaction.objects.filter(
            user=user,
            date__month=month,
            date__year=year
        )

        total_income = transactions.filter(
            category__type='income'
        ).aggregate(total=Sum('amount'))['total'] or 0

        total_expense = transactions.filter(
            category__type='expense'
        ).aggregate(total=Sum('amount'))['total'] or 0

        savings = total_income - total_expense
        savings_rate = round((savings / total_income * 100), 2) if total_income > 0 else 0

        category_breakdown = transactions.filter(
            category__type='expense'
        ).values(
            'category__name',
            'category__icon',
            'category__color'
        ).annotate(
            total=Sum('amount'),
            count=Count('id')
        ).order_by('-total')

        daily_spending = transactions.filter(
            category__type='expense'
        ).values('date').annotate(
            total=Sum('amount')
        ).order_by('date')

        bills_paid = BillPayment.objects.filter(
            bill__user=user,
            paid_date__month=month,
            paid_date__year=year,
            status='paid'
        ).aggregate(total=Sum('amount_paid'))['total'] or 0

        bills_upcoming = RecurringBill.objects.filter(
            user=user,
            is_active=True,
            next_due_date__month=month,
            next_due_date__year=year
        ).aggregate(total=Sum('amount'))['total'] or 0

        top_categories = list(category_breakdown[:5])

        return Response({
            'month': month,
            'year': year,
            'month_name': calendar.month_name[month],
            'summary': {
                'total_income': total_income,
                'total_expense': total_expense,
                'savings': savings,
                'savings_rate': savings_rate,
            },
            'bills': {
                'paid': bills_paid,
                'upcoming': bills_upcoming,
            },
            'category_breakdown': list(category_breakdown),
            'top_categories': top_categories,
            'daily_spending': list(daily_spending),
        })


class YearlyReportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        year = int(request.query_params.get('year', date.today().year))
        user = request.user

        monthly_data = []
        for month in range(1, 13):
            transactions = Transaction.objects.filter(
                user=user,
                date__month=month,
                date__year=year
            )
            income = transactions.filter(
                category__type='income'
            ).aggregate(total=Sum('amount'))['total'] or 0

            expense = transactions.filter(
                category__type='expense'
            ).aggregate(total=Sum('amount'))['total'] or 0

            monthly_data.append({
                'month': month,
                'month_name': calendar.month_name[month][:3],
                'income': income,
                'expense': expense,
                'savings': income - expense,
            })

        total_income = sum(m['income'] for m in monthly_data)
        total_expense = sum(m['expense'] for m in monthly_data)

        return Response({
            'year': year,
            'monthly_data': monthly_data,
            'summary': {
                'total_income': total_income,
                'total_expense': total_expense,
                'total_savings': total_income - total_expense,
            }
        })


class TaxEstimatorView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        data = request.data
        gross_income = float(data.get('gross_income', 0))
        hra_received = float(data.get('hra_received', 0))
        rent_paid = float(data.get('rent_paid', 0))
        basic_salary = float(data.get('basic_salary', 0))
        section_80c = float(data.get('section_80c', 0))
        section_80d = float(data.get('section_80d', 0))
        home_loan_interest = float(data.get('home_loan_interest', 0))
        is_metro = data.get('is_metro', True)

        hra_exemption = 0
        if hra_received > 0 and rent_paid > 0:
            rent_minus_10 = max(0, rent_paid - 0.10 * basic_salary)
            metro_limit = 0.50 * basic_salary if is_metro else 0.40 * basic_salary
            hra_exemption = min(hra_received, rent_minus_10, metro_limit)

        std_deduction = 50000
        deduction_80c = min(section_80c, 150000)
        deduction_80d = min(section_80d, 25000)
        deduction_hl = min(home_loan_interest, 200000)

        old_deductions = (
            std_deduction + hra_exemption + deduction_80c + deduction_80d + deduction_hl
        )

        old_taxable = max(0, gross_income - old_deductions)
        old_tax = add_cess(calculate_old_regime(old_taxable))

        new_std_deduction = 75000
        new_taxable = max(0, gross_income - new_std_deduction)
        new_tax = add_cess(calculate_new_regime(new_taxable))

        better_regime = 'old' if old_tax < new_tax else 'new'
        tax_savings = abs(old_tax - new_tax)

        return Response({
            'gross_income': gross_income,
            'old_regime': {
                'deductions': old_deductions,
                'taxable_income': old_taxable,
                'tax': old_tax,
                'breakdown': {
                    'standard_deduction': std_deduction,
                    'hra_exemption': round(hra_exemption),
                    'section_80c': deduction_80c,
                    'section_80d': deduction_80d,
                    'home_loan': deduction_hl,
                }
            },
            'new_regime': {
                'deductions': new_std_deduction,
                'taxable_income': new_taxable,
                'tax': new_tax,
            },
            'recommendation': {
                'better_regime': better_regime,
                'tax_savings': tax_savings,
                'message': f"{'Old' if better_regime == 'old' else 'New'} regime saves you ₹{tax_savings:,}"
            }
        })


class Investment80CView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        year = int(request.query_params.get('year', date.today().year))

        investments = Transaction.objects.filter(
            user=request.user,
            category__type='expense',
            date__year=year,
            category__name__in=['Insurance', 'Education', 'Investment']
        ).values('category__name').annotate(
            total=Sum('amount')
        )

        total_invested = sum(i['total'] for i in investments)
        limit = 150000
        remaining = max(0, limit - total_invested)

        return Response({
            'year': year,
            'investments': list(investments),
            'total_invested': total_invested,
            'limit': limit,
            'remaining': remaining,
            'is_maxed': total_invested >= limit,
        })


class SpendingAnomalyView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        today = date.today()
        user = request.user
        
        # Get current month start and end
        current_month_start = today.replace(day=1)
        current_month_end = today
        
        # Get last 3 months of data (including current month)
        three_months_ago = current_month_start - timedelta(days=1)
        three_months_ago = three_months_ago.replace(day=1)
        
        # Fetch all transactions for last 3 months
        transactions = Transaction.objects.filter(
            user=user,
            category__type='expense',
            date__gte=three_months_ago,
            date__lte=current_month_end
        )
        
        # Group by category and month
        category_monthly = {}
        for txn in transactions:
            cat_name = txn.category.name
            month_key = txn.date.strftime('%Y-%m')
            
            if cat_name not in category_monthly:
                category_monthly[cat_name] = {
                    'name': cat_name,
                    'icon': txn.category.icon,
                    'color': txn.category.color,
                    'months': {}
                }
            
            if month_key not in category_monthly[cat_name]['months']:
                category_monthly[cat_name]['months'][month_key] = 0
            
            category_monthly[cat_name]['months'][month_key] += float(txn.amount)
        
        # Calculate anomalies
        current_month_str = today.strftime('%Y-%m')
        anomalies = []
        
        for cat_name, cat_data in category_monthly.items():
            months = cat_data['months']
            if current_month_str in months:
                current_spend = months[current_month_str]
                
                # Get previous 2 months average (excluding current)
                prev_months = [m for m in months.keys() if m != current_month_str]
                if prev_months:
                    avg_prev = sum(months[m] for m in prev_months) / len(prev_months)
                    
                    # Check for spike (>20% increase)
                    if avg_prev > 0:
                        increase_pct = ((current_spend - avg_prev) / avg_prev) * 100
                        if increase_pct >= 20:
                            anomalies.append({
                                'category': cat_name,
                                'icon': cat_data['icon'],
                                'color': cat_data['color'],
                                'current_spend': round(current_spend, 2),
                                'average_spend': round(avg_prev, 2),
                                'increase_pct': round(increase_pct, 1),
                                'difference': round(current_spend - avg_prev, 2),
                            })
        
        # Sort by increase percentage (highest first)
        anomalies.sort(key=lambda x: x['increase_pct'], reverse=True)
        
        return Response({
            'current_month': current_month_str,
            'anomalies': anomalies,
            'has_anomalies': len(anomalies) > 0,
            'total_anomalies': len(anomalies),
        })


class AIFinancialAdvisorView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user_message = request.data.get('message', '').strip()
        if not user_message:
            return Response({'error': 'Message required'}, status=400)

        try:
            # Get user's financial context
            today = date.today()
            month = today.month
            year = today.year
            
            # Last month financials
            transactions = Transaction.objects.filter(
                user=request.user,
                date__month=month,
                date__year=year
            )
            
            income = transactions.filter(category__type='income').aggregate(Sum('amount'))['amount__sum'] or 0
            expense = transactions.filter(category__type='expense').aggregate(Sum('amount'))['amount__sum'] or 0
            
            # Category breakdown
            categories = transactions.filter(
                category__type='expense'
            ).values('category__name').annotate(total=Sum('amount')).order_by('-total')[:5]
            categories = list(categories)
            
            # Upcoming bills
            bills = RecurringBill.objects.filter(
                user=request.user,
                is_active=True
            ).aggregate(total=Sum('amount'))['total'] or 0
            
            # Build context
            context = f"""
User's Financial Summary (Current Month: {calendar.month_name[month]} {year}):
- Income: ₹{income}
- Expenses: ₹{expense}
- Savings: ₹{income - expense}
- Top spending categories: {', '.join([f"{c['category__name']}: ₹{c['total']}" for c in categories])}
- Active recurring bills: ₹{bills}/month

User Query: {user_message}

Provide concise, actionable financial advice in 2-3 sentences.
"""
            
            # Call Claude API
            api_key = getattr(settings, 'ANTHROPIC_API_KEY', '') or os.getenv('ANTHROPIC_API_KEY')
            if not api_key:
                return Response({
                    'response': build_local_financial_advice(user_message, income, expense, bills, categories),
                    'is_demo': True,
                    'advisor_warning': 'ANTHROPIC_API_KEY is not configured on the backend.'
                })

            try:
                from anthropic import Anthropic
                client = Anthropic(api_key=api_key)
                message = client.messages.create(
                    model='claude-3-5-sonnet-20241022',
                    max_tokens=300,
                    messages=[
                        {'role': 'user', 'content': context}
                    ]
                )

                response_text = message.content[0].text

                return Response({
                    'response': response_text,
                    'context': {
                        'income': income,
                        'expense': expense,
                        'savings': income - expense,
                    }
                })
            except Exception:
                return Response({
                    'response': build_local_financial_advice(user_message, income, expense, bills, categories),
                    'is_demo': True,
                    'advisor_warning': 'External AI provider failed. Check whether the Anthropic key is valid.'
                })

        except Exception:
            return Response({
                'response': build_local_financial_advice(
                    user_message,
                    locals().get('income', 0),
                    locals().get('expense', 0),
                    locals().get('bills', 0),
                    locals().get('categories', []),
                ),
                'is_demo': True,
                'advisor_warning': 'Advisor fallback used because the external provider could not be reached.'
            })


