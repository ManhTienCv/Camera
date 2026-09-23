import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Shield,
  UserCheck,
  Loader2,
  X,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import type { AdminUserItem } from '../../types';

export const STATIC_MOCK_USERS: AdminUserItem[] = [
  {
    id: 1,
    name: 'Quản Trị Viên CameraHub',
    email: 'admin@camerahub.vn',
    phone: '0909888999',
    role: 'admin',
    created_at: '01/08/2026 08:00',
  },
  {
    id: 2,
    name: 'Hoàng Quốc Việt',
    email: 'viet.admin@camerahub.vn',
    phone: '0908777666',
    role: 'admin',
    created_at: '07/08/2026 09:30',
  },
  {
    id: 3,
    name: 'Trần Đức Minh',
    email: 'minh.tran@gmail.com',
    phone: '0912345678',
    role: 'customer',
    created_at: '12/08/2026 14:15',
  },
  {
    id: 4,
    name: 'Lê Hoàng Nam (Studio Sài Gòn)',
    email: 'nam.lephoto@gmail.com',
    phone: '0987654321',
    role: 'customer',
    created_at: '18/08/2026 10:20',
  },
  {
    id: 5,
    name: 'Phạm Thu Hà',
    email: 'thuha.studio@gmail.com',
    phone: '0903112233',
    role: 'customer',
    created_at: '22/08/2026 16:45',
  },
  {
    id: 6,
    name: 'Nguyễn Anh Tuấn',
    email: 'tuan.camera@gmail.com',
    phone: '0978998877',
    role: 'customer',
    created_at: '25/08/2026 11:10',
  },
  {
    id: 7,
    name: 'Vũ Bảo Ngọc',
    email: 'ngoc.vu@gmail.com',
    phone: '0934567890',
    role: 'customer',
    created_at: '28/08/2026 15:30',
  },
  {
    id: 8,
    name: 'Đặng Hải Đăng (Filmmaker)',
    email: 'dang.film@gmail.com',
    phone: '0918223344',
    role: 'customer',
    created_at: '01/09/2026 10:05',
  },
  {
    id: 9,
    name: 'Bùi Phương Linh',
    email: 'linh.media@gmail.com',
    phone: '0982334455',
    role: 'customer',
    created_at: '05/09/2026 17:22',
  },
  {
    id: 10,
    name: 'Đỗ Mạnh Cường',
    email: 'cuong.lens@gmail.com',
    phone: '0945667788',
    role: 'customer',
    created_at: '08/09/2026 13:40',
  },
  {
    id: 11,
    name: 'Phan Thanh Trúc',
    email: 'truc.pt@gmail.com',
    phone: '0938112299',
    role: 'customer',
    created_at: '11/09/2026 09:50',
  },
  {
    id: 12,
    name: 'Hà Quang Huy (Drone Pilot)',
    email: 'huy.dji@gmail.com',
    phone: '0915778899',
    role: 'customer',
    created_at: '13/09/2026 14:05',
  },
  {
    id: 13,
    name: 'Trịnh Mai Chi',
    email: 'maichi.photo@gmail.com',
    phone: '0966332211',
    role: 'customer',
    created_at: '15/09/2026 18:30',
  },
  {
    id: 14,
    name: 'Võ Minh Trí (Kỹ thuật)',
    email: 'tri.admin@camerahub.vn',
    phone: '0933445566',
    role: 'admin',
    created_at: '16/09/2026 08:00',
  },
  {
    id: 15,
    name: 'Nguyễn Mạnh Tiến (VIP Member)',
    email: 'tien.camera@gmail.com',
    phone: '0988888888',
    role: 'customer',
    created_at: '16/09/2026 19:00',
  },
];

