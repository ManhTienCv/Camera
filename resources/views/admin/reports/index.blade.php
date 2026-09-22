@extends('layouts.admin')

@section('title', 'Báo cáo doanh thu')

@section('content')
<div class="container-fluid">
    <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
            <h2 class="h3 fw-bold text-dark mb-1">Báo cáo doanh thu & Đơn hàng</h2>
            <p class="text-muted small mb-0">Doanh thu tính theo ngày tạo đơn, chỉ gồm đơn đã thanh toán hợp lệ, chưa hoàn tiền và không bị hủy/hoàn hàng.</p>
        </div>
        <a href="/admin" class="btn btn-outline-primary btn-sm">
            <i class="fa-solid fa-desktop me-1"></i>Mở giao diện SPA
        </a>
    </div>

    <nav class="nav nav-pills mb-4" aria-label="Báo cáo">
        <a class="nav-link active fw-semibold" aria-current="page" href="{{ route('admin.reports.index') }}">
            <i class="fa-solid fa-table me-1"></i>Bảng số liệu
        </a>
        <a class="nav-link fw-semibold" href="{{ route('admin.reports.charts') }}">
            <i class="fa-solid fa-chart-pie me-1"></i>Biểu đồ trực quan
        </a>
    </nav>

    <!-- KPI Cards -->
    <div class="row g-3 mb-4">
        <div class="col-md-4">
            <div class="card border-0 shadow-sm rounded-3 h-100 p-3 bg-white">
                <div class="d-flex align-items-center justify-content-between">
                    <div>
                        <span class="text-muted small fw-medium">Tổng số đơn hàng</span>
                        <h3 class="mb-0 fw-bold mt-1">{{ number_format($totalOrders) }}</h3>
                    </div>
                    <div class="p-3 bg-primary bg-opacity-10 text-primary rounded-circle">
                        <i class="fa-solid fa-cart-arrow-down fa-xl"></i>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-md-4">
            <div class="card border-0 shadow-sm rounded-3 h-100 p-3 bg-white">
                <div class="d-flex align-items-center justify-content-between">
                    <div>
                        <span class="text-muted small fw-medium">Tổng số khách hàng</span>
                        <h3 class="mb-0 fw-bold mt-1">{{ number_format($totalCustomers) }}</h3>
                    </div>
                    <div class="p-3 bg-info bg-opacity-10 text-info rounded-circle">
                        <i class="fa-solid fa-users fa-xl"></i>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-md-4">
            <div class="card border-0 shadow-sm rounded-3 h-100 p-3 bg-white">
                <div class="d-flex align-items-center justify-content-between">
                    <div>
                        <span class="text-muted small fw-medium">Tổng doanh thu thực tế</span>
                        <h3 class="mb-0 fw-bold text-success mt-1">{{ number_format($totalRevenue, 0, ',', '.') }} đ</h3>
                    </div>
                    <div class="p-3 bg-success bg-opacity-10 text-success rounded-circle">
                        <i class="fa-solid fa-money-bill-wave fa-xl"></i>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Category Revenue -->
    <div class="card border-0 shadow-sm rounded-3 mb-4">
        <div class="card-header bg-white py-3 border-bottom">
            <h5 class="card-title fw-bold mb-0">Doanh thu theo danh mục sản phẩm</h5>
            <small class="text-muted">Tính theo giá sản phẩm khi đặt hàng, không bao gồm phí vận chuyển.</small>
        </div>
        <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
                <thead class="table-light">
                    <tr>
                        <th class="ps-3">Danh mục</th>
                        <th class="text-end">Số lượng bán</th>
                        <th class="text-end pe-3">Doanh thu</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($categoryRevenue as $revenue)
                        <tr>
                            <td class="ps-3 fw-semibold">{{ $revenue->category_name ?? ('Danh mục #'.$revenue->category_id) }}</td>
                            <td class="text-end">{{ number_format($revenue->total_qty) }}</td>
                            <td class="text-end pe-3 fw-bold text-primary">{{ number_format($revenue->total_revenue, 0, ',', '.') }} đ</td>
                        </tr>
                    @empty
                        <tr><td colspan="3" class="text-center text-muted py-4">Chưa có dữ liệu bán hàng.</td></tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </div>

    <!-- Time Period Tables (Daily, Monthly, Yearly) -->
    @foreach([
        ['Doanh thu theo ngày (30 ngày gần nhất)', 'Ngày', 'date', $revenueByDate, 'd/m/Y'],
        ['Doanh thu theo tháng (12 tháng gần nhất)', 'Tháng', 'month', $revenueByMonth, 'm/Y'],
        ['Doanh thu theo từng năm', 'Năm', 'year', $revenueByYear, null],
    ] as [$title, $label, $field, $rows, $format])
    <div class="card border-0 shadow-sm rounded-3 mb-4">
        <div class="card-header bg-white py-3 border-bottom">
            <h5 class="card-title fw-bold mb-0">{{ $title }}</h5>
        </div>
        <div class="table-responsive" style="max-height: 380px;">
            <table class="table table-hover align-middle mb-0">
                <thead class="table-light">
                    <tr>
                        <th class="ps-3">{{ $label }}</th>
                        <th class="text-end">Số đơn đã thanh toán</th>
                        <th class="text-end pe-3">Doanh thu</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($rows as $revenue)
                        <tr>
                            <td class="ps-3 font-monospace">
                                {{ $format ? \Carbon\Carbon::parse($revenue->{$field}.($field === 'month' ? '-01' : ''))->format($format) : $revenue->{$field} }}
                            </td>
                            <td class="text-end"><span class="badge bg-secondary rounded-pill px-2 py-1">{{ number_format($revenue->order_count) }}</span></td>
                            <td class="text-end pe-3 fw-semibold text-success">{{ number_format($revenue->total_revenue, 0, ',', '.') }} đ</td>
                        </tr>
                    @empty
                        <tr><td colspan="3" class="text-center text-muted py-4">Chưa có doanh thu phát sinh trong khoảng thời gian này.</td></tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </div>
    @endforeach
</div>
@endsection
