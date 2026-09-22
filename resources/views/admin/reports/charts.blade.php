@extends('layouts.admin')

@section('title', 'Biểu đồ báo cáo doanh thu')

@section('content')
<style>
    .chart-wrap { position: relative; min-height: 320px; height: 320px; }
    .chart-wrap canvas { width: 100% !important; height: 100% !important; }
</style>

<div class="container-fluid">
    <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
            <h2 class="h3 fw-bold text-dark mb-1">Biểu đồ phân tích doanh thu</h2>
            <p class="text-muted small mb-0">Chỉ tính đơn đã thanh toán, chưa hoàn tiền và không bị hủy. Doanh thu tính theo ngày tạo đơn.</p>
        </div>
        <a href="/admin" class="btn btn-outline-primary btn-sm">
            <i class="fa-solid fa-desktop me-1"></i>Mở giao diện SPA
        </a>
    </div>

    <nav class="nav nav-pills mb-4" aria-label="Báo cáo">
        <a class="nav-link fw-semibold" href="{{ route('admin.reports.index') }}">
            <i class="fa-solid fa-table me-1"></i>Bảng số liệu
        </a>
        <a class="nav-link active fw-semibold" aria-current="page" href="{{ route('admin.reports.charts') }}">
            <i class="fa-solid fa-chart-pie me-1"></i>Biểu đồ trực quan
        </a>
    </nav>

    <div id="report-chart-error" class="alert alert-warning d-none" role="alert">
        Không tải được thư viện biểu đồ. Bạn có thể xem số liệu chi tiết tại trang <a href="{{ route('admin.reports.index') }}" class="alert-link">Bảng số liệu</a>.
    </div>

    <div class="row g-4">
        <!-- 1. Category Revenue Bar Chart -->
        <div class="col-lg-6">
            <div class="card border-0 shadow-sm rounded-3 h-100">
                <div class="card-header bg-white py-3 border-bottom">
                    <h5 class="card-title fw-bold mb-0">1. Doanh thu theo danh mục sản phẩm</h5>
                </div>
                <div class="card-body chart-wrap">
                    <canvas id="categoryRevenueChart"></canvas>
                </div>
            </div>
        </div>

        <!-- 2. Daily Revenue Line Chart (30 days) -->
        <div class="col-lg-6">
            <div class="card border-0 shadow-sm rounded-3 h-100">
                <div class="card-header bg-white py-3 border-bottom">
                    <h5 class="card-title fw-bold mb-0">2. Doanh thu theo ngày (30 ngày gần nhất)</h5>
                </div>
                <div class="card-body chart-wrap">
                    <canvas id="revenueByDateChart"></canvas>
                </div>
            </div>
        </div>

        <!-- 3. Monthly Revenue Bar Chart (12 months) -->
        <div class="col-lg-6">
            <div class="card border-0 shadow-sm rounded-3 h-100">
                <div class="card-header bg-white py-3 border-bottom">
                    <h5 class="card-title fw-bold mb-0">3. Doanh thu theo tháng (12 tháng gần nhất)</h5>
                </div>
                <div class="card-body chart-wrap">
                    <canvas id="revenueByMonthChart"></canvas>
                </div>
            </div>
        </div>

        <!-- 4. Yearly Revenue Bar Chart -->
        <div class="col-lg-6">
            <div class="card border-0 shadow-sm rounded-3 h-100">
                <div class="card-header bg-white py-3 border-bottom">
                    <h5 class="card-title fw-bold mb-0">4. Doanh thu theo từng năm</h5>
                </div>
                <div class="card-body chart-wrap">
                    <canvas id="revenueByYearChart"></canvas>
                </div>
            </div>
        </div>

        <!-- 5. Payment Method Donut/Pie Chart (MoMo vs COD vs VietQR) -->
        <div class="col-lg-12">
            <div class="card border-0 shadow-sm rounded-3">
                <div class="card-header bg-white py-3 border-bottom">
                    <h5 class="card-title fw-bold mb-0">5. Doanh thu theo phương thức thanh toán (MoMo vs Tiền mặt COD)</h5>
                </div>
                <div class="card-body chart-wrap" style="min-height: 380px; height: 380px;">
                    <canvas id="revenueByPaymentMethodChart"></canvas>
                </div>
            </div>
        </div>
    </div>
