from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils import timezone
from django.conf import settings
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
import requests as http_requests
import re
import secrets
import string

User = get_user_model()

def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
    }

def is_valid_email(value):
    return re.match(r'^[^@]+@[^@]+.[^@]+$', value) is not None

def is_valid_phone(value):
    return re.match(r'^+?[0-9]{9,15}$', value) is not None

def generate_secure_password(length=12):
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    while True:
        pwd = ''.join(secrets.choice(alphabet) for _ in range(length))
        if (any(c.islower() for c in pwd) and 
            any(c.isupper() for c in pwd) and 
            any(c.isdigit() for c in pwd)):
            return pwd

def send_password_email(user, password):
    html_message = render_to_string(
        "auth/password_email.html",
        {"user": user, "password": password, "year": timezone.now().year}
    )
    send_mail(
        subject="Your NABTA Account Password",
        message=f"Your secure password is: {password}",
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        html_message=html_message,
        fail_silently=False,
    )

class LoginView(APIView):
    permission_classes = [AllowAny]
    @swagger_auto_schema(
        operation_summary="Login or auto-register",
        operation_description="If user exists, validates password and returns JWT. If user doesn't exist (email only), creates account and emails a secure password.",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=["identifier"],
            properties={
                "identifier": openapi.Schema(type=openapi.TYPE_STRING, example="farmer@nabta.com or +213555123456"),
                "password": openapi.Schema(type=openapi.TYPE_STRING, format="password", example="YourPassword123!", description="Required if user already exists"),
            },
        ),
        tags=["Authentication"],
    )
    def post(self, request):
        identifier = request.data.get("identifier", " ").strip()
        password = request.data.get("password", " ")
        
        if not identifier:
            return Response({"error": "Identifier is required."}, status=status.HTTP_400_BAD_REQUEST)

        if is_valid_email(identifier):
            user = User.objects.filter(email=identifier.lower()).first()
            lookup_type = "email"
        elif is_valid_phone(identifier):
            user = User.objects.filter(phone=identifier).first()
            lookup_type = "phone"
        else:
            return Response({"error": "Provide a valid email or phone number."}, status=status.HTTP_400_BAD_REQUEST)

        # Existing user: authenticate with password
        if user:
            if not password:
                return Response({"error": "Password is required for existing accounts."}, status=status.HTTP_400_BAD_REQUEST)
            if not user.check_password(password):
                return Response({"error": "Invalid credentials."}, status=status.HTTP_401_UNAUTHORIZED)
            if not user.is_active:
                return Response({"error": "This account has been deactivated."}, status=status.HTTP_401_UNAUTHORIZED)
            
            tokens = get_tokens_for_user(user)
            return Response({
                "message": "Login successful.",
                "user": {
                    "id": str(user.id), "email": user.email, "phone": user.phone,
                    "first_name": user.first_name, "last_name": user.last_name,
                    "role": user.role, "avatar": request.build_absolute_uri(user.avatar.url) if user.avatar else None
                },
                "tokens": tokens
            }, status=status.HTTP_200_OK)

        # New user: auto-register with email and send secure password
        else:
            if lookup_type != "email":
                return Response({"error": "New accounts must be created with a valid email address."}, status=status.HTTP_400_BAD_REQUEST)
            
            secure_password = generate_secure_password()
            user = User.objects.create_user(email=identifier.lower(), password=secure_password)
            try:
                send_password_email(user, secure_password)
            except Exception:
                return Response({"error": "Failed to send email. Please try again."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            return Response({
                "message": "Account created successfully. A secure password has been sent to your email.",
                "email": user.email
            }, status=status.HTTP_201_CREATED)

class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]
    @swagger_auto_schema(
        operation_summary="Request new secure password",
        operation_description="Generates a new secure password and sends it to the user's email. Always returns 200 for security.",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=["email"],
            properties={"email": openapi.Schema(type=openapi.TYPE_STRING, format="email")},
        ),
        tags=["Password Reset"],
    )
    def post(self, request):
        email = request.data.get("email", " ").strip().lower()
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"message": "If an account with that email exists, a new password has been sent."}, status=status.HTTP_200_OK)
        
        new_password = generate_secure_password()
        user.set_password(new_password)
        user.save()
        
        try:
            send_password_email(user, new_password)
        except Exception:
            return Response({"error": "Failed to send email."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response({"message": "A new secure password has been sent to your email."}, status=status.HTTP_200_OK)

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]
    @swagger_auto_schema(operation_summary="Logout", tags=["Authentication"])
    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response({"error": "Refresh token is required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except TokenError:
            return Response({"error": "Invalid or expired token."}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"message": "Logged out successfully."}, status=status.HTTP_200_OK)

class ProfileView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    @swagger_auto_schema(operation_summary="Get profile", tags=["Profile"])
    def get(self, request):
        user = request.user
        return Response({
            "id": str(user.id), "email": user.email, "phone": user.phone,
            "username": user.username, "first_name": user.first_name, "last_name": user.last_name,
            "role": user.role, "bio": user.bio,
            "avatar": request.build_absolute_uri(user.avatar.url) if user.avatar else None,
            "created_at": user.created_at,
        })
    @swagger_auto_schema(operation_summary="Update profile", tags=["Profile"])
    def patch(self, request):
        user = request.user
        for field in ["first_name", "last_name", "phone", "bio"]:
            if field in request.data:
                setattr(user, field, request.data[field])
        if "avatar" in request.FILES:
            user.avatar = request.FILES["avatar"]
        user.save()
        return Response({"message": "Profile updated successfully.", "user": {
            "id": str(user.id), "email": user.email, "phone": user.phone,
            "first_name": user.first_name, "last_name": user.last_name,
            "role": user.role, "bio": user.bio,
            "avatar": request.build_absolute_uri(user.avatar.url) if user.avatar else None
        }})
    @swagger_auto_schema(operation_summary="Delete account", tags=["Profile"])
    def delete(self, request):
        request.user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]
    @swagger_auto_schema(operation_summary="Change password", tags=["Profile"])
    def post(self, request):
        user = request.user
        old_password = request.data.get("old_password", " ")
        new_password = request.data.get("new_password", " ")
        confirm_new_password = request.data.get("confirm_new_password", " ")

        if not user.check_password(old_password):
            return Response({"error": "Old password is incorrect."}, status=status.HTTP_401_UNAUTHORIZED)
        if new_password != confirm_new_password:
            return Response({"error": "New passwords do not match."}, status=status.HTTP_400_BAD_REQUEST)
        if len(new_password) < 8:
            return Response({"error": "Password must be at least 8 characters."}, status=status.HTTP_400_BAD_REQUEST)
        
        user.set_password(new_password)
        user.save()
        return Response({"message": "Password changed successfully."}, status=status.HTTP_200_OK)

class GoogleOAuthView(APIView):
    permission_classes = [AllowAny]
    @swagger_auto_schema(operation_summary="Google OAuth", tags=["OAuth"])
    def post(self, request):
        access_token = request.data.get("access_token")
        if not access_token:
            return Response({"error": "Google access token is required."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            google_response = http_requests.get("https://www.googleapis.com/oauth2/v3/userinfo",
                                                headers={"Authorization": f"Bearer {access_token}"}, timeout=10)
        except http_requests.exceptions.RequestException:
            return Response({"error": "Could not reach Google."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        
        if google_response.status_code != 200:
            return Response({"error": "Invalid Google token."}, status=status.HTTP_400_BAD_REQUEST)
        
        google_data = google_response.json()
        google_id = google_data.get("sub")
        email = google_data.get("email", " ").lower()
        first_name = google_data.get("given_name", " ")
        last_name = google_data.get("family_name", " ")
        picture = google_data.get("picture", " ")
        
        if not email:
            return Response({"error": "Could not retrieve email from Google."}, status=status.HTTP_400_BAD_REQUEST)
        
        user = User.objects.filter(google_id=google_id).first()
        is_new_user = False
        
        if not user:
            user = User.objects.filter(email=email).first()
            if user:
                user.google_id = google_id
                user.save()
            else:
                is_new_user = True
                user = User.objects.create_user(
                    email=email, password=None, first_name=first_name, last_name=last_name, google_id=google_id
                )
        
        tokens = get_tokens_for_user(user)
        return Response({
            "message": "Google login successful.", "is_new_user": is_new_user,
            "user": {"id": str(user.id), "email": user.email, "first_name": user.first_name,
                     "last_name": user.last_name, "role": user.role,
                     "avatar": user.avatar.url if user.avatar else picture or None},
            "tokens": tokens
        }, status=status.HTTP_200_OK)