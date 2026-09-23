import React from 'react';
import { MapPin, Plus, Edit3, Trash2 } from 'lucide-react';
import type { Address } from '../../types';

interface ProfileAddressesTabProps {
  addresses: Address[];
  loadingAddresses: boolean;
  onOpenAddAddress: () => void;
  onOpenEditAddress: (addr: Address) => void;
  onDeleteAddress: (id: string) => void;
  onSetDefaultAddress: (addr: Address) => void;
}

export const ProfileAddressesTab: React.FC<ProfileAddressesTabProps> = ({
  addresses,
  loadingAddresses,
  onOpenAddAddress,
  onOpenEditAddress,
  onDeleteAddress,
  onSetDefaultAddress,
}) => {
  return (
    <div className="bg-white dark:bg-ink-900 rounded-3xl border border-cream-200 dark:border-ink-800 p-6 sm:p-8 shadow-xs space-y-6 animate-fade-in transition-colors">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-cream-100 dark:border-ink-800">
        <div>
          <div className="flex items-center gap-2">
            <MapPin size={20} className="text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-display font-bold text-xl text-ink-900 dark:text-cream-50">
              Sổ Địa Chỉ Giao Hàng & Ghim Bản Đồ
            </h3>
          </div>
          <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">
            Lưu nhiều địa chỉ để tự động điền nhanh khi mua hàng & giao hỏa tốc GHN
          </p>
        </div>

        <button
          onClick={onOpenAddAddress}
          className="btn-accent px-5 py-2.5 rounded-2xl shadow-sm flex items-center gap-2 text-xs font-bold active:scale-95 transition-all cursor-pointer"
        >
          <Plus size={16} />
          <span>Thêm Địa Chỉ Mới</span>
        </button>
      </div>

      {loadingAddresses ? (
        <div className="p-12 text-center text-ink-400 dark:text-ink-500">Đang tải danh sách địa chỉ...</div>
      ) : addresses.length === 0 ? (
        <div className="p-12 text-center space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-cream-100 dark:bg-ink-800 text-cream-400 dark:text-ink-500 flex items-center justify-center mx-auto">
            <MapPin size={32} />
          </div>
          <p className="font-bold text-ink-800 dark:text-cream-100">Chưa có địa chỉ nhận hàng nào</p>
          <p className="text-xs text-ink-400 dark:text-ink-500 max-w-sm mx-auto">
            Hãy thêm địa chỉ giao hàng để đặt mua máy ảnh và phụ kiện dễ dàng hơn
          </p>
          <button
            onClick={onOpenAddAddress}
            className="btn-accent px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
          >
            + Thêm địa chỉ đầu tiên
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`p-5 rounded-2xl border transition-all shadow-2xs ${
                addr.isDefault
                  ? 'border-accent-500 ring-2 ring-accent-500/10 bg-white dark:bg-ink-800'
                  : 'border-cream-200 dark:border-ink-700 hover:border-cream-300 dark:hover:border-ink-600 bg-cream-50/50 dark:bg-ink-800/40'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-bold text-sm text-ink-900 dark:text-cream-50">{addr.label}</h4>
                    {addr.isDefault && (
                      <span className="text-[10px] font-bold text-accent-700 dark:text-accent-300 bg-accent-50 dark:bg-accent-950/60 border border-accent-200 dark:border-accent-800 px-2 py-0.5 rounded-full">
                        Mặc định
                      </span>
                    )}
                  </div>

                  <p className="text-xs font-semibold text-ink-800 dark:text-cream-100">
                    {addr.recipientName} • <span className="font-normal text-ink-500 dark:text-ink-400">{addr.phone}</span>
                  </p>

                  <p className="text-xs text-ink-600 dark:text-cream-300 mt-1 line-clamp-2">
                    {addr.address}, {addr.city}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-3">
                  <button
                    onClick={() => onOpenEditAddress(addr)}
                    className="p-2 rounded-xl bg-white dark:bg-ink-800 hover:bg-cream-100 dark:hover:bg-ink-700 border border-cream-200 dark:border-ink-700 text-ink-600 dark:text-cream-200 hover:text-ink-900 dark:hover:text-cream-50 transition-colors cursor-pointer"
                    title="Chỉnh sửa"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={() => onDeleteAddress(addr.id)}
                    className="p-2 rounded-xl bg-white dark:bg-ink-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-cream-200 dark:border-ink-700 text-ink-600 dark:text-cream-200 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                    title="Xóa"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {!addr.isDefault && (
                <div className="mt-3 pt-3 border-t border-cream-100 dark:border-ink-700 flex justify-end">
                  <button
                    onClick={() => onSetDefaultAddress(addr)}
                    className="text-xs font-bold text-accent-600 dark:text-accent-400 hover:text-accent-700 cursor-pointer"
                  >
                    Thiết lập làm mặc định
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
