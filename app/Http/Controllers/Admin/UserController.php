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
}
