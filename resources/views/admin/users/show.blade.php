@extends('layouts.admin')

@section('title', 'Chi tiết người dùng')

@section('content')
<div class="container-fluid" style="max-width: 900px;">
    <div class="d-flex align-items-center justify-content-between mb-4">
        <div class="d-flex align-items-center">
            <a href="{{ route('admin.users.index') }}" class="btn btn-outline-secondary btn-sm me-3">
                <i class="fa-solid fa-arrow-left"></i> Quay lại
            </a>
            <h2 class="h3 fw-bold text-dark mb-0">Hồ sơ người dùng #{{ $user->id }}</h2>
        </div>
        <div>
            <a href="{{ route('admin.users.edit', $user->id) }}" class="btn btn-primary btn-sm">
                <i class="fa-solid fa-pen-to-square me-1"></i>Chỉnh sửa
            </a>
        </div>
    </div>

    <div class="card border-0 shadow-sm rounded-3 mb-4">
        <div class="card-body p-4">
            <div class="row">
                <div class="col-md-6 mb-3">
                    <span class="text-muted small">ID Người dùng</span>
                    <p class="fw-bold fs-5 mb-0">#{{ $user->id }}</p>
                </div>
                <div class="col-md-6 mb-3">
                    <span class="text-muted small">Họ và tên</span>
                    <p class="fw-bold fs-5 mb-0">{{ $user->name }}</p>
                </div>
                <div class="col-md-6 mb-3">
                    <span class="text-muted small">Email đăng ký</span>
                    <p class="fw-semibold mb-0">{{ $user->email }}</p>
                </div>
                <div class="col-md-6 mb-3">
                    <span class="text-muted small">Số điện thoại</span>
                    <p class="fw-semibold mb-0">{{ $user->phone ?? 'Chưa cập nhật' }}</p>
                </div>
                <div class="col-md-6 mb-3">
                    <span class="text-muted small">Vai trò</span>
                    <div>
                        @if($user->role === 'admin')
                            <span class="badge bg-danger">Quản trị viên (Admin)</span>
                        @else
                            <span class="badge bg-secondary">Khách hàng (User)</span>
                        @endif
                    </div>
                </div>
                <div class="col-md-6 mb-3">
                    <span class="text-muted small">Thời gian tạo tài khoản</span>
                    <p class="fw-semibold mb-0">{{ $user->created_at ? $user->created_at->format('d/m/Y H:i:s') : 'N/A' }}</p>
                </div>
            </div>
        </div>
    </div>

    <!-- Recent Orders by this user -->
    <div class="card border-0 shadow-sm rounded-3">
        <div class="card-header bg-white py-3 border-bottom">
            <h5 class="card-title fw-bold mb-0">Đơn hàng gần đây của khách</h5>
        </div>
        <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
                <thead class="table-light">
                    <tr>
                        <th class="ps-3">Mã đơn</th>
                        <th>Tổng tiền</th>
                        <th>Trạng thái đơn</th>
                        <th>Ngày đặt</th>
                        <th class="text-end pe-3">Xem</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($user->orders as $order)
                        <tr>
                            <td class="ps-3 fw-bold font-monospace">{{ $order->order_code ?? ('#'.$order->id) }}</td>
                            <td class="fw-semibold text-danger">{{ number_format($order->total_amount, 0, ',', '.') }} đ</td>
                            <td><span class="badge bg-info text-dark">{{ $order->order_status }}</span></td>
                            <td class="small text-muted">{{ $order->created_at ? $order->created_at->format('d/m/Y H:i') : '' }}</td>
                            <td class="text-end pe-3">
                                <a href="{{ route('admin.orders.show', $order->id) }}" class="btn btn-sm btn-outline-primary">
                                    <i class="fa-solid fa-eye"></i>
                                </a>
                            </td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="5" class="text-center text-muted py-4">Khách hàng này chưa có đơn hàng nào.</td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </div>
</div>
@endsection
