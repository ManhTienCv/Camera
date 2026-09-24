@extends('layouts.admin')

@section('title', 'Thống kê tài chính & Giao dịch')

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
            <h2 class="h3 fw-bold text-dark mb-1">Thống Kê Tài Chính & Giao Dịch</h2>
            <p class="text-muted small mb-0">Theo dõi doanh số, dòng tiền thanh toán và trạng thái đối soát đơn hàng CameraHub.</p>
        </div>
        <div class="d-flex align-items-center gap-2">
            <a href="{{ route('admin.finance.transactions') }}" class="btn btn-primary btn-sm rounded-pill px-3 shadow-sm">
                <i class="fa-solid fa-list-check me-1.5"></i>Danh sách giao dịch
            </a>
            <a href="/admin" class="btn btn-outline-secondary btn-sm rounded-pill px-3">
                <i class="fa-solid fa-desktop me-1.5"></i>Giao diện SPA
            </a>
        </div>
    </div>

    <!-- Sub Navigation Tabs -->
    <nav class="nav nav-pills gap-2 mb-4 bg-white p-1.5 rounded-3 shadow-xs border" aria-label="Finance Tabs">
        <a class="nav-link active fw-bold px-3 py-2 rounded-2" href="{{ route('admin.finance.index') }}">
            <i class="fa-solid fa-chart-pie me-1.5"></i>Thống kê tổng quan
        </a>
        <a class="nav-link text-muted fw-semibold px-3 py-2 rounded-2" href="{{ route('admin.finance.transactions') }}">
            <i class="fa-solid fa-receipt me-1.5"></i>Chi tiết giao dịch & Cập nhật COD
        </a>
    </nav>

    <!-- Filter Card -->
    <div class="card border-0 shadow-sm rounded-4 mb-4 overflow-hidden">
        <div class="card-header bg-white py-3 px-4 border-bottom d-flex align-items-center justify-content-between">
            <div class="d-flex align-items-center gap-2">
                <i class="fa-solid fa-filter text-primary"></i>
                <h5 class="card-title fw-bold mb-0 text-dark">Bộ Lọc Thống Kê</h5>
            </div>
            @if(array_filter($filters ?? []))
                <span class="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 px-2.5 py-1 rounded-pill small">
                    Đang kích hoạt bộ lọc
                </span>
            @endif
        </div>
        <div class="card-body p-4 bg-light bg-opacity-25">
            <form method="GET" action="{{ route('admin.finance.index') }}">
                <div class="row g-3">
                    <!-- Search input -->
                    <div class="col-md-4">
                        <label class="form-label small fw-bold text-secondary">Mã đơn / Tên KH / SĐT</label>
                        <div class="input-group input-group-sm">
                            <span class="input-group-text bg-white border-end-0 text-muted">
                                <i class="fa-solid fa-magnifying-glass"></i>
                            </span>
                            <input type="text" name="search" class="form-control border-start-0" placeholder="Ví dụ: CAM-1002, 0988..." value="{{ $filters['search'] ?? '' }}">
                        </div>
                    </div>

                    <!-- Date range -->
                    <div class="col-md-4 col-sm-6">
                        <label class="form-label small fw-bold text-secondary">Từ ngày tạo</label>
                        <input type="date" name="date_from" class="form-control form-control-sm" value="{{ $filters['date_from'] ?? '' }}">
                    </div>
                    <div class="col-md-4 col-sm-6">
                        <label class="form-label small fw-bold text-secondary">Đến ngày tạo</label>
                        <input type="date" name="date_to" class="form-control form-control-sm" value="{{ $filters['date_to'] ?? '' }}">
                    </div>

                    <!-- Amount range -->
                    <div class="col-md-3 col-sm-6">
                        <label class="form-label small fw-bold text-secondary">Số tiền tối thiểu (VNĐ)</label>
                        <input type="number" step="1000" name="min_amount" class="form-control form-control-sm" placeholder="Từ..." value="{{ $filters['min_amount'] ?? '' }}">
                    </div>
                    <div class="col-md-3 col-sm-6">
                        <label class="form-label small fw-bold text-secondary">Số tiền tối đa (VNĐ)</label>
                        <input type="number" step="1000" name="max_amount" class="form-control form-control-sm" placeholder="Đến..." value="{{ $filters['max_amount'] ?? '' }}">
                    </div>

                    <!-- Gateway select -->
                    <div class="col-md-3 col-sm-6">
                        <label class="form-label small fw-bold text-secondary">Cổng thanh toán</label>
                        <select name="gateway" class="form-select form-select-sm">
                            <option value="">-- Tất cả phương thức --</option>
                            <option value="cod" {{ ($filters['gateway'] ?? '') === 'cod' ? 'selected' : '' }}>COD (Nhận hàng thanh toán)</option>
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
                    <a href="{{ route('admin.finance.index') }}" class="btn btn-outline-secondary btn-sm px-3 rounded-pill">
                        <i class="fa-solid fa-rotate-left me-1"></i>Đặt lại
                    </a>
                    <button type="submit" class="btn btn-primary btn-sm px-4 rounded-pill shadow-xs">
                        <i class="fa-solid fa-filter me-1.5"></i>Áp dụng bộ lọc
                    </button>
                </div>
            </form>
        </div>
    </div>

    <!-- Overview Hero KPI Card -->
    <div class="card border-0 shadow-sm rounded-4 mb-4 p-4 bg-gradient text-white" style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);">
        <div class="row align-items-center g-4">
            <div class="col-md-7 border-end-md border-secondary border-opacity-25">
                <span class="badge bg-warning bg-opacity-20 text-warning px-3 py-1 rounded-pill small fw-bold mb-2">
                    <i class="fa-solid fa-sack-dollar me-1"></i>Tổng doanh thu đơn hàng theo bộ lọc
                </span>
                <h1 class="display-6 fw-bold mb-1 tracking-tight text-white">
                    {{ number_format($summary->total_amount ?? 0, 0, ',', '.') }} <span class="fs-4 text-warning">₫</span>
                </h1>
                <p class="text-white-50 small mb-0">
                    Bao gồm toàn bộ các đơn hàng phù hợp với điều kiện tìm kiếm và khoảng thời gian đã chọn.
                </p>
            </div>
            <div class="col-md-5">
                <div class="d-flex align-items-center gap-3">
                    <div class="p-3 bg-white bg-opacity-10 text-white rounded-3 fs-2">
                        <i class="fa-solid fa-boxes-stacked"></i>
                    </div>
                    <div>
                        <span class="text-white-50 small d-block">Tổng số đơn hàng ghi nhận</span>
                        <h3 class="fw-bold mb-0 text-white">{{ number_format($summary->order_count ?? 0) }} đơn</h3>
                        <small class="text-info mt-1 d-inline-block">
                            <i class="fa-solid fa-circle-check me-1"></i>Mỗi đơn được tính duy nhất 1 lần
                        </small>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- 8 Individual Status KPI Cards (Grid) -->
    <h5 class="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
        <i class="fa-solid fa-chart-simple text-primary"></i>
        <span>Chỉ Số Theo Trạng Thái Giao Dịch</span>
    </h5>

    <div class="row g-3 mb-4">
        @php
            $statusCards = [
                'pending' => [
                    'label' => 'Chờ thanh toán',
                    'color' => 'warning',
                    'icon' => 'fa-clock',
                    'bg' => 'bg-warning bg-opacity-10 text-warning',
                ],
                'initiated' => [
                    'label' => 'Đang chờ MoMo',
                    'color' => 'danger',
                    'icon' => 'fa-mobile-screen-button',
                    'bg' => 'bg-danger bg-opacity-10 text-danger',
                ],
                'paid' => [
                    'label' => 'Đã thanh toán',
                    'color' => 'success',
                    'icon' => 'fa-circle-check',
                    'bg' => 'bg-success bg-opacity-10 text-success',
                ],
                'failed' => [
                    'label' => 'Thanh toán thất bại',
                    'color' => 'danger',
                    'icon' => 'fa-circle-xmark',
                    'bg' => 'bg-danger bg-opacity-10 text-danger',
                ],
                'cancelled' => [
                    'label' => 'Đã hủy',
                    'color' => 'secondary',
                    'icon' => 'fa-ban',
                    'bg' => 'bg-secondary bg-opacity-10 text-secondary',
                ],
                'refund_pending' => [
                    'label' => 'Chờ hoàn tiền',
                    'color' => 'warning',
                    'icon' => 'fa-rotate-left',
                    'bg' => 'bg-warning bg-opacity-10 text-warning',
                ],
                'refunded' => [
                    'label' => 'Đã hoàn tiền',
                    'color' => 'info',
                    'icon' => 'fa-money-bill-transfer',
                    'bg' => 'bg-info bg-opacity-10 text-info',
                ],
            ];
        @endphp

        @foreach($statusCards as $stKey => $cfg)
            @php
                $item = $statusTotals->get($stKey);
                $count = $item ? $item->order_count : 0;
                $amount = $item ? $item->total_amount : 0;
            @endphp
            <div class="col-xl-3 col-md-4 col-sm-6">
                <div class="card border-0 shadow-sm rounded-4 h-100 p-3.5 bg-white transition-all hover-translate-y">
                    <div class="d-flex align-items-center justify-content-between mb-3">
                        <span class="badge {{ $cfg['bg'] }} px-2.5 py-1.5 rounded-pill small fw-bold">
                            <i class="fa-solid {{ $cfg['icon'] }} me-1"></i>{{ $cfg['label'] }}
                        </span>
                        <span class="fs-5 fw-bold text-dark">{{ number_format($count) }} <small class="text-muted fs-6 fw-normal">đơn</small></span>
                    </div>
                    <div>
                        <span class="text-muted small d-block">Tổng giá trị</span>
                        <h4 class="fw-bold mb-0 text-dark fs-5 mt-0.5">
                            {{ number_format($amount, 0, ',', '.') }} <small class="text-muted fw-normal">₫</small>
                        </h4>
                    </div>
                </div>
            </div>
        @endforeach
    </div>

    <!-- Payment Methods Breakdown Table -->
    <div class="card border-0 shadow-sm rounded-4 mb-4 overflow-hidden">
        <div class="card-header bg-white py-3.5 px-4 border-bottom d-flex align-items-center justify-content-between">
            <div>
                <h5 class="card-title fw-bold mb-1 text-dark">Thống Kê Theo Phương Thức Thanh Toán</h5>
                <p class="text-muted small mb-0">So sánh đối soát giữa COD (Tiền mặt khi giao) và Cổng MoMo trực tuyến.</p>
            </div>
            <a href="{{ route('admin.finance.transactions') }}" class="btn btn-outline-primary btn-sm rounded-pill px-3">
                <span>Xem từng giao dịch</span>
                <i class="fa-solid fa-arrow-right ms-1"></i>
            </a>
        </div>
        <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
                <thead class="table-light text-secondary small text-uppercase">
                    <tr>
                        <th class="ps-4 py-3">Phương thức</th>
                        <th class="text-center">Số lượng đơn</th>
                        <th class="text-end">Tổng giá trị đơn</th>
                        <th class="text-end">Số tiền đã thu (Paid)</th>
                        <th class="text-end pe-4" style="min-width: 180px;">Tỷ lệ thu thành công</th>
                    </tr>
                </thead>
                <tbody class="divide-y">
                    @forelse(['cod', 'momo', 'unknown'] as $mKey)
                        @php
                            $row = $methodTotals->get($mKey);
                            $count = $row ? $row->order_count : 0;
                            $amount = $row ? (float)$row->total_amount : 0;
                            $paid = $row ? (float)$row->paid_amount : 0;
                            $rate = $amount > 0 ? round(($paid / $amount) * 100, 1) : 0;
                        @endphp
                        <tr>
                            <td class="ps-4 py-3">
                                <div class="d-flex align-items-center gap-2.5">
                                    @if($mKey === 'cod')
                                        <div class="w-9 h-9 rounded-3 bg-amber-500 bg-opacity-10 text-amber-600 d-flex align-items-center justify-content-center fs-5 shrink-0">
                                            <i class="fa-solid fa-truck-ramp-box"></i>
                                        </div>
                                        <div>
                                            <span class="fw-bold text-dark d-block">COD</span>
                                            <small class="text-muted">Thanh toán tiền mặt khi nhận máy ảnh</small>
                                        </div>
                                    @elseif($mKey === 'momo')
                                        <div class="w-9 h-9 rounded-3 bg-danger bg-opacity-10 text-danger d-flex align-items-center justify-content-center fs-5 shrink-0">
                                            <i class="fa-solid fa-wallet"></i>
                                        </div>
                                        <div>
                                            <span class="fw-bold text-dark d-block">Ví MoMo</span>
                                            <small class="text-muted">Cổng quét mã MoMo QR / App</small>
                                        </div>
                                    @else
                                        <div class="w-9 h-9 rounded-3 bg-secondary bg-opacity-10 text-secondary d-flex align-items-center justify-content-center fs-5 shrink-0">
                                            <i class="fa-solid fa-circle-question"></i>
                                        </div>
                                        <div>
                                            <span class="fw-bold text-dark d-block">Chưa xác định</span>
                                            <small class="text-muted">Giao dịch phát sinh không rõ cổng</small>
                                        </div>
                                    @endif
                                </div>
                            </td>
                            <td class="text-center">
                                <span class="badge bg-secondary bg-opacity-10 text-dark px-3 py-1.5 rounded-pill fw-bold">
                                    {{ number_format($count) }} đơn
                                </span>
                            </td>
                            <td class="text-end fw-semibold text-dark">
                                {{ number_format($amount, 0, ',', '.') }} ₫
                            </td>
                            <td class="text-end fw-bold text-success">
                                {{ number_format($paid, 0, ',', '.') }} ₫
                            </td>
                            <td class="text-end pe-4">
                                <div class="d-flex align-items-center justify-content-end gap-2">
                                    <div class="progress flex-grow-1" style="height: 6px; background-color: #e2e8f0;">
                                        <div class="progress-bar bg-success rounded-pill" role="progressbar" style="width: {{ min(100, $rate) }}%"></div>
                                    </div>
                                    <span class="small fw-bold {{ $rate >= 70 ? 'text-success' : 'text-secondary' }} tabular-nums" style="width: 48px;">
                                        {{ $rate }}%
                                    </span>
                                </div>
                            </td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="5" class="text-center py-4 text-muted">Chưa có số liệu phương thức thanh toán.</td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </div>
</div>
@endsection
