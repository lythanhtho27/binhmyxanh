document.addEventListener('DOMContentLoaded', () => {
  // Modal Thêm sản phẩm
  const addModal = document.getElementById('add-product-modal');
  const openAddBtn = document.getElementById('btn-open-add-product');
  const closeAddBtns = document.querySelectorAll('.close-add-modal');

  if (openAddBtn && addModal) {
    openAddBtn.addEventListener('click', () => {
      addModal.style.display = 'flex';
    });
  }

  closeAddBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (addModal) addModal.style.display = 'none';
    });
  });

  // Modal Sửa sản phẩm
  const editModal = document.getElementById('edit-product-modal');
  const closeEditBtns = document.querySelectorAll('.close-edit-modal');
  const editForm = document.getElementById('edit-product-form');

  document.querySelectorAll('.btn-open-edit-product').forEach(btn => {
    btn.addEventListener('click', () => {
      const dataStr = btn.getAttribute('data-product');
      if (!dataStr) return;
      const product = JSON.parse(dataStr);

      editForm.action = `/admin/products/edit/${product.id}`;
      document.getElementById('edit-name').value = product.name || '';
      document.getElementById('edit-category').value = product.category_id || '';
      document.getElementById('edit-price').value = product.price || '';
      document.getElementById('edit-original-price').value = product.original_price || '';
      document.getElementById('edit-unit').value = product.unit || 'kg';
      document.getElementById('edit-stock').value = product.stock || '';
      document.getElementById('edit-origin').value = product.origin || '';
      document.getElementById('edit-harvest-date').value = product.harvest_date || '';
      document.getElementById('edit-shelf-life').value = product.shelf_life || '';
      document.getElementById('edit-certification').value = product.certification || '';
      document.getElementById('edit-image').value = product.image || '';
      document.getElementById('edit-short-desc').value = product.short_description || '';
      document.getElementById('edit-desc').value = product.description || '';
      document.getElementById('edit-nutrition').value = product.nutrition_info || '';
      document.getElementById('edit-storage').value = product.storage_guide || '';
      document.getElementById('edit-featured').checked = !!product.is_featured;
      document.getElementById('edit-new').checked = !!product.is_new;

      editModal.style.display = 'flex';
    });
  });

  closeEditBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (editModal) editModal.style.display = 'none';
    });
  });

  // Đóng modal khi click ra ngoài overlay
  window.addEventListener('click', (e) => {
    if (e.target === addModal) addModal.style.display = 'none';
    if (e.target === editModal) editModal.style.display = 'none';
  });

  // Xác nhận xóa
  document.querySelectorAll('.btn-confirm-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này? Hành động này không thể hoàn tác!')) {
        e.preventDefault();
      }
    });
  });

  // Mobile Sidebar Toggle cho Admin
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
