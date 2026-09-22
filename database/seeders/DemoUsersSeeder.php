<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class DemoUsersSeeder extends Seeder
{
    public function run(): void
    {
        $mockUsers = [
            [
                'name' => 'Trần Đức Minh',
                'email' => 'minh.tran@gmail.com',
                'phone' => '0912345678',
                'role' => 'customer',
                'created_at' => Carbon::now()->subDays(45),
            ],
            [
                'name' => 'Lê Hoàng Nam (Studio)',
                'email' => 'nam.lephoto@gmail.com',
                'phone' => '0987654321',
                'role' => 'customer',
                'created_at' => Carbon::now()->subDays(38),
            ],
            [
                'name' => 'Phạm Thu Hà',
                'email' => 'thuha.studio@gmail.com',
                'phone' => '0903112233',
                'role' => 'customer',
                'created_at' => Carbon::now()->subDays(29),
            ],
            [
                'name' => 'Nguyễn Anh Tuấn',
                'email' => 'tuan.camera@gmail.com',
                'phone' => '0978998877',
                'role' => 'customer',
                'created_at' => Carbon::now()->subDays(25),
            ],
            [
                'name' => 'Vũ Bảo Ngọc',
                'email' => 'ngoc.vu@gmail.com',
                'phone' => '0934567890',
                'role' => 'customer',
                'created_at' => Carbon::now()->subDays(20),
            ],
            [
                'name' => 'Đặng Hải Đăng (Filmmaker)',
                'email' => 'dang.film@gmail.com',
                'phone' => '0918223344',
                'role' => 'customer',
                'created_at' => Carbon::now()->subDays(16),
            ],
            [
                'name' => 'Bùi Phương Linh',
                'email' => 'linh.media@gmail.com',
                'phone' => '0982334455',
                'role' => 'customer',
                'created_at' => Carbon::now()->subDays(12),
            ],
            [
                'name' => 'Hoàng Quốc Việt',
                'email' => 'viet.admin@camerahub.vn',
                'phone' => '0909888999',
                'role' => 'admin',
                'created_at' => Carbon::now()->subDays(10),
            ],
            [
                'name' => 'Đỗ Mạnh Cường',
                'email' => 'cuong.lens@gmail.com',
                'phone' => '0945667788',
                'role' => 'customer',
                'created_at' => Carbon::now()->subDays(7),
            ],
            [
                'name' => 'Phan Thanh Trúc',
                'email' => 'truc.pt@gmail.com',
                'phone' => '0938112299',
                'role' => 'customer',
                'created_at' => Carbon::now()->subDays(5),
            ],
            [
                'name' => 'Hà Quang Huy (Drone Pilot)',
                'email' => 'huy.dji@gmail.com',
                'phone' => '0915778899',
                'role' => 'customer',
                'created_at' => Carbon::now()->subDays(3),
            ],
            [
                'name' => 'Trịnh Mai Chi',
                'email' => 'maichi.photo@gmail.com',
                'phone' => '0966332211',
                'role' => 'customer',
                'created_at' => Carbon::now()->subDays(1),
            ],
        ];

        foreach ($mockUsers as $userData) {
            User::updateOrCreate(
                ['email' => $userData['email']],
                [
                    'name' => $userData['name'],
                    'phone' => $userData['phone'],
                    'role' => $userData['role'],
                    'password' => Hash::make('password123'),
                    'email_verified_at' => now(),
                    'created_at' => $userData['created_at'],
                    'updated_at' => $userData['created_at'],
                ]
            );
        }
    }
}
