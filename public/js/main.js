document.addEventListener('DOMContentLoaded', () => {
  // 1. Toast Notification Helper
  window.showToast = function(message, icon = '🍃') {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  };

  // 1.1. Xử lý Menu Drawer trên Điện thoại / Tablet
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const closeMobileMenuBtn = document.getElementById('close-mobile-menu-btn');
  const mobileNavbar = document.getElementById('mobile-navbar');
  const mobileNavBackdrop = document.getElementById('mobile-nav-backdrop');

  function openMobileMenu() {
    if (mobileNavbar) mobileNavbar.classList.add('open');
    if (mobileNavBackdrop) mobileNavBackdrop.style.display = 'block';
    document.body.style.overflow = 'hidden';
  }

  function closeMobileMenu() {
    if (mobileNavbar) mobileNavbar.classList.remove('open');
    if (mobileNavBackdrop) mobileNavBackdrop.style.display = 'none';
    document.body.style.overflow = '';
  }

  if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', openMobileMenu);
  if (closeMobileMenuBtn) closeMobileMenuBtn.addEventListener('click', closeMobileMenu);
  if (mobileNavBackdrop) mobileNavBackdrop.addEventListener('click', closeMobileMenu);

  // Tự động đóng menu mobile khi bấm vào link
  if (mobileNavbar) {
    mobileNavbar.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeMobileMenu);
    });
  }

  // 2. Slider cuộn cho Sản phẩm mới về
  const sliderTracks = document.querySelectorAll('.slider-track');
  sliderTracks.forEach(track => {
    const parent = track.closest('.slider-container');
    if (!parent) return;

    const prevBtn = parent.querySelector('.slider-prev');
    const nextBtn = parent.querySelector('.slider-next');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        const scrollAmount = Math.max(180, Math.floor(track.clientWidth * 0.75));
        track.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        const scrollAmount = Math.max(180, Math.floor(track.clientWidth * 0.75));
        track.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      });
    }
  });

  // 3. Thêm vào giỏ hàng bằng AJAX
  document.querySelectorAll('.ajax-add-to-cart').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const productId = btn.getAttribute('data-product-id');
      const qtyInput = document.querySelector(`#qty-${productId}`) || document.querySelector('.detail-qty-input');
      const quantity = qtyInput ? parseInt(qtyInput.value) || 1 : 1;

      try {
        const response = await fetch('/cart/add', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ productId, quantity })
        });

        const data = await response.json();
        if (data.success) {
          // Cập nhật số lượng trên giỏ hàng header
          const badges = document.querySelectorAll('.cart-badge');
          badges.forEach(badge => {
            badge.textContent = data.cartCount;
          });
          showToast(data.message || 'Đã thêm sản phẩm vào giỏ!', '🛒');
        } else {
          showToast(data.message || 'Lỗi khi thêm vào giỏ', '⚠️');
        }
      } catch (err) {
        console.error(err);
        showToast('Không thể kết nối đến máy chủ', '❌');
      }
    });
  });

  // 4. Bộ chọn số lượng (+ / -)
  document.querySelectorAll('.qty-control').forEach(control => {
    const minusBtn = control.querySelector('.qty-minus');
    const plusBtn = control.querySelector('.qty-plus');
    const input = control.querySelector('.qty-input');

    if (minusBtn && input) {
      minusBtn.addEventListener('click', () => {
        let val = parseInt(input.value) || 1;
        if (val > 1) {
          input.value = val - 1;
          input.dispatchEvent(new Event('change'));
        }
      });
    }

    if (plusBtn && input) {
      plusBtn.addEventListener('click', () => {
        let val = parseInt(input.value) || 1;
        input.value = val + 1;
        input.dispatchEvent(new Event('change'));
      });
    }
  });

  // 5. Cập nhật số lượng trong trang giỏ hàng bằng AJAX
  document.querySelectorAll('.cart-qty-input').forEach(input => {
    input.addEventListener('change', async () => {
      const productId = input.getAttribute('data-product-id');
      const quantity = parseInt(input.value) || 1;

      try {
        const res = await fetch('/cart/update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ productId, quantity })
        });

        const data = await res.json();
        if (data.success) {
          location.reload(); // Tải lại để cập nhật toàn bộ bảng tổng tiền
        }
      } catch (err) {
        console.error(err);
      }
    });
  });

  // 6. Tabs chi tiết sản phẩm
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const target = btn.getAttribute('data-target');
      const pane = document.getElementById(target);
      if (pane) pane.classList.add('active');
    });
  });

  // 7. Chọn phương thức thanh toán
  const paymentCards = document.querySelectorAll('.payment-card');
  paymentCards.forEach(card => {
    card.addEventListener('click', () => {
      paymentCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      const radio = card.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;

      const bankInfo = document.getElementById('banking-info-box');
      if (bankInfo) {
        if (radio && radio.value === 'banking') {
          bankInfo.style.display = 'block';
        } else {
          bankInfo.style.display = 'none';
        }
      }
    });
  });

  // 8. TÍNH NĂNG QUÉT MÃ QR NÔNG SẢN
  const qrModal = document.getElementById('qr-scanner-modal');
  const openQrBtn = document.getElementById('open-qr-scanner-btn');
  const closeQrBtn = document.getElementById('close-qr-scanner-btn');
  const qrTabCamera = document.getElementById('qr-tab-camera');
  const qrTabFile = document.getElementById('qr-tab-file');
  const qrCameraSection = document.getElementById('qr-camera-section');
  const qrFileSection = document.getElementById('qr-file-section');
  const qrFileInput = document.getElementById('qr-input-file');
  const qrFeedback = document.getElementById('qr-scan-feedback');
  const qrCameraStatus = document.getElementById('qr-camera-status');

  let html5QrCode = null;
  let isScanningCamera = false;

  // Xử lý khi quét được mã QR hợp lệ
  function handleScannedResult(decodedText) {
    console.log('Quét thành công mã QR:', decodedText);
    if (qrFeedback) {
      qrFeedback.style.display = 'block';
      qrFeedback.style.backgroundColor = '#e8f5e9';
      qrFeedback.style.color = '#2e7d32';
      qrFeedback.innerHTML = `<i class="fa-solid fa-circle-check"></i> Đã tìm thấy: <strong>${decodedText}</strong><br>Đang chuyển hướng đến chi tiết sản phẩm...`;
    }

    // Dừng quét camera nếu đang chạy
    stopCamera();

    setTimeout(() => {
      // Nếu là URL đầy đủ chứa /products/
      if (decodedText.includes('/products/')) {
        window.location.href = decodedText;
      } 
      // Nếu là số ID (ví dụ: "1", "2")
      else if (!isNaN(decodedText.trim())) {
        window.location.href = '/products/' + decodedText.trim();
      } 
      // Nếu chứa mã dạng NS-0001
      else if (decodedText.startsWith('NS-')) {
        const id = parseInt(decodedText.replace('NS-', ''));
        if (!isNaN(id)) {
          window.location.href = '/products/' + id;
          return;
        }
      } 
      else {
        // Thử tìm kiếm nếu là từ khóa
        window.location.href = '/products?search=' + encodeURIComponent(decodedText);
      }
    }, 900);
  }

  // Khởi động Camera
  async function startCamera() {
    if (typeof Html5Qrcode === 'undefined') {
      if (qrCameraStatus) qrCameraStatus.innerHTML = '<span style="color: red;">Không thể tải thư viện quét mã QR. Vui lòng thử lại!</span>';
      return;
    }

    try {
      if (!html5QrCode) {
        html5QrCode = new Html5Qrcode('qr-reader');
      }

      if (qrCameraStatus) qrCameraStatus.textContent = 'Đang khởi động camera...';

      const config = { fps: 10, qrbox: { width: 220, height: 220 } };

      await html5QrCode.start(
        { facingMode: 'environment' }, // Ưu tiên camera sau trên điện thoại
        config,
        (decodedText) => {
          handleScannedResult(decodedText);
        },
        () => {
          // Frame không có QR -> bỏ qua, không báo lỗi
        }
      );

      isScanningCamera = true;
      if (qrCameraStatus) qrCameraStatus.textContent = 'Hướng camera về phía mã QR trên bao bì sản phẩm.';
    } catch (err) {
      console.warn('Lỗi mở camera:', err);
      if (qrCameraStatus) {
        qrCameraStatus.innerHTML = '<span style="color: #c62828;">Không thể truy cập camera (hoặc chưa cấp quyền). Bạn hãy chuyển sang tab <strong>"Tải ảnh tem QR"</strong> để tải ảnh nhé!</span>';
      }
    }
  }

  // Dừng Camera
  function stopCamera() {
    if (html5QrCode && isScanningCamera) {
      html5QrCode.stop().then(() => {
        isScanningCamera = false;
        if (qrCameraStatus) qrCameraStatus.textContent = 'Đã dừng camera.';
      }).catch(err => console.error('Lỗi dừng camera:', err));
    }
  }

  // Mở Modal Quét QR
  if (openQrBtn && qrModal) {
    openQrBtn.addEventListener('click', () => {
      qrModal.style.display = 'flex';
      if (qrFeedback) qrFeedback.style.display = 'none';
      switchTab('camera');
    });
  }

  // Đóng Modal Quét QR
  function closeQrModal() {
    if (qrModal) qrModal.style.display = 'none';
    stopCamera();
  }

  if (closeQrBtn) closeQrBtn.addEventListener('click', closeQrModal);
  window.addEventListener('click', (e) => {
    if (e.target === qrModal) closeQrModal();
  });

  // Chuyển đổi Tab Camera <-> Tải file ảnh
  function switchTab(tab) {
    if (tab === 'camera') {
      if (qrCameraSection) qrCameraSection.style.display = 'block';
      if (qrFileSection) qrFileSection.style.display = 'none';
      if (qrTabCamera) {
        qrTabCamera.className = 'btn-sm btn-primary-sm qr-tab-btn';
      }
      if (qrTabFile) {
        qrTabFile.className = 'btn-sm btn-outline-sm qr-tab-btn';
      }
      startCamera();
    } else {
      stopCamera();
      if (qrCameraSection) qrCameraSection.style.display = 'none';
      if (qrFileSection) qrFileSection.style.display = 'block';
      if (qrTabCamera) {
        qrTabCamera.className = 'btn-sm btn-outline-sm qr-tab-btn';
      }
      if (qrTabFile) {
        qrTabFile.className = 'btn-sm btn-primary-sm qr-tab-btn';
      }
    }
  }

  if (qrTabCamera) qrTabCamera.addEventListener('click', () => switchTab('camera'));
  if (qrTabFile) qrTabFile.addEventListener('click', () => switchTab('file'));

  // Quét mã QR từ file ảnh
  if (qrFileInput) {
    qrFileInput.addEventListener('change', async (e) => {
      if (e.target.files.length === 0) return;
      const file = e.target.files[0];

      if (!html5QrCode) {
        html5QrCode = new Html5Qrcode('qr-reader');
      }

      if (qrFeedback) {
        qrFeedback.style.display = 'block';
        qrFeedback.style.backgroundColor = '#e1f5fe';
        qrFeedback.style.color = '#0288d1';
        qrFeedback.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang đọc mã QR từ ảnh tải lên...';
      }

      try {
        const decodedText = await html5QrCode.scanFile(file, true);
        handleScannedResult(decodedText);
      } catch (err) {
        console.error('Không tìm thấy QR trong ảnh:', err);
        if (qrFeedback) {
          qrFeedback.style.display = 'block';
          qrFeedback.style.backgroundColor = '#ffebee';
          qrFeedback.style.color = '#c62828';
          qrFeedback.innerHTML = '<i class="fa-solid fa-circle-xmark"></i> Không tìm thấy mã QR trong hình ảnh. Vui lòng thử ảnh rõ nét hơn!';
        }
      }
    });
  }

  // 9. Modal xem tem QR lớn trên trang chi tiết sản phẩm
  const btnShowProductQr = document.getElementById('btn-show-qr-modal');
  const productQrModal = document.getElementById('product-qr-modal');
  const closeProductQrBtn = document.getElementById('close-product-qr-modal');

  if (btnShowProductQr && productQrModal) {
    btnShowProductQr.addEventListener('click', () => {
      productQrModal.style.display = 'flex';
    });
  }

  if (closeProductQrBtn && productQrModal) {
    closeProductQrBtn.addEventListener('click', () => {
      productQrModal.style.display = 'none';
    });
  }

  window.addEventListener('click', (e) => {
    if (e.target === productQrModal) {
      productQrModal.style.display = 'none';
    }
  });
});