</div>

<div id="report-chart-data" hidden data-chart-data="{{ json_encode([
    'catLabels' => $catLabels ?? [],
    'catRevenue' => $catRevenue ?? [],
    'revDateLabels' => $revDateLabels ?? [],
    'revDateData' => $revDateData ?? [],
    'revMonthLabels' => $revMonthLabels ?? [],
    'revMonthData' => $revMonthData ?? [],
    'revYearLabels' => $revYearLabels ?? [],
    'revYearData' => $revYearData ?? [],
    'paymentMethodLabels' => $paymentMethodLabels ?? [],
    'paymentMethodRevenue' => $paymentMethodRevenue ?? [],
]) }}"></div>

@section('scripts')
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
window.addEventListener('DOMContentLoaded', () => {
    if (typeof Chart === 'undefined') {
        document.getElementById('report-chart-error')?.classList.remove('d-none');
        return;
    }

    const dataEl = document.getElementById('report-chart-data');
    if (!dataEl) return;

    const reportData = JSON.parse(dataEl.dataset.chartData);

    const catLabels = reportData.catLabels || [];
    const catRevenue = (reportData.catRevenue || []).map(Number);
    const revDateLabels = reportData.revDateLabels || [];
    const revDateData = (reportData.revDateData || []).map(Number);
    const revMonthLabels = reportData.revMonthLabels || [];
    const revMonthData = (reportData.revMonthData || []).map(Number);
    const revYearLabels = reportData.revYearLabels || [];
    const revYearData = (reportData.revYearData || []).map(Number);
    const payLabels = reportData.paymentMethodLabels || [];
    const payRevenue = (reportData.paymentMethodRevenue || []).map(Number);

    const formatVND = (v) => new Intl.NumberFormat('vi-VN').format(v) + ' đ';

    const mk = (el, type, labels, data, label, bgColor = '#f97316', borderColor = '#ea580c') => {
        if (!el) return;
        return new Chart(el, {
            type,
            data: {
                labels,
                datasets: [{
                    label,
                    data,
                    backgroundColor: bgColor,
                    borderColor: borderColor,
                    borderWidth: 2,
                    fill: type === 'line',
                    tension: 0.35,
                    borderRadius: type === 'bar' ? 6 : 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: (ctx) => `${ctx.dataset.label}: ${formatVND(ctx.raw)}`
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (v) => formatVND(v)
                        }
                    }
                }
            }
        });
    };

    mk(document.getElementById('categoryRevenueChart'), 'bar', catLabels, catRevenue, 'Doanh thu (VNĐ)', '#3b82f6', '#2563eb');
    mk(document.getElementById('revenueByDateChart'), 'line', revDateLabels, revDateData, 'Doanh thu (VNĐ)', 'rgba(249, 115, 22, 0.15)', '#f97316');
    mk(document.getElementById('revenueByMonthChart'), 'bar', revMonthLabels, revMonthData, 'Doanh thu (VNĐ)', '#10b981', '#059669');
    mk(document.getElementById('revenueByYearChart'), 'bar', revYearLabels, revYearData, 'Doanh thu (VNĐ)', '#8b5cf6', '#7c3aed');

    const payCanvas = document.getElementById('revenueByPaymentMethodChart');
    if (payCanvas) {
        new Chart(payCanvas, {
            type: 'doughnut',
            data: {
                labels: payLabels,
                datasets: [{
                    label: 'Doanh thu (VNĐ)',
                    data: payRevenue,
                    backgroundColor: ['#a855f7', '#3b82f6', '#10b981', '#f59e0b'],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: (ctx) => `${ctx.label}: ${formatVND(ctx.raw)}`
                        }
                    }
                }
            }
        });
    }
});
</script>
@endsection
@endsection
