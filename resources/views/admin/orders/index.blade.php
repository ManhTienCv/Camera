@extends('layouts.admin')

@section('title', 'Quản lý đơn hàng')

@section('content')
<div class="container-fluid">
    <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
            <h2 class="h3 fw-bold text-dark mb-1">Quản lý đơn hàng</h2>
            <p class="text-muted small mb-0">Theo dõi trạng thái, đồng bộ đơn GHN và quản trị vòng đời đơn hàng.</p>
        </div>
        <a href="/admin" class="btn btn-outline-primary btn-sm">
            <i class="fa-solid fa-desktop me-1"></i>Giao diện SPA
        </a>
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

    <!-- Status Tabs (Lab 08 requirement) -->
    <ul class="nav nav-tabs mb-4">
        @php
            $tabDefs = [
                'all' => 'Tất cả',
                'pending' => 'Chờ xử lý',
                'ready' => 'Chờ lấy hàng',
                'picking' => 'Đang lấy hàng',
                'delivering' => 'Đang giao',
                'delivered' => 'Thành công',
                'return' => 'Hoàn hàng',
                'cancelled' => 'Đã hủy',
            ];
            $currentTab = request('tab', $activeTab ?? 'all');
        @endphp
        @foreach($tabDefs as $key => $label)
            <li class="nav-item">
                <a class="nav-link {{ $currentTab === $key ? 'active fw-bold' : '' }}" href="{{ route('admin.orders.index', ['tab' => $key]) }}">
                    {{ $label }}
                    @if(isset($tabCounts[$key]))
                        <span class="badge {{ $currentTab === $key ? 'bg-primary text-white' : 'bg-secondary' }} rounded-pill ms-1">
                            {{ $tabCounts[$key] }}
                        </span>
                    @endif
                </a>
            </li>
        @endforeach
    </ul>

    <!-- Orders Table -->
    <div class="card border-0 shadow-sm rounded-3">
        <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
                <thead class="table-light">
                    <tr>
                        <th class="ps-3">Mã đơn</th>
                        <th>Ngày tạo</th>
                        <th>Khách hàng</th>
                        <th>Sản phẩm</th>
                        <th>Tổng tiền</th>
                        <th>Thanh toán</th>
                        <th>Vận đơn GHN</th>
                        <th>Trạng thái giao</th>
                        <th class="text-end pe-3">Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($orders as $order)
                        @php
                            $o = is_array($order) ? (object)$order : $order;
                            $isDelivering = in_array($o->order_status ?? $o->status, ['shipping', 'delivering', 'picked', 'storing', 'transporting', 'sorting']);
                        @endphp
                        <tr>
                            <td class="ps-3 font-monospace fw-bold text-primary">
                                <a href="{{ route('admin.orders.show', $o->id) }}" class="text-decoration-none">
                                    {{ $o->order_code ?? ('CAM-' . $o->id) }}
                                </a>
                            </td>
                            <td class="small text-muted">
                                {{ isset($o->created_at) ? \Carbon\Carbon::parse($o->created_at)->format('d/m/Y H:i') : '' }}
                            </td>
                            <td>
                                <div class="fw-semibold">{{ $o->customer_name ?? ($o->user->name ?? 'Khách') }}</div>
                                <div class="small text-muted">{{ $o->customer_phone ?? '' }}</div>
                            </td>
                            <td>
                                <span class="badge bg-light text-dark border">
                                    {{ $o->item_count ?? (isset($o->items) ? count($o->items) : 1) }} món
                                </span>
                            </td>
                            <td class="fw-bold text-danger">
                                {{ number_format($o->total_amount ?? 0, 0, ',', '.') }} đ
                            </td>
                            <td>
                                @if(($o->payment_status ?? '') === 'completed' || ($o->payment_status ?? '') === 'paid')
                                    <span class="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">Đã thanh toán</span>
                                @else
                                    <span class="badge bg-warning-subtle text-warning border border-warning-subtle px-2 py-1">Chờ thanh toán</span>
                                @endif
                                <div class="small text-muted mt-0.5">{{ strtoupper($o->payment_method ?? 'COD') }}</div>
                            </td>
                            <td>
                                @if(!empty($o->tracking_code) || !empty($o->ghn_order_code))
                                    <span class="badge bg-info-subtle text-info border border-info-subtle font-monospace px-2 py-1">
                                        {{ $o->tracking_code ?: $o->ghn_order_code }}
                                    </span>
                                @else
                                    <span class="text-muted small">Chưa tạo vận đơn</span>
                                @endif
                            </td>
                            <td>
                                @php
                                    $st = $o->order_status ?? $o->status ?? 'pending';
                                    $color = match($st) {
                                        'pending', 'processing' => 'bg-secondary',
                                        'ready_to_pick', 'picking' => 'bg-info text-dark',
                                        'shipping', 'delivering' => 'bg-warning text-dark',
                                        'delivered', 'completed' => 'bg-success',
                                        'cancelled' => 'bg-danger',
                                        'return', 'returned' => 'bg-dark',
                                        default => 'bg-light text-dark'
                                    };
                                @endphp
                                <span class="badge {{ $color }} px-2 py-1 rounded-pill">{{ $st }}</span>
                            </td>
                            <td class="text-end pe-3">
                                <a href="{{ route('admin.orders.show', $o->id) }}" class="btn btn-sm btn-outline-primary">
                                    <i class="fa-solid fa-eye me-1"></i>Chi tiết
                                </a>
                                @if(!$isDelivering && ($o->order_status ?? $o->status) !== 'cancelled' && ($o->order_status ?? $o->status) !== 'delivered')
                                    <form action="{{ route('admin.orders.update', $o->id) }}" method="POST" class="d-inline ms-1">
                                        @csrf
                                        @method('PUT')
                                        <input type="hidden" name="status" value="cancelled">
                                        <input type="hidden" name="reason" value="Admin hủy đơn">
                                        <button onclick="return confirm('Bạn có chắc chắn muốn hủy đơn hàng này?')" class="btn btn-sm btn-outline-danger" title="Hủy đơn hàng">
                                            <i class="fa-solid fa-ban"></i> Hủy
                                        </button>
                                    </form>
                                @elseif($isDelivering)
                                    <button class="btn btn-sm btn-outline-secondary ms-1" disabled title="Lab 08: Đơn hàng đang giao KHÔNG cho phép Hủy">
                                        <i class="fa-solid fa-lock"></i> Khóa hủy
                                    </button>
                                @endif
                            </td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="9" class="text-center text-muted py-5">
                                Không có đơn hàng nào trong mục này.
                            </td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </div>
</div>
@endsection
