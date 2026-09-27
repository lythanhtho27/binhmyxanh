document.addEventListener('DOMContentLoaded', () => {
  // ==========================================
  // 1. CHUYỂN TABS TRONG MODAL THÊM & SỬA
  // ==========================================
  document.querySelectorAll('.admin-modal-tabs').forEach(tabGroup => {
    tabGroup.querySelectorAll('.modal-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        const modal = btn.closest('.modal-content');

        modal.querySelectorAll('.modal-tab-btn').forEach(b => b.classList.remove('active'));
        modal.querySelectorAll('.modal-tab-pane').forEach(p => p.classList.remove('active'));

        btn.classList.add('active');
        const targetPane = modal.querySelector('#' + targetId);
        if (targetPane) targetPane.classList.add('active');
      });
    });
  });

  function resetModalTabs(modal) {
    if (!modal) return;
    const firstTabBtn = modal.querySelector('.modal-tab-btn');
    if (firstTabBtn) {
      firstTabBtn.click();
    }
  }

  // ==========================================
  // 2. MODAL THÊM SẢN PHẨM & XỬ LÝ HÌNH ẢNH
  // ==========================================
  const addModal = document.getElementById('add-product-modal');
  const openAddBtn = document.getElementById('btn-open-add-product');
  const closeAddBtns = document.querySelectorAll('.close-add-modal');
  const addDropzone = document.getElementById('add-dropzone-trigger');
  const addFileInput = document.getElementById('add-image-file');
  const addPreviewImg = document.getElementById('add-preview-img');
  const addFileStatus = document.getElementById('add-file-status');
  const addUrlInput = document.getElementById('add-image-url');
  const btnAddPreviewUrl = document.getElementById('btn-add-preview-url');

  if (openAddBtn && addModal) {
    openAddBtn.addEventListener('click', () => {
      resetModalTabs(addModal);
      updatePriceTag('add-price', 'add-price-preview');
      updatePriceTag('add-original-price', 'add-orig-price-preview');
      const addFeatured = document.getElementById('add-featured');
      const addNew = document.getElementById('add-new');
      if (addFeatured) syncToggleCard('card-add-featured', addFeatured);
      if (addNew) syncToggleCard('card-add-new', addNew);
      addModal.style.display = 'flex';
    });
  }

  closeAddBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (addModal) addModal.style.display = 'none';
    });
  });

  // Kích hoạt chọn file từ máy tính (Thêm mới)
  if (addDropzone && addFileInput) {
    addDropzone.addEventListener('click', () => addFileInput.click());
    addFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const objectUrl = URL.createObjectURL(file);
        if (addPreviewImg) addPreviewImg.src = objectUrl;
        if (addFileStatus) addFileStatus.innerHTML = `<i class="fa-solid fa-check-circle" style="color: #2e7d32;"></i> Đã chọn file: <strong>${file.name}</strong>`;
      }
    });
  }

  // Cập nhật live preview khi nhập link URL (Thêm mới)
  if (addUrlInput && addPreviewImg) {
    const updateAddPreview = () => {
      const url = addUrlInput.value.trim();
      if (url) {
        addPreviewImg.src = url;
        if (addFileInput) addFileInput.value = '';
        if (addFileStatus) addFileStatus.textContent = 'Bấm để tải ảnh từ máy tính lên';
      }
    };
    addUrlInput.addEventListener('input', updateAddPreview);
    if (btnAddPreviewUrl) btnAddPreviewUrl.addEventListener('click', updateAddPreview);
  }

  // ==========================================
  // HELPER: ĐỊNH DẠNG TIỀN TỆ VNĐ & THẺ CHỌN
  // ==========================================
  function formatVND(value) {
    if (!value || isNaN(value)) return null;
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  }

  function updatePriceTag(inputId, previewId) {
    const input = document.getElementById(inputId);
    const tag = document.getElementById(previewId);
    if (!input || !tag) return;
    const val = Number(input.value);
    if (val && val > 0) {
      tag.style.display = 'inline-flex';
      const span = tag.querySelector('span');
      if (span) span.textContent = formatVND(val);
    } else {
      tag.style.display = 'none';
    }
  }

  function syncToggleCard(cardId, checkbox) {
    const card = document.getElementById(cardId);
    if (!card || !checkbox) return;
    card.classList.toggle('active', !!checkbox.checked);
  }

  // Tương tác chạm thẻ chọn nổi bật / mới
  document.querySelectorAll('.feature-toggle-card').forEach(card => {
    card.addEventListener('click', (e) => {
      const checkbox = card.querySelector('input[type="checkbox"]');
      if (!checkbox) return;
      if (e.target !== checkbox) {
        checkbox.checked = !checkbox.checked;
      }
      card.classList.toggle('active', checkbox.checked);
    });
  });

  // Lắng nghe sự kiện gõ giá để preview live
  [
    { input: 'edit-price', preview: 'edit-price-preview' },
    { input: 'edit-original-price', preview: 'edit-orig-price-preview' },
    { input: 'add-price', preview: 'add-price-preview' },
    { input: 'add-original-price', preview: 'add-orig-price-preview' }
  ].forEach(item => {
    const el = document.getElementById(item.input);
    if (el) {
      el.addEventListener('input', () => updatePriceTag(item.input, item.preview));
    }
  });

  // ==========================================
  // 3. MODAL SỬA SẢN PHẨM & XỬ LÝ HÌNH ẢNH
  // ==========================================
  const editModal = document.getElementById('edit-product-modal');
  const closeEditBtns = document.querySelectorAll('.close-edit-modal');
  const editForm = document.getElementById('edit-product-form');
  const editDropzone = document.getElementById('edit-dropzone-trigger');
  const editFileInput = document.getElementById('edit-image-file');
  const editPreviewImg = document.getElementById('edit-preview-img');
  const editFileStatus = document.getElementById('edit-file-status');
  const editUrlInput = document.getElementById('edit-image');
  const btnEditPreviewUrl = document.getElementById('btn-edit-preview-url');

  document.querySelectorAll('.btn-open-edit-product').forEach(btn => {
    btn.addEventListener('click', () => {
      const dataStr = btn.getAttribute('data-product');
      if (!dataStr) return;
      const product = JSON.parse(dataStr);

      editForm.action = `/admin/products/edit/${product.id}`;
      document.getElementById('edit-name').value = product.name || '';
      document.getElementById('edit-category').value = product.category_id || '';
      
      // Xóa phần thập phân .00 thừa trong giá tiền VNĐ
      const cleanPrice = product.price ? Math.round(Number(product.price)) : '';
      const cleanOrigPrice = product.original_price ? Math.round(Number(product.original_price)) : '';
      document.getElementById('edit-price').value = cleanPrice;
      document.getElementById('edit-original-price').value = cleanOrigPrice;
      updatePriceTag('edit-price', 'edit-price-preview');
      updatePriceTag('edit-original-price', 'edit-orig-price-preview');

      // Hiển thị mã ID trên header modal
      const badgeId = document.getElementById('edit-badge-id');
      if (badgeId) badgeId.textContent = `#${product.id}`;

      document.getElementById('edit-unit').value = product.unit || 'kg';
      document.getElementById('edit-stock').value = product.stock || '';
      document.getElementById('edit-origin').value = product.origin || '';
      document.getElementById('edit-harvest-date').value = product.harvest_date || '';
      document.getElementById('edit-shelf-life').value = product.shelf_life || '';
      document.getElementById('edit-certification').value = product.certification || '';
      
      // Xử lý hình ảnh ban đầu
      const currentImg = product.image || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80';
      if (editUrlInput) editUrlInput.value = currentImg;
      if (editPreviewImg) editPreviewImg.src = currentImg;
      if (editFileInput) editFileInput.value = '';
      if (editFileStatus) editFileStatus.textContent = 'Bấm để thay ảnh mới từ máy tính';

      document.getElementById('edit-short-desc').value = product.short_description || '';
      document.getElementById('edit-desc').value = product.description || '';
      document.getElementById('edit-nutrition').value = product.nutrition_info || '';
      document.getElementById('edit-storage').value = product.storage_guide || '';
      
      // Đồng bộ trạng thái thẻ toggle
      const editFeatured = document.getElementById('edit-featured');
      const editNew = document.getElementById('edit-new');
      if (editFeatured) {
        editFeatured.checked = !!product.is_featured;
        syncToggleCard('card-edit-featured', editFeatured);
      }
      if (editNew) {
        editNew.checked = !!product.is_new;
        syncToggleCard('card-edit-new', editNew);
      }

      resetModalTabs(editModal);
      editModal.style.display = 'flex';
    });
  });

  closeEditBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (editModal) editModal.style.display = 'none';
    });
  });

  // Kích hoạt chọn file từ máy tính (Sửa)
  if (editDropzone && editFileInput) {
    editDropzone.addEventListener('click', () => editFileInput.click());
    editFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const objectUrl = URL.createObjectURL(file);
        if (editPreviewImg) editPreviewImg.src = objectUrl;
        if (editFileStatus) editFileStatus.innerHTML = `<i class="fa-solid fa-check-circle" style="color: #2e7d32;"></i> Đã chọn file thay thế: <strong>${file.name}</strong>`;
      }
    });
  }

  // Cập nhật live preview khi đổi URL (Sửa)
  if (editUrlInput && editPreviewImg) {
    const updateEditPreview = () => {
      const url = editUrlInput.value.trim();
      if (url) {
        editPreviewImg.src = url;
        if (editFileInput) editFileInput.value = '';
        if (editFileStatus) editFileStatus.textContent = 'Bấm để thay ảnh mới từ máy tính';
      }
    };
    editUrlInput.addEventListener('input', updateEditPreview);
    if (btnEditPreviewUrl) btnEditPreviewUrl.addEventListener('click', updateEditPreview);
  }

  // ==========================================
  // 4. CHỌN ẢNH MẪU ĐẸP MỘT CHẠM (PRESETS)
  // ==========================================
  document.querySelectorAll('.preset-gallery .preset-thumb-item').forEach(thumb => {
    thumb.addEventListener('click', () => {
      const url = thumb.getAttribute('data-url');
      const gallery = thumb.closest('.preset-gallery');
      const targetModal = gallery.getAttribute('data-target-modal');

      if (!url) return;

      if (targetModal === 'add') {
        if (addUrlInput) addUrlInput.value = url;
        if (addPreviewImg) addPreviewImg.src = url;
        if (addFileInput) addFileInput.value = '';
        if (addFileStatus) addFileStatus.textContent = 'Bấm để tải ảnh từ máy tính lên';
      } else if (targetModal === 'edit') {
        if (editUrlInput) editUrlInput.value = url;
        if (editPreviewImg) editPreviewImg.src = url;
        if (editFileInput) editFileInput.value = '';
        if (editFileStatus) editFileStatus.textContent = 'Bấm để thay ảnh mới từ máy tính';
      }

      // Đánh dấu active cho thumbnail được chọn
      gallery.querySelectorAll('.preset-thumb-item').forEach(item => item.style.borderColor = 'transparent');
      thumb.style.borderColor = '#2e7d32';
    });
  });

  // ==========================================
  // 5. ĐÓNG MODAL KHI CLICK RA NGOÀI
  // ==========================================
  window.addEventListener('click', (e) => {
    if (e.target === addModal) addModal.style.display = 'none';
    if (e.target === editModal) editModal.style.display = 'none';
  });

  // ==========================================
  // 6. XÁC NHẬN XÓA NÔNG SẢN
  // ==========================================
  document.querySelectorAll('.btn-confirm-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này? Hành động này không thể hoàn tác!')) {
        e.preventDefault();
      }
    });
  });

  // ==========================================
  // 7. MOBILE SIDEBAR TOGGLE
  // ==========================================
  const adminSidebar = document.getElementById('admin-sidebar');
  const adminToggleBtn = document.getElementById('admin-sidebar-toggle-btn');
  const adminCloseBtn = document.getElementById('admin-sidebar-close-btn');
  const adminOverlay = document.getElementById('admin-sidebar-overlay');

  function openAdminSidebar() {
    if (adminSidebar) adminSidebar.classList.add('open');
    if (adminOverlay) adminOverlay.style.display = 'block';
  }

  function closeAdminSidebar() {
    if (adminSidebar) adminSidebar.classList.remove('open');
    if (adminOverlay) adminOverlay.style.display = 'none';
  }

  if (adminToggleBtn) adminToggleBtn.addEventListener('click', openAdminSidebar);
  if (adminCloseBtn) adminCloseBtn.addEventListener('click', closeAdminSidebar);
  if (adminOverlay) adminOverlay.addEventListener('click', closeAdminSidebar);
});
