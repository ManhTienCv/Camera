<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'phone',
        'avatar_url',
        'role',
        'google_id',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function addresses(): HasMany
    {
        return $this->hasMany(Address::class)->orderByDesc('is_default')->orderByDesc('created_at');
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class)->orderByDesc('created_at');
    }

    public function sentMessages(): HasMany
    {
        return $this->hasMany(Message::class, 'sender_id');
    }

    public function receivedMessages(): HasMany
    {
        return $this->hasMany(Message::class, 'receiver_id');
    }

    /**
     * Tạo auth token an toàn cho người dùng và lưu cache với sha256 hash (không vượt quá 255 chars của bảng cache)
     */
    public function createToken(): string
    {
        $payload = base64_encode(json_encode([
            'uid' => $this->id,
            'email' => $this->email,
            'role' => $this->role,
            'iat' => time(),
            'exp' => time() + (86400 * 30),
            'nonce' => \Illuminate\Support\Str::random(16),
        ]));
        $appKey = config('app.key');
        if (empty($appKey)) {
            throw new \RuntimeException('Hệ thống chưa cấu hình APP_KEY trong file môi trường .env.');
        }
        $signature = hash_hmac('sha256', $payload, $appKey);
        $token = 'camerahub_' . $payload . '.' . $signature;

        // Lưu Cache bằng SHA256 hash của token để khóa luôn cố định 64 ký tự, giải quyết triệt để lỗi MySQL 1406
        \Illuminate\Support\Facades\Cache::put('auth_token_' . hash('sha256', $token), $this->id, now()->addDays(30));

        return $token;
    }

    /**
     * Xác thực và tìm User từ Bearer token (hỗ trợ HMAC signed token và Cache hash)
     */
    public static function resolveByToken(?string $token): ?User
    {
        if (empty($token)) {
            return null;
        }

        // 1. Xác thực HMAC Signed Token (Bền vững, không phụ thuộc Cache)
        if (str_contains($token, '.')) {
            $tokenRaw = str_starts_with($token, 'camerahub_') ? substr($token, 10) : $token;
            $parts = explode('.', $tokenRaw, 2);
            if (count($parts) === 2) {
                [$payloadEncoded, $signature] = $parts;
                $appKey = config('app.key');
                if (empty($appKey)) {
                    return null;
                }
                $expectedSig = hash_hmac('sha256', $payloadEncoded, $appKey);
                if (hash_equals($expectedSig, $signature)) {
                    $payload = json_decode(base64_decode($payloadEncoded), true);
                    if (is_array($payload) && !empty($payload['uid'])) {
                        $exp = $payload['exp'] ?? 0;
                        if (!$exp || $exp >= time()) {
                            if (!\Illuminate\Support\Facades\Cache::has('revoked_token_' . $signature)) {
                                $user = static::find($payload['uid']);
                                if ($user) {
                                    return $user;
                                }
                            }
                        }
                    }
                }
            }
        }

        // 2. Fallback sang Cache tra cứu bằng sha256 hash của token
        $hashKey = 'auth_token_' . hash('sha256', $token);
        $userId = \Illuminate\Support\Facades\Cache::get($hashKey);
        if (!$userId && strlen($token) <= 200) {
            $userId = \Illuminate\Support\Facades\Cache::get('auth_token_' . $token);
        }

        if ($userId) {
            return static::find($userId);
        }

        return null;
    }
}
