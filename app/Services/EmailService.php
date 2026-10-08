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
}
