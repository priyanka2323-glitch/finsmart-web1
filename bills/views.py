from django.shortcuts import render
from rest_framework import generics, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
from .models import RecurringBill, BillPayment
from .serializers import RecurringBillSerializer, BillPaymentSerializer
from .payment import client
from transaction.models import Transaction, Category
import json
from django.views.decorators.csrf import csrf_exempt
from django.http import HttpResponseBadRequest, HttpResponse
from django.conf import settings
class RecurringBillListCreateView(generics.ListCreateAPIView):
    serializer_class = RecurringBillSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return RecurringBill.objects.filter(
            user=self.request.user, 
            is_active=True
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class RecurringBillDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = RecurringBillSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return RecurringBill.objects.filter(user=self.request.user)

class UpcomingBillsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        today = timezone.now().date()
        next_30 = today + timedelta(days=30)
        bills = RecurringBill.objects.filter(
            user=request.user,
            is_active=True,
            next_due_date__range=[today, next_30]
        ).order_by('next_due_date')
        serializer = RecurringBillSerializer(bills, many=True)
        return Response(serializer.data)

class PayBillView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        bill = RecurringBill.objects.get(pk=pk, user=request.user)
        payment = BillPayment.objects.create(
            bill=bill,
            amount_paid=bill.amount,
            paid_date=timezone.now().date(),
            status='paid'
        )
        # update next due date
        from dateutil.relativedelta import relativedelta
        if bill.frequency == 'monthly':
            bill.next_due_date += relativedelta(months=1)
        elif bill.frequency == 'quarterly':
            bill.next_due_date += relativedelta(months=3)
        elif bill.frequency == 'yearly':
            bill.next_due_date += relativedelta(years=1)
        bill.save()
        return Response(BillPaymentSerializer(payment).data)
class CreateBillOrderView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            bill = RecurringBill.objects.get(pk=pk, user=request.user)
        except RecurringBill.DoesNotExist:
            return Response({"error": "Bill not found"}, status=404)

        # Create Razorpay order (amount in paise)
        order = client.order.create({
            "amount": int(bill.amount * 100),
            "currency": "INR",
            "receipt": f"bill_{bill.id}_{request.user.id}",
            "notes": {
                "bill_id": str(bill.id),
                "user_id": str(request.user.id),
                "bill_name": bill.name,
            }
        })

        return Response({
            "key": settings.RAZORPAY_KEY_ID,
            "order_id": order["id"],
            "amount": order["amount"],
            "currency": order["currency"],
            "bill_name": bill.name,
            "bill_id": bill.id,
        })


class VerifyBillPaymentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            bill = RecurringBill.objects.get(pk=pk, user=request.user)
        except RecurringBill.DoesNotExist:
            return Response({"error": "Bill not found"}, status=404)

        # Verify signature
        params = {
            "razorpay_order_id":   request.data.get("razorpay_order_id"),
            "razorpay_payment_id": request.data.get("razorpay_payment_id"),
            "razorpay_signature":  request.data.get("razorpay_signature"),
        }

        try:
            client.utility.verify_payment_signature(params)
        except Exception:
            return Response({"error": "Invalid payment signature"}, status=400)

        # Mark bill as paid
        BillPayment.objects.create(
            bill=bill,
            amount_paid=bill.amount,
            paid_date=timezone.now().date(),
            status="paid",
            razorpay_order_id=params["razorpay_order_id"],
            razorpay_payment_id=params["razorpay_payment_id"],
            razorpay_signature=params["razorpay_signature"],
        )

        # Update next due date
        from dateutil.relativedelta import relativedelta
        if bill.frequency == "monthly":
            bill.next_due_date += relativedelta(months=1)
        elif bill.frequency == "quarterly":
            bill.next_due_date += relativedelta(months=3)
        elif bill.frequency == "yearly":
            bill.next_due_date += relativedelta(years=1)
        bill.save()

        # Auto-record as transaction
        category = Category.objects.filter(type="expense").first()
        Transaction.objects.create(
            user=request.user,
            amount=bill.amount,
            type="expense",
            category=category,
            date=timezone.now().date(),
            note=f"Bill payment: {bill.name}",
            is_recurring=True,
        )

        return Response({
            "success": True,
            "message": f"{bill.name} paid successfully",
            "payment_id": params["razorpay_payment_id"],
        })
@csrf_exempt
def razorpay_webhook(request):
    import hmac, hashlib, json
    from django.conf import settings
    webhook_body = request.body
    signature = request.META.get("HTTP_X_RAZORPAY_SIGNATURE", "")
    expected = hmac.new(settings.RAZORPAY_WEBHOOK_SECRET.encode(), webhook_body, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, signature):
        return HttpResponseBadRequest("Invalid signature")
    event = json.loads(webhook_body)
    # handle payment captured
    if event.get("event") == "payment.captured":
        payload = event["payload"]["payment"]["entity"]
        order_id = payload.get("order_id")
        try:
            p = BillPayment.objects.get(razorpay_order_id=order_id)
            p.razorpay_payment_id = payload.get("id")
            p.status = "paid"
            # payload amount is in paise
            try:
                p.amount_paid = int(payload.get("amount", 0)) / 100.0
            except Exception:
                pass
            p.paid_date = timezone.now().date()
            p.save()
            bill = p.bill
            # Update next due date
            from dateutil.relativedelta import relativedelta
            if bill.frequency == "monthly":
                bill.next_due_date += relativedelta(months=1)
            elif bill.frequency == "quarterly":
                bill.next_due_date += relativedelta(months=3)
            elif bill.frequency == "yearly":
                bill.next_due_date += relativedelta(years=1)
            bill.save()
        except BillPayment.DoesNotExist:
            pass
    return HttpResponse(status=200)

# Create your views here.
