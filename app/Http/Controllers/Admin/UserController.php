<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;

class UserController extends Controller
{
    /**
     * Hiển thị danh sách người dùng
     */
    public function index(Request $request)
    {
        $query = User::query()->orderBy('id', 'desc');

        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if ($request->filled('role')) {
            $role = $request->role;
            if ($role === 'customer' || $role === 'user') {
                $query->whereIn('role', ['customer', 'user']);
            } else {
                $query->where('role', $role);
            }
        }

        $users = $query->get()->map(function ($u) {
            return [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'phone' => $u->phone,
                'role' => $u->role === 'admin' ? 'admin' : 'customer',
                'created_at' => $u->created_at ? $u->created_at->format('d/m/Y H:i') : '',
            ];
        });

        // If no users found in DB, fallback to rich static mock users
        if ($users->isEmpty()) {
            $mockList = collect($this->getStaticMockUsers());
            if ($request->filled('search')) {
                $s = strtolower(trim($request->search));
                $mockList = $mockList->filter(function ($item) use ($s) {
                    return str_contains(strtolower($item['name']), $s)
                        || str_contains(strtolower($item['email']), $s)
                        || (isset($item['phone']) && str_contains($item['phone'], $s));
                });
            }
            if ($request->filled('role')) {
                $r = $request->role;
                $mockList = $mockList->filter(function ($item) use ($r) {
                    return $r === 'admin' ? $item['role'] === 'admin' : ($item['role'] === 'customer' || $item['role'] === 'user');
                });
            }
            $users = $mockList->values();
        }

        if ($request->wantsJson() || $request->is('api/*')) {
            return response()->json($users);
        }

        if (view()->exists('admin.users.index')) {
            return view('admin.users.index', compact('users'));
        }

        return response()->json($users);
    }

    /**
     * Hiển thị form tạo người dùng mới
     */
    public function create()
    {
        return view('admin.users.create');
    }

    /**
     * Hiển thị form chỉnh sửa người dùng
     */
    public function edit($id)
    {
        $user = User::findOrFail($id);
        return view('admin.users.edit', compact('user'));
    }

    /**
     * Hiển thị chi tiết người dùng
     */
    public function show(Request $request, $id)
    {
        $user = User::with(['orders' => fn ($q) => $q->latest()->limit(5)])->findOrFail($id);

        if ($request->wantsJson() || $request->is('api/*')) {
            return response()->json($user);
        }

        if (view()->exists('admin.users.show')) {
            return view('admin.users.show', compact('user'));
        }

        return response()->json($user);
    }

