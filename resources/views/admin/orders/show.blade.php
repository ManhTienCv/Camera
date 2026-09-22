@extends('layouts.admin')

@section('title', 'Chi tiết đơn hàng ' . ($order->order_code ?? ('#'.$order->id)))

@section('content')
<div class="container-fluid" style="max-width: 1000px;">
    <div class="d-flex align-items-center justify-content-between mb-4">
        <div class="d-flex align-items-center">
            <a href="{{ route('admin.orders.index') }}" class="btn btn-outline-secondary btn-sm me-3">
                <i class="fa-solid fa-arrow-left"></i> Quay lại
            </a>
            <h2 class="h3 fw-bold text-dark mb-0">Đơn hàng {{ $order->order_code ?? ('#'.$order->id) }}</h2>
        </div>
        <div>
            @php
                $isDelivering = in_array($order->order_status, ['shipping', 'delivering', 'picked', 'storing', 'transporting', 'sorting']);
            @endphp
            @if($isDelivering)
                <span class="badge bg-warning text-dark p-2">
                    <i class="fa-solid fa-truck-fast me-1"></i>Đơn đang giao (Quy tắc Lab 08: KHÔNG cho phép Hủy)
                </span>
            @endif
        </div>
    </div>

    <div class="row g-4 mb-4">
        <div class="col-md-6">
            <div class="card border-0 shadow-sm rounded-3 h-100 p-4 bg-white">
                <h5 class="fw-bold mb-3 border-bottom pb-2">Thông tin khách hàng</h5>
                <p class="mb-1"><strong>Họ tên:</strong> {{ $order->customer_name }}</p>
                <p class="mb-1"><strong>Email:</strong> {{ $order->customer_email }}</p>
                <p class="mb-1"><strong>Điện thoại:</strong> {{ $order->customer_phone }}</p>
                <p class="mb-1"><strong>Địa chỉ nhận:</strong> {{ $order->shipping_address }}, {{ $order->city }}</p>
            </div>
        </div>

        <div class="col-md-6">
            <div class="card border-0 shadow-sm rounded-3 h-100 p-4 bg-white">
                <h5 class="fw-bold mb-3 border-bottom pb-2">Thông tin thanh toán & Vận đơn</h5>
                <p class="mb-1"><strong>Phương thức:</strong> {{ strtoupper($order->payment_method) }}</p>
                <p class="mb-1"><strong>Trạng thái thanh toán:</strong> 
                    <span class="badge {{ $order->payment_status === 'completed' ? 'bg-success' : 'bg-warning text-dark' }}">
                        {{ $order->payment_status }}
                    </span>
                </p>
                <p class="mb-1"><strong>Mã vận đơn GHN:</strong> 
                    <span class="font-monospace fw-bold text-primary">{{ $order->tracking_code ?: ($order->ghn_order_code ?: 'Chưa tạo') }}</span>
                </p>
                <p class="mb-1"><strong>Trạng thái đơn:</strong> 
                    <span class="badge bg-dark">{{ $order->order_status }}</span>
                </p>
                @if($order->cancel_reason)
                    <p class="mb-1 text-danger"><strong>Lý do hủy:</strong> {{ $order->cancel_reason }}</p>
                @endif
            </div>
        </div>
    </div>

    <!-- Product Items -->
    <div class="card border-0 shadow-sm rounded-3 mb-4">
        <div class="card-header bg-white py-3 border-bottom">
            <h5 class="card-title fw-bold mb-0">Danh sách sản phẩm</h5>
        </div>
        <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
                <thead class="table-light">
                    <tr>
                        <th class="ps-3">Sản phẩm</th>
                        <th class="text-end">Đơn giá</th>
                        <th class="text-center">Số lượng</th>
                        <th class="text-end pe-3">Thành tiền</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($order->items as $item)
                        <tr>
                            <td class="ps-3">
                                <div class="d-flex align-items-center">
                                    @if($item->image_url)
                                        <img src="{{ $item->image_url }}" alt="" class="rounded me-3" style="width: 48px; height: 48px; object-fit: cover;">
                                    @endif
                                    <div>
                                        <div class="fw-semibold">{{ $item->name }}</div>
                                        <div class="small text-muted">Mã SP: #{{ $item->product_id }}</div>
                                    </div>
                                </div>
                            </td>
                            <td class="text-end">{{ number_format($item->price, 0, ',', '.') }} đ</td>
                            <td class="text-center fw-bold">{{ $item->quantity }}</td>
                            <td class="text-end pe-3 fw-bold text-danger">{{ number_format($item->price * $item->quantity, 0, ',', '.') }} đ</td>
                        </tr>
                    @endforeach
                    <tr class="table-light">
                        <td colspan="3" class="text-end fw-bold ps-3">Tổng giá trị đơn hàng:</td>
                        <td class="text-end pe-3 fw-bold fs-5 text-danger">{{ number_format($order->total_amount, 0, ',', '.') }} đ</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>

    <!-- Status change form -->
    <div class="card border-0 shadow-sm rounded-3 p-4 bg-white">
        <h5 class="fw-bold mb-3">Cập nhật trạng thái đơn hàng</h5>
        <form action="{{ route('admin.orders.update', $order->id) }}" method="POST" class="row g-3 align-items-center">
            @csrf
            @method('PUT')
            <div class="col-md-6">
                <select name="status" class="form-select">
                    <option value="pending" @selected($order->order_status === 'pending')>Chờ xử lý (pending)</option>
                    <option value="ready_to_pick" @selected($order->order_status === 'ready_to_pick')>Chờ lấy hàng (ready_to_pick)</option>
                    <option value="picking" @selected($order->order_status === 'picking')>Đang lấy hàng (picking)</option>
                    <option value="shipping" @selected($order->order_status === 'shipping' || $order->order_status === 'delivering')>Đang giao hàng (shipping/delivering)</option>
                    <option value="delivered" @selected($order->order_status === 'delivered')>Giao thành công (delivered)</option>
                    <option value="completed" @selected($order->order_status === 'completed')>Hoàn tất (completed)</option>
                    @if(!$isDelivering)
                        <option value="cancelled" @selected($order->order_status === 'cancelled')>Hủy đơn hàng (cancelled)</option>
                    @endif
                </select>
            </div>
            <div class="col-md-6">
                <button type="submit" class="btn btn-primary px-4">
                    <i class="fa-solid fa-check me-1"></i>Lưu trạng thái
                </button>
                @if($isDelivering)
                    <span class="text-muted small ms-2"><i class="fa-solid fa-triangle-exclamation text-warning"></i> Lab 08: Không thể hủy đơn đang giao</span>
                @endif
            </div>
        </form>
    </div>
</div>
@endsection
