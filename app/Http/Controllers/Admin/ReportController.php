<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

use Illuminate\Support\Facades\Cache;

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
     * Bảng số liệu báo cáo (100% Real Data từ CSDL, có cache thông minh 30s)
     */
    public function index(Request $request)
    {
        if ($request->boolean('refresh')) {
            Cache::forget('admin_reports_index_data');
        }

        $data = Cache::remember('admin_reports_index_data', 30, function () {
            $categoryRevenue = $this->categoryRevenue();
            $totalOrders = Order::count();
            $totalCustomers = DB::table('users')->where('role', '!=', 'admin')->count();
            $revenueByDate = $this->dailyRevenue();
            $revenueByMonth = $this->periodRevenue($revenueByDate, 'month');
            $revenueByYear = $this->periodRevenue($revenueByDate, 'year');
            $totalRevenue = (float) $this->paidOrders()->sum('total_amount');
            $topSellingProducts = $this->topSellingProducts();

            return compact(
                'categoryRevenue', 'totalOrders', 'totalCustomers', 'totalRevenue',
                'revenueByDate', 'revenueByMonth', 'revenueByYear', 'topSellingProducts'
            );
        });

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
     * Dữ liệu biểu đồ báo cáo (100% Real Data từ CSDL, có cache thông minh 30s)
     */
    public function charts(Request $request)
    {
        if ($request->boolean('refresh')) {
            Cache::forget('admin_reports_charts_data');
        }

        $chartData = Cache::remember('admin_reports_charts_data', 30, function () {
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

            $paymentRevenues = $this->paidOrders()
                ->select('payment_method', DB::raw('SUM(total_amount) as total'))
                ->groupBy('payment_method')
                ->pluck('total', 'payment_method');

            $momoRev = (float) ($paymentRevenues->get('momo') ?? 0);
            $codRev = (float) ($paymentRevenues->get('cod') ?? 0);
            $vietqrRev = (float) (($paymentRevenues->get('vietqr') ?? 0) + ($paymentRevenues->get('bank_transfer') ?? 0));

            $paymentMethodLabels = ['Ví MoMo', 'Tiền mặt (COD)', 'VietQR'];
            $paymentMethodRevenue = [$momoRev, $codRev, $vietqrRev];

            return compact(
                'catLabels', 'catRevenue', 'revDateLabels', 'revDateData',
                'revMonthLabels', 'revMonthData', 'revYearLabels', 'revYearData',
                'paymentMethodLabels', 'paymentMethodRevenue'
            );
        });

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
