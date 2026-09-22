@extends('layouts.admin')

@section('title', 'Quản lý người dùng')

@section('content')
<div class="container-fluid">
    <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
            <h2 class="h3 fw-bold text-dark mb-1">Quản lý người dùng</h2>
            <p class="text-muted small mb-0">Quản lý danh sách tài khoản khách hàng và quản trị viên hệ thống.</p>
        </div>
        <div>
            <a href="{{ route('admin.users.create') }}" class="btn btn-success">
                <i class="fa-solid fa-user-plus me-1"></i>Thêm người dùng mới
            </a>
            <a href="/admin" class="btn btn-outline-primary ms-2">
                <i class="fa-solid fa-desktop me-1"></i>Giao diện SPA
            </a>
        </div>
    </div>

    @if(session('success'))
        <div class="alert alert-success alert-dismissible fade show" role="alert">
            <i class="fa-solid fa-circle-check me-2"></i>{{ session('success') }}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    @endif

    @if(session('error'))
        <div class="alert alert-danger alert-dismissible fade show" role="alert">
            <i class="fa-solid fa-triangle-exclamation me-2"></i>{{ session('error') }}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    @endif

    <!-- Search and Filter Form -->
    <div class="card border-0 shadow-sm rounded-3 mb-4">
        <div class="card-body">
            <form action="{{ route('admin.users.index') }}" method="GET" class="row g-3 align-items-center">
                <div class="col-md-5">
                    <div class="input-group">
                        <span class="input-group-text bg-white"><i class="fa-solid fa-magnifying-glass text-muted"></i></span>
                        <input type="text" name="search" class="form-control" placeholder="Tìm theo tên, email, SĐT..." value="{{ request('search') }}">
                    </div>
                </div>
                <div class="col-md-3">
                    <select name="role" class="form-select">
                        <option value="">-- Tất cả vai trò --</option>
                        <option value="admin" @selected(request('role') === 'admin')>Quản trị viên (Admin)</option>
                        <option value="customer" @selected(request('role') === 'customer' || request('role') === 'user')>Khách hàng (User)</option>
                    </select>
                </div>
                <div class="col-md-4">
                    <button type="submit" class="btn btn-primary">
                        <i class="fa-solid fa-filter me-1"></i>Lọc danh sách
                    </button>
                    <a href="{{ route('admin.users.index') }}" class="btn btn-light ms-1">Đặt lại</a>
                </div>
            </form>
        </div>
    </div>

    <!-- Users Table -->
    <div class="card border-0 shadow-sm rounded-3">
        <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
                <thead class="table-light">
                    <tr>
                        <th class="ps-3" style="width: 70px;">ID</th>
                        <th>Họ và tên</th>
                        <th>Email</th>
                        <th>Số điện thoại</th>
                        <th>Vai trò</th>
                        <th>Ngày đăng ký</th>
                        <th class="text-end pe-3">Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($users as $user)
                        <tr>
                            <td class="ps-3 fw-bold text-muted">#{{ is_array($user) ? $user['id'] : $user->id }}</td>
                            <td>
                                <div class="d-flex align-items-center">
                                    <div class="avatar rounded-circle bg-primary bg-opacity-10 text-primary fw-bold d-flex align-items-center justify-content-center me-2" style="width: 36px; height: 36px;">
                                        {{ strtoupper(substr(is_array($user) ? $user['name'] : $user->name, 0, 1)) }}
                                    </div>
                                    <span class="fw-semibold">{{ is_array($user) ? $user['name'] : $user->name }}</span>
                                </div>
                            </td>
                            <td>{{ is_array($user) ? $user['email'] : $user->email }}</td>
                            <td>{{ is_array($user) ? ($user['phone'] ?? '-') : ($user->phone ?? '-') }}</td>
                            <td>
                                @php $r = is_array($user) ? $user['role'] : $user->role; @endphp
                                @if($r === 'admin')
                                    <span class="badge bg-danger rounded-pill px-2.5 py-1">Quản trị viên</span>
                                @else
                                    <span class="badge bg-secondary rounded-pill px-2.5 py-1">Khách hàng</span>
                                @endif
                            </td>
                            <td class="small text-muted">{{ is_array($user) ? ($user['created_at'] ?? '') : ($user->created_at ? $user->created_at->format('d/m/Y H:i') : '') }}</td>
                            <td class="text-end pe-3">
                                @php $uid = is_array($user) ? $user['id'] : $user->id; @endphp
                                <a href="{{ route('admin.users.show', $uid) }}" class="btn btn-outline-info btn-sm">
                                    <i class="fa-solid fa-eye"></i>
                                </a>
                                <a href="{{ route('admin.users.edit', $uid) }}" class="btn btn-outline-primary btn-sm ms-1">
                                    <i class="fa-solid fa-pen-to-square"></i>
                                </a>
                                @if($uid != 1)
                                <form action="{{ route('admin.users.destroy', $uid) }}" method="POST" class="d-inline ms-1">
                                    @csrf
                                    @method('DELETE')
                                    <button onclick="return confirm('Bạn có chắc chắn muốn xóa người dùng này?')" class="btn btn-outline-danger btn-sm">
                                        <i class="fa-solid fa-trash"></i>
                                    </button>
                                </form>
                                @endif
                            </td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="7" class="text-center text-muted py-5">
                                Không tìm thấy người dùng nào phù hợp.
                            </td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </div>
</div>
@endsection