    /**
     * Lưu người dùng mới vào CSDL
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'role' => 'required|in:admin,user,customer',
            'phone' => 'nullable|string|max:20',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role === 'user' ? 'customer' : $request->role,
            'phone' => $request->phone,
        ]);

        if ($request->wantsJson() || $request->is('api/*')) {
            return response()->json([
                'message' => 'Thêm người dùng thành công.',
                'user' => $user,
            ], 201);
        }

        return redirect()->route('admin.users.index')->with('success', 'Thêm người dùng thành công.');
    }

    /**
     * Cập nhật thông tin người dùng
     */
    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $user->id,
            'role' => 'required|in:admin,user,customer',
            'phone' => 'nullable|string|max:20',
        ]);

        $updateData = [
            'name' => $request->name,
            'email' => $request->email,
            'role' => $request->role === 'user' ? 'customer' : $request->role,
            'phone' => $request->phone,
        ];

        if ($request->filled('password')) {
            $request->validate(['password' => 'min:6']);
            $updateData['password'] = Hash::make($request->password);
        }

        $user->update($updateData);

        if ($request->wantsJson() || $request->is('api/*')) {
            return response()->json([
                'message' => 'Cập nhật người dùng thành công.',
                'user' => $user,
            ]);
        }

        return redirect()->route('admin.users.index')->with('success', 'Cập nhật người dùng thành công.');
    }

    /**
     * Xóa người dùng
     */
    public function destroy(Request $request, $id)
    {
        $user = User::findOrFail($id);

        if ($user->id === 1 || $user->id === Auth::id()) {
            $msg = 'Không thể xóa tài khoản Quản trị viên chính này!';
            if ($request->wantsJson() || $request->is('api/*')) {
                return response()->json(['error' => $msg], 403);
            }
            return redirect()->route('admin.users.index')->with('error', $msg);
        }

        $user->delete();

        if ($request->wantsJson() || $request->is('api/*')) {
            return response()->json(['message' => 'Xóa người dùng thành công.']);
        }

        return redirect()->route('admin.users.index')->with('success', 'Xóa người dùng thành công.');
    }

    /**
     * Dữ liệu tĩnh người dùng mẫu chuyên nghiệp ngành Nhiếp ảnh / Camera
     */
    private function getStaticMockUsers(): array
    {
        return [
            [
                'id' => 1,
                'name' => 'Quản Trị Viên CameraHub',
                'email' => 'admin@camerahub.vn',
                'phone' => '0909888999',
                'role' => 'admin',
                'created_at' => '01/08/2026 08:00',
            ],
            [
                'id' => 2,
                'name' => 'Hoàng Quốc Việt',
                'email' => 'viet.admin@camerahub.vn',
                'phone' => '0908777666',
                'role' => 'admin',
                'created_at' => '07/08/2026 09:30',
            ],
            [
                'id' => 3,
                'name' => 'Trần Đức Minh',
                'email' => 'minh.tran@gmail.com',
                'phone' => '0912345678',
                'role' => 'customer',
                'created_at' => '12/08/2026 14:15',
            ],
            [
                'id' => 4,
                'name' => 'Lê Hoàng Nam (Studio Sài Gòn)',
                'email' => 'nam.lephoto@gmail.com',
                'phone' => '0987654321',
                'role' => 'customer',
                'created_at' => '18/08/2026 10:20',
            ],
            [
                'id' => 5,
                'name' => 'Phạm Thu Hà',
                'email' => 'thuha.studio@gmail.com',
                'phone' => '0903112233',
                'role' => 'customer',
                'created_at' => '22/08/2026 16:45',
            ],
            [
                'id' => 6,
                'name' => 'Nguyễn Anh Tuấn',
                'email' => 'tuan.camera@gmail.com',
                'phone' => '0978998877',
                'role' => 'customer',
                'created_at' => '25/08/2026 11:10',
            ],
            [
                'id' => 7,
                'name' => 'Vũ Bảo Ngọc',
                'email' => 'ngoc.vu@gmail.com',
                'phone' => '0934567890',
                'role' => 'customer',
                'created_at' => '28/08/2026 15:30',
            ],
            [
                'id' => 8,
                'name' => 'Đặng Hải Đăng (Filmmaker)',
                'email' => 'dang.film@gmail.com',
                'phone' => '0918223344',
                'role' => 'customer',
                'created_at' => '01/09/2026 10:05',
            ],
            [
                'id' => 9,
                'name' => 'Bùi Phương Linh',
                'email' => 'linh.media@gmail.com',
                'phone' => '0982334455',
                'role' => 'customer',
                'created_at' => '05/09/2026 17:22',
            ],
            [
                'id' => 10,
                'name' => 'Đỗ Mạnh Cường',
                'email' => 'cuong.lens@gmail.com',
                'phone' => '0945667788',
                'role' => 'customer',
                'created_at' => '08/09/2026 13:40',
            ],
            [
                'id' => 11,
                'name' => 'Phan Thanh Trúc',
                'email' => 'truc.pt@gmail.com',
                'phone' => '0938112299',
                'role' => 'customer',
                'created_at' => '11/09/2026 09:50',
            ],
            [
                'id' => 12,
                'name' => 'Hà Quang Huy (Drone Pilot)',
                'email' => 'huy.dji@gmail.com',
                'phone' => '0915778899',
                'role' => 'customer',
                'created_at' => '13/09/2026 14:05',
            ],
            [
                'id' => 13,
                'name' => 'Trịnh Mai Chi',
                'email' => 'maichi.photo@gmail.com',
                'phone' => '0966332211',
                'role' => 'customer',
                'created_at' => '15/09/2026 18:30',
            ],
            [
                'id' => 14,
                'name' => 'Võ Minh Trí (Kỹ thuật)',
                'email' => 'tri.admin@camerahub.vn',
                'phone' => '0933445566',
                'role' => 'admin',
                'created_at' => '16/09/2026 08:00',
            ],
            [
                'id' => 15,
                'name' => 'Nguyễn Mạnh Tiến (VIP Member)',
                'email' => 'tien.camera@gmail.com',
                'phone' => '0988888888',
                'role' => 'customer',
                'created_at' => '16/09/2026 19:00',
            ],
        ];
    }
}
