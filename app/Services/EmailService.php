<?php

namespace App\Services;

use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class EmailService
{
    /**
     * Common Email HTML Shell Wrapper
     */
    private static function wrapTemplate(string $title, string $contentHtml, string $badgeText = '📷 CAMERAHUB VIETNAM', string $badgeColor = '#f17a35'): string
    {
        return <<<HTML
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{$title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #fdfbf7; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #22221f;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed; background-color: #fdfbf7; padding: 30px 0;">
        <tr>
            <td align="center">
                <!-- Main Container (600px) -->
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06); border: 1px solid #f5ede0;">
                    <!-- Brand Header Banner -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #151513 0%, #22221f 100%); padding: 32px 40px; text-align: center;">
                            <div style="display: inline-block; padding: 6px 14px; background: rgba(255,255,255,0.1); border-radius: 20px; border: 1px solid rgba(255,255,255,0.2); margin-bottom: 8px;">
                                <span style="color: {$badgeColor}; font-weight: 800; font-size: 13px; letter-spacing: 1px;">{$badgeText}</span>
                            </div>
                            <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">{$title}</h1>
                        </td>
                    </tr>

                    <!-- Body Content -->
                    <tr>
                        <td style="padding: 36px 40px; background-color: #ffffff;">
                            {$contentHtml}
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #faf6ee; padding: 24px 40px; text-align: center; border-top: 1px solid #f5ede0;">
                            <p style="margin: 0 0 6px 0; font-size: 13px; font-weight: 600; color: #44443d;">CameraHub - Cửa hàng Máy ảnh & Phụ kiện Nhiếp ảnh Chuyên nghiệp</p>
                            <p style="margin: 0; font-size: 11px; color: #7a7a73; line-height: 1.5;">
                                Hotline: 1900-8888 • Email hỗ trợ: nvmtein@gmail.com<br>
                                Địa chỉ: Showroom CameraHub, Số 10 Cầu Giấy, Hà Nội
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
HTML;
    }

    /**
     * Send Registration OTP Email
     */
    public static function sendRegisterOtp(string $toEmail, string $fullName, string $otp): bool
    {
        try {
            $subject = "[CameraHub] Mã OTP xác thực đăng ký tài khoản: " . $otp;
            $nameDisplay = htmlspecialchars($fullName ?: 'Quý khách');

            $bodyHtml = <<<HTML
            <h2 style="font-size: 18px; font-weight: 700; color: #22221f; margin-top: 0;">Xin chào {$nameDisplay},</h2>
            <p style="font-size: 14px; line-height: 1.6; color: #5a5a52; margin: 0 0 20px 0;">
                Cảm ơn bạn đã đăng ký tài khoản thành viên tại <strong>CameraHub</strong>. Để hoàn tất quy trình bảo mật và kích hoạt tài khoản, vui lòng sử dụng mã OTP xác thực dưới đây:
            </p>

            <!-- OTP Box -->
            <div style="background: #faf6ee; border: 2px dashed #f17a35; border-radius: 12px; padding: 20px; text-align: center; margin: 25px 0;">
                <div style="font-size: 11px; font-weight: 700; color: #e85d1b; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px;">MÃ XÁC THỰC OTP CỦA BẠN</div>
                <div style="font-size: 34px; font-weight: 800; letter-spacing: 10px; color: #151513; font-family: 'Courier New', Courier, monospace;">{$otp}</div>
                <div style="font-size: 12px; color: #7a7a73; margin-top: 8px;">Mã có hiệu lực trong vòng <strong>5 phút</strong></div>
            </div>

            <p style="font-size: 13px; color: #7a7a73; line-height: 1.6; margin-bottom: 0;">
                🔒 <em>Lưu ý: Tuyệt đối không chia sẻ mã này cho bất kỳ ai. Nếu bạn không yêu cầu đăng ký này, vui lòng bỏ qua email.</em>
            </p>
HTML;

            $fullHtml = self::wrapTemplate("Xác Thực Đăng Ký Tài Khoản", $bodyHtml);

            Mail::html($fullHtml, function ($message) use ($toEmail, $subject) {
                $message->to($toEmail)
                    ->subject($subject);
            });

            return true;
        } catch (\Throwable $e) {
            Log::error("Failed to send register OTP email to {$toEmail}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Send Change Email OTP
     */
    public static function sendChangeEmailOtp(string $toEmail, string $fullName, string $otp): bool
    {
        try {
            $subject = "[CameraHub] Mã OTP xác nhận đổi địa chỉ Email: " . $otp;
            $nameDisplay = htmlspecialchars($fullName ?: 'Quý khách');

            $bodyHtml = <<<HTML
            <h2 style="font-size: 18px; font-weight: 700; color: #22221f; margin-top: 0;">Xin chào {$nameDisplay},</h2>
            <p style="font-size: 14px; line-height: 1.6; color: #5a5a52; margin: 0 0 20px 0;">
                Hệ thống nhận được yêu cầu cập nhật địa chỉ email đăng nhập tài khoản của bạn tại <strong>CameraHub</strong> sang địa chỉ <strong>{$toEmail}</strong>.
            </p>

            <!-- OTP Box -->
            <div style="background: #faf6ee; border: 2px dashed #f17a35; border-radius: 12px; padding: 20px; text-align: center; margin: 25px 0;">
                <div style="font-size: 11px; font-weight: 700; color: #e85d1b; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px;">MÃ XÁC THỰC ĐỔI EMAIL</div>
                <div style="font-size: 34px; font-weight: 800; letter-spacing: 10px; color: #151513; font-family: 'Courier New', Courier, monospace;">{$otp}</div>
                <div style="font-size: 12px; color: #7a7a73; margin-top: 8px;">Mã có hiệu lực trong vòng <strong>5 phút</strong></div>
            </div>

            <p style="font-size: 13px; color: #7a7a73; line-height: 1.6; margin-bottom: 0;">
                🔒 <em>Nếu bạn không thực hiện yêu cầu này, vui lòng đổi mật khẩu ngay lập tức hoặc liên hệ hỗ trợ CameraHub.</em>
            </p>
HTML;

            $fullHtml = self::wrapTemplate("Xác Nhận Thay Đổi Email", $bodyHtml);

            Mail::html($fullHtml, function ($message) use ($toEmail, $subject) {
                $message->to($toEmail)
                    ->subject($subject);
            });

            return true;
        } catch (\Throwable $e) {
            Log::error("Failed to send change email OTP to {$toEmail}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Send Forgot Password OTP Email
     */
    public static function sendForgotPasswordOtp(string $toEmail, string $fullName, string $otp): bool
    {
        try {
            $subject = "[CameraHub] Mã OTP đặt lại mật khẩu của bạn: " . $otp;
            $nameDisplay = htmlspecialchars($fullName ?: 'Quý khách');

            $bodyHtml = <<<HTML
            <h2 style="font-size: 18px; font-weight: 700; color: #22221f; margin-top: 0;">Xin chào {$nameDisplay},</h2>
            <p style="font-size: 14px; line-height: 1.6; color: #5a5a52; margin: 0 0 20px 0;">
                Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản <strong>CameraHub</strong> liên kết với địa chỉ email <strong>{$toEmail}</strong>.
            </p>

            <!-- OTP Box -->
            <div style="background: #faf6ee; border: 2px dashed #f17a35; border-radius: 12px; padding: 20px; text-align: center; margin: 25px 0;">
                <div style="font-size: 11px; font-weight: 700; color: #e85d1b; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px;">MÃ XÁC THỰC ĐẶT LẠI MẬT KHẨU</div>
                <div style="font-size: 34px; font-weight: 800; letter-spacing: 10px; color: #151513; font-family: 'Courier New', Courier, monospace;">{$otp}</div>
                <div style="font-size: 12px; color: #7a7a73; margin-top: 8px;">Mã xác thực có hiệu lực trong vòng <strong>5 phút</strong></div>
            </div>

            <p style="font-size: 13px; color: #7a7a73; line-height: 1.6; margin-bottom: 0;">
                🔒 <em>Lưu ý: Tuyệt đối không cung cấp mã OTP này cho bất kỳ ai để bảo vệ tài khoản. Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email hoặc liên hệ với hỗ trợ CameraHub.</em>
            </p>
HTML;

            $fullHtml = self::wrapTemplate("Khôi Phục Mật Khẩu Tài Khoản", $bodyHtml);

            Mail::html($fullHtml, function ($message) use ($toEmail, $subject) {
                $message->to($toEmail)
                    ->subject($subject);
            });

            return true;
        } catch (\Throwable $e) {
            Log::error("Failed to send forgot password OTP to {$toEmail}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Send Order Confirmation Email (Khi đặt đơn hàng thành công)
     */
    public static function sendOrderConfirmation($order): bool
    {
        try {
            $toEmail = $order->customer_email;
            if (!$toEmail) return false;

            $orderCode = htmlspecialchars($order->order_code ?: ('CAM-' . $order->id));
            $subject = "[CameraHub] Xác nhận đơn hàng #" . $orderCode . " - Đặt hàng thành công!";
            $customerName = htmlspecialchars($order->customer_name ?: 'Quý khách');
            $totalAmountFormatted = number_format((float) $order->total_amount, 0, ',', '.') . ' ₫';
            $shippingAddress = htmlspecialchars($order->shipping_address . ($order->city ? ', ' . $order->city : ''));
            $phone = htmlspecialchars($order->customer_phone ?: 'Chưa cung cấp');
            
            $methodMap = [
                'vietqr' => 'Chuyển khoản VietQR (Napas 24/7)',
                'bank_transfer' => 'Chuyển khoản ngân hàng',
                'momo' => 'Ví điện tử MoMo',
                'vnpay' => 'Cổng VNPAY',
                'cod' => 'Thanh toán khi nhận hàng (COD)',
            ];
            $paymentMethodName = $methodMap[$order->payment_method] ?? strtoupper($order->payment_method ?: 'COD');

            // Generate items table rows with correct subtotal calculation
            $itemsHtml = '';
            $items = $order->items ?? [];
            foreach ($items as $item) {
                $pName = htmlspecialchars($item->name ?? ($item->product?->name ?? 'Thiết bị máy ảnh'));
                $price = (float) $item->price;
                $qty = (int) $item->quantity;
                $lineTotal = $price * $qty;
                $pPrice = number_format($price, 0, ',', '.') . ' ₫';
                $pSubtotal = number_format($lineTotal, 0, ',', '.') . ' ₫';

                $itemsHtml .= <<<HTML
                <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #f5ede0; font-size: 13px; color: #22221f; font-weight: 600;">
                        {$pName}
                        <div style="font-size: 11px; color: #888; font-weight: normal; margin-top: 2px;">Đơn giá: {$pPrice}</div>
                    </td>
                    <td style="padding: 12px 10px; border-bottom: 1px solid #f5ede0; font-size: 13px; color: #5a5a52; text-align: center;">
                        {$qty}
                    </td>
                    <td style="padding: 12px 0; border-bottom: 1px solid #f5ede0; font-size: 13px; color: #e85d1b; font-weight: 700; text-align: right;">
                        {$pSubtotal}
                    </td>
                </tr>
HTML;
            }

            $bodyHtml = <<<HTML
            <h2 style="font-size: 18px; font-weight: 700; color: #22221f; margin-top: 0;">Xin chào {$customerName},</h2>
            <p style="font-size: 14px; line-height: 1.6; color: #5a5a52; margin: 0 0 20px 0;">
                Cảm ơn bạn đã tin tưởng lựa chọn thiết bị tại <strong>CameraHub</strong>! Đơn hàng của bạn đã được tiếp nhận thành công với thông tin chi tiết dưới đây:
            </p>

            <!-- Order Info Summary Box -->
            <div style="background-color: #faf6ee; border-radius: 12px; padding: 18px 20px; margin-bottom: 24px; border: 1px solid #f5ede0;">
                <table width="100%" border="0" cellpadding="0" cellspacing="0" style="font-size: 13px; line-height: 1.8;">
                    <tr>
                        <td width="38%" style="color: #7a7a73; font-weight: 500;">Mã đơn hàng:</td>
                        <td style="color: #e85d1b; font-weight: 800; font-family: monospace; font-size: 14px;">#{$orderCode}</td>
                    </tr>
                    <tr>
                        <td style="color: #7a7a73; font-weight: 500;">Người nhận:</td>
                        <td style="color: #22221f; font-weight: 600;">{$customerName} ({$phone})</td>
                    </tr>
                    <tr>
                        <td style="color: #7a7a73; font-weight: 500;">Địa chỉ giao hàng:</td>
                        <td style="color: #22221f;">{$shippingAddress}</td>
                    </tr>
                    <tr>
                        <td style="color: #7a7a73; font-weight: 500;">Phương thức:</td>
                        <td style="color: #22221f; font-weight: 600;">{$paymentMethodName}</td>
                    </tr>
                    <tr>
                        <td style="color: #7a7a73; font-weight: 500;">Đối tác vận chuyển:</td>
                        <td style="color: #f97316; font-weight: 700;">Giao Hàng Nhanh (GHN Express)</td>
                    </tr>
                </table>
            </div>

            <!-- Items Table -->
            <h3 style="font-size: 14px; font-weight: 700; color: #22221f; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 0.5px;">Chi Tiết Sản Phẩm</h3>
            <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                <thead>
                    <tr style="border-bottom: 2px solid #dec9a6;">
                        <th align="left" style="padding-bottom: 8px; font-size: 12px; color: #7a7a73; font-weight: 600;">Sản phẩm</th>
                        <th align="center" style="padding-bottom: 8px; font-size: 12px; color: #7a7a73; font-weight: 600; width: 60px;">SL</th>
                        <th align="right" style="padding-bottom: 8px; font-size: 12px; color: #7a7a73; font-weight: 600; width: 110px;">Thành tiền</th>
                    </tr>
                </thead>
                <tbody>
                    {$itemsHtml}
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="2" style="padding-top: 15px; font-size: 15px; font-weight: 700; color: #22221f;">Tổng thanh toán:</td>
                        <td align="right" style="padding-top: 15px; font-size: 18px; font-weight: 800; color: #e85d1b;">{$totalAmountFormatted}</td>
                    </tr>
                </tfoot>
            </table>

            <p style="font-size: 13px; color: #7a7a73; line-height: 1.6; margin: 25px 0 0 0; padding-top: 15px; border-top: 1px solid #f5ede0;">
                Chúng tôi sẽ thông báo cho bạn ngay khi kiện hàng được bàn giao cho đối tác vận chuyển GHN Express. Mọi thắc mắc xin liên hệ Hotline: <strong>1900-8888</strong>.
            </p>
HTML;

            $fullHtml = self::wrapTemplate("Xác Nhận Đơn Hàng #" . $orderCode, $bodyHtml);

            Mail::html($fullHtml, function ($message) use ($toEmail, $subject) {
                $message->to($toEmail)
                    ->subject($subject);
            });

            return true;
        } catch (\Throwable $e) {
            Log::error("Failed to send order confirmation email to {$order->customer_email}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Send Payment Success Email (Thông báo xác nhận thanh toán thành công để khách an tâm)
     */
    public static function sendPaymentSuccessNotification($order): bool
    {
        try {
            $toEmail = $order->customer_email;
            if (!$toEmail) return false;

            $customerName = htmlspecialchars($order->customer_name ?: 'Quý khách');
            $orderCode = htmlspecialchars($order->order_code ?: ('CAM-' . $order->id));
            $subject = "[CameraHub] ✅ Xác nhận thanh toán thành công đơn hàng #" . $orderCode . " - Đang chuẩn bị giao hàng!";
            $totalAmountFormatted = number_format((float) $order->total_amount, 0, ',', '.') . ' ₫';
            $shippingAddress = htmlspecialchars($order->shipping_address . ($order->city ? ', ' . $order->city : ''));
            $phone = htmlspecialchars($order->customer_phone ?: 'Chưa cung cấp');

            $methodMap = [
                'vietqr' => 'Chuyển khoản VietQR (Napas 24/7)',
                'bank_transfer' => 'Chuyển khoản ngân hàng',
                'momo' => 'Ví điện tử MoMo Gateway',
                'vnpay' => 'Cổng thanh toán VNPAY',
                'cod' => 'Thanh toán khi nhận hàng (COD)',
            ];
            $paymentMethodName = $methodMap[$order->payment_method] ?? strtoupper($order->payment_method ?: 'Trực tuyến');
            $paidTime = now()->format('H:i:s d/m/Y');

            // Generate items table rows with calculated subtotals
            $itemsHtml = '';
            $items = $order->items ?? [];
            foreach ($items as $item) {
                $pName = htmlspecialchars($item->name ?? ($item->product?->name ?? 'Thiết bị máy ảnh'));
                $price = (float) $item->price;
                $qty = (int) $item->quantity;
                $lineTotal = $price * $qty;
                $pPrice = number_format($price, 0, ',', '.') . ' ₫';
                $pSubtotal = number_format($lineTotal, 0, ',', '.') . ' ₫';

                $itemsHtml .= <<<HTML
                <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #f5ede0; font-size: 13px; color: #22221f; font-weight: 600;">
                        <span style="display: block; font-size: 13px; font-weight: 600; color: #151513;">{$pName}</span>
                        <span style="font-size: 11px; color: #888; font-weight: normal;">Đơn giá: {$pPrice}</span>
                    </td>
                    <td style="padding: 12px 10px; border-bottom: 1px solid #f5ede0; font-size: 13px; color: #5a5a52; text-align: center;">
                        x{$qty}
                    </td>
                    <td style="padding: 12px 0; border-bottom: 1px solid #f5ede0; font-size: 13px; color: #059669; font-weight: 700; text-align: right;">
                        {$pSubtotal}
                    </td>
                </tr>
HTML;
            }

            $bodyHtml = <<<HTML
            <div style="text-align: center; margin-bottom: 24px;">
                <div style="display: inline-block; width: 56px; height: 56px; line-height: 56px; border-radius: 28px; background: #ecfdf5; border: 2px solid #a7f3d0; text-align: center; font-size: 26px; margin-bottom: 10px;">
                    ✅
                </div>
                <h2 style="font-size: 20px; font-weight: 800; color: #065f46; margin: 0 0 6px 0;">XÁC NHẬN THANH TOÁN THÀNH CÔNG</h2>
                <p style="font-size: 13px; color: #047857; margin: 0;">Giao dịch đối soát thành công • Đơn hàng đã được duyệt đóng gói</p>
            </div>

            <p style="font-size: 14px; line-height: 1.6; color: #44443d; margin: 0 0 20px 0;">
                Xin chào <strong>{$customerName}</strong>, CameraHub xin thông báo đơn hàng <strong>#{$orderCode}</strong> của bạn đã được xác nhận thanh toán thành công số tiền <strong>{$totalAmountFormatted}</strong>! Kho hàng của chúng tôi đang tiến hành kiểm tra kỹ thuật, dán tem bảo hành và đóng gói chống sốc chuyên dụng để chuẩn bị bàn giao cho <strong>Giao Hàng Nhanh (GHN Express)</strong>.
            </p>

            <!-- Payment Receipt Box -->
            <div style="background-color: #faf6ee; border-radius: 14px; padding: 20px; margin-bottom: 24px; border: 1px solid #f2e3cd;">
                <table width="100%" border="0" cellpadding="0" cellspacing="0" style="font-size: 13px; line-height: 1.9;">
                    <tr>
                        <td width="42%" style="color: #7a7a73;">Mã đơn hàng:</td>
                        <td style="color: #e85d1b; font-weight: 800; font-family: monospace; font-size: 14px;">#{$orderCode}</td>
                    </tr>
                    <tr>
                        <td style="color: #7a7a73;">Trạng thái thanh toán:</td>
                        <td><span style="display: inline-block; padding: 3px 9px; border-radius: 6px; background-color: #ecfdf5; color: #059669; font-weight: 700; font-size: 11px; border: 1px solid #a7f3d0;">✓ ĐÃ THANH TOÁN THÀNH CÔNG</span></td>
                    </tr>
                    <tr>
                        <td style="color: #7a7a73;">Số tiền đã thanh toán:</td>
                        <td style="color: #059669; font-weight: 800; font-size: 15px;">{$totalAmountFormatted}</td>
                    </tr>
                    <tr>
                        <td style="color: #7a7a73;">Phương thức:</td>
                        <td style="color: #22221f; font-weight: 600;">{$paymentMethodName}</td>
                    </tr>
                    <tr>
                        <td style="color: #7a7a73;">Thời gian xác nhận:</td>
                        <td style="color: #22221f;">{$paidTime}</td>
                    </tr>
                    <tr>
                        <td style="color: #7a7a73;">Người nhận:</td>
                        <td style="color: #22221f; font-weight: 600;">{$customerName} ({$phone})</td>
                    </tr>
                    <tr>
                        <td style="color: #7a7a73;">Địa chỉ giao hàng:</td>
                        <td style="color: #22221f;">{$shippingAddress}</td>
                    </tr>
                    <tr>
                        <td style="color: #7a7a73;">Đối tác vận chuyển:</td>
                        <td style="color: #f97316; font-weight: 700;">Giao Hàng Nhanh (GHN Express)</td>
                    </tr>
                </table>
            </div>

            <!-- Items Table -->
            <h3 style="font-size: 14px; font-weight: 700; color: #22221f; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 0.5px;">Thiết Bị Trong Kiện Hàng</h3>
            <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                <thead>
                    <tr style="border-bottom: 2px solid #dec9a6;">
                        <th align="left" style="padding-bottom: 8px; font-size: 12px; color: #7a7a73; font-weight: 600;">Sản phẩm</th>
                        <th align="center" style="padding-bottom: 8px; font-size: 12px; color: #7a7a73; font-weight: 600; width: 50px;">SL</th>
                        <th align="right" style="padding-bottom: 8px; font-size: 12px; color: #7a7a73; font-weight: 600; width: 110px;">Thành tiền</th>
                    </tr>
                </thead>
                <tbody>
                    {$itemsHtml}
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="2" style="padding-top: 15px; font-size: 14px; font-weight: 700; color: #22221f;">Tổng tiền đã thanh toán:</td>
                        <td align="right" style="padding-top: 15px; font-size: 17px; font-weight: 800; color: #059669;">{$totalAmountFormatted}</td>
                    </tr>
                </tfoot>
            </table>

            <!-- Reassurance Commitments -->
            <div style="background-color: #f8fafc; border-radius: 12px; padding: 16px 18px; margin: 25px 0 0 0; border: 1px solid #e2e8f0; font-size: 12px; color: #475569; line-height: 1.6;">
                <div style="font-weight: 700; color: #0f172a; margin-bottom: 6px; font-size: 13px;">🛡️ Cam Kết Dịch Vụ & Bảo Vệ Khách Hàng:</div>
                <div style="margin-bottom: 4px;">• <strong>Bảo hiểm 100%:</strong> Toàn bộ thiết bị máy ảnh và ống kính được bảo hiểm giá trị cao trong suốt quá trình vận chuyển.</div>
                <div style="margin-bottom: 4px;">• <strong>Đóng gói chuyên dụng:</strong> Chèn xốp bóng khí 3 lớp chống sốc, niêm phong tem chống bóc mở trước khi gửi.</div>
                <div>• <strong>Theo dõi hành trình:</strong> Khi bưu tá GHN nhận kiện hàng, bạn có thể tra cứu mã vận đơn trực tiếp tại trang web CameraHub.</div>
            </div>

            <p style="font-size: 13px; color: #7a7a73; line-height: 1.6; margin: 20px 0 0 0; text-align: center;">
                Cần hỗ trợ gấp? Gọi ngay Hotline miễn phí: <strong style="color: #e85d1b;">1900-8888</strong> (08:30 - 21:30 hàng ngày).
            </p>
HTML;

            $fullHtml = self::wrapTemplate("Xác Nhận Thanh Toán Thành Công #" . $orderCode, $bodyHtml, "✅ THANH TOÁN THÀNH CÔNG", "#10b981");

            Mail::html($fullHtml, function ($message) use ($toEmail, $subject) {
                $message->to($toEmail)
                    ->subject($subject);
            });

            Log::info("Payment success email sent to {$toEmail} for order #{$orderCode}");
            return true;
        } catch (\Throwable $e) {
            Log::error("Failed to send payment success email to {$order->customer_email}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Send Order Status Update Email (Theo từng giai đoạn: processing, shipping, delivered/completed, cancelled)
     */
    public static function sendOrderStatusUpdated($order, string $newStatus, ?string $reason = null): bool
    {
        try {
            $toEmail = $order->customer_email;
            if (!$toEmail) return false;

            $orderCode = htmlspecialchars($order->order_code ?: ('CAM-' . $order->id));
            $customerName = htmlspecialchars($order->customer_name ?: 'Quý khách');
            $totalAmountFormatted = number_format((float) $order->total_amount, 0, ',', '.') . ' ₫';
            $shippingAddress = htmlspecialchars($order->shipping_address . ($order->city ? ', ' . $order->city : ''));
            $phone = htmlspecialchars($order->customer_phone ?: 'Chưa cung cấp');
            $trackingCode = htmlspecialchars($order->tracking_code ?: ($order->ghn_order_code ?: 'Đang cập nhật'));

            $statusConfig = [
                'processing' => [
                    'badge' => '📦 ĐANG CHUẨN BỊ HÀNG',
                    'color' => '#f59e0b',
                    'title' => 'Đơn Hàng Đang Được Đóng Gói Chuẩn Bị',
                    'subject' => "[CameraHub] 📦 Đơn hàng #{$orderCode} đang được chuẩn bị và kiểm tra kỹ thuật",
                    'message' => "Đơn hàng của bạn đã được chuyển cho đội ngũ kỹ thuật kho tại CameraHub. Chúng tôi đang tiến hành kiểm tra cảm biến, phụ kiện kèm theo, dán tem bảo hành điện tử và bọc xốp chống sốc 3 lớp chuyên dụng trước khi bàn giao cho đơn vị vận chuyển.",
                    'step' => 'Giai đoạn 2/4: Chuẩn bị & Đóng gói hàng',
                ],
                'shipping' => [
                    'badge' => '🚚 ĐANG VẬN CHUYỂN',
                    'color' => '#3b82f6',
                    'title' => 'Đơn Hàng Đang Trên Đường Giao Đến Bạn',
                    'subject' => "[CameraHub] 🚚 Đơn hàng #{$orderCode} đã bàn giao cho GHN Express - Đang giao hàng!",
                    'message' => "Kiện hàng của bạn đã được xuất kho và bàn giao thành công cho bưu tá <strong>Giao Hàng Nhanh (GHN Express)</strong>. Bưu tá sẽ liên hệ với bạn trước khi giao hàng qua số điện thoại <strong>{$phone}</strong>.",
                    'step' => 'Giai đoạn 3/4: Đang trên đường giao hàng',
                ],
                'completed' => [
                    'badge' => '🎉 GIAO HÀNG THÀNH CÔNG',
                    'color' => '#10b981',
                    'title' => 'Đơn Hàng Đã Giao Thành Công',
                    'subject' => "[CameraHub] 🎉 Đơn hàng #{$orderCode} đã được giao thành công!",
                    'message' => "CameraHub xác nhận bạn đã nhận được kiện hàng thành công! Cảm ơn bạn đã lựa chọn tin tưởng CameraHub. Toàn bộ thiết bị máy ảnh trong đơn hàng của bạn đã được tự động kích hoạt bảo hành điện tử chính hãng.",
                    'step' => 'Giai đoạn 4/4: Giao hàng thành công hoàn tất',
                ],
                'delivered' => [
                    'badge' => '🎉 GIAO HÀNG THÀNH CÔNG',
                    'color' => '#10b981',
                    'title' => 'Đơn Hàng Đã Giao Thành Công',
                    'subject' => "[CameraHub] 🎉 Đơn hàng #{$orderCode} đã được giao thành công!",
                    'message' => "CameraHub xác nhận bạn đã nhận được kiện hàng thành công! Cảm ơn bạn đã lựa chọn tin tưởng CameraHub. Toàn bộ thiết bị máy ảnh trong đơn hàng của bạn đã được tự động kích hoạt bảo hành điện tử chính hãng.",
                    'step' => 'Giai đoạn 4/4: Giao hàng thành công hoàn tất',
                ],
                'cancelled' => [
                    'badge' => '❌ ĐÃ HỦY ĐƠN HÀNG',
                    'color' => '#ef4444',
                    'title' => 'Thông Báo Hủy Đơn Hàng',
                    'subject' => "[CameraHub] ⚠️ Thông báo hủy đơn hàng #{$orderCode}",
                    'message' => "Đơn hàng của bạn tại CameraHub đã được hủy trên hệ thống. " . ($reason ? ("Lý do: <em>" . htmlspecialchars($reason) . "</em>.") : '') . " Toàn bộ số lượng sản phẩm trong đơn đã được hoàn trả về kho. Nếu bạn đã thanh toán trực tuyến trước đó, bộ phận kế toán sẽ tiến hành đối soát và hoàn tiền vào tài khoản ngân hàng của bạn.",
                    'step' => 'Trạng thái: Đã hủy đơn',
                ],
            ];

            $config = $statusConfig[$newStatus] ?? [
                'badge' => '📋 CẬP NHẬT TRẠNG THÁI',
                'color' => '#6b7280',
                'title' => 'Cập Nhật Trạng Thái Đơn Hàng',
                'subject' => "[CameraHub] Cập nhật trạng thái đơn hàng #{$orderCode}",
                'message' => "Đơn hàng của bạn đã được cập nhật sang trạng thái: <strong>" . strtoupper($newStatus) . "</strong>.",
                'step' => 'Trạng thái: ' . $newStatus,
            ];

            // Generate items summary
            $itemsHtml = '';
            $items = $order->items ?? [];
            foreach ($items as $item) {
                $pName = htmlspecialchars($item->name ?? ($item->product?->name ?? 'Thiết bị máy ảnh'));
                $price = (float) $item->price;
                $qty = (int) $item->quantity;
                $lineTotal = $price * $qty;
                $pPrice = number_format($price, 0, ',', '.') . ' ₫';
                $pSubtotal = number_format($lineTotal, 0, ',', '.') . ' ₫';

                $itemsHtml .= <<<HTML
                <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #f5ede0; font-size: 13px; color: #22221f;">
                        <strong>{$pName}</strong>
                        <div style="font-size: 11px; color: #888;">Đơn giá: {$pPrice}</div>
                    </td>
                    <td style="padding: 10px 10px; border-bottom: 1px solid #f5ede0; font-size: 13px; color: #5a5a52; text-align: center;">
                        x{$qty}
                    </td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #f5ede0; font-size: 13px; color: #e85d1b; font-weight: 700; text-align: right;">
                        {$pSubtotal}
                    </td>
                </tr>
HTML;
            }

            $bodyHtml = <<<HTML
            <div style="background-color: #faf6ee; border-left: 4px solid {$config['color']}; border-radius: 8px; padding: 14px 18px; margin-bottom: 22px;">
                <div style="font-size: 11px; font-weight: 700; color: {$config['color']}; text-transform: uppercase; letter-spacing: 1px;">{$config['step']}</div>
                <div style="font-size: 16px; font-weight: 700; color: #151513; margin-top: 4px;">{$config['title']}</div>
            </div>

            <p style="font-size: 14px; line-height: 1.6; color: #44443d; margin: 0 0 20px 0;">
                Xin chào <strong>{$customerName}</strong>,<br>
                {$config['message']}
            </p>

            <!-- Order Details Box -->
            <div style="background-color: #faf6ee; border-radius: 12px; padding: 18px 20px; margin-bottom: 22px; border: 1px solid #f5ede0;">
                <table width="100%" border="0" cellpadding="0" cellspacing="0" style="font-size: 13px; line-height: 1.8;">
                    <tr>
                        <td width="40%" style="color: #7a7a73;">Mã đơn hàng:</td>
                        <td style="color: #e85d1b; font-weight: 800; font-family: monospace; font-size: 14px;">#{$orderCode}</td>
                    </tr>
                    <tr>
                        <td style="color: #7a7a73;">Người nhận:</td>
                        <td style="color: #22221f; font-weight: 600;">{$customerName} ({$phone})</td>
                    </tr>
                    <tr>
                        <td style="color: #7a7a73;">Địa chỉ nhận hàng:</td>
                        <td style="color: #22221f;">{$shippingAddress}</td>
                    </tr>
                    <tr>
                        <td style="color: #7a7a73;">Đơn vị vận chuyển:</td>
                        <td style="color: #f97316; font-weight: 700;">Giao Hàng Nhanh (GHN Express)</td>
                    </tr>
                    <tr>
                        <td style="color: #7a7a73;">Mã vận đơn GHN:</td>
                        <td style="font-family: monospace; font-weight: 700; color: #2563eb;">{$trackingCode}</td>
                    </tr>
                    <tr>
                        <td style="color: #7a7a73;">Tổng thanh toán:</td>
                        <td style="color: #e85d1b; font-weight: 800; font-size: 15px;">{$totalAmountFormatted}</td>
                    </tr>
                </table>
            </div>

            <!-- Items Table -->
            <h3 style="font-size: 13px; font-weight: 700; color: #22221f; margin: 0 0 8px 0; text-transform: uppercase;">Sản Phẩm Trong Đơn Hàng</h3>
            <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                <thead>
                    <tr style="border-bottom: 2px solid #dec9a6;">
                        <th align="left" style="padding-bottom: 6px; font-size: 12px; color: #7a7a73; font-weight: 600;">Sản phẩm</th>
                        <th align="center" style="padding-bottom: 6px; font-size: 12px; color: #7a7a73; font-weight: 600; width: 50px;">SL</th>
                        <th align="right" style="padding-bottom: 6px; font-size: 12px; color: #7a7a73; font-weight: 600; width: 110px;">Thành tiền</th>
                    </tr>
                </thead>
                <tbody>
                    {$itemsHtml}
                </tbody>
            </table>

            <p style="font-size: 13px; color: #7a7a73; line-height: 1.6; margin: 20px 0 0 0; text-align: center; border-top: 1px solid #f5ede0; padding-top: 15px;">
                Cần hỗ trợ về hành trình đơn hàng? Vui lòng liên hệ Hotline: <strong style="color: #e85d1b;">1900-8888</strong>.
            </p>
HTML;

            $fullHtml = self::wrapTemplate($config['title'] . " #" . $orderCode, $bodyHtml, $config['badge'], $config['color']);

            Mail::html($fullHtml, function ($message) use ($toEmail, $config) {
                $message->to($toEmail)
                    ->subject($config['subject']);
            });

            Log::info("Order status update email ({$newStatus}) sent to {$toEmail} for order #{$orderCode}");
            return true;
        } catch (\Throwable $e) {
            Log::error("Failed to send order status email ({$newStatus}) to {$order->customer_email}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Send Welcome Registration Email (Khi khách hàng đăng ký tài khoản thành công)
     */
    public static function sendWelcomeRegistration($user): bool
    {
        try {
            $toEmail = $user->email;
            if (!$toEmail) return false;

            $fullName = htmlspecialchars($user->name ?: 'Bạn');
            $customerCode = 'CAM-ACC-' . str_pad((string) $user->id, 5, '0', STR_PAD_LEFT);
            $subject = "[CameraHub] 🎉 Chào mừng " . $fullName . " gia nhập CameraHub - Đăng ký thành công!";
            $registerTime = now()->format('H:i:s d/m/Y');

            $bodyHtml = <<<HTML
            <div style="text-align: center; margin-bottom: 24px;">
                <div style="display: inline-block; width: 60px; height: 60px; line-height: 60px; border-radius: 30px; background: #fff7ed; border: 2px solid #fed7aa; text-align: center; font-size: 28px; margin-bottom: 10px;">
                    📷
                </div>
                <h2 style="font-size: 20px; font-weight: 800; color: #9a3412; margin: 0 0 6px 0;">CHÀO MỪNG THÀNH VIÊN MỚI!</h2>
                <p style="font-size: 13px; color: #c2410c; margin: 0;">Tài khoản CameraHub của bạn đã được kích hoạt thành công</p>
            </div>

            <p style="font-size: 14px; line-height: 1.6; color: #44443d; margin: 0 0 20px 0;">
                Xin chào <strong>{$fullName}</strong>,<br>
                Cảm ơn bạn đã đăng ký tài khoản tại <strong>CameraHub</strong> - Hệ thống phân phối máy ảnh, ống kính và phụ kiện nhiếp ảnh chuyên nghiệp hàng đầu tại Việt Nam.
            </p>

            <!-- Account Info Box -->
            <div style="background-color: #faf6ee; border-radius: 14px; padding: 20px; margin-bottom: 24px; border: 1px solid #f2e3cd;">
                <div style="font-size: 12px; font-weight: 700; color: #e85d1b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">THÔNG TIN TÀI KHOẢN CỦA BẠN</div>
                <table width="100%" border="0" cellpadding="0" cellspacing="0" style="font-size: 13px; line-height: 1.9;">
                    <tr>
                        <td width="38%" style="color: #7a7a73;">Họ và tên:</td>
                        <td style="color: #22221f; font-weight: 600;">{$fullName}</td>
                    </tr>
                    <tr>
                        <td style="color: #7a7a73;">Email đăng nhập:</td>
                        <td style="color: #22221f; font-weight: 600; font-family: monospace;">{$toEmail}</td>
                    </tr>
                    <tr>
                        <td style="color: #7a7a73;">Mã thành viên:</td>
                        <td style="color: #e85d1b; font-weight: 800; font-family: monospace;">{$customerCode}</td>
                    </tr>
                    <tr>
                        <td style="color: #7a7a73;">Thời gian kích hoạt:</td>
                        <td style="color: #22221f;">{$registerTime}</td>
                    </tr>
                </table>
            </div>

            <!-- Member Privileges Box -->
            <div style="background-color: #f8fafc; border-radius: 12px; padding: 18px 20px; margin-bottom: 24px; border: 1px solid #e2e8f0; font-size: 13px; line-height: 1.7; color: #334155;">
                <div style="font-weight: 700; color: #0f172a; margin-bottom: 10px; font-size: 14px;">✨ Đặc Quyền Thành Viên CameraHub:</div>
                <div style="margin-bottom: 6px;">🎁 <strong>Ưu đãi thành viên:</strong> Tích lũy điểm thưởng và nhận mã voucher giảm giá định kỳ qua email.</div>
                <div style="margin-bottom: 6px;">🛡️ <strong>Bảo hành chính hãng VIP:</strong> Tra cứu bảo hành điện tử nhanh chóng 24/7 trực tiếp trên website.</div>
                <div style="margin-bottom: 6px;">🧼 <strong>Dịch vụ miễn phí:</strong> Miễn phí vệ sinh cảm biến và kiểm tra kỹ thuật máy ảnh trọn đời tại showroom.</div>
                <div>🚚 <strong>Giao hàng hỏa tốc:</strong> Vận chuyển nhanh qua đối tác Giao Hàng Nhanh (GHN) trên toàn quốc.</div>
            </div>

            <p style="font-size: 13px; color: #7a7a73; line-height: 1.6; margin: 20px 0 0 0; text-align: center;">
                Nếu bạn có bất kỳ câu hỏi nào về thiết bị hoặc chính sách, hãy liên hệ Hotline hỗ trợ: <strong style="color: #e85d1b;">1900-8888</strong>.
            </p>
HTML;

            $fullHtml = self::wrapTemplate("Chào Mừng Thành Viên Mới!", $bodyHtml, "🎉 ĐĂNG KÝ THÀNH CÔNG", "#f17a35");

            Mail::html($fullHtml, function ($message) use ($toEmail, $subject) {
                $message->to($toEmail)
                    ->subject($subject);
            });

            Log::info("Welcome registration email sent to {$toEmail}");
            return true;
        } catch (\Throwable $e) {
            Log::error("Failed to send welcome registration email to {$user->email}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Helper phân tích thiết bị người dùng đăng nhập
     */
    private static function formatDevice(?string $userAgent): string
    {
        if (empty($userAgent)) return 'Trình duyệt Web (Thiết bị không xác định)';
        $os = 'Máy tính / Di động';
        if (str_contains($userAgent, 'Windows NT 10.0')) $os = 'Windows 10/11';
        elseif (str_contains($userAgent, 'Windows')) $os = 'Windows PC';
        elseif (str_contains($userAgent, 'Macintosh') || str_contains($userAgent, 'Mac OS X')) $os = 'macOS (Apple Mac)';
        elseif (str_contains($userAgent, 'iPhone')) $os = 'Apple iPhone';
        elseif (str_contains($userAgent, 'iPad')) $os = 'Apple iPad';
        elseif (str_contains($userAgent, 'Android')) $os = 'Thiết bị Android';
        elseif (str_contains($userAgent, 'Linux')) $os = 'Linux OS';

        $browser = 'Trình duyệt Web';
        if (str_contains($userAgent, 'Edg/')) $browser = 'Microsoft Edge';
        elseif (str_contains($userAgent, 'Chrome/')) $browser = 'Google Chrome';
        elseif (str_contains($userAgent, 'Safari/') && !str_contains($userAgent, 'Chrome')) $browser = 'Apple Safari';
        elseif (str_contains($userAgent, 'Firefox/')) $browser = 'Mozilla Firefox';

        return "{$browser} trên {$os}";
    }

    /**
     * Send Login Notification Email (Cảnh báo an toàn khi có phiên đăng nhập mới)
     */
    public static function sendLoginNotification($user, string $ip, ?string $userAgent = null): bool
    {
        try {
            $toEmail = $user->email;
            if (!$toEmail) return false;

            $fullName = htmlspecialchars($user->name ?: 'Bạn');
            $subject = "[CameraHub] 🔐 Cảnh báo bảo mật: Phát hiện đăng nhập tài khoản CameraHub mới";
            $loginTime = now()->format('H:i:s d/m/Y');
            $device = htmlspecialchars(self::formatDevice($userAgent));
            $clientIp = htmlspecialchars($ip ?: 'Không xác định');

            $bodyHtml = <<<HTML
            <div style="text-align: center; margin-bottom: 24px;">
                <div style="display: inline-block; width: 56px; height: 56px; line-height: 56px; border-radius: 28px; background: #eff6ff; border: 2px solid #bfdbfe; text-align: center; font-size: 26px; margin-bottom: 10px;">
                    🔐
                </div>
                <h2 style="font-size: 19px; font-weight: 800; color: #1e40af; margin: 0 0 6px 0;">THÔNG BÁO ĐĂNG NHẬP MỚI</h2>
                <p style="font-size: 13px; color: #2563eb; margin: 0;">Ghi nhận phiên đăng nhập thành công vào tài khoản</p>
            </div>

            <p style="font-size: 14px; line-height: 1.6; color: #44443d; margin: 0 0 20px 0;">
                Xin chào <strong>{$fullName}</strong>,<br>
                Hệ thống bảo mật CameraHub ghi nhận tài khoản của bạn (<strong>{$toEmail}</strong>) vừa được đăng nhập thành công với thông tin chi tiết dưới đây:
            </p>

            <!-- Login Details Box -->
            <div style="background-color: #faf6ee; border-radius: 14px; padding: 20px; margin-bottom: 24px; border: 1px solid #f2e3cd;">
                <table width="100%" border="0" cellpadding="0" cellspacing="0" style="font-size: 13px; line-height: 1.9;">
                    <tr>
                        <td width="38%" style="color: #7a7a73;">Thời gian đăng nhập:</td>
                        <td style="color: #22221f; font-weight: 700;">{$loginTime}</td>
                    </tr>
                    <tr>
                        <td style="color: #7a7a73;">Địa chỉ IP:</td>
                        <td style="color: #2563eb; font-weight: 700; font-family: monospace;">{$clientIp}</td>
                    </tr>
                    <tr>
                        <td style="color: #7a7a73;">Thiết bị & Trình duyệt:</td>
                        <td style="color: #22221f; font-weight: 600;">{$device}</td>
                    </tr>
                </table>
            </div>

            <!-- Security Notice Box -->
            <div style="background-color: #f8fafc; border-radius: 12px; padding: 16px 18px; margin-bottom: 20px; border: 1px solid #e2e8f0; font-size: 12px; color: #475569; line-height: 1.6;">
                <div style="font-weight: 700; color: #0f172a; margin-bottom: 6px; font-size: 13px;">🛡️ Đây có phải là bạn không?</div>
                <div style="margin-bottom: 4px;">• <strong>Nếu là bạn:</strong> Bạn có thể hoàn toàn yên tâm tiếp tục trải nghiệm và bỏ qua email này.</div>
                <div>• <strong>Nếu KHÔNG PHẢI bạn:</strong> Tài khoản của bạn có thể đã bị lộ mật khẩu. Vui lòng truy cập tính năng <strong>Quên mật khẩu</strong> trên website để đặt lại mật khẩu mới ngay lập tức hoặc liên hệ Hotline: <strong style="color: #e85d1b;">1900-8888</strong>.</div>
            </div>
HTML;

            $fullHtml = self::wrapTemplate("Thông Báo Đăng Nhập Tài Khoản", $bodyHtml, "🔐 BẢO MẬT TÀI KHOẢN", "#2563eb");

            Mail::html($fullHtml, function ($message) use ($toEmail, $subject) {
                $message->to($toEmail)
                    ->subject($subject);
            });

            Log::info("Login security notification email sent to {$toEmail}");
            return true;
        } catch (\Throwable $e) {
            Log::error("Failed to send login notification email to {$user->email}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Get Admin Notification Email Address
     */
    public static function getAdminEmail(): string
    {
        return env('ADMIN_NOTIFICATION_EMAIL') ?: (config('mail.from.address') ?: 'nvmtein@gmail.com');
    }

    /**
     * Send Admin New Order Alert (Gửi thông báo có đơn hàng mới phát sinh tới Quản trị viên)
     */
    public static function sendAdminNewOrderAlert($order): bool
    {
        try {
            $toEmail = self::getAdminEmail();
            if (!$toEmail) return false;

            $orderCode = htmlspecialchars($order->order_code ?: ('CAM-' . $order->id));
            $customerName = htmlspecialchars($order->customer_name ?: 'Khách hàng');
            $customerEmail = htmlspecialchars($order->customer_email ?: 'Chưa cung cấp');
            $customerPhone = htmlspecialchars($order->customer_phone ?: 'Chưa cung cấp');
            $shippingAddress = htmlspecialchars($order->shipping_address . ($order->city ? ', ' . $order->city : ''));
            $totalAmountFormatted = number_format((float) $order->total_amount, 0, ',', '.') . ' ₫';
            $orderTime = $order->created_at ? $order->created_at->format('H:i:s d/m/Y') : now()->format('H:i:s d/m/Y');

            $methodMap = [
                'vietqr' => 'Chuyển khoản VietQR',
                'bank_transfer' => 'Chuyển khoản ngân hàng',
                'momo' => 'Ví điện tử MoMo',
                'vnpay' => 'Cổng VNPAY',
                'cod' => 'Thanh toán khi nhận hàng (COD)',
            ];
            $paymentMethodName = $methodMap[$order->payment_method] ?? strtoupper($order->payment_method ?: 'COD');
            $paymentStatusName = $order->payment_status === 'paid' || $order->payment_status === 'completed'
                ? '<span style="color: #059669; font-weight: 700;">ĐÃ THANH TOÁN</span>'
                : '<span style="color: #d97706; font-weight: 700;">CHỜ THANH TOÁN (COD / PENDING)</span>';

            $subject = "[CameraHub Quản Trị] 🔔 Có đơn hàng mới #{$orderCode} - {$totalAmountFormatted} ({$customerName})";

            // Items table
            $itemsHtml = '';
            $items = $order->items ?? [];
            foreach ($items as $item) {
                $pName = htmlspecialchars($item->name ?? ($item->product?->name ?? 'Thiết bị máy ảnh'));
                $price = (float) $item->price;
                $qty = (int) $item->quantity;
                $lineTotal = $price * $qty;
                $pPrice = number_format($price, 0, ',', '.') . ' ₫';
                $pSubtotal = number_format($lineTotal, 0, ',', '.') . ' ₫';

                $itemsHtml .= <<<HTML
                <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #f5ede0; font-size: 13px; color: #22221f;">
                        <strong>{$pName}</strong>
                        <div style="font-size: 11px; color: #888;">Đơn giá: {$pPrice}</div>
                    </td>
                    <td style="padding: 10px 10px; border-bottom: 1px solid #f5ede0; font-size: 13px; color: #5a5a52; text-align: center;">
                        x{$qty}
                    </td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #f5ede0; font-size: 13px; color: #e85d1b; font-weight: 700; text-align: right;">
                        {$pSubtotal}
                    </td>
                </tr>
HTML;
            }

            $bodyHtml = <<<HTML
            <div style="text-align: center; margin-bottom: 24px;">
                <div style="display: inline-block; width: 56px; height: 56px; line-height: 56px; border-radius: 28px; background: #fff7ed; border: 2px solid #fed7aa; text-align: center; font-size: 26px; margin-bottom: 10px;">
                    🔔
                </div>
                <h2 style="font-size: 19px; font-weight: 800; color: #9a3412; margin: 0 0 6px 0;">THÔNG BÁO ĐƠN HÀNG MỚI</h2>
                <p style="font-size: 13px; color: #c2410c; margin: 0;">Khách hàng vừa hoàn tất đặt mua đơn hàng trên hệ thống</p>
            </div>

            <p style="font-size: 14px; line-height: 1.6; color: #44443d; margin: 0 0 20px 0;">
                Kính gửi <strong>Ban Quản Trị CameraHub</strong>,<br>
                Hệ thống ghi nhận đơn hàng mới mã <strong>#{$orderCode}</strong> vừa được tạo thành công với thông tin chi tiết dưới đây:
            </p>

            <!-- Order Details Box -->
            <div style="background-color: #faf6ee; border-radius: 14px; padding: 20px; margin-bottom: 24px; border: 1px solid #f2e3cd;">
                <div style="font-size: 12px; font-weight: 700; color: #e85d1b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">THÔNG TIN ĐƠN HÀNG & KHÁCH HÀNG</div>
                <table width="100%" border="0" cellpadding="0" cellspacing="0" style="font-size: 13px; line-height: 1.9;">
                    <tr>
                        <td width="38%" style="color: #7a7a73;">Mã đơn hàng:</td>
                        <td style="color: #e85d1b; font-weight: 800; font-family: monospace; font-size: 14px;">#{$orderCode}</td>
                    </tr>
                    <tr>
                        <td style="color: #7a7a73;">Thời gian đặt:</td>
                        <td style="color: #22221f;">{$orderTime}</td>
                    </tr>
                    <tr>
                        <td style="color: #7a7a73;">Khách hàng:</td>
                        <td style="color: #22221f; font-weight: 600;">{$customerName} ({$customerPhone})</td>
                    </tr>
                    <tr>
                        <td style="color: #7a7a73;">Email khách:</td>
                        <td style="color: #2563eb;">{$customerEmail}</td>
                    </tr>
                    <tr>
                        <td style="color: #7a7a73;">Địa chỉ nhận hàng:</td>
                        <td style="color: #22221f;">{$shippingAddress}</td>
                    </tr>
                    <tr>
                        <td style="color: #7a7a73;">Phương thức thanh toán:</td>
                        <td style="color: #22221f; font-weight: 600;">{$paymentMethodName}</td>
                    </tr>
                    <tr>
                        <td style="color: #7a7a73;">Trạng thái thanh toán:</td>
                        <td>{$paymentStatusName}</td>
                    </tr>
                    <tr>
                        <td style="color: #7a7a73;">Tổng giá trị đơn:</td>
                        <td style="color: #e85d1b; font-weight: 800; font-size: 16px;">{$totalAmountFormatted}</td>
                    </tr>
                </table>
            </div>

            <!-- Items Table -->
            <h3 style="font-size: 13px; font-weight: 700; color: #22221f; margin: 0 0 8px 0; text-transform: uppercase;">Chi Tiết Sản Phẩm Đặt Mua</h3>
            <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 22px;">
                <thead>
                    <tr style="border-bottom: 2px solid #dec9a6;">
                        <th align="left" style="padding-bottom: 6px; font-size: 12px; color: #7a7a73; font-weight: 600;">Sản phẩm</th>
                        <th align="center" style="padding-bottom: 6px; font-size: 12px; color: #7a7a73; font-weight: 600; width: 50px;">SL</th>
                        <th align="right" style="padding-bottom: 6px; font-size: 12px; color: #7a7a73; font-weight: 600; width: 110px;">Thành tiền</th>
                    </tr>
                </thead>
                <tbody>
                    {$itemsHtml}
                </tbody>
            </table>

            <!-- Admin Action Hint -->
            <div style="background-color: #f8fafc; border-radius: 12px; padding: 16px 18px; margin-top: 20px; border: 1px solid #e2e8f0; font-size: 12px; color: #475569; line-height: 1.6;">
                <div style="font-weight: 700; color: #0f172a; margin-bottom: 6px; font-size: 13px;">📋 Hành Động Tiếp Theo:</div>
                <div style="margin-bottom: 4px;">• Vui lòng đăng nhập <strong>Admin Panel</strong> để kiểm tra tồn kho và xác nhận chuẩn bị hàng.</div>
                <div>• Nếu đơn hàng là COD hoặc trực tuyến đã thanh toán, kiểm tra phiếu vận chuyển GHN đã được kết nối tự động.</div>
            </div>
HTML;

            $fullHtml = self::wrapTemplate("Thông Báo Đơn Hàng Mới #" . $orderCode, $bodyHtml, "🔔 ĐƠN HÀNG MỚI (ADMIN)", "#f17a35");

            Mail::html($fullHtml, function ($message) use ($toEmail, $subject) {
                $message->to($toEmail)
                    ->subject($subject);
            });

            Log::info("Admin new order alert email sent to {$toEmail} for order #{$orderCode}");
            return true;
        } catch (\Throwable $e) {
            Log::error("Failed to send admin new order alert email: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Send Admin Low Stock Alert (Cảnh báo tồn kho thấp khi sản phẩm sắp hết hàng)
     */
    public static function sendAdminLowStockAlert($product, int $remainingStock): bool
    {
        try {
            $toEmail = self::getAdminEmail();
            if (!$toEmail) return false;

            $productName = htmlspecialchars($product->name ?? 'Sản phẩm máy ảnh');
            $sku = htmlspecialchars($product->sku ?? ('SP-' . $product->id));
            $priceFormatted = number_format((float) ($product->price ?? 0), 0, ',', '.') . ' ₫';
            $alertTime = now()->format('H:i:s d/m/Y');

            $isOutOfStock = $remainingStock <= 0;
            $badge = $isOutOfStock ? '🚨 HẾT HÀNG TRONG KHO' : '⚠️ CẢNH BÁO TỒN KHO THẤP';
            $badgeColor = $isOutOfStock ? '#ef4444' : '#f59e0b';
            $subject = $isOutOfStock
                ? "[CameraHub Quản Trị] 🚨 CẢNH BÁO HẾT HÀNG: {$productName} (Tồn kho: 0)"
                : "[CameraHub Quản Trị] ⚠️ CẢNH BÁO TỒN KHO THẤP: {$productName} (Còn {$remainingStock} sp)";

            $statusText = $isOutOfStock
                ? '<span style="color: #ef4444; font-weight: 800;">ĐÃ HẾT HÀNG (0 chiếc)</span>'
                : '<span style="color: #f59e0b; font-weight: 800;">SẮP HẾT HÀNG (Còn ' . $remainingStock . ' chiếc)</span>';

            $alertMsg = $isOutOfStock
                ? "Sản phẩm <strong>{$productName}</strong> vừa chạm mức <strong>0 chiếc</strong> trong kho sau đơn hàng mới nhất. Sản phẩm sẽ tạm thời ngưng nhận đặt hàng cho đến khi được nhập kho bổ sung."
                : "Sản phẩm <strong>{$productName}</strong> chỉ còn lại <strong>{$remainingStock} chiếc</strong> trong kho. Vui lòng kiểm tra và lên kế hoạch nhập hàng sớm để tránh gián đoạn kinh doanh.";

            $bodyHtml = <<<HTML
            <div style="text-align: center; margin-bottom: 24px;">
                <div style="display: inline-block; width: 56px; height: 56px; line-height: 56px; border-radius: 28px; background: {$badgeColor}15; border: 2px solid {$badgeColor}; text-align: center; font-size: 26px; margin-bottom: 10px;">
                    ⚠️
                </div>
                <h2 style="font-size: 19px; font-weight: 800; color: #1e293b; margin: 0 0 6px 0;">CẢNH BÁO TỒN KHO SẢN PHẨM</h2>
                <p style="font-size: 13px; color: #64748b; margin: 0;">Thông báo tự động từ phân hệ quản lý kho CameraHub</p>
            </div>

            <p style="font-size: 14px; line-height: 1.6; color: #44443d; margin: 0 0 20px 0;">
                Kính gửi <strong>Bộ phận Quản lý Kho &amp; Bán hàng</strong>,<br>
                {$alertMsg}
            </p>

            <!-- Product Stock Info Box -->
            <div style="background-color: #faf6ee; border-radius: 14px; padding: 20px; margin-bottom: 24px; border: 1px solid #f2e3cd;">
                <div style="font-size: 12px; font-weight: 700; color: #e85d1b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">CHI TIẾT THIẾT BỊ CẦN NHẬP KHO</div>
                <table width="100%" border="0" cellpadding="0" cellspacing="0" style="font-size: 13px; line-height: 1.9;">
                    <tr>
                        <td width="38%" style="color: #7a7a73;">Tên sản phẩm:</td>
                        <td style="color: #22221f; font-weight: 700;">{$productName}</td>
                    </tr>
                    <tr>
                        <td width="38%" style="color: #7a7a73;">Mã SKU:</td>
                        <td style="font-family: monospace; font-weight: 700; color: #2563eb;">{$sku}</td>
                    </tr>
                    <tr>
                        <td width="38%" style="color: #7a7a73;">Giá niêm yết:</td>
                        <td style="color: #22221f; font-weight: 600;">{$priceFormatted}</td>
                    </tr>
                    <tr>
                        <td width="38%" style="color: #7a7a73;">Số lượng còn lại:</td>
                        <td>{$statusText}</td>
                    </tr>
                    <tr>
                        <td width="38%" style="color: #7a7a73;">Thời điểm cảnh báo:</td>
                        <td style="color: #22221f;">{$alertTime}</td>
                    </tr>
                </table>
            </div>

            <!-- Action Advice -->
            <div style="background-color: #f8fafc; border-radius: 12px; padding: 16px 18px; margin-top: 20px; border: 1px solid #e2e8f0; font-size: 12px; color: #475569; line-height: 1.6;">
                <div style="font-weight: 700; color: #0f172a; margin-bottom: 6px; font-size: 13px;">💡 Khuyến Nghị Hành Động:</div>
                <div style="margin-bottom: 4px;">• Truy cập <strong>Admin Panel &gt; Quản Lý Kho (Inventory Movements)</strong> để kiểm tra lịch sử xuất/nhập.</div>
                <div>• Liên hệ Nhà phân phối / Hãng sản xuất để đặt hàng bổ sung kịp thời.</div>
            </div>
HTML;

            $fullHtml = self::wrapTemplate("Cảnh Báo Tồn Kho: " . $productName, $bodyHtml, $badge, $badgeColor);

            Mail::html($fullHtml, function ($message) use ($toEmail, $subject) {
                $message->to($toEmail)
                    ->subject($subject);
            });

            Log::info("Admin low stock alert email sent to {$toEmail} for product #{$product->id} (Remaining: {$remainingStock})");
            return true;
        } catch (\Throwable $e) {
            Log::error("Failed to send admin low stock alert email: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Send Admin Refund Request Alert (Thông báo cho Admin/Kế toán khi khách hủy đơn và yêu cầu hoàn tiền)
     */
    public static function sendAdminRefundRequestAlert($order, ?string $reason = null): bool
    {
        try {
            $toEmail = self::getAdminEmail();
            if (!$toEmail) return false;

            $orderCode = htmlspecialchars($order->order_code ?: ('CAM-' . $order->id));
            $customerName = htmlspecialchars($order->customer_name ?: 'Khách hàng');
            $customerEmail = htmlspecialchars($order->customer_email ?: 'Chưa cung cấp');
            $customerPhone = htmlspecialchars($order->customer_phone ?: 'Chưa cung cấp');
            $totalAmountFormatted = number_format((float) $order->total_amount, 0, ',', '.') . ' ₫';
            $cancelReason = htmlspecialchars($reason ?: ($order->cancel_reason ?: 'Khách yêu cầu hủy đơn'));
            $bankName = htmlspecialchars($order->bank_name ?: 'Chưa cung cấp');
            $accountNumber = htmlspecialchars($order->bank_account_number ?: 'Chưa cung cấp');
            $accountHolder = htmlspecialchars($order->bank_account_holder ?: 'Chưa cung cấp');
            $requestTime = now()->format('H:i:s d/m/Y');

            $subject = "[CameraHub Quản Trị] 💸 YÊU CẦU HOÀN TIỀN đơn hàng #{$orderCode} - {$totalAmountFormatted} ({$customerName})";

            $bodyHtml = <<<HTML
            <div style="text-align: center; margin-bottom: 24px;">
                <div style="display: inline-block; width: 56px; height: 56px; line-height: 56px; border-radius: 28px; background: #fef2f2; border: 2px solid #fecaca; text-align: center; font-size: 26px; margin-bottom: 10px;">
                    💸
                </div>
                <h2 style="font-size: 19px; font-weight: 800; color: #991b1b; margin: 0 0 6px 0;">YÊU CẦU HOÀN TIỀN TỪ KHÁCH HÀNG</h2>
                <p style="font-size: 13px; color: #b91c1c; margin: 0;">Đơn hàng trực tuyến đã thanh toán được yêu cầu hủy &amp; hoàn tiền</p>
            </div>

            <p style="font-size: 14px; line-height: 1.6; color: #44443d; margin: 0 0 20px 0;">
                Kính gửi <strong>Bộ phận Kế toán &amp; Ban Quản trị</strong>,<br>
                Khách hàng <strong>{$customerName}</strong> vừa thực hiện yêu cầu hủy đơn hàng đã thanh toán <strong>#{$orderCode}</strong> và đề nghị hoàn tiền về tài khoản ngân hàng.
            </p>

            <!-- Refund Request Box -->
            <div style="background-color: #faf6ee; border-radius: 14px; padding: 20px; margin-bottom: 24px; border: 1px solid #f2e3cd;">
                <div style="font-size: 12px; font-weight: 700; color: #dc2626; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">THÔNG TIN YÊU CẦU HOÀN TIỀN</div>
                <table width="100%" border="0" cellpadding="0" cellspacing="0" style="font-size: 13px; line-height: 1.9;">
                    <tr>
                        <td width="38%" style="color: #7a7a73;">Mã đơn hàng:</td>
                        <td style="color: #dc2626; font-weight: 800; font-family: monospace; font-size: 14px;">#{$orderCode}</td>
                    </tr>
                    <tr>
                        <td width="38%" style="color: #7a7a73;">Số tiền cần hoàn:</td>
                        <td style="color: #dc2626; font-weight: 800; font-size: 16px;">{$totalAmountFormatted}</td>
                    </tr>
                    <tr>
                        <td width="38%" style="color: #7a7a73;">Khách hàng:</td>
                        <td style="color: #22221f; font-weight: 600;">{$customerName} ({$customerPhone})</td>
                    </tr>
                    <tr>
                        <td width="38%" style="color: #7a7a73;">Email khách:</td>
                        <td style="color: #2563eb;">{$customerEmail}</td>
                    </tr>
                    <tr>
                        <td width="38%" style="color: #7a7a73;">Lý do hủy đơn:</td>
                        <td style="color: #b91c1c; font-style: italic;">{$cancelReason}</td>
                    </tr>
                    <tr>
                        <td width="38%" style="color: #7a7a73;">Thời gian yêu cầu:</td>
                        <td style="color: #22221f;">{$requestTime}</td>
                    </tr>
                </table>
            </div>

            <!-- Customer Bank Details Box -->
            <div style="background-color: #f0fdf4; border-radius: 14px; padding: 20px; margin-bottom: 24px; border: 1px solid #bbf7d0;">
                <div style="font-size: 12px; font-weight: 700; color: #166534; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">STK NGÂN HÀNG NHẬN HOÀN TIỀN CỦA KHÁCH</div>
                <table width="100%" border="0" cellpadding="0" cellspacing="0" style="font-size: 13px; line-height: 1.9;">
                    <tr>
                        <td width="38%" style="color: #166534;">Ngân hàng thụ hưởng:</td>
                        <td style="color: #0f172a; font-weight: 700;">{$bankName}</td>
                    </tr>
                    <tr>
                        <td width="38%" style="color: #166534;">Số tài khoản:</td>
                        <td style="color: #15803d; font-weight: 800; font-family: monospace; font-size: 15px;">{$accountNumber}</td>
                    </tr>
                    <tr>
                        <td width="38%" style="color: #166534;">Tên chủ tài khoản:</td>
                        <td style="color: #0f172a; font-weight: 700; text-transform: uppercase;">{$accountHolder}</td>
                    </tr>
                </table>
            </div>

            <!-- Accountant Instructions -->
            <div style="background-color: #f8fafc; border-radius: 12px; padding: 16px 18px; margin-top: 20px; border: 1px solid #e2e8f0; font-size: 12px; color: #475569; line-height: 1.6;">
                <div style="font-weight: 700; color: #0f172a; margin-bottom: 6px; font-size: 13px;">📌 Quy Trình Xử Lý Hoàn Tiền:</div>
                <div style="margin-bottom: 4px;">1. Kế toán đối soát sao kê tài khoản ngân hàng để xác nhận đơn đã nhận tiền thực tế.</div>
                <div style="margin-bottom: 4px;">2. Thực hiện chuyển khoản số tiền <strong>{$totalAmountFormatted}</strong> vào STK nêu trên.</div>
                <div>3. Truy cập <strong>Admin Panel &gt; Chi tiết đơn #{$orderCode}</strong> &gt; Nhập <strong>Mã giao dịch ngân hàng</strong> và bấm <strong>Xác nhận hoàn tiền</strong> để hệ thống tự động gửi email xác nhận cho khách.</div>
            </div>
HTML;

            $fullHtml = self::wrapTemplate("Yêu Cầu Hoàn Tiền Đơn #" . $orderCode, $bodyHtml, "💸 YÊU CẦU HOÀN TIỀN (ADMIN)", "#dc2626");

            Mail::html($fullHtml, function ($message) use ($toEmail, $subject) {
                $message->to($toEmail)
                    ->subject($subject);
            });

            Log::info("Admin refund request alert email sent to {$toEmail} for order #{$orderCode}");
            return true;
        } catch (\Throwable $e) {
            Log::error("Failed to send admin refund request alert email: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Send Refund Confirmation Email (Xác nhận đã hoàn tiền thành công gửi cho Khách hàng)
     */
    public static function sendRefundConfirmation($order, ?string $refundTxnCode = null): bool
    {
        try {
            $toEmail = $order->customer_email;
            if (!$toEmail) return false;

            $orderCode = htmlspecialchars($order->order_code ?: ('CAM-' . $order->id));
            $customerName = htmlspecialchars($order->customer_name ?: 'Quý khách');
            $totalAmountFormatted = number_format((float) $order->total_amount, 0, ',', '.') . ' ₫';
            $refCode = htmlspecialchars($refundTxnCode ?: ($order->refund_ref_code ?: 'CAM-REF-' . time()));
            $bankName = htmlspecialchars($order->bank_name ?: 'Tài khoản ngân hàng của bạn');
            $accountNumber = htmlspecialchars($order->bank_account_number ? (substr($order->bank_account_number, 0, 3) . '****' . substr($order->bank_account_number, -3)) : 'Tài khoản đã đăng ký');
            $accountHolder = htmlspecialchars($order->bank_account_holder ?: $customerName);
            $refundedTime = now()->format('H:i:s d/m/Y');

            $subject = "[CameraHub] 💸 Xác nhận đã hoàn tiền thành công đơn hàng #{$orderCode}";

            $bodyHtml = <<<HTML
            <div style="text-align: center; margin-bottom: 24px;">
                <div style="display: inline-block; width: 56px; height: 56px; line-height: 56px; border-radius: 28px; background: #ecfdf5; border: 2px solid #a7f3d0; text-align: center; font-size: 26px; margin-bottom: 10px;">
                    💸
                </div>
                <h2 style="font-size: 20px; font-weight: 800; color: #065f46; margin: 0 0 6px 0;">HOÀN TIỀN THÀNH CÔNG</h2>
                <p style="font-size: 13px; color: #047857; margin: 0;">Giao dịch hoàn tiền cho đơn hàng #{$orderCode} đã hoàn tất</p>
            </div>

            <p style="font-size: 14px; line-height: 1.6; color: #44443d; margin: 0 0 20px 0;">
                Xin chào <strong>{$customerName}</strong>,<br>
                Bộ phận kế toán CameraHub thông báo đã thực hiện lệnh hoàn trả số tiền <strong>{$totalAmountFormatted}</strong> vào tài khoản ngân hàng của bạn theo yêu cầu hủy đơn hàng <strong>#{$orderCode}</strong>.
            </p>

            <!-- Refund Receipt Box -->
            <div style="background-color: #faf6ee; border-radius: 14px; padding: 20px; margin-bottom: 24px; border: 1px solid #f2e3cd;">
                <div style="font-size: 12px; font-weight: 700; color: #059669; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">CHI TIẾT GIAO DỊCH HOÀN TIỀN</div>
                <table width="100%" border="0" cellpadding="0" cellspacing="0" style="font-size: 13px; line-height: 1.9;">
                    <tr>
                        <td width="40%" style="color: #7a7a73;">Mã đơn hàng:</td>
                        <td style="color: #e85d1b; font-weight: 800; font-family: monospace; font-size: 14px;">#{$orderCode}</td>
                    </tr>
                    <tr>
                        <td width="40%" style="color: #7a7a73;">Số tiền hoàn trả:</td>
                        <td style="color: #059669; font-weight: 800; font-size: 16px;">{$totalAmountFormatted}</td>
                    </tr>
                    <tr>
                        <td width="40%" style="color: #7a7a73;">Mã GD ngân hàng:</td>
                        <td style="color: #2563eb; font-weight: 700; font-family: monospace;">{$refCode}</td>
                    </tr>
                    <tr>
                        <td width="40%" style="color: #7a7a73;">Thời gian xử lý:</td>
                        <td style="color: #22221f;">{$refundedTime}</td>
                    </tr>
                    <tr>
                        <td width="40%" style="color: #7a7a73;">Ngân hàng nhận:</td>
                        <td style="color: #22221f; font-weight: 600;">{$bankName}</td>
                    </tr>
                    <tr>
                        <td width="40%" style="color: #7a7a73;">Tài khoản nhận:</td>
                        <td style="color: #22221f; font-weight: 600; font-family: monospace;">{$accountNumber} ({$accountHolder})</td>
                    </tr>
                </table>
            </div>

            <!-- Bank Processing Timing Advice -->
            <div style="background-color: #f8fafc; border-radius: 12px; padding: 16px 18px; margin-top: 20px; border: 1px solid #e2e8f0; font-size: 12px; color: #475569; line-height: 1.6;">
                <div style="font-weight: 700; color: #0f172a; margin-bottom: 6px; font-size: 13px;">⏱️ Thời Gian Nhận Tiền Thực Tế:</div>
                <div style="margin-bottom: 4px;">• Với các ngân hàng hỗ trợ Napas 24/7: Tiền thường vào tài khoản trong vòng <strong>5 - 30 phút</strong>.</div>
                <div>• Với một số ngân hàng ngoài giờ hành chính: Có thể mất từ <strong>1 - 24 giờ làm việc</strong>. Nếu sau 24h bạn vẫn chưa nhận được biến động số dư, xin vui lòng gọi ngay Hotline: <strong style="color: #e85d1b;">1900-8888</strong> để được hỗ trợ kiểm tra trực tiếp.</div>
            </div>
HTML;

            $fullHtml = self::wrapTemplate("Xác Nhận Hoàn Tiền #" . $orderCode, $bodyHtml, "💸 HOÀN TIỀN THÀNH CÔNG", "#10b981");

            Mail::html($fullHtml, function ($message) use ($toEmail, $subject) {
                $message->to($toEmail)
                    ->subject($subject);
            });

            Log::info("Refund confirmation email sent to {$toEmail} for order #{$orderCode}");
            return true;
        } catch (\Throwable $e) {
            Log::error("Failed to send refund confirmation email: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Send Password Changed Notification Email (Cảnh báo an toàn khi mật khẩu vừa được thay đổi)
     */
    public static function sendPasswordChangedNotification($user, ?string $ip = null, ?string $userAgent = null): bool
    {
        try {
            $toEmail = $user->email;
            if (!$toEmail) return false;

            $fullName = htmlspecialchars($user->name ?: 'Bạn');
            $changedTime = now()->format('H:i:s d/m/Y');
            $device = htmlspecialchars(self::formatDevice($userAgent));
            $clientIp = htmlspecialchars($ip ?: 'Không xác định');

            $subject = "[CameraHub] 🔒 Cảnh báo bảo mật: Mật khẩu tài khoản CameraHub của bạn đã được thay đổi";

            $bodyHtml = <<<HTML
            <div style="text-align: center; margin-bottom: 24px;">
                <div style="display: inline-block; width: 56px; height: 56px; line-height: 56px; border-radius: 28px; background: #eff6ff; border: 2px solid #bfdbfe; text-align: center; font-size: 26px; margin-bottom: 10px;">
                    🔒
                </div>
                <h2 style="font-size: 19px; font-weight: 800; color: #1e40af; margin: 0 0 6px 0;">ĐỔI MẬT KHẨU THÀNH CÔNG</h2>
                <p style="font-size: 13px; color: #2563eb; margin: 0;">Mật khẩu tài khoản CameraHub vừa được cập nhật mới</p>
            </div>

            <p style="font-size: 14px; line-height: 1.6; color: #44443d; margin: 0 0 20px 0;">
                Xin chào <strong>{$fullName}</strong>,<br>
                Hệ thống bảo mật CameraHub thông báo mật khẩu của tài khoản <strong>{$toEmail}</strong> vừa được thay đổi thành công vào lúc <strong>{$changedTime}</strong>.
            </p>

            <!-- Audit Box -->
            <div style="background-color: #faf6ee; border-radius: 14px; padding: 20px; margin-bottom: 24px; border: 1px solid #f2e3cd;">
                <table width="100%" border="0" cellpadding="0" cellspacing="0" style="font-size: 13px; line-height: 1.9;">
                    <tr>
                        <td width="38%" style="color: #7a7a73;">Thời gian thực hiện:</td>
                        <td style="color: #22221f; font-weight: 700;">{$changedTime}</td>
                    </tr>
                    <tr>
                        <td width="38%" style="color: #7a7a73;">Địa chỉ IP:</td>
                        <td style="color: #2563eb; font-weight: 700; font-family: monospace;">{$clientIp}</td>
                    </tr>
                    <tr>
                        <td width="38%" style="color: #7a7a73;">Thiết bị &amp; Trình duyệt:</td>
                        <td style="color: #22221f; font-weight: 600;">{$device}</td>
                    </tr>
                </table>
            </div>

            <!-- Security Warnings -->
            <div style="background-color: #fff1f2; border-radius: 12px; padding: 16px 18px; margin-bottom: 20px; border: 1px solid #fecdd3; font-size: 12px; color: #881337; line-height: 1.6;">
                <div style="font-weight: 700; color: #9f1239; margin-bottom: 6px; font-size: 13px;">🛡️ Đây có phải là thao tác của bạn không?</div>
                <div style="margin-bottom: 4px;">• <strong>Nếu là bạn thực hiện:</strong> Bạn có thể hoàn toàn yên tâm và bỏ qua email này.</div>
                <div>• <strong>Nếu bạn KHÔNG đổi mật khẩu:</strong> Tài khoản của bạn có thể đã bị chiếm quyền truy cập trái phép! Hãy lập tức sử dụng tính năng <strong>Quên Mật Khẩu</strong> để thiết lập lại mật khẩu mới hoặc liên hệ ngay Hotline khẩn cấp: <strong style="color: #e11d48;">1900-8888</strong>.</div>
            </div>
HTML;

            $fullHtml = self::wrapTemplate("Thông Báo Đổi Mật Khẩu Thành Công", $bodyHtml, "🔒 BẢO MẬT TÀI KHOẢN", "#2563eb");

            Mail::html($fullHtml, function ($message) use ($toEmail, $subject) {
                $message->to($toEmail)
                    ->subject($subject);
            });

            Log::info("Password change security notification email sent to {$toEmail}");
            return true;
        } catch (\Throwable $e) {
            Log::error("Failed to send password changed notification email: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Send Review Reply Notification Email (Thông báo cho khách khi Admin phản hồi đánh giá sản phẩm)
     */
    public static function sendReviewReplyNotification($review, string $replyContent): bool
    {
        try {
            $toEmail = $review->user?->email ?: ($review->order?->customer_email ?: null);
            if (!$toEmail) return false;

            $customerName = htmlspecialchars($review->customer_name ?: ($review->user?->name ?: 'Quý khách'));
            $productName = htmlspecialchars($review->product?->name ?? 'Sản phẩm tại CameraHub');
            $stars = str_repeat('⭐', max(1, min(5, (int) $review->rating)));
            $ratingDisplay = $stars . " (" . ((int) $review->rating) . "/5 sao)";
            $customerComment = htmlspecialchars($review->comment ?: 'Đánh giá sản phẩm');
            $replyHtml = nl2br(htmlspecialchars($replyContent));
            $replyTime = now()->format('H:i:s d/m/Y');

            $subject = "[CameraHub] 💬 Phản hồi từ CameraHub cho đánh giá của bạn về: " . $productName;

            $bodyHtml = <<<HTML
            <div style="text-align: center; margin-bottom: 24px;">
                <div style="display: inline-block; width: 56px; height: 56px; line-height: 56px; border-radius: 28px; background: #fff7ed; border: 2px solid #fed7aa; text-align: center; font-size: 26px; margin-bottom: 10px;">
                    💬
                </div>
                <h2 style="font-size: 19px; font-weight: 800; color: #9a3412; margin: 0 0 6px 0;">PHẢN HỒI ĐÁNH GIÁ SẢN PHẨM</h2>
                <p style="font-size: 13px; color: #c2410c; margin: 0;">Đội ngũ hỗ trợ CameraHub vừa phản hồi đánh giá của bạn</p>
            </div>

            <p style="font-size: 14px; line-height: 1.6; color: #44443d; margin: 0 0 20px 0;">
                Xin chào <strong>{$customerName}</strong>,<br>
                Cảm ơn bạn đã dành thời gian đánh giá trải nghiệm sản phẩm <strong>{$productName}</strong> tại CameraHub. Ban Quản trị &amp; Đội ngũ Chăm sóc khách hàng vừa gửi phản hồi chính thức cho nhận xét của bạn:
            </p>

            <!-- Customer Review Snippet -->
            <div style="background-color: #faf6ee; border-radius: 12px; padding: 16px 18px; margin-bottom: 20px; border: 1px solid #f2e3cd;">
                <div style="font-size: 11px; font-weight: 700; color: #7a7a73; text-transform: uppercase; margin-bottom: 6px;">ĐÁNH GIÁ CỦA BẠN:</div>
                <div style="margin-bottom: 6px; font-size: 14px;">{$ratingDisplay}</div>
                <div style="font-size: 13px; color: #44443d; font-style: italic; line-height: 1.5;">“{$customerComment}”</div>
            </div>

            <!-- Admin Official Reply Box -->
            <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 8px; padding: 18px 20px; margin-bottom: 24px;">
                <div style="font-size: 12px; font-weight: 700; color: #1e40af; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
                    📷 PHẢN HỒI TỪ ĐỘI NGŨ CAMERAHUB ({$replyTime}):
                </div>
                <div style="font-size: 14px; color: #1e293b; line-height: 1.7; font-weight: 500;">
                    {$replyHtml}
                </div>
            </div>

            <p style="font-size: 13px; color: #7a7a73; line-height: 1.6; margin: 20px 0 0 0; text-align: center;">
                Sự đóng góp của bạn giúp cộng đồng nhiếp ảnh có thêm góc nhìn khách quan và giúp CameraHub ngày càng hoàn thiện dịch vụ!
            </p>
HTML;

            $fullHtml = self::wrapTemplate("Phản Hồi Đánh Giá: " . $productName, $bodyHtml, "💬 PHẢN HỒI ĐÁNH GIÁ", "#f17a35");

            Mail::html($fullHtml, function ($message) use ($toEmail, $subject) {
                $message->to($toEmail)
                    ->subject($subject);
            });

            Log::info("Review reply notification email sent to {$toEmail} for review #{$review->id}");
            return true;
        } catch (\Throwable $e) {
            Log::error("Failed to send review reply notification email: " . $e->getMessage());
            return false;
        }
    }
}

