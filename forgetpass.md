User taps "Forgot Password"
        ↓
ForgotPasswordScreen → enters email → hits Send
        ↓
POST /auth/forgot-password
  → find user by email
  → generate random 6-digit code  e.g. 847291
  → save code + expiry (Date.now() + 15min) to DB
  → call sendPasswordResetEmail(email, code)
  → Nodemailer sends it via your existing Gmail setup
        ↓
VerifyOTPScreen → user enters 6 digits → hits Verify
        ↓
POST /auth/verify-otp
  → find user by email
  → check code matches AND expiry hasn't passed
  → set reset_otp_verified = true
  → return success
        ↓
ResetPasswordScreen → user enters new password → hits Reset
        ↓
POST /auth/reset-password
  → find user by email
  → check reset_otp_verified is true (security check)
  → bcrypt.hash(newPassword)
  → save new password
  → clear the OTP columns
  → done