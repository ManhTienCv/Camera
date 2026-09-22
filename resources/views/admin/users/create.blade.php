@extends('layouts.admin')

@section('title', 'Thêm người dùng mới')

@section('content')
<div class="container-fluid" style="max-width: 800px;">
    <div class="d-flex align-items-center mb-4">
        <a href="{{ route('admin.users.index') }}" class="btn btn-outline-secondary btn-sm me-3">
            <i class="fa-solid fa-arrow-left"></i> Quay lại
        </a>
        <h2 class="h3 fw-bold text-dark mb-0">Thêm người dùng mới</h2>
    </div>

    @if ($errors->any())
        <div class="alert alert-danger">
            <ul class="mb-0">
                @foreach ($errors->all() as $error)
                    <li>{{ $error }}</li>
                @endforeach
            </ul>
        </div>
    @endif

    <div class="card border-0 shadow-sm rounded-3">
        <div class="card-body p-4">
            <form action="{{ route('admin.users.store') }}" method="POST">
                @csrf

                <div class="mb-3">
                    <label class="form-label fw-semibold">Họ và tên <span class="text-danger">*</span></label>
                    <input type="text" name="name" class="form-control" value="{{ old('name') }}" placeholder="Nhập họ và tên..." required>
                </div>

                <div class="mb-3">
                    <label class="form-label fw-semibold">Địa chỉ Email <span class="text-danger">*</span></label>
                    <input type="email" name="email" class="form-control" value="{{ old('email') }}" placeholder="example@email.com" required>
                </div>

                <div class="mb-3">
                    <label class="form-label fw-semibold">Mật khẩu <span class="text-danger">*</span></label>
                    <input type="password" name="password" class="form-control" placeholder="Tối thiểu 6 ký tự" required>
                </div>

                <div class="mb-3">
                    <label class="form-label fw-semibold">Số điện thoại</label>
                    <input type="text" name="phone" class="form-control" value="{{ old('phone') }}" placeholder="09xxxxxxxx">
                </div>

                <div class="mb-4">
                    <label class="form-label fw-semibold">Vai trò phân quyền <span class="text-danger">*</span></label>
                    <select name="role" class="form-select" required>
                        <option value="user" @selected(old('role') === 'user' || old('role') === 'customer')>Khách hàng (User/Customer)</option>
                        <option value="admin" @selected(old('role') === 'admin')>Quản trị viên (Admin)</option>
                    </select>
                </div>

                <div class="d-flex justify-content-end gap-2">
                    <a href="{{ route('admin.users.index') }}" class="btn btn-light px-4">Hủy bỏ</a>
                    <button type="submit" class="btn btn-success px-4">
                        <i class="fa-solid fa-check me-1"></i>Lưu người dùng
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>
@endsection