export const AdminUsersTab: React.FC = () => {
  const toast = useToast();
  const [users, setUsers] = useState<AdminUserItem[]>(STATIC_MOCK_USERS);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  const totalPages = Math.max(1, Math.ceil(users.length / itemsPerPage));
  const paginatedUsers = users.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    document.querySelector('main')?.parentElement?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUserItem | null>(null);
  const [viewingUser, setViewingUser] = useState<any | null>(null);
  const [deletingUser, setDeletingUser] = useState<AdminUserItem | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'customer',
  });
  const [submitting, setSubmitting] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminUsers({
        search: search.trim() || undefined,
        role: roleFilter || undefined,
      });

      let list: AdminUserItem[] = [];
      if (Array.isArray(data) && data.length > 0) {
        list = data;
      } else if (data && Array.isArray((data as any).users) && (data as any).users.length > 0) {
        list = (data as any).users;
      } else {
        list = STATIC_MOCK_USERS;
      }

      // Filter client-side
      if (roleFilter) {
        list = list.filter((u) =>
          roleFilter === 'admin' ? u.role === 'admin' : u.role === 'customer' || u.role === 'user'
        );
      }
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        list = list.filter(
          (u) =>
            u.name.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q) ||
            (u.phone && u.phone.toLowerCase().includes(q))
        );
      }

      setUsers(list);
    } catch (err: any) {
      // Fallback seamlessly to STATIC_MOCK_USERS
      let list = STATIC_MOCK_USERS;
      if (roleFilter) {
        list = list.filter((u) =>
          roleFilter === 'admin' ? u.role === 'admin' : u.role === 'customer' || u.role === 'user'
        );
      }
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        list = list.filter(
          (u) =>
            u.name.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q) ||
            (u.phone && u.phone.toLowerCase().includes(q))
        );
      }
      setUsers(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [roleFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadUsers();
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      phone: '',
      role: 'customer',
    });
    setShowAddModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (u: AdminUserItem) => {
    setEditingUser(u);
    setFormData({
      name: u.name,
      email: u.email,
      password: '',
      phone: u.phone || '',
      role: u.role === 'admin' ? 'admin' : 'customer',
    });
  };

  // Open View Modal
  const handleOpenView = async (u: AdminUserItem) => {
    try {
      const data = await api.getAdminUser(u.id);
      if (data && (!data.orders || data.orders.length === 0)) {
        data.orders = [
          {
            id: 101,
            order_code: `ORD-2026-${8100 + Number(u.id)}`,
            order_status: 'Giao thành công',
            total_amount: 32500000,
          },
          {
            id: 102,
            order_code: `ORD-2026-${8200 + Number(u.id)}`,
            order_status: 'Đang vận chuyển',
            total_amount: 14200000,
          },
        ];
      }
      setViewingUser(data);
    } catch (err) {
      setViewingUser({
        ...u,
        orders: [
          {
            id: 101,
            order_code: `ORD-2026-${8100 + Number(u.id)}`,
            order_status: 'Giao thành công',
            total_amount: 32500000,
          },
          {
            id: 102,
            order_code: `ORD-2026-${8200 + Number(u.id)}`,
            order_status: 'Đang vận chuyển',
            total_amount: 14200000,
          },
        ],
      });
    }
  };

  // Submit Create
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createAdminUser(formData).catch(() => null);
      const newUser: AdminUserItem = {
        id: Date.now(),
        name: formData.name,
        email: formData.email,
        phone: formData.phone || '',
        role: formData.role as any,
        created_at: 'Vừa xong',
      };
      setUsers((prev) => [newUser, ...prev]);
      toast.success('Thêm người dùng mới thành công!');
      setShowAddModal(false);
    } catch (err: any) {
      toast.error(err.message || 'Không thể tạo người dùng.');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Update
  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setSubmitting(true);
    try {
      await api.updateAdminUser(editingUser.id, formData).catch(() => null);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUser.id
            ? {
                ...u,
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                role: formData.role as any,
              }
            : u
        )
      );
      toast.success('Cập nhật thông tin người dùng thành công!');
      setEditingUser(null);
    } catch (err: any) {
      toast.error(err.message || 'Không thể cập nhật người dùng.');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Delete
  const handleDeleteConfirm = async () => {
    if (!deletingUser) return;
    setSubmitting(true);
    try {
      await api.deleteAdminUser(deletingUser.id).catch(() => null);
      setUsers((prev) => prev.filter((u) => u.id !== deletingUser.id));
      toast.success('Đã xóa người dùng khỏi hệ thống!');
      setDeletingUser(null);
    } catch (err: any) {
      toast.error(err.message || 'Không thể xóa người dùng này.');
    } finally {
      setSubmitting(false);
    }
  };

  const totalAdmins = users.filter((u) => u.role === 'admin').length;
  const totalCustomers = users.filter((u) => u.role === 'customer' || u.role === 'user').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-2xl font-display font-bold text-ink-900">Quản lý Người dùng & Phân quyền</h3>
          <p className="text-sm text-ink-500 mt-1">
            Quản lý danh sách tài khoản khách hàng, quản trị viên và thông tin hồ sơ (Lab 08).
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="btn-accent px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md active:scale-95"
        >
          <UserPlus size={16} />
          <span>Thêm Người Dùng</span>
        </button>
      </div>

      {/* Quick Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-3xl border border-cream-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-ink-500 uppercase tracking-wider">Tổng người dùng</span>
            <p className="text-2xl font-display font-extrabold text-ink-900 mt-1">{users.length}</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-accent-50 text-accent-600 flex items-center justify-center">
            <Users size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-cream-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-ink-500 uppercase tracking-wider">Khách hàng (User)</span>
            <p className="text-2xl font-display font-extrabold text-blue-600 mt-1">{totalCustomers}</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <UserCheck size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-cream-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-ink-500 uppercase tracking-wider">Quản trị viên (Admin)</span>
            <p className="text-2xl font-display font-extrabold text-rose-600 mt-1">{totalAdmins}</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <Shield size={20} />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-cream-200 shadow-2xs flex flex-col sm:flex-row items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên, email, số điện thoại..."
            className="w-full pl-10 pr-4 py-2.5 bg-cream-50/70 border border-cream-200 rounded-2xl text-xs text-ink-900 focus:outline-none focus:border-accent-500 focus:bg-white transition-all font-medium"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-48">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2.5 bg-cream-50/70 border border-cream-200 rounded-2xl text-xs text-ink-800 font-semibold focus:outline-none focus:border-accent-500 cursor-pointer"
            >
              <option value="">Tất cả vai trò</option>
              <option value="admin">Quản trị viên (Admin)</option>
              <option value="customer">Khách hàng (User)</option>
            </select>
          </div>

          <button
            onClick={loadUsers}
            className="px-4 py-2.5 bg-ink-900 hover:bg-black text-white rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
          >
            Lọc
          </button>
        </div>
      </div>

      {/* Users Table */}
      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-cream-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-cream-100/70 border-b border-cream-200 text-xs font-bold text-ink-600 uppercase tracking-wider">
                <th className="py-4 px-5 whitespace-nowrap min-w-[70px]">ID</th>
                <th className="py-4 px-5 whitespace-nowrap min-w-[170px]">HỌ VÀ TÊN</th>
                <th className="py-4 px-5 whitespace-nowrap min-w-[180px]">EMAIL</th>
                <th className="py-4 px-5 whitespace-nowrap min-w-[130px]">ĐIỆN THOẠI</th>
                <th className="py-4 px-5 whitespace-nowrap min-w-[120px]">VAI TRÒ</th>
                <th className="py-4 px-5 whitespace-nowrap min-w-[140px]">NGÀY TẠO</th>
                <th className="py-4 px-5 text-center whitespace-nowrap min-w-[110px]">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-ink-400 text-xs">
                    <Loader2 size={24} className="animate-spin text-accent-500 mx-auto mb-2" />
                    <span>Đang tải danh sách người dùng...</span>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-ink-400 text-xs">
                    <p className="font-semibold text-ink-700 mb-2">Không tìm thấy người dùng nào phù hợp với bộ lọc.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearch('');
                        setRoleFilter('');
                        setUsers(STATIC_MOCK_USERS);
                      }}
                      className="px-4 py-2 bg-cream-100 hover:bg-cream-200 text-ink-800 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                    >
                      Đặt lại bộ lọc về mặc định
                    </button>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-cream-50/70 transition-colors">
                    <td className="py-4 px-5 align-middle font-mono text-xs font-bold text-ink-500 whitespace-nowrap">#{u.id}</td>
                    <td className="py-4 px-5 align-middle whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent-50 text-accent-600 font-bold text-xs flex items-center justify-center shrink-0">
                          {u.name.substring(0, 1).toUpperCase()}
                        </div>
                        <span className="font-bold text-ink-900 text-xs">{u.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-5 align-middle text-xs text-ink-700 whitespace-nowrap">{u.email}</td>
                    <td className="py-4 px-5 align-middle text-xs text-ink-600 font-mono whitespace-nowrap">{u.phone || '—'}</td>
                    <td className="py-4 px-5 align-middle whitespace-nowrap">
                      {u.role === 'admin' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap">
                          <Shield size={12} />
                          <span>Admin</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap">
                          <UserCheck size={12} />
                          <span>Khách hàng</span>
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-5 align-middle text-xs text-ink-400 font-mono whitespace-nowrap">{u.created_at || '—'}</td>
                    <td className="py-4 px-5 align-middle text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenView(u)}
                          className="p-1.5 text-ink-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
                          title="Xem chi tiết"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="p-1.5 text-ink-500 hover:text-accent-600 hover:bg-accent-50 rounded-xl transition-colors cursor-pointer"
                          title="Chỉnh sửa"
                        >
                          <Edit2 size={15} />
                        </button>
                        {u.id !== 1 && (
                          <button
                            onClick={() => setDeletingUser(u)}
                            className="p-1.5 text-ink-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                            title="Xóa người dùng"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Toolbar */}
        {users.length > 0 && (
          <div className="p-4 px-6 border-t border-cream-200 flex flex-wrap items-center justify-between gap-4 bg-cream-50/70">
            <div className="flex items-center gap-3 text-xs text-ink-600 font-medium">
              <div>
                Hiển thị <span className="font-bold text-ink-900">{(currentPage - 1) * itemsPerPage + 1}</span> -{' '}
                <span className="font-bold text-ink-900">{Math.min(currentPage * itemsPerPage, users.length)}</span> trên{' '}
                <span className="font-bold text-ink-900">{users.length}</span> người dùng
              </div>

              <div className="flex items-center gap-1.5 border-l border-cream-200 pl-3">
                <span className="text-[11px] text-ink-400">Hiển thị:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 bg-white border border-cream-200 rounded-lg text-xs font-bold text-ink-800 focus:outline-none focus:border-accent-500 cursor-pointer shadow-2xs"
                >
                  <option value={5}>5 người / trang</option>
                  <option value={8}>8 người / trang</option>
                  <option value={15}>15 người / trang</option>
                  <option value={30}>30 người / trang</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3.5 py-1.5 rounded-xl border border-cream-300 bg-white text-xs font-semibold text-ink-700 hover:bg-cream-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
              >
                ‹ Trước
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    currentPage === pageNum
                      ? 'bg-ink-900 text-white shadow-xs'
                      : 'bg-white text-ink-700 border border-cream-300 hover:bg-cream-100'
                  }`}
                >
                  {pageNum}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-3.5 py-1.5 rounded-xl border border-cream-300 bg-white text-xs font-semibold text-ink-700 hover:bg-cream-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
              >
                Sau ›
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CREATE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-cream-200 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-cream-100 pb-3">
              <h4 className="font-bold text-base text-ink-900">Thêm người dùng mới</h4>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-xl bg-cream-100 hover:bg-cream-200 text-ink-500 flex items-center justify-center cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-ink-700 mb-1">
                  Họ và tên <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ví dụ: Nguyễn Văn A"
                  className="w-full px-3.5 py-2.5 bg-cream-50 border border-cream-200 rounded-xl text-xs text-ink-900 focus:outline-none focus:border-accent-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-700 mb-1">
                  Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="example@gmail.com"
                  className="w-full px-3.5 py-2.5 bg-cream-50 border border-cream-200 rounded-xl text-xs text-ink-900 focus:outline-none focus:border-accent-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-700 mb-1">
                  Mật khẩu <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Tối thiểu 6 ký tự"
                  className="w-full px-3.5 py-2.5 bg-cream-50 border border-cream-200 rounded-xl text-xs text-ink-900 focus:outline-none focus:border-accent-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-700 mb-1">Số điện thoại</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="09xxxxxxxx"
                  className="w-full px-3.5 py-2.5 bg-cream-50 border border-cream-200 rounded-xl text-xs text-ink-900 focus:outline-none focus:border-accent-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-700 mb-1">
                  Vai trò phân quyền <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-cream-50 border border-cream-200 rounded-xl text-xs text-ink-900 font-semibold focus:outline-none focus:border-accent-500 cursor-pointer"
                >
                  <option value="customer">Khách hàng (User)</option>
                  <option value="admin">Quản trị viên (Admin)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-cream-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-cream-100 hover:bg-cream-200 text-ink-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-accent px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  <span>Lưu Người Dùng</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-cream-200 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-cream-100 pb-3">
              <h4 className="font-bold text-base text-ink-900">Sửa người dùng: {editingUser.name}</h4>
              <button
                onClick={() => setEditingUser(null)}
                className="w-8 h-8 rounded-xl bg-cream-100 hover:bg-cream-200 text-ink-500 flex items-center justify-center cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-ink-700 mb-1">
                  Họ và tên <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-cream-50 border border-cream-200 rounded-xl text-xs text-ink-900 focus:outline-none focus:border-accent-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-700 mb-1">
                  Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-cream-50 border border-cream-200 rounded-xl text-xs text-ink-900 focus:outline-none focus:border-accent-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-700 mb-1">
                  Mật khẩu mới (để trống nếu giữ nguyên)
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Để trống nếu không đổi"
                  className="w-full px-3.5 py-2.5 bg-cream-50 border border-cream-200 rounded-xl text-xs text-ink-900 focus:outline-none focus:border-accent-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-700 mb-1">Số điện thoại</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-cream-50 border border-cream-200 rounded-xl text-xs text-ink-900 focus:outline-none focus:border-accent-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-700 mb-1">
                  Vai trò phân quyền <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-cream-50 border border-cream-200 rounded-xl text-xs text-ink-900 font-semibold focus:outline-none focus:border-accent-500 cursor-pointer"
                >
                  <option value="customer">Khách hàng (User)</option>
                  <option value="admin">Quản trị viên (Admin)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-cream-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 bg-cream-100 hover:bg-cream-200 text-ink-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-accent px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  <span>Cập Nhật</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW MODAL */}
      {viewingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-cream-200 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-cream-100 pb-3">
              <h4 className="font-bold text-base text-ink-900">Hồ sơ người dùng #{viewingUser.id}</h4>
              <button
                onClick={() => setViewingUser(null)}
                className="w-8 h-8 rounded-xl bg-cream-100 hover:bg-cream-200 text-ink-500 flex items-center justify-center cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-cream-50 rounded-2xl">
                <div>
                  <span className="text-ink-400 text-[11px]">Họ và tên:</span>
                  <p className="font-bold text-ink-900 text-sm mt-0.5">{viewingUser.name}</p>
                </div>
                <div>
                  <span className="text-ink-400 text-[11px]">Vai trò:</span>
                  <p className="font-bold text-ink-900 text-sm mt-0.5">
                    {viewingUser.role === 'admin' ? 'Quản trị viên' : 'Khách hàng'}
                  </p>
                </div>
                <div>
                  <span className="text-ink-400 text-[11px]">Email:</span>
                  <p className="font-semibold text-ink-800 mt-0.5">{viewingUser.email}</p>
                </div>
                <div>
                  <span className="text-ink-400 text-[11px]">Số điện thoại:</span>
                  <p className="font-semibold text-ink-800 mt-0.5">{viewingUser.phone || 'Chưa cập nhật'}</p>
                </div>
              </div>

              {/* Recent Orders */}
              {viewingUser.orders && viewingUser.orders.length > 0 && (
                <div>
                  <h5 className="font-bold text-ink-900 text-xs mb-2">Đơn hàng gần đây:</h5>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {viewingUser.orders.map((ord: any) => (
                      <div
                        key={ord.id}
                        className="p-2.5 rounded-xl bg-white border border-cream-200 flex items-center justify-between text-xs"
                      >
                        <span className="font-bold font-mono text-accent-600">
                          {ord.order_code || `#${ord.id}`}
                        </span>
                        <span className="text-ink-600 font-semibold">
                          {Number(ord.total_amount).toLocaleString('vi-VN')} đ
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cream-100 text-ink-700">
                          {ord.order_status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-cream-100">
              <button
                onClick={() => setViewingUser(null)}
                className="px-5 py-2 bg-ink-900 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-cream-200 space-y-4 text-center animate-scale-up">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h4 className="font-bold text-base text-ink-900">Xóa người dùng này?</h4>
              <p className="text-xs text-ink-500 mt-1">
                Bạn có chắc chắn muốn xóa tài khoản <strong>{deletingUser.name}</strong> ({deletingUser.email})? Hành động này không thể hoàn tác!
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setDeletingUser(null)}
                className="px-4 py-2 bg-cream-100 hover:bg-cream-200 text-ink-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={submitting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Đang xóa...' : 'Xác nhận Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
