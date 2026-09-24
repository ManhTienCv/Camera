import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import L from 'leaflet';
import {
  Search,
  Crosshair,
  Layers,
  MapPin,
  Check,
  X,
  Loader2,
  Navigation,
  Building,
  Home,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

export interface SelectedLocationData {
  fullAddress: string;
  detailAddress: string;
  administrativeArea: string;
  city: string;
  district: string;
  lat: number;
  lng: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (location: SelectedLocationData) => void;
  initialLat?: number;
  initialLng?: number;
  initialAddress?: string;
}

// Prominent Vietnamese Landmarks Database for Instant Matching
const POPULAR_VN_LANDMARKS = [
  { name: 'Khu Đô Thị Phúc Diễn', address: 'Phúc Diễn, Bắc Từ Liêm', city: 'Hà Nội', district: 'Bắc Từ Liêm', lat: 21.0470, lng: 105.7619 },
  { name: 'Keangnam Landmark 72', address: 'Đường Phạm Hùng, Mễ Trì', city: 'Hà Nội', district: 'Nam Từ Liêm', lat: 21.0168, lng: 105.7838 },
  { name: 'Hồ Hoàn Kiếm', address: 'Phố Đinh Tiên Hoàng, Hàng Trống', city: 'Hà Nội', district: 'Hoàn Kiếm', lat: 21.0285, lng: 105.8542 },
  { name: 'Hồ Tây', address: 'Đường Thanh Niên, Yên Phụ', city: 'Hà Nội', district: 'Tây Hồ', lat: 21.0583, lng: 105.8266 },
  { name: 'Lăng Chủ tịch Hồ Chí Minh', address: 'Số 2 Hùng Vương, Điện Bàn', city: 'Hà Nội', district: 'Ba Đình', lat: 21.0368, lng: 105.8347 },
  { name: 'Vincom Mega Mall Royal City', address: '72A Nguyễn Trãi, Thượng Đình', city: 'Hà Nội', district: 'Thanh Xuân', lat: 21.0028, lng: 105.8155 },
  { name: 'Vincom Mega Mall Times City', address: '458 Minh Khai, Vĩnh Tuy', city: 'Hà Nội', district: 'Hai Bà Trưng', lat: 20.9953, lng: 105.8679 },
  { name: 'Đại học Quốc Gia Hà Nội', address: '144 Xuân Thủy, Dịch Vọng Hậu', city: 'Hà Nội', district: 'Cầu Giấy', lat: 21.0373, lng: 105.7818 },
  { name: 'Đại học Bách Khoa Hà Nội', address: 'Số 1 Đại Cồ Việt, Bách Khoa', city: 'Hà Nội', district: 'Hai Bà Trưng', lat: 21.0044, lng: 105.8436 },
  { name: 'Sân bay Quốc tế Nội Bài', address: 'Phú Cường, Sóc Sơn', city: 'Hà Nội', district: 'Sóc Sơn', lat: 21.2212, lng: 105.8072 },
  { name: 'Chợ Bến Thành', address: 'Đường Lê Lợi, Bến Thành, Quận 1', city: 'TP. Hồ Chí Minh', district: 'Quận 1', lat: 10.7725, lng: 106.6980 },
  { name: 'Landmark 81', address: '720A Điện Biên Phủ, Phường 22, Bình Thạnh', city: 'TP. Hồ Chí Minh', district: 'Bình Thạnh', lat: 10.7950, lng: 106.7218 },
  { name: 'Phố đi bộ Nguyễn Huệ', address: 'Nguyễn Huệ, Bến Nghé, Quận 1', city: 'TP. Hồ Chí Minh', district: 'Quận 1', lat: 10.7735, lng: 106.7037 },
  { name: 'Sân bay Quốc tế Tân Sơn Nhất', address: 'Đường Trường Sơn, Phường 2, Tân Bình', city: 'TP. Hồ Chí Minh', district: 'Tân Bình', lat: 10.8185, lng: 106.6588 },
  { name: 'Nhà thờ Đức Bà', address: '01 Công xã Paris, Bến Nghé, Quận 1', city: 'TP. Hồ Chí Minh', district: 'Quận 1', lat: 10.7798, lng: 106.6990 },
  { name: 'Khu đô thị Phú Mỹ Hưng', address: 'Đường Nguyễn Văn Linh, Tân Phong, Quận 7', city: 'TP. Hồ Chí Minh', district: 'Quận 7', lat: 10.7293, lng: 106.7118 },
  { name: 'Cầu Rồng Đà Nẵng', address: 'Đường Nguyễn Văn Linh, Phước Ninh, Hải Châu', city: 'Đà Nẵng', district: 'Hải Châu', lat: 16.0611, lng: 108.2238 },
  { name: 'Bãi biển Mỹ Khê', address: 'Đường Võ Nguyên Giáp, Phước Mỹ, Sơn Trà', city: 'Đà Nẵng', district: 'Sơn Trà', lat: 16.0601, lng: 108.2464 },
];

export function MapLocationPicker({
  isOpen,
  onClose,
  onConfirm,
  initialLat = 21.0285,
  initialLng = 105.8542,
  initialAddress = '',
}: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const currentTileLayerRef = useRef<L.TileLayer | null>(null);
  const toast = useToast();

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: initialLat,
    lng: initialLng,
  });
  const [mapType, setMapType] = useState<'street' | 'satellite'>('street');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ name: string; lat: number; lng: number; area: string }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);

  const searchWrapperRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Address fields
  const [detailAddress, setDetailAddress] = useState('Phúc Diễn');
  const [administrativeArea, setAdministrativeArea] = useState('Bắc Từ Liêm, Hà Nội');
  const [detectedCity, setDetectedCity] = useState('Hà Nội');
  const [detectedDistrict, setDetectedDistrict] = useState('Bắc Từ Liêm');

  // Reset search state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSearchResults([]);
      setShowSuggestions(false);
      setIsSearching(false);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    }
  }, [isOpen]);

  // Click outside search container to close suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchWrapperRef.current &&
        !searchWrapperRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on Escape Key (closes suggestions first if open, else closes modal)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (showSuggestions) {
          setShowSuggestions(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, showSuggestions]);

  // Reverse Geocoding with Multi-tier Fallback
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    setIsGeocoding(true);
    try {
      // 1. First check if close to any predefined landmarks (< 100m)
      const nearbyLandmark = POPULAR_VN_LANDMARKS.find((lm) => {
        const dLat = Math.abs(lm.lat - lat);
        const dLng = Math.abs(lm.lng - lng);
        return dLat < 0.002 && dLng < 0.002;
      });

      if (nearbyLandmark) {
        setDetailAddress(nearbyLandmark.address);
        setAdministrativeArea(`${nearbyLandmark.district}, ${nearbyLandmark.city}`);
        setDetectedCity(nearbyLandmark.city);
        setDetectedDistrict(nearbyLandmark.district);
        setIsGeocoding(false);
        return;
      }

      // 2. Query Nominatim OpenStreetMap Reverse API
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=vi`,
        { headers: { 'User-Agent': 'CameraHub/1.0' } }
      );

      if (res.ok) {
        const data = await res.json();
        const addr = data.address || {};

        const road = addr.road || addr.street || addr.neighbourhood || addr.suburb || '';
        const houseNumber = addr.house_number || '';
        const quarter = addr.quarter || addr.suburb || addr.village || '';
        const district = addr.city_district || addr.district || addr.county || addr.town || '';
        const city = addr.city || addr.state || addr.province || 'Hà Nội';

        const detail = [houseNumber, road, quarter].filter(Boolean).join(', ') || 'Đang xác định số nhà';
        const admin = [district, city].filter(Boolean).join(', ') || 'Việt Nam';

        setDetailAddress(detail);
        setAdministrativeArea(admin);
        setDetectedCity(city.replace(/^(Thành phố|Tỉnh)\s+/i, ''));
        setDetectedDistrict(district.replace(/^(Quận|Huyện|Thị xã)\s+/i, ''));
      }
    } catch (e) {
      console.warn('Reverse geocode fallback:', e);
      setDetailAddress(`Vị trí toạ độ: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      setAdministrativeArea('Hà Nội, Việt Nam');
    } finally {
      setIsGeocoding(false);
    }
  }, []);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    // Custom Glowing Orange Pin
    const customIcon = L.divIcon({
      className: 'custom-map-pin',
      html: `
        <div class="relative flex items-center justify-center">
          <div class="w-9 h-9 bg-accent-500 rounded-full flex items-center justify-center text-white shadow-[0_4px_12px_rgba(232,93,27,0.55)] border-2 border-white transform -translate-y-3.5 hover:scale-110 transition-transform cursor-grab">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
          </div>
          <div class="absolute -bottom-1 w-3.5 h-1 bg-ink-900/30 rounded-full blur-[1px]"></div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 32],
    });

    // Create map instance
    const map = L.map(mapContainerRef.current, {
      center: [coords.lat, coords.lng],
      zoom: 16,
      zoomControl: true,
    });

    // Google Maps Tile Layer
    const tileUrl =
      mapType === 'satellite'
        ? 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'
        : 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';

    const tileLayer = L.tileLayer(tileUrl, {
      maxZoom: 20,
      attribution: '© Google Maps',
    }).addTo(map);

    currentTileLayerRef.current = tileLayer;

    // Draggable Marker
    const marker = L.marker([coords.lat, coords.lng], {
      icon: customIcon,
      draggable: true,
    }).addTo(map);

    marker.on('dragend', (e) => {
      const pos = e.target.getLatLng();
      setCoords({ lat: pos.lat, lng: pos.lng });
      reverseGeocode(pos.lat, pos.lng);
    });

    map.on('click', (e) => {
      marker.setLatLng(e.latlng);
      setCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
      reverseGeocode(e.latlng.lat, e.latlng.lng);
    });

    mapInstanceRef.current = map;
    markerRef.current = marker;

    // Initial reverse geocode
    reverseGeocode(coords.lat, coords.lng);

    // Invalidate size after modal render
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [isOpen]);

  // Switch Tile Layer (Street vs Satellite)
  const toggleMapType = () => {
    if (!mapInstanceRef.current || !currentTileLayerRef.current) return;
    const nextType = mapType === 'street' ? 'satellite' : 'street';
    setMapType(nextType);

    mapInstanceRef.current.removeLayer(currentTileLayerRef.current);
    const newUrl =
      nextType === 'satellite'
        ? 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'
        : 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';

    const newLayer = L.tileLayer(newUrl, {
      maxZoom: 20,
      attribution: '© Google Maps',
    }).addTo(mapInstanceRef.current);

    currentTileLayerRef.current = newLayer;
  };

  // Get User GPS Position
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.warning('Trình duyệt của bạn không hỗ trợ định vị GPS.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ lat: latitude, lng: longitude });

        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.flyTo([latitude, longitude], 17, { duration: 1.2 });
          markerRef.current.setLatLng([latitude, longitude]);
        }

        reverseGeocode(latitude, longitude);
        setIsLocating(false);
      },
      (error) => {
        console.warn('GPS location error:', error);
        toast.error('Không thể lấy vị trí hiện tại. Vui lòng cho phép quyền truy cập vị trí trên trình duyệt.');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Core Search Execution (Local landmarks + Nominatim OpenStreetMap API)
  const executeSearch = useCallback(async (query: string, signal?: AbortSignal) => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) {
      setSearchResults([]);
      setShowSuggestions(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const lower = trimmed.toLowerCase();
      // 1. Instant local landmark matches
      const localMatches = POPULAR_VN_LANDMARKS.filter(
        (lm) =>
          lm.name.toLowerCase().includes(lower) ||
          lm.address.toLowerCase().includes(lower) ||
          lm.district.toLowerCase().includes(lower) ||
          lm.city.toLowerCase().includes(lower)
      ).map((lm) => ({
        name: lm.name,
        area: `${lm.address}, ${lm.district}, ${lm.city}`,
        lat: lm.lat,
        lng: lm.lng,
      }));

      // 2. Fetch Nominatim OpenStreetMap Search
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          trimmed + ', Vietnam'
        )}&limit=5&accept-language=vi`,
        {
          signal,
          headers: { 'User-Agent': 'CameraHub/1.0' },
        }
      );

      let apiMatches: Array<{ name: string; lat: number; lng: number; area: string }> = [];
      if (res.ok) {
        const data = await res.json();
        apiMatches = data.map((item: any) => ({
          name: item.display_name.split(',')[0],
          area: item.display_name,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
        }));
      }

      // Merge and deduplicate by proximity (< ~100m)
      const combined = [...localMatches];
      for (const apiItem of apiMatches) {
        const exists = combined.some(
          (c) => Math.abs(c.lat - apiItem.lat) < 0.001 && Math.abs(c.lng - apiItem.lng) < 0.001
        );
        if (!exists) {
          combined.push(apiItem);
        }
      }

      setSearchResults(combined);
      setShowSuggestions(true);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.warn('Search suggestions failed:', err);
      }
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search effect: Wait 750ms after user stops typing to avoid spam & delay
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed || trimmed.length < 2) {
      setSearchResults([]);
      setShowSuggestions(false);
      setIsSearching(false);
      return;
    }

    // Indicate searching state while user pauses
    setIsSearching(true);

    const timer = setTimeout(() => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;
      executeSearch(trimmed, controller.signal);
    }, 750);

    return () => {
      clearTimeout(timer);
    };
  }, [searchQuery, executeSearch]);

  // Immediate search on Form Submit (Enter key)
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;
    executeSearch(searchQuery, controller.signal);
  };

  const handleClearSearch = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setSearchQuery('');
    setSearchResults([]);
    setShowSuggestions(false);
    setIsSearching(false);
  };

  const handleSelectSearchResult = (result: { lat: number; lng: number; name: string }) => {
    setCoords({ lat: result.lat, lng: result.lng });
    setShowSuggestions(false);
    setSearchQuery(result.name);

    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.flyTo([result.lat, result.lng], 17, { duration: 1.2 });
      markerRef.current.setLatLng([result.lat, result.lng]);
    }

    reverseGeocode(result.lat, result.lng);
  };

  const handleConfirmLocation = () => {
    const full = `${detailAddress}, ${administrativeArea}`.trim();
    onConfirm({
      fullAddress: full,
      detailAddress,
      administrativeArea,
      city: detectedCity,
      district: detectedDistrict,
      lat: coords.lat,
      lng: coords.lng,
    });
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 w-screen h-screen min-h-[100dvh] z-[99999] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-fade-in overflow-y-auto cursor-pointer"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-ink-900 rounded-3xl shadow-2xl border border-cream-200 dark:border-ink-800 overflow-hidden my-auto flex flex-col cursor-default animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Compact */}
        <div className="px-6 py-3.5 border-b border-cream-100 dark:border-ink-800 flex items-center justify-between bg-cream-50/60 dark:bg-ink-950/60 shrink-0">
          <div>

            <h2 className="font-display font-bold text-lg text-ink-900 dark:text-cream-50 leading-tight">
              Chọn Vị Trí Nhận Hàng Trên Bản Đồ
            </h2>

          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-cream-200 dark:hover:bg-ink-800 text-ink-400 hover:text-ink-900 dark:hover:text-cream-100 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search & Map Toolbar */}
        <div className="relative z-20 p-3 bg-white dark:bg-ink-900 border-b border-cream-100 dark:border-ink-800 shrink-0">
          <div className="flex items-center gap-2">
            {/* Search Input Container with Relative Wrapper for Floating Dropdown */}
            <div ref={searchWrapperRef} className="flex-1 relative">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => {
                    if (searchResults.length > 0 || searchQuery.trim().length >= 2) {
                      setShowSuggestions(true);
                    }
                  }}
                  placeholder="Tìm kiếm địa chỉ, tên đường, toà nhà..."
                  className="w-full pl-9 pr-14 py-2 bg-cream-50/90 dark:bg-ink-950 border border-cream-200 dark:border-ink-700 rounded-xl text-xs focus:outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 text-ink-800 dark:text-cream-50 placeholder:text-ink-400 dark:placeholder:text-ink-500 transition-colors"
                />
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 dark:text-ink-500" />
                
                {/* Search Right Status: Loading spinner & Clear button */}
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  {isSearching && (
                    <Loader2 size={13} className="text-accent-500 animate-spin" />
                  )}
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="w-5 h-5 flex items-center justify-center rounded-full text-ink-400 hover:text-ink-700 dark:hover:text-cream-200 hover:bg-cream-200/60 dark:hover:bg-ink-800 transition-colors cursor-pointer"
                      title="Xoá tìm kiếm"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </form>

              {/* Floating Autocomplete Suggestions Dropdown */}
              {showSuggestions && (
                <div className="absolute left-0 right-0 top-full mt-1.5 z-[1000] bg-white dark:bg-ink-900 border border-cream-200 dark:border-ink-700 rounded-2xl shadow-2xl p-1.5 max-h-56 overflow-y-auto space-y-1">
                  {searchResults.length > 0 ? (
                    searchResults.map((res, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSelectSearchResult(res)}
                        className="w-full flex items-start gap-2.5 p-2 rounded-xl text-left hover:bg-accent-50/80 dark:hover:bg-ink-800/80 transition-all cursor-pointer group"
                      >
                        <div className="w-6 h-6 rounded-lg bg-accent-100 dark:bg-accent-950/60 text-accent-600 dark:text-accent-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                          <MapPin size={13} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-ink-800 dark:text-cream-100 truncate group-hover:text-accent-600 dark:group-hover:text-accent-400 transition-colors">
                            {res.name}
                          </p>
                          <p className="text-[10px] text-ink-400 dark:text-ink-500 truncate">
                            {res.area}
                          </p>
                        </div>
                      </button>
                    ))
                  ) : !isSearching && searchQuery.trim().length >= 2 ? (
                    <div className="px-3 py-3 text-center text-xs text-ink-500 dark:text-ink-400 flex flex-col items-center justify-center gap-1">
                      <MapPin size={16} className="text-ink-300 dark:text-ink-600" />
                      <span>Không tìm thấy gợi ý phù hợp</span>
                      <span className="text-[10px] text-ink-400">Bạn có thể bấm trực tiếp lên bản đồ để chọn vị trí</span>
                    </div>
                  ) : isSearching ? (
                    <div className="px-3 py-3 text-center text-xs text-ink-500 dark:text-ink-400 flex items-center justify-center gap-2">
                      <Loader2 size={13} className="text-accent-500 animate-spin" />
                      <span>Đang tìm kiếm gợi ý địa điểm...</span>
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            {/* My Location Button */}
            <button
              type="button"
              onClick={handleGetCurrentLocation}
              disabled={isLocating}
              className="flex items-center gap-1 px-3 py-2 bg-accent-50 dark:bg-accent-950/60 text-accent-700 dark:text-accent-400 border border-accent-200 dark:border-accent-800/80 rounded-xl text-xs font-bold hover:bg-accent-100 dark:hover:bg-accent-900/60 transition-all cursor-pointer shadow-2xs shrink-0"
            >
              {isLocating ? (
                <Loader2 size={13} className="animate-spin text-accent-600 dark:text-accent-400" />
              ) : (
                <Crosshair size={13} className="text-accent-500" />
              )}
              <span>Vị trí của tôi</span>
            </button>

            {/* Map Type Switcher */}
            <button
              type="button"
              onClick={toggleMapType}
              className="flex items-center gap-1 px-3 py-2 bg-cream-100 dark:bg-ink-800 text-ink-700 dark:text-cream-200 border border-cream-200 dark:border-ink-700 rounded-xl text-xs font-bold hover:bg-cream-200 dark:hover:bg-ink-700 transition-all cursor-pointer shadow-2xs shrink-0"
            >
              <Layers size={13} className="text-ink-500 dark:text-cream-300" />
              <span>{mapType === 'street' ? 'Vệ tinh' : 'Bản đồ'}</span>
            </button>
          </div>
        </div>

        {/* Leaflet Map Area with Floating Badge and Coordinates */}
        <div className="relative h-[220px] sm:h-[250px] w-full bg-cream-100 dark:bg-ink-950 shrink-0">
          <div ref={mapContainerRef} className="w-full h-full" />

          {/* Floating Instruction Pill Top-Left */}
          <div className="absolute top-2.5 left-12 z-[400] bg-white/95 dark:bg-ink-900/95 backdrop-blur-xs px-3 py-1 rounded-full shadow-sm border border-cream-200 dark:border-ink-700 flex items-center gap-1.5 text-[11px] font-bold text-ink-800 dark:text-cream-100 pointer-events-none">
            <Navigation size={12} className="text-accent-500 animate-pulse" />
            <span>Kéo ghim hoặc click trên bản đồ để chọn vị trí</span>
          </div>

          {/* Floating Coordinates Badge Bottom-Right */}
          <div className="absolute bottom-2.5 right-2.5 z-[400] bg-white/90 dark:bg-ink-900/90 backdrop-blur-xs px-2.5 py-0.5 rounded-full shadow-2xs border border-cream-200 dark:border-ink-700 flex items-center gap-1 text-[10px] font-mono text-ink-600 dark:text-cream-200 pointer-events-none">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-500"></span>
            <span>📍 {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}</span>
          </div>
        </div>

        {/* Selected Location Info Panel - Compact & Symmetrical */}
        <div className="p-4 bg-white dark:bg-ink-900 border-t border-cream-200 dark:border-ink-800 space-y-3 shrink-0">
          <div className="bg-accent-50/50 dark:bg-ink-800/80 border border-accent-200/70 dark:border-ink-700 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 bg-accent-500 text-white rounded-full flex items-center justify-center text-[10px] shadow-xs">
                  ✓
                </div>
                <span className="text-[11px] font-bold text-ink-900 dark:text-cream-50 tracking-wide uppercase">
                  THÔNG TIN VỊ TRÍ GIAO HÀNG ĐÃ CHỌN
                </span>
              </div>
              <span className="px-2 py-0.5 bg-accent-50 dark:bg-accent-950/60 text-accent-700 dark:text-accent-400 border border-accent-300 dark:border-accent-800 rounded-full text-[10px] font-bold">
                {isGeocoding ? 'Đang định vị toạ độ...' : 'Vị trí chuẩn xác'}
              </span>
            </div>

            <div className="grid sm:grid-cols-2 gap-2.5">
              <div>
                <label className="flex items-center gap-1 text-[10px] font-bold text-ink-700 dark:text-cream-200 uppercase tracking-wide mb-1">
                  <Home size={12} className="text-accent-500" />
                  <span>ĐỊA CHỈ CHI TIẾT (SỐ NHÀ, TÊN ĐƯỜNG):</span>
                </label>
                <input
                  type="text"
                  value={detailAddress}
                  onChange={(e) => setDetailAddress(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white dark:bg-ink-950 border border-cream-300 dark:border-ink-600 rounded-xl text-xs font-semibold text-ink-900 dark:text-cream-50 focus:outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20"
                  placeholder="Ví dụ: Số 12, Ngõ 139 Phú Diễn"
                />
              </div>

              <div>
                <label className="flex items-center gap-1 text-[10px] font-bold text-ink-700 dark:text-cream-200 uppercase tracking-wide mb-1">
                  <Building size={12} className="text-accent-500" />
                  <span>KHU VỰC HÀNH CHÍNH:</span>
                </label>
                <input
                  type="text"
                  value={administrativeArea}
                  onChange={(e) => setAdministrativeArea(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white dark:bg-ink-950 border border-cream-300 dark:border-ink-600 rounded-xl text-xs font-semibold text-ink-900 dark:text-cream-50 focus:outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20"
                  placeholder="Ví dụ: Phường Phú Diễn, Quận Bắc Từ Liêm, Hà Nội"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons - Always Visible and Prominent */}
          <div className="flex items-center justify-end gap-2.5 pt-0.5">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-full text-xs font-bold text-ink-700 dark:text-cream-200 bg-cream-100 dark:bg-ink-800 hover:bg-cream-200 dark:hover:bg-ink-700 transition-colors cursor-pointer"
            >
              Hủy Bỏ
            </button>
            <button
              type="button"
              onClick={handleConfirmLocation}
              className="flex items-center gap-1.5 px-6 py-2 rounded-full text-xs font-bold text-white bg-accent-500 hover:bg-accent-600 transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <Check size={15} />
              <span>Xác Nhận Dùng Địa Chỉ Này</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
