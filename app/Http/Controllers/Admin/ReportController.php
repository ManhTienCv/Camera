<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    /**
     * Lấy danh sách các đơn hàng đã thanh toán hợp lệ (không bị hủy, hoàn)
     */
    private function paidOrders(): Builder
    {
        return Order::query()->where('orders.created_at', '<=', now())
            ->where('orders.order_status', '!=', 'cancelled')
            ->where(function ($q) {
                $q->where('orders.payment_status', 'completed')
                    ->orWhere('orders.payment_status', 'paid')
                    ->orWhereIn('orders.order_status', ['shipping', 'delivered', 'completed'])
                    ->orWhereExists(function ($sub) {
                        $sub->select(DB::raw(1))
                            ->from('payment_transactions')
                            ->whereColumn('payment_transactions.order_id', 'orders.id')
                            ->where('payment_transactions.status', 'paid');
                    });
            });
    }

    /**
     * Thống kê doanh thu theo danh mục sản phẩm
     */
    private function categoryRevenue(): Collection
    {
        return DB::table('order_items')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->leftJoin('categories', 'products.category_id', '=', 'categories.id')
            ->whereIn('order_items.order_id', $this->paidOrders()->select('orders.id'))
            ->select('products.category_id', 'categories.name as category_name')
            ->selectRaw('COALESCE(SUM(order_items.price * order_items.quantity), 0) as total_revenue, COALESCE(SUM(order_items.quantity), 0) as total_qty')
            ->groupBy('products.category_id', 'categories.name')
            ->orderByDesc('total_revenue')->get();
    }

    /**
     * Thống kê doanh thu theo từng ngày
     */
    private function dailyRevenue(): Collection
    {
        return $this->paidOrders()
            ->selectRaw('DATE(orders.created_at) as date, SUM(total_amount) as total_revenue, COUNT(*) as order_count')
            ->groupByRaw('DATE(orders.created_at)')->orderBy('date')->get();
    }

    /**
     * Tổng hợp doanh thu theo chu kỳ (Tháng, Năm)
     */
    private function periodRevenue(Collection $days, string $period): Collection
    {
        return $days->groupBy(fn ($day) => substr($day->date, 0, $period === 'month' ? 7 : 4))
            ->map(fn (Collection $rows, $key) => (object) [
                $period => (string) $key,
                'total_revenue' => (float) $rows->sum('total_revenue'),
                'order_count' => (int) $rows->sum('order_count'),
            ])->values();
    }

    /**
     * Thống kê top sản phẩm bán chạy nhất
     */
    private function topSellingProducts(int $limit = 5): Collection
    {
        return DB::table('order_items')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->whereIn('order_items.order_id', $this->paidOrders()->select('orders.id'))
            ->select('products.id', 'products.name', 'products.image_url', 'products.price')
            ->selectRaw('COALESCE(SUM(order_items.quantity), 0) as sold_qty, COALESCE(SUM(order_items.price * order_items.quantity), 0) as total_revenue')
            ->groupBy('products.id', 'products.name', 'products.image_url', 'products.price')
            ->orderByDesc('sold_qty')
            ->limit($limit)
            ->get();
    }

    /**
     * Bảng số liệu báo cáo (100% Real Data từ CSDL)
     */
    public function index(Request $request)
    {
        $categoryRevenue = $this->categoryRevenue();
        $totalOrders = Order::count();
        $totalCustomers = DB::table('users')->where('role', '!=', 'admin')->count();
        $revenueByDate = $this->dailyRevenue();
        $revenueByMonth = $this->periodRevenue($revenueByDate, 'month');
        $revenueByYear = $this->periodRevenue($revenueByDate, 'year');
        $totalRevenue = (float) $this->paidOrders()->sum('total_amount');
        $topSellingProducts = $this->topSellingProducts();

        $data = compact(
            'categoryRevenue', 'totalOrders', 'totalCustomers', 'totalRevenue',
            'revenueByDate', 'revenueByMonth', 'revenueByYear', 'topSellingProducts'
        );
        $data['isMock'] = false;

        if ($request->wantsJson() || $request->is('api/*')) {
            return response()->json($data);
        }

        if (view()->exists('admin.reports.index')) {
            return view('admin.reports.index', $data);
        }

        return response()->json($data);
    }

    /**
     * Dữ liệu biểu đồ báo cáo (100% Real Data từ CSDL)
     */
    public function charts(Request $request)
    {
        $categories = $this->categoryRevenue();
        $catLabels = $categories->map(fn ($row) => $row->category_name ?? 'Danh mục #'.$row->category_id)->all();
        $catRevenue = $categories->pluck('total_revenue')->map(fn ($value) => (float) $value)->all();

        $daily = $this->dailyRevenue();
        $byDate = $daily->keyBy('date');
        $byMonth = $this->periodRevenue($daily, 'month')->keyBy('month');
        $byYear = $this->periodRevenue($daily, 'year');

        $startDay = Carbon::now()->startOfDay()->subDays(29);
        $startMonth = Carbon::now()->startOfMonth()->subMonths(11);

        $revDateLabels = $revDateData = $revMonthLabels = $revMonthData = [];

        for ($i = 0; $i < 30; $i++) {
            $date = $startDay->copy()->addDays($i)->toDateString();
            $revDateLabels[] = Carbon::parse($date)->format('d/m');
            $revDateData[] = (float) ($byDate->get($date)?->total_revenue ?? 0);
        }

        for ($i = 0; $i < 12; $i++) {
            $month = $startMonth->copy()->addMonths($i);
            $revMonthLabels[] = $month->format('m/Y');
            $revMonthData[] = (float) ($byMonth->get($month->format('Y-m'))?->total_revenue ?? 0);
        }

        $revYearLabels = $byYear->pluck('year')->all();
        $revYearData = $byYear->pluck('total_revenue')->map(fn ($value) => (float) $value)->all();

        $momoRev = (float) $this->paidOrders()->where('payment_method', 'momo')->sum('total_amount');
        $codRev = (float) $this->paidOrders()->where('payment_method', 'cod')->sum('total_amount');
        $vietqrRev = (float) $this->paidOrders()->whereIn('payment_method', ['vietqr', 'bank_transfer'])->sum('total_amount');

        $paymentMethodLabels = ['Ví MoMo', 'Tiền mặt (COD)', 'VietQR'];
        $paymentMethodRevenue = [$momoRev, $codRev, $vietqrRev];

        $chartData = compact(
            'catLabels', 'catRevenue', 'revDateLabels', 'revDateData',
            'revMonthLabels', 'revMonthData', 'revYearLabels', 'revYearData',
            'paymentMethodLabels', 'paymentMethodRevenue'
        );
        $chartData['isMock'] = false;

        if ($request->wantsJson() || $request->is('api/*')) {
            return response()->json($chartData);
        }

        if (view()->exists('admin.reports.charts')) {
            return view('admin.reports.charts', $chartData);
        }

        return response()->json($chartData);
    }
}
