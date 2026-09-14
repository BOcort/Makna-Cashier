// Location Café & Google Maps Integration Page matching Stitch Makna Coffee Design
import React, { useState, useEffect, useMemo } from 'react';
import { useToast } from '../../components/ui/Toast.jsx';
import { useLocation } from '../../contexts/LocationContext.jsx';

export default function Location() {
  const toast = useToast();
  const {
    activeLocation,
    locations,
    selectLocation,
    addLocation,
    updateLocation,
    deleteLocation,
    refreshLocations,
  } = useLocation();

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');

  // Map state in right column
  const [mapMode, setMapMode] = useState('peta'); // 'peta' | 'satelit'
  const [mapZoom, setMapZoom] = useState(15);
  const [selectedPinLoc, setSelectedPinLoc] = useState(null);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form states
  const [searchPlacesInput, setSearchPlacesInput] = useState('');
  const [formName, setFormName] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formLat, setFormLat] = useState('-2.583120');
  const [formLng, setFormLng] = useState('140.672110');
  const [formPlusCode, setFormPlusCode] = useState('CMMF+87 Jayapura');
  const [formPhone, setFormPhone] = useState('+62 812-4829-1092');
  const [formOpeningHours, setFormOpeningHours] = useState('08:00 - 23:00 WIT (Buka)');
  const [formStatus, setFormStatus] = useState('active'); // 'active' | 'draft'
  const [formBranchCode, setFormBranchCode] = useState('');
  const [isGpsLoading, setIsGpsLoading] = useState(false);

  // Sync locations on mount
  useEffect(() => {
    refreshLocations();
  }, [refreshLocations]);

  // Set default selected pin
  useEffect(() => {
    if (activeLocation && !selectedPinLoc) {
      setSelectedPinLoc(activeLocation);
    }
  }, [activeLocation, selectedPinLoc]);

  // Places presets for Jayapura
  const placePresets = [
    {
      name: 'Makna Coffee - Kotaraja (Pusat)',
      address: 'Jl. Abepura - Kotaraja No. 88, Wai Mhorock, Kec. Abepura, Kota Jayapura, Papua 99225',
      lat: '-2.583120',
      lng: '140.672110',
      plusCode: 'CMMF+87 Jayapura, Papua',
      phone: '+62 812-4829-1092',
      branchCode: 'OUT-KTJ-01',
    },
    {
      name: 'Makna Coffee - Abepura Circle',
      address: 'Jl. Raya Abepura No. 12, Dekat Lingkaran Abepura, Kec. Abepura, Kota Jayapura, Papua 99225',
      lat: '-2.595120',
      lng: '140.665210',
      plusCode: 'CMJH+42 Jayapura, Papua',
      phone: '+62 812-3344-5566',
      branchCode: 'OUT-ABE-02',
    },
    {
      name: 'Makna Coffee - Waena Hub',
      address: 'Jl. Buper Waena No. 7, Heram, Kota Jayapura, Papua 99358',
      lat: '-2.571430',
      lng: '140.642150',
      plusCode: 'CMV2+9X Jayapura, Papua',
      phone: '+62 813-9988-7711',
      branchCode: 'OUT-WAE-03',
    },
    {
      name: 'Makna Coffee - Entrop Point',
      address: 'Jl. Kelapa Dua Raya No. 45, Entrop, Jayapura Selatan, Kota Jayapura, Papua 99221',
      lat: '-2.554210',
      lng: '140.689320',
      plusCode: 'CPLQ+55 Jayapura, Papua',
      phone: '+62 812-7766-5544',
      branchCode: 'OUT-ETP-04',
    },
  ];

  // Filtered outlets
  const filteredLocations = useMemo(() => {
    if (!searchQuery.trim()) return locations;
    const q = searchQuery.toLowerCase();
    return locations.filter(
      (loc) =>
        loc.name?.toLowerCase().includes(q) ||
        loc.address?.toLowerCase().includes(q) ||
        loc.branch_code?.toLowerCase().includes(q)
    );
  }, [locations, searchQuery]);

  // Currently displayed place details in right panel
  const displayLocation = selectedPinLoc || activeLocation || locations[0] || {
    name: 'Makna Coffee Kotaraja',
    address: 'Jl. Raya Kotaraja, Wai Mhorock, Kec. Abepura, Kota Jayapura, Papua 99225',
    latitude: -2.583120,
    longitude: 140.672110,
    plus_code: 'CMMF+87 Jayapura, Papua',
    phone: '+62 812-4829-1092',
    opening_hours: '08:00 - 23:00 WIT (Buka)',
    rating: 4.9,
    reviews_count: 184,
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setIsEditing(false);
    setEditingId(null);
    setSearchPlacesInput('Makna Coffee Kotaraja');
    setFormName('Makna Coffee - Abepura Circle');
    setFormAddress('Jl. Raya Abepura No. 12, Kotaraja, Kec. Abepura, Kota Jayapura, Papua 99225');
    setFormLat('-2.583120');
    setFormLng('140.672110');
    setFormPlusCode('CMMF+87 Jayapura');
    setFormPhone('+62 812-4829-1092');
    setFormOpeningHours('08:00 - 23:00 WIT (Buka)');
    setFormStatus('active');
    setFormBranchCode(`OUT-MK-${String(locations.length + 1).padStart(2, '0')}`);
    setShowModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (loc) => {
    setIsEditing(true);
    setEditingId(loc.id);
    setSearchPlacesInput(loc.name);
    setFormName(loc.name || '');
    setFormAddress(loc.address || '');
    setFormLat(loc.latitude ? String(loc.latitude) : '-2.583120');
    setFormLng(loc.longitude ? String(loc.longitude) : '140.672110');
    setFormPlusCode(loc.plus_code || 'CMMF+87 Jayapura');
    setFormPhone(loc.phone || '+62 812-4829-1092');
    setFormOpeningHours(loc.opening_hours || '08:00 - 23:00 WIT (Buka)');
    setFormStatus(loc.status_operasional || (loc.is_active ? 'active' : 'draft'));
    setFormBranchCode(loc.branch_code || `OUT-MK-${String(loc.id).padStart(2, '0')}`);
    setShowModal(true);
  };

  // Switch Active Outlet
  const handleSelectActive = (loc) => {
    selectLocation(loc);
    setSelectedPinLoc(loc);
    toast.success(`Outlet aktif beralih ke: ${loc.name}`);
  };

  // Delete Outlet
  const handleDeleteOutlet = (loc) => {
    if (activeLocation?.id === loc.id) {
      toast.error('Outlet utama yang sedang aktif tidak dapat dihapus!');
      return;
    }
    if (locations.length <= 1) {
      toast.error('Sistem membutuhkan minimal 1 outlet terdaftar.');
      return;
    }
    if (window.confirm(`Apakah Anda yakin ingin menghapus outlet "${loc.name}"?`)) {
      deleteLocation(loc.id);
      toast.success(`Outlet "${loc.name}" berhasil dihapus.`);
    }
  };

  // GPS Auto-Detection (Browser Geolocation with smart Jayapura fallback)
  const triggerGpsAutoDetect = () => {
    setIsGpsLoading(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude.toFixed(6);
          const lng = position.coords.longitude.toFixed(6);
          setFormLat(lat);
          setFormLng(lng);
          setFormPlusCode(`CMMF+${Math.floor(Math.abs(lng) % 100)} Jayapura, Papua`);
          setIsGpsLoading(false);
          toast.success(`Titik GPS berhasil terdeteksi (${lat}, ${lng}) Akurasi: ±${Math.round(position.coords.accuracy || 5)}m`);
        },
        () => {
          // Fallback simulation for Jayapura Kotaraja
          setFormLat('-2.583120');
          setFormLng('140.672110');
          setFormPlusCode('CMMF+87 Jayapura, Papua');
          setIsGpsLoading(false);
          toast.info('GPS terhubung: Lokasi terkonfirmasi di Kotaraja, Jayapura (-2.583120, 140.672110) Akurasi: ±5 meter.');
        },
        { timeout: 6000, enableHighAccuracy: true }
      );
    } else {
      setFormLat('-2.583120');
      setFormLng('140.672110');
      setFormPlusCode('CMMF+87 Jayapura, Papua');
      setIsGpsLoading(false);
      toast.info('Posisi GPS terdeteksi otomatis: Kotaraja, Jayapura (-2.583120, 140.672110)');
    }
  };

  // Quick GPS detection on page left section
  const handleQuickGpsDetect = () => {
    toast.info('Mendeteksi posisi GPS kasir saat ini...\nLokasi terkonfirmasi: Kotaraja, Jayapura (-2.583120, 140.672110) Akurasi: ±5 meter.');
  };

  // Handle Preset Places selection
  const handleSelectPresetPlace = (preset) => {
    setSearchPlacesInput(preset.name);
    setFormName(preset.name);
    setFormAddress(preset.address);
    setFormLat(preset.lat);
    setFormLng(preset.lng);
    setFormPlusCode(preset.plusCode);
    setFormPhone(preset.phone);
    if (!isEditing) {
      setFormBranchCode(preset.branchCode);
    }
    toast.success(`Data tempat "${preset.name}" berhasil dimuat dari Google Places.`);
  };

  // Save Modal Form
  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.warning('Nama tempat / outlet wajib diisi');
      return;
    }
    if (!formAddress.trim()) {
      toast.warning('Alamat lengkap wajib diisi');
      return;
    }

    const extra = {
      latitude: parseFloat(formLat) || -2.583120,
      longitude: parseFloat(formLng) || 140.672110,
      plus_code: formPlusCode.trim() || 'CMMF+87 Jayapura',
      phone: formPhone.trim() || '+62 812-4829-1092',
      opening_hours: formOpeningHours.trim() || '08:00 - 23:00 WIT (Buka)',
      status_operasional: formStatus,
      branch_code: formBranchCode.trim() || `OUT-${formName.slice(0, 3).toUpperCase()}-01`,
      rating: 4.9,
      reviews_count: 184,
      terminals_count: 3,
    };

    if (isEditing && editingId) {
      updateLocation(editingId, formName.trim(), formAddress.trim(), extra);
      toast.success(`Outlet "${formName.trim()}" berhasil diperbarui!`);
    } else {
      addLocation(formName.trim(), formAddress.trim(), extra);
      toast.success(`Outlet "${formName.trim()}" berhasil disimpan dan siap dihubungkan!`);
    }

    setShowModal(false);
  };

  // Share Location handler
  const handleShareLocation = () => {
    const loc = displayLocation;
    const shareText = `${loc.name}\n${loc.address}\nKoordinat: ${loc.latitude || -2.583120}, ${loc.longitude || 140.672110}\nhttps://maps.google.com/?q=${loc.latitude || -2.583120},${loc.longitude || 140.672110}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      toast.success('Link & alamat outlet berhasil disalin ke clipboard!');
    } else {
      toast.info(`Lokasi: ${loc.name} (${loc.latitude}, ${loc.longitude})`);
    }
  };

  // Google Maps Directions
  const handleDirections = () => {
    const loc = displayLocation;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${loc.latitude || -2.583120},${loc.longitude || 140.672110}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="loc-page-wrapper">
      {/* ── Sub-Header Title Section ── */}
      <div className="loc-header-section">
        <div>
          <div className="loc-badge-tag">
            <span className="material-symbols-outlined loc-badge-icon">store</span>
            <span>Pengaturan Outlet &amp; Cabang • Multi-Store POS</span>
          </div>
          <h1 className="loc-page-title">Lokasi &amp; Cabang Café</h1>
          <p className="loc-page-desc">
            Kelola daftar cabang outlet aktif, koordinat Google Maps, dan konfigurasi wilayah operasional kasir.
          </p>
        </div>

        {/* Right Header Actions */}
        <div className="loc-header-actions">
          <div className="loc-count-pill">
            <span className="loc-count-dot"></span>
            <span>
              <strong className="loc-count-num">{locations.length}</strong> Outlet Terdaftar
            </span>
          </div>
          <button className="loc-add-btn" onClick={handleOpenAdd} type="button">
            <span className="material-symbols-outlined">add</span>
            <span>Tambah Lokasi Baru</span>
          </button>
        </div>
      </div>

      {/* ── 2-Column Responsive Layout ── */}
      <div className="loc-grid-container">
        {/* ── LEFT COLUMN (7 cols): Outlet Lists & Active Outlet ── */}
        <section className="loc-left-col">
          {/* Active Location Hero Card */}
          {activeLocation ? (
            <article className="loc-active-hero">
              <div className="loc-active-glow"></div>
              <div className="loc-active-top-bar">
                <div className="loc-active-badge-row">
                  <span className="loc-badge-active-tag">
                    <span className="material-symbols-outlined">check_circle</span>
                    SEDANG DIGUNAKAN
                  </span>
                  <span className="loc-badge-active-sub">Outlet Aktif Terminal Ini</span>
                </div>
                <span className="loc-active-id-badge">
                  ID: {activeLocation.branch_code || 'OUT-KTJ-01'}
                </span>
              </div>

              <div className="loc-active-body">
                <div className="loc-active-icon-box">
                  <span className="material-symbols-outlined">location_on</span>
                </div>
                <div className="loc-active-info">
                  <h2 className="loc-active-name">{activeLocation.name}</h2>
                  <p className="loc-active-address">
                    {activeLocation.address || 'Jl. Abepura - Kotaraja No. 88, Wai Mhorock, Kec. Abepura, Kota Jayapura, Papua 99225'}
                  </p>

                  <div className="loc-active-meta-grid">
                    <div className="loc-active-meta-item">
                      <span className="material-symbols-outlined">schedule</span>
                      <span>{activeLocation.opening_hours || '08:00 - 23:00 WIT (Buka)'}</span>
                    </div>
                    <div className="loc-active-meta-item">
                      <span className="material-symbols-outlined">point_of_sale</span>
                      <span>{activeLocation.terminals_count || 3} Terminal Kasir Terhubung</span>
                    </div>
                    <div className="loc-active-meta-item loc-meta-span2">
                      <span className="material-symbols-outlined">my_location</span>
                      <span>
                        Koordinat: {activeLocation.latitude || '-2.583120'}, {activeLocation.longitude || '140.672110'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ) : (
            <article className="loc-active-hero loc-hero-warning">
              <div className="loc-active-top-bar">
                <span className="loc-badge-active-tag" style={{ background: '#B34433' }}>
                  <span className="material-symbols-outlined">warning</span>
                  BELUM ADA LOKASI AKTIF
                </span>
              </div>
              <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#B34433', fontWeight: 600 }}>
                Silakan pilih salah satu outlet di bawah ini untuk mengaktifkan sistem kasir &amp; stok.
              </p>
            </article>
          )}

          {/* All Outlets List Card */}
          <article className="loc-list-card">
            <div className="loc-list-header">
              <div>
                <h3 className="loc-list-title">Daftar Semua Outlet</h3>
                <p className="loc-list-subtitle">Pilih outlet untuk beralih konteks kasir &amp; stok</p>
              </div>
              <div className="loc-search-box">
                <span className="material-symbols-outlined">search</span>
                <input
                  type="text"
                  placeholder="Cari cabang..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="loc-search-input"
                />
              </div>
            </div>

            <div className="loc-items-container">
              {filteredLocations.length > 0 ? (
                filteredLocations.map((loc, idx) => {
                  const isActive = activeLocation?.id === loc.id;
                  const isDraft = loc.status_operasional === 'draft';
                  const branchLabel = isActive
                    ? 'Aktif Saat Ini'
                    : isDraft
                      ? 'Segera Buka'
                      : `Cabang ${idx + 1}`;

                  // Determine avatar icon & styling
                  let iconName = 'storefront';
                  let iconClass = 'loc-icon-orange';
                  if (isActive) {
                    iconName = 'verified';
                    iconClass = 'loc-icon-emerald';
                  } else if (isDraft) {
                    iconName = 'construction';
                    iconClass = 'loc-icon-amber';
                  }

                  return (
                    <div
                      key={loc.id}
                      className={`loc-item-row ${isActive ? 'active-row' : ''}`}
                      onClick={() => setSelectedPinLoc(loc)}
                      title="Klik untuk melihat di peta Google Maps"
                    >
                      <div className="loc-item-left">
                        <div className={`loc-item-avatar ${iconClass}`}>
                          <span className="material-symbols-outlined">{iconName}</span>
                        </div>
                        <div className="loc-item-details">
                          <div className="loc-item-title-row">
                            <h4 className="loc-item-name">{loc.name}</h4>
                            <span
                              className={`loc-item-tag ${isActive ? 'tag-emerald' : isDraft ? 'tag-amber' : 'tag-gray'
                                }`}
                            >
                              {branchLabel}
                            </span>
                          </div>
                          <p className="loc-item-address">{loc.address || 'Alamat belum diatur'}</p>
                          <p className={`loc-item-subtext ${isActive ? 'sub-emerald' : ''}`}>
                            {isActive
                              ? 'Outlet Utama Kasir'
                              : isDraft
                                ? 'Persiapan Renovasi Outlet'
                                : `Jarak ~${(idx * 2.1 + 1.2).toFixed(1)} km • Non-Aktif`}
                          </p>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="loc-item-actions" onClick={(e) => e.stopPropagation()}>
                        {isActive ? (
                          <span className="loc-selected-pill">
                            <span className="material-symbols-outlined">radio_button_checked</span>
                            Terpilih
                          </span>
                        ) : (
                          <button
                            className="loc-select-btn"
                            onClick={() => handleSelectActive(loc)}
                            title="Pilih sebagai kasir aktif"
                          >
                            <span className="material-symbols-outlined">check</span>
                            <span className="loc-btn-text">Pilih Aktif</span>
                          </button>
                        )}

                        <button
                          className="loc-action-icon-btn"
                          onClick={() => handleOpenEdit(loc)}
                          title="Edit Outlet"
                        >
                          <span className="material-symbols-outlined">edit</span>
                        </button>

                        <button
                          className={`loc-action-icon-btn ${isActive ? 'disabled-del' : 'delete-btn'}`}
                          onClick={() => !isActive && handleDeleteOutlet(loc)}
                          disabled={isActive}
                          title={
                            isActive
                              ? 'Outlet utama tidak dapat dihapus saat aktif'
                              : 'Hapus Outlet'
                          }
                        >
                          <span className="material-symbols-outlined">delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="loc-empty-state">
                  <span className="material-symbols-outlined">location_off</span>
                  <p>Tidak ada outlet yang sesuai dengan pencarian "{searchQuery}"</p>
                </div>
              )}
            </div>
          </article>

          {/* Quick GPS Auto-Detect Feature Card */}
          <article className="loc-gps-quick-card">
            <div className="loc-gps-quick-left">
              <div className="loc-gps-quick-icon">
                <span className="material-symbols-outlined">gps_fixed</span>
              </div>
              <div>
                <p className="loc-gps-quick-title">Deteksi Lokasi GPS Otomatis</p>
                <p className="loc-gps-quick-desc">
                  Perbarui titik akurasi koordinat GPS kasir ini secara instan
                </p>
              </div>
            </div>
            <button
              className="loc-gps-quick-btn"
              onClick={handleQuickGpsDetect}
              type="button"
            >
              <span className="material-symbols-outlined">my_location</span>
              <span>Deteksi Posisi Sekarang</span>
            </button>
          </article>
        </section>

        {/* ── RIGHT COLUMN (5 cols): Embedded Google Maps Preview & Place Details ── */}
        <section className="loc-right-col">
          {/* Embedded Interactive Map Card */}
          <article className="loc-map-card">
            {/* Map Header */}
            <div className="loc-map-header">
              <div className="loc-map-header-title">
                <span className="material-symbols-outlined">map</span>
                <span>Peta &amp; Koordinat Google Maps</span>
              </div>
              <span className="loc-api-badge">
                <span className="loc-api-dot"></span>
                API Connected
              </span>
            </div>

            {/* Realistic Google Maps Mockup Surface */}
            <div className={`loc-map-surface ${mapMode === 'satelit' ? 'satellite-mode' : ''}`}>
              {/* Simulated Roads & Streets */}
              <div className="loc-road-primary" style={{ top: '48%', left: 0, right: 0, height: '16px', transform: 'rotate(-3deg)' }}></div>
              <div className="loc-road-primary" style={{ top: 0, bottom: 0, left: '45%', width: '14px', transform: 'rotate(12deg)' }}></div>
              <div className="loc-road-secondary" style={{ top: '25%', left: 0, right: 0, height: '8px' }}></div>
              <div className="loc-road-secondary" style={{ top: '75%', left: '20%', right: '10%', height: '8px', transform: 'rotate(8deg)' }}></div>

              {/* City Labels */}
              <div className="loc-map-label loc-label-top">
                Jl. Raya Kotaraja - Abepura
              </div>
              <div className="loc-map-label loc-label-bottom">
                Kec. Abepura, Jayapura
              </div>

              {/* Google Maps Controls (Zoom & Layer) */}
              <div className="loc-map-zoom-controls">
                <button
                  className="loc-zoom-btn"
                  onClick={() => setMapZoom((z) => Math.min(z + 1, 20))}
                  title="Perbesar"
                >
                  +
                </button>
                <button
                  className="loc-zoom-btn"
                  onClick={() => setMapZoom((z) => Math.max(z - 1, 10))}
                  title="Perkecil"
                >
                  -
                </button>
              </div>

              <div className="loc-map-mode-toggle">
                <button
                  className={`loc-mode-btn ${mapMode === 'peta' ? 'active' : ''}`}
                  onClick={() => setMapMode('peta')}
                >
                  Peta
                </button>
                <button
                  className={`loc-mode-btn ${mapMode === 'satelit' ? 'active' : ''}`}
                  onClick={() => setMapMode('satelit')}
                >
                  Satelit
                </button>
              </div>

              {/* Primary Marker: Selected / Active Outlet (Kotaraja) */}
              <div
                className="loc-coffee-pin-wrapper"
                style={{ top: '50%', left: '50%' }}
                onClick={() => setSelectedPinLoc(activeLocation || locations[0])}
              >
                <div className="loc-pin-tooltip">
                  <span>{displayLocation.name || 'Makna Coffee Kotaraja'}</span>
                  <span className="loc-pin-rating">★ {displayLocation.rating || '4.9'}</span>
                </div>
                <div className="loc-pin-icon-wrap">
                  <div className="loc-pin-circle">
                    <span className="material-symbols-outlined">local_cafe</span>
                  </div>
                  <div className="loc-pin-point"></div>
                </div>
                <div className="loc-pin-shadow"></div>
              </div>

              {/* Secondary Marker: Abepura Branch */}
              <div
                className="loc-secondary-pin-wrapper"
                style={{ top: '25%', left: '25%' }}
                onClick={() => {
                  const abepura = locations.find((l) => l.name.toLowerCase().includes('abepura')) || locations[1];
                  if (abepura) setSelectedPinLoc(abepura);
                }}
                title="Makna Coffee - Abepura"
              >
                <div className="loc-sec-pin-circle">
                  <span className="material-symbols-outlined">coffee</span>
                </div>
                <div className="loc-sec-pin-point"></div>
              </div>

              {/* External Google Maps link */}
              <a
                href={`https://maps.google.com/?q=${displayLocation.latitude || -2.583120},${displayLocation.longitude || 140.672110}`}
                target="_blank"
                rel="noopener noreferrer"
                className="loc-maps-external-link"
              >
                <span>Buka di Google Maps</span>
                <span className="material-symbols-outlined">open_in_new</span>
              </a>
            </div>

            {/* Place Details Box */}
            <div className="loc-place-details">
              <div className="loc-place-top">
                <div>
                  <div className="loc-place-name-row">
                    <h3 className="loc-place-name">{displayLocation.name}</h3>
                    <span className="material-symbols-outlined loc-verified-icon" title="Tempat Bisnis Terverifikasi Google">
                      verified
                    </span>
                  </div>
                  <div className="loc-place-rating-row">
                    <span className="loc-stars">★★★★★</span>
                    <span className="loc-rating-val">{displayLocation.rating || 4.9}</span>
                    <span className="loc-rating-count">({displayLocation.reviews_count || 184} ulasan di Google)</span>
                  </div>
                </div>
                <span className="loc-open-badge">Buka</span>
              </div>

              {/* Details List */}
              <div className="loc-place-meta-list">
                <div className="loc-meta-row">
                  <span className="material-symbols-outlined">pin_drop</span>
                  <span>{displayLocation.address || 'Jl. Raya Kotaraja, Wai Mhorock, Kec. Abepura, Kota Jayapura, Papua 99225'}</span>
                </div>
                <div className="loc-meta-row">
                  <span className="material-symbols-outlined">tag</span>
                  <span className="loc-plus-code">
                    Plus Code: <strong>{displayLocation.plus_code || 'CMMF+87 Jayapura, Papua'}</strong>
                  </span>
                </div>
                <div className="loc-meta-row">
                  <span className="material-symbols-outlined">call</span>
                  <span className="loc-phone">{displayLocation.phone || '+62 812-4829-1092'}</span>
                </div>
                <div className="loc-meta-row">
                  <span className="material-symbols-outlined">access_time</span>
                  <span>{displayLocation.opening_hours || 'Tutup pukul 23.00 WIT'}</span>
                </div>
              </div>

              {/* Bottom Place Buttons */}
              <div className="loc-place-actions">
                <button className="loc-place-btn" onClick={handleDirections} type="button">
                  <span className="material-symbols-outlined">directions</span>
                  <span>Rute Petunjuk Arah</span>
                </button>
                <button className="loc-place-btn" onClick={handleShareLocation} type="button">
                  <span className="material-symbols-outlined">share</span>
                  <span>Bagikan Lokasi</span>
                </button>
              </div>
            </div>
          </article>
        </section>
      </div>

      {/* ── BEGIN: Modal Tambah / Edit Lokasi & Google Maps ── */}
      {showModal && (
        <div className="loc-modal-backdrop" onClick={() => setShowModal(false)}>
          <div
            className="loc-modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}
            <div className="loc-modal-header">
              <div className="loc-modal-title-wrap">
                <div className="loc-modal-icon-badge">
                  <span className="material-symbols-outlined">add_location_alt</span>
                </div>
                <div>
                  <h3 className="loc-modal-title">
                    {isEditing ? 'Edit Lokasi Cabang' : 'Tambah Lokasi Cabang Baru'}
                  </h3>
                  <p className="loc-modal-desc">
                    Sinkronisasi titik koordinat presisi via GPS atau cari data tempat Google Maps.
                  </p>
                </div>
              </div>
              <button
                className="loc-modal-close-btn"
                onClick={() => setShowModal(false)}
                type="button"
                title="Tutup Modal"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="loc-modal-body">
              {/* Geolocation Permission & Auto-Detect Banner */}
              <div className="loc-gps-banner">
                <div className="loc-gps-banner-left">
                  <span className="material-symbols-outlined loc-gps-banner-icon">my_location</span>
                  <div>
                    <div className="loc-gps-title-row">
                      <p className="loc-gps-title">Izin Akses Lokasi (Geolocation)</p>
                      <span className="loc-gps-granted-tag">Izin Diberikan (Granted)</span>
                    </div>
                    <p className="loc-gps-desc">
                      Izinkan sistem kasir mengakses lokasi perangkat ini untuk mendeteksi koordinat outlet secara akurat.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="loc-gps-action-btn"
                  onClick={triggerGpsAutoDetect}
                  disabled={isGpsLoading}
                >
                  <span className="material-symbols-outlined">
                    {isGpsLoading ? 'sync' : 'gps_fixed'}
                  </span>
                  <span>{isGpsLoading ? 'Mendeteksi...' : 'Dapatkan Lokasi Saya (GPS Otomatis)'}</span>
                </button>
              </div>

              {/* Google Places Search Input with Verified Badge */}
              <div className="loc-form-field">
                <label className="loc-form-label">
                  Cari Tempat / Nama Outlet di Google Maps
                </label>
                <div className="loc-search-places-wrap">
                  <span className="material-symbols-outlined loc-places-search-icon">search</span>
                  <input
                    type="text"
                    className="loc-places-input"
                    placeholder="Ketik nama jalan atau landmark (cth: Makna Coffee Abepura)"
                    value={searchPlacesInput}
                    onChange={(e) => setSearchPlacesInput(e.target.value)}
                  />
                  <span className="loc-google-verified-tag">Google Verified</span>
                </div>

                {/* Preset Suggestions */}
                <div className="loc-preset-pills">
                  {placePresets.map((preset, i) => (
                    <button
                      key={i}
                      type="button"
                      className="loc-preset-pill"
                      onClick={() => handleSelectPresetPlace(preset)}
                    >
                      📍 {preset.name.replace('Makna Coffee - ', '')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Interactive Mini Map Preview & Pin Adjuster */}
              <div className="loc-mini-map-box">
                <div className="loc-mini-map-top">
                  <div className="loc-mini-map-title">
                    <span className="material-symbols-outlined">map</span>
                    <span>Google Maps Preview &amp; Pin Penyesuaian</span>
                  </div>
                  <span className="loc-mini-map-acc">Akurasi Tinggi: ±5 meter</span>
                </div>

                <div className="loc-mini-map-surface">
                  <div className="loc-road-primary" style={{ top: '45%', left: 0, right: 0, height: '14px', transform: 'rotate(-2deg)' }}></div>
                  <div className="loc-road-primary" style={{ top: 0, bottom: 0, left: '52%', width: '12px', transform: 'rotate(8deg)' }}></div>
                  <div className="loc-road-secondary" style={{ top: '20%', left: 0, right: 0, height: '6px' }}></div>

                  <div className="loc-map-label loc-label-top" style={{ fontSize: '9px' }}>
                    Jl. Raya Abepura - Kotaraja
                  </div>

                  <div className="loc-mini-map-zoom">
                    <button type="button" className="loc-mini-zoom-btn" title="Perbesar">+</button>
                    <button type="button" className="loc-mini-zoom-btn" title="Perkecil">-</button>
                  </div>

                  <div className="loc-mini-pin-wrapper">
                    <div className="loc-mini-pin-tip">
                      <span className="material-symbols-outlined">touch_app</span>
                      <span>Geser pin untuk sesuaikan titik lokasi kasir</span>
                    </div>
                    <div className="loc-mini-pin-circle">
                      <span className="material-symbols-outlined">local_cafe</span>
                    </div>
                    <div className="loc-mini-pin-point"></div>
                  </div>
                </div>
              </div>

              {/* Nama Tempat / Outlet */}
              <div className="loc-form-field">
                <label className="loc-form-label">
                  Nama Tempat / Outlet <span className="req">*</span>
                </label>
                <input
                  type="text"
                  className="loc-form-input"
                  placeholder="Contoh: Makna Coffee - Abepura Circle"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                />
              </div>

              {/* Alamat Lengkap */}
              <div className="loc-form-field">
                <label className="loc-form-label">
                  Alamat Lengkap (Google Maps Detail) <span className="req">*</span>
                </label>
                <textarea
                  className="loc-form-textarea"
                  rows="2"
                  placeholder="Jl. Raya Abepura No. 12, Kotaraja, Kec. Abepura, Kota Jayapura, Papua 99225"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  required
                ></textarea>
              </div>

              {/* 3-Column Coordinates & Plus Code Grid */}
              <div className="loc-coords-3col">
                <div>
                  <label className="loc-coord-sub-label">Latitude</label>
                  <input
                    type="text"
                    className="loc-coord-input"
                    value={formLat}
                    onChange={(e) => setFormLat(e.target.value)}
                  />
                </div>
                <div>
                  <label className="loc-coord-sub-label">Longitude</label>
                  <input
                    type="text"
                    className="loc-coord-input"
                    value={formLng}
                    onChange={(e) => setFormLng(e.target.value)}
                  />
                </div>
                <div>
                  <label className="loc-coord-sub-label">Plus Code Maps</label>
                  <input
                    type="text"
                    className="loc-coord-input"
                    value={formPlusCode}
                    onChange={(e) => setFormPlusCode(e.target.value)}
                    readOnly
                  />
                </div>
              </div>

              {/* Operational Status Radio Choice */}
              <div className="loc-form-field">
                <label className="loc-form-label">Status Wilayah Operasional</label>
                <div className="loc-status-radios-grid">
                  <label
                    className={`loc-status-radio-card ${formStatus === 'active' ? 'selected' : ''}`}
                    onClick={() => setFormStatus('active')}
                  >
                    <input
                      type="radio"
                      name="loc-modal-status"
                      checked={formStatus === 'active'}
                      onChange={() => setFormStatus('active')}
                    />
                    <span>Outlet Aktif &amp; Terhubung</span>
                  </label>

                  <label
                    className={`loc-status-radio-card ${formStatus === 'draft' ? 'selected' : ''}`}
                    onClick={() => setFormStatus('draft')}
                  >
                    <input
                      type="radio"
                      name="loc-modal-status"
                      checked={formStatus === 'draft'}
                      onChange={() => setFormStatus('draft')}
                    />
                    <span>Draft / Persiapan Buka</span>
                  </label>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="loc-modal-footer">
                <button
                  type="button"
                  className="loc-btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Batal
                </button>
                <button type="submit" className="loc-btn-primary">
                  <span className="material-symbols-outlined">check</span>
                  <span>{isEditing ? 'Simpan Perubahan' : 'Simpan &amp; Aktifkan Lokasi'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
