<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Gasify Account</title>
    <style>
        /* Reset and base styles */
        body, table, td, p, a, li, blockquote {
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
        }
        table, td {
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
        }
        img {
            -ms-interpolation-mode: bicubic;
        }

        /* Base styles */
        body {
            margin: 0 !important;
            padding: 0 !important;
            background-color: #0f172a;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        }

        /* Container */
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #1e293b;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }

        /* Header */
        .email-header {
            background: linear-gradient(135deg, #065f46 0%, #047857 50%, #059669 100%);
            padding: 40px 30px;
            text-align: center;
            position: relative;
        }

        .logo-container {
            margin-bottom: 20px;
        }

        .logo {
            width: 60px;
            height: 60px;
            background-color: #10b981;
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            font-weight: bold;
            color: white;
            margin: 0 auto;
        }

        .email-title {
            color: white;
            font-size: 28px;
            font-weight: bold;
            margin: 20px 0 10px 0;
        }

        .email-subtitle {
            color: #d1fae5;
            font-size: 16px;
            margin: 0;
            opacity: 0.9;
        }

        /* Content */
        .email-content {
            padding: 40px 30px;
        }

        .welcome-message {
            text-align: center;
            margin-bottom: 30px;
        }

        .welcome-title {
            color: white;
            font-size: 24px;
            font-weight: bold;
            margin: 0 0 10px 0;
        }

        .welcome-text {
            color: #94a3b8;
            font-size: 16px;
            line-height: 1.6;
            margin: 0;
        }

        /* CTA Button */
        .cta-section {
            text-align: center;
            margin: 40px 0;
        }

        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 8px;
            font-weight: bold;
            font-size: 16px;
            box-shadow: 0 4px 14px 0 rgba(16, 185, 129, 0.39);
            transition: all 0.2s ease;
        }

        .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px 0 rgba(16, 185, 129, 0.5);
        }

        /* Security Info */
        .security-section {
            background-color: #0f172a;
            border-radius: 8px;
            padding: 24px;
            margin: 30px 0;
            border-left: 4px solid #10b981;
        }

        .security-title {
            color: white;
            font-size: 18px;
            font-weight: bold;
            margin: 0 0 12px 0;
            display: flex;
            align-items: center;
        }

        .security-icon {
            margin-right: 8px;
            color: #10b981;
        }

        .security-list {
            color: #94a3b8;
            margin: 0;
            padding-left: 24px;
        }

        .security-list li {
            margin-bottom: 8px;
            line-height: 1.5;
        }

        /* Warning */
        .warning-section {
            background-color: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 8px;
            padding: 16px;
            margin: 20px 0;
        }

        .warning-title {
            color: #92400e;
            font-weight: bold;
            margin: 0 0 8px 0;
            display: flex;
            align-items: center;
        }

        .warning-text {
            color: #92400e;
            margin: 0;
            font-size: 14px;
        }

        /* Footer */
        .email-footer {
            background-color: #0f172a;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #334155;
        }

        .footer-text {
            color: #64748b;
            font-size: 14px;
            margin: 0 0 15px 0;
        }

        .footer-links {
            margin: 20px 0;
        }

        .footer-link {
            color: #10b981;
            text-decoration: none;
            margin: 0 10px;
            font-size: 14px;
        }

        .footer-link:hover {
            text-decoration: underline;
        }

        .social-links {
            margin-top: 20px;
        }

        .social-link {
            display: inline-block;
            margin: 0 8px;
            color: #64748b;
            text-decoration: none;
            font-size: 20px;
        }

        /* Responsive */
        @media only screen and (max-width: 600px) {
            .email-container {
                margin: 10px;
                border-radius: 8px;
            }

            .email-header,
            .email-content,
            .email-footer {
                padding-left: 20px;
                padding-right: 20px;
            }

            .email-title {
                font-size: 24px;
            }

            .cta-button {
                padding: 14px 24px;
                font-size: 15px;
            }
        }
    </style>
</head>
<body>
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table class="email-container" width="600" cellpadding="0" cellspacing="0" role="presentation">
                    <!-- Header -->
                    <tr>
                        <td class="email-header">
                            <div class="logo-container">
                                <div class="logo">$GTRUST</div>
                            </div>
                            <h1 class="email-title">Verify Your Account</h1>
                            <p class="email-subtitle">Welcome to Gasify - Your Money, Your Rules</p>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td class="email-content">
                            <div class="welcome-message">
                                <h2 class="welcome-title">Hi {{ $user->name }}! 👋</h2>
                                <p class="welcome-text">
                                    Thanks for joining Gasify! To start trading securely and access all our features,
                                    please verify your email address.
                                </p>
                            </div>

                            <!-- CTA Button -->
                            <div class="cta-section">
                                <a href="{{ $verificationUrl }}" class="cta-button">
                                    ✅ Verify My Email Address
                                </a>
                            </div>

                            <!-- Security Info -->
                            <div class="security-section">
                                <h3 class="security-title">
                                    <span class="security-icon">🔒</span>
                                    Why verify your email?
                                </h3>
                                <ul class="security-list">
                                    <li>Enable secure account recovery</li>
                                    <li>Receive important security notifications</li>
                                    <li>Access advanced trading features</li>
                                    <li>Participate in exclusive airdrops</li>
                                </ul>
                            </div>

                            <!-- Warning -->
                            <div class="warning-section">
                                <h4 class="warning-title">
                                    <span style="margin-right: 8px;">⚠️</span>
                                    Link expires in 60 minutes
                                </h4>
                                <p class="warning-text">
                                    For your security, this verification link will expire in 60 minutes.
                                    If it expires, you can request a new one from your account settings.
                                </p>
                            </div>

                            <!-- Manual Verification -->
                            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #334155;">
                                <p style="color: #94a3b8; font-size: 14px; margin: 0 0 10px 0;">
                                    If the button doesn't work, copy and paste this link into your browser:
                                </p>
                                <p style="word-break: break-all; background-color: #0f172a; padding: 12px; border-radius: 6px; border: 1px solid #334155;">
                                    <a href="{{ $verificationUrl }}" style="color: #10b981; text-decoration: none; font-size: 12px;">
                                        {{ $verificationUrl }}
                                    </a>
                                </p>
                            </div>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td class="email-footer">
                            <p class="footer-text">
                                You're receiving this email because you recently created a Gasify account.
                                If you didn't create this account, please ignore this email.
                            </p>

                            <div class="footer-links">
                                <a href="#" class="footer-link">Privacy Policy</a>
                                <a href="#" class="footer-link">Terms of Service</a>
                                <a href="#" class="footer-link">Help Center</a>
                            </div>

                            <div class="social-links">
                                <a href="#" class="social-link">📧</a>
                                <a href="#" class="social-link">🐦</a>
                                <a href="#" class="social-link">💬</a>
                            </div>

                            <p style="color: #475569; font-size: 12px; margin: 20px 0 0 0;">
                                © 2025 Gasify. All rights reserved.<br>
                                1.2M Nigerians protected · ₦18B in safe trades
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
