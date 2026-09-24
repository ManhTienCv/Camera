@extends('layouts.admin')

@section('title', 'Danh sách giao dịch thanh toán')

@section('content')
<div class="container-fluid px-0 px-md-2">
    <!-- Header -->
    <div class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
        <div>
            <div class="d-flex align-items-center gap-2 mb-1">
                <span class="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-2.5 py-1 rounded-pill small fw-bold">
                    <i class="fa-solid fa-shield-halved me-1"></i>Lab 09 - Quản trị Tài chính
                </span>
            </div>
            <h2 class="h3 fw-bold text-dark mb-1">Danh Sách Giao Dịch & Đối Soát COD</h2>
            <p class="text-muted small mb-0">Tra cứu chi tiết từng lần thanh toán và cập nhật chuyển đổi trạng thái thu tiền đơn COD.</p>
        </div>
        <div class="d-flex align-items-center gap-2">
            <a href="{{ route('admin.finance.index') }}" class="btn btn-outline-primary btn-sm rounded-pill px-3 shadow-xs">
                <i class="fa-solid fa-chart-pie me-1.5"></i>Thống kê tổng quan
            </a>
            <a href="/admin" class="btn btn-outline-secondary btn-sm rounded-pill px-3">
                <i class="fa-solid fa-desktop me-1.5"></i>Giao diện SPA
            </a>
        </div>
    </div>

    <!-- Sub Navigation Tabs -->
    <nav class="nav nav-pills gap-2 mb-4 bg-white p-1.5 rounded-3 shadow-xs border" aria-label="Finance Tabs">
        <a class="nav-link text-muted fw-semibold px-3 py-2 rounded-2" href="{{ route('admin.finance.index') }}">
            <i class="fa-solid fa-chart-pie me-1.5"></i>Thống kê tổng quan
        </a>
        <a class="nav-link active fw-bold px-3 py-2 rounded-2" href="{{ route('admin.finance.transactions') }}">
            <i class="fa-solid fa-receipt me-1.5"></i>Chi tiết giao dịch & Cập nhật COD
        </a>
    </nav>

    <!-- Flash message alert -->
    @if(session('success'))
        <div class="alert alert-success alert-dismissible fade show border-0 shadow-sm rounded-3 d-flex align-items-center gap-2 mb-4" role="alert">
            <i class="fa-solid fa-circle-check fs-5 text-success"></i>
            <div>{{ session('success') }}</div>
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    @endif

    @if($errors->any())
        <div class="alert alert-danger alert-dismissible fade show border-0 shadow-sm rounded-3 d-flex align-items-start gap-2 mb-4" role="alert">
            <i class="fa-solid fa-triangle-exclamation fs-5 text-danger mt-0.5"></i>
            <div>
                <strong class="d-block">Có lỗi xảy ra khi cập nhật:</strong>
                <ul class="mb-0 ps-3 small mt-1">
                    @foreach($errors->all() as $err)
                        <li>{{ $err }}</li>
                    @endforeach
                </ul>
            </div>
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    @endif

    <!-- Filter Card -->
    <div class="card border-0 shadow-sm rounded-4 mb-4 overflow-hidden">
        <div class="card-header bg-white py-3 px-4 border-bottom d-flex align-items-center justify-content-between">
            <div class="d-flex align-items-center gap-2">
                <i class="fa-solid fa-filter text-primary"></i>
                <h5 class="card-title fw-bold mb-0 text-dark">Bộ Lọc & Sắp Xếp Giao Dịch</h5>
            </div>
            <span class="text-muted small">
                Hiển thị: <strong>{{ $orders->total() }}</strong> giao dịch
            </span>
        </div>
        <div class="card-body p-4 bg-light bg-opacity-25">
            <form method="GET" action="{{ route('admin.finance.transactions') }}">
                <div class="row g-3">
                    <!-- Search input -->
                    <div class="col-md-3">
                        <label class="form-label small fw-bold text-secondary">Mã đơn / Tên / SĐT</label>
                        <div class="input-group input-group-sm">
                            <span class="input-group-text bg-white border-end-0 text-muted">
                                <i class="fa-solid fa-magnifying-glass"></i>
                            </span>
                            <input type="text" name="search" class="form-control border-start-0" placeholder="CAM-1002, Phong..." value="{{ $filters['search'] ?? '' }}">
                        </div>
                    </div>

                    <!-- Date range -->
                    <div class="col-md-3 col-sm-6">
                        <label class="form-label small fw-bold text-secondary">Từ ngày</label>
                        <input type="date" name="date_from" class="form-control form-control-sm" value="{{ $filters['date_from'] ?? '' }}">
                    </div>
                    <div class="col-md-3 col-sm-6">
                        <label class="form-label small fw-bold text-secondary">Đến ngày</label>
                        <input type="date" name="date_to" class="form-control form-control-sm" value="{{ $filters['date_to'] ?? '' }}">
                    </div>

                    <!-- Sort -->
                    <div class="col-md-3 col-sm-6">
                        <label class="form-label small fw-bold text-secondary">Sắp xếp theo</label>
                        <select name="sort" class="form-select form-select-sm">
                            <option value="newest" {{ ($filters['sort'] ?? '') === 'newest' ? 'selected' : '' }}>Mới nhất (Mặc định)</option>
                            <option value="oldest" {{ ($filters['sort'] ?? '') === 'oldest' ? 'selected' : '' }}>Cũ nhất</option>
                            <option value="amount_desc" {{ ($filters['sort'] ?? '') === 'amount_desc' ? 'selected' : '' }}>Số tiền giảm dần</option>
                            <option value="amount_asc" {{ ($filters['sort'] ?? '') === 'amount_asc' ? 'selected' : '' }}>Số tiền tăng dần</option>
                        </select>
                    </div>

                    <!-- Amount range -->
                    <div class="col-md-3 col-sm-6">
                        <label class="form-label small fw-bold text-secondary">Số tiền từ (VNĐ)</label>
                        <input type="number" step="1000" name="min_amount" class="form-control form-control-sm" placeholder="Tối thiểu..." value="{{ $filters['min_amount'] ?? '' }}">
                    </div>
                    <div class="col-md-3 col-sm-6">
                        <label class="form-label small fw-bold text-secondary">Số tiền đến (VNĐ)</label>
                        <input type="number" step="1000" name="max_amount" class="form-control form-control-sm" placeholder="Tối đa..." value="{{ $filters['max_amount'] ?? '' }}">
                    </div>

                    <!-- Gateway select -->
                    <div class="col-md-3 col-sm-6">
                        <label class="form-label small fw-bold text-secondary">Phương thức</label>
                        <select name="gateway" class="form-select form-select-sm">
                            <option value="">-- Tất cả cổng --</option>
                            <option value="cod" {{ ($filters['gateway'] ?? '') === 'cod' ? 'selected' : '' }}>COD (Tiền mặt)</option>
                            <option value="momo" {{ ($filters['gateway'] ?? '') === 'momo' ? 'selected' : '' }}>Ví MoMo</option>
                            <option value="unknown" {{ ($filters['gateway'] ?? '') === 'unknown' ? 'selected' : '' }}>Chưa xác định</option>
                        </select>
                    </div>

                    <!-- Payment status select -->
                    <div class="col-md-3 col-sm-6">
                        <label class="form-label small fw-bold text-secondary">Trạng thái thanh toán</label>
                        <select name="payment_status" class="form-select form-select-sm">
                            <option value="">-- Tất cả trạng thái --</option>
                            @foreach($statuses as $stKey => $stLabel)
                                <option value="{{ $stKey }}" {{ ($filters['payment_status'] ?? '') === $stKey ? 'selected' : '' }}>
                                    {{ $stLabel }}
                                </option>
                            @endforeach
                        </select>
                    </div>
                </div>

                <!-- Action buttons -->
                <div class="d-flex align-items-center justify-content-end gap-2 mt-4 pt-3 border-top">
                    <a href="{{ route('admin.finance.transactions') }}" class="btn btn-outline-secondary btn-sm px-3 rounded-pill">
                        <i class="fa-solid fa-rotate-left me-1"></i>Đặt lại
                    </a>
                    <button type="submit" class="btn btn-primary btn-sm px-4 rounded-pill shadow-xs">
                        <i class="fa-solid fa-magnifying-glass me-1.5"></i>Tìm kiếm & Lọc
                    </button>
                </div>
            </form>
        </div>
    </div>

    <!-- Notice Card on COD Rule -->
    <div class="alert alert-info border-0 shadow-xs rounded-3 d-flex align-items-start gap-2.5 mb-4 py-2.5 px-3">
        <i class="fa-solid fa-circle-info fs-5 text-info mt-0.5"></i>
        <div class="small">
            <strong>Quy tắc đối soát COD:</strong> Chỉ đơn hàng phương thức <strong>COD</strong> mới được phép cập nhật thủ công. Thứ tự chuyển đổi:
            <code>Chờ thanh toán (pending)</code> ➔ <code>Đã thu tiền (paid)</code> hoặc <code>Thất bại (failed)</code>. Đơn đã thu tiền có thể chuyển sang <code>Chờ hoàn tiền (refund_pending)</code> rồi xác nhận <code>Đã hoàn tiền (refunded)</code>.
        </div>
    </div>

    <!-- Transactions Table -->
    <div class="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
        <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
                <thead class="table-light text-secondary small text-uppercase">
                    <tr>
                        <th class="ps-4 py-3">Đơn hàng</th>
                        <th>Khách hàng</th>
                        <th>Phương thức</th>
                        <th class="text-end">Số tiền</th>
                        <th class="text-center">Trạng thái thanh toán</th>
                        <th class="pe-4 text-end" style="min-width: 250px;">Cập nhật COD</th>
                    </tr>
                </thead>
                <tbody class="divide-y">
                    @forelse($orders as $o)
                        @php
                            $isCod = $o->gateway === 'cod';
                            $currentPayStatus = $o->payment_status;
                            $allowedNext = $isCod ? ($codTransitions[$currentPayStatus] ?? [$currentPayStatus]) : [];
                            
                            // Badge styles for payment status
                            $statusBadgeMap = [
                                'pending' => 'bg-warning bg-opacity-15 text-warning border-warning border-opacity-25',
                                'initiated' => 'bg-danger bg-opacity-15 text-danger border-danger border-opacity-25',
                                'paid' => 'bg-success bg-opacity-15 text-success border-success border-opacity-25',
                                'failed' => 'bg-danger bg-opacity-15 text-danger border-danger border-opacity-25',
                                'cancelled' => 'bg-secondary bg-opacity-15 text-secondary border-secondary border-opacity-25',
                                'refund_pending' => 'bg-warning bg-opacity-20 text-dark border-warning border-opacity-50',
                                'refunded' => 'bg-info bg-opacity-15 text-info border-info border-opacity-25',
                            ];
                            $badgeClass = $statusBadgeMap[$currentPayStatus] ?? 'bg-secondary text-white';
                        @endphp
                        <tr>
                            <!-- Order code & time -->
                            <td class="ps-4 py-3">
                                <div class="d-flex align-items-center gap-2">
                                    <div class="w-8 h-8 rounded-2 bg-light text-primary d-flex align-items-center justify-content-center fw-bold small">
                                        <i class="fa-solid fa-box-open"></i>
                                    </div>
                                    <div>
                                        <span class="fw-bold text-dark d-block">
                                            #{{ $o->order_code ?? $o->id }}
                                        </span>
                                        <small class="text-muted tabular-nums">
                                            {{ \Carbon\Carbon::parse($o->created_at)->format('H:i - d/m/Y') }}
                                        </small>
                                    </div>
                                </div>
                            </td>

                            <!-- Customer info -->
                            <td>
                                <div>
                                    <span class="fw-bold text-dark d-block">{{ $o->customer_name ?? $o->name ?? 'Khách vãng lai' }}</span>
                                    <small class="text-muted d-block">
                                        <i class="fa-solid fa-phone me-1"></i>{{ $o->customer_phone ?? $o->phone ?? '---' }}
                                    </small>
                                </div>
                            </td>

                            <!-- Gateway -->
                            <td>
                                @if($o->gateway === 'cod')
                                    <span class="badge bg-amber-500 bg-opacity-10 text-amber-600 border border-amber-500 border-opacity-25 px-2.5 py-1 rounded-pill small fw-bold">
                                        <i class="fa-solid fa-truck-ramp-box me-1"></i>COD
                                    </span>
                                @elseif($o->gateway === 'momo')
                                    <span class="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 px-2.5 py-1 rounded-pill small fw-bold">
                                        <i class="fa-solid fa-wallet me-1"></i>MoMo
                                    </span>
                                @else
                                    <span class="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 px-2.5 py-1 rounded-pill small">
                                        Chưa rõ
                                    </span>
                                @endif
                            </td>

                            <!-- Amount -->
                            <td class="text-end fw-bold text-dark">
                                {{ number_format($o->total_price ?? $o->total_amount ?? 0, 0, ',', '.') }} ₫
                            </td>

                            <!-- Payment status -->
                            <td class="text-center">
                                <span class="badge border {{ $badgeClass }} px-2.5 py-1 rounded-pill fw-bold small">
                                    {{ $statuses[$currentPayStatus] ?? $currentPayStatus }}
                                </span>
                                @if($o->paid_at)
                                    <small class="text-muted d-block mt-0.5" style="font-size: 11px;">
                                        Đã thu: {{ \Carbon\Carbon::parse($o->paid_at)->format('d/m H:i') }}
                                    </small>
                                @endif
                            </td>

                            <!-- COD update form -->
                            <td class="pe-4 text-end">
                                @if($isCod)
                                    <form method="POST" action="{{ route('admin.finance.update-status', $o->id) }}" class="d-inline-flex align-items-center justify-content-end gap-1.5">
                                        @csrf
                                        @method('PATCH')

                                        <input type="hidden" name="current_payment_status" value="{{ $currentPayStatus }}">
                                        <input type="hidden" name="current_order_status" value="{{ $o->order_status }}">
                                        <input type="hidden" name="current_payment_id" value="{{ (int)($o->payment_id ?? 0) }}">

                                        <select name="payment_status" class="form-select form-select-sm rounded-pill border-secondary border-opacity-25 text-xs py-1" style="width: 150px; font-size: 12px;">
                                            @foreach($allowedNext as $transStatus)
                                                <option value="{{ $transStatus }}" {{ $transStatus === $currentPayStatus ? 'selected' : '' }}>
                                                    {{ $statuses[$transStatus] ?? $transStatus }}
                                                </option>
                                            @endforeach
                                        </select>

                                        <button type="submit" class="btn btn-sm btn-outline-primary rounded-pill px-2.5 py-1 shadow-xs" title="Cập nhật trạng thái thanh toán">
                                            <i class="fa-solid fa-floppy-disk me-1"></i>Lưu
                                        </button>
                                    </form>
                                @else
                                    <span class="badge bg-light text-muted border px-2.5 py-1 rounded-pill small">
                                        <i class="fa-solid fa-lock me-1"></i>MoMo tự động
                                    </span>
                                @endif
                            </td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="6" class="text-center py-5 text-muted">
                                <div class="py-4">
                                    <i class="fa-solid fa-receipt fs-1 text-secondary opacity-25 mb-3 d-block"></i>
                                    <h6>Không tìm thấy giao dịch nào phù hợp với bộ lọc.</h6>
                                    <p class="small text-muted mb-3">Vui lòng thử tìm kiếm với từ khóa hoặc khoảng ngày khác.</p>
                                    <a href="{{ route('admin.finance.transactions') }}" class="btn btn-sm btn-outline-secondary rounded-pill px-3">
                                        Xóa bộ lọc
                                    </a>
                                </div>
                            </td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>

        <!-- Pagination -->
        @if($orders->hasPages())
            <div class="card-footer bg-white py-3 px-4 border-top d-flex align-items-center justify-content-between">
                <small class="text-muted">
                    Hiển thị từ {{ $orders->firstItem() }} đến {{ $orders->lastItem() }} trên tổng số {{ $orders->total() }} đơn
                </small>
                <div>
                    {{ $orders->links('pagination::bootstrap-5') }}
                </div>
            </div>
        @endif
    </div>
</div>
@endsection
