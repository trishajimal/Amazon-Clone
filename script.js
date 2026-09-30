const STORAGE_KEY = 'amazonCart';

function getCart() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  updateCartCounter();
}

function updateCartCounter() {
  const cartCount = document.querySelector('#cart-count');
  if (!cartCount) return;

  const items = getCart().reduce((total, item) => total + item.qty, 0);
  cartCount.textContent = items;
}

function addToCart(product) {
  const cart = getCart();
  const existingItem = cart.find((item) => item.id === product.id);

  if (existingItem) {
    existingItem.qty += 1;
  } else {
    cart.push({ ...product, qty: 1 });
  }

  saveCart(cart);
  showToast(`${product.name} added to cart`);
}

function removeFromCart(id) {
  const cart = getCart().filter((item) => item.id !== id);
  saveCart(cart);
  renderCart();
}

function changeQty(id, delta) {
  const cart = getCart();
  const item = cart.find((entry) => entry.id === id);

  if (!item) return;

  item.qty += delta;
  if (item.qty <= 0) {
    const nextCart = cart.filter((entry) => entry.id !== id);
    saveCart(nextCart);
    renderCart();
    return;
  }

  saveCart(cart);
  renderCart();
}

function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 1800);
}

function initModal() {
  const modal = document.getElementById('auth-modal');
  const openButtons = document.querySelectorAll('[data-open-modal]');
  const closeButtons = document.querySelectorAll('[data-close-modal]');

  if (!modal) return;

  const handleOpen = () => {
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
  };

  const handleClose = () => {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  };

  openButtons.forEach((button) => button.addEventListener('click', handleOpen));
  closeButtons.forEach((button) => button.addEventListener('click', handleClose));

  modal.addEventListener('click', (event) => {
    if (event.target === modal) handleClose();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') handleClose();
  });
}

function initCarousel() {
  const slides = Array.from(document.querySelectorAll('.carousel-slide'));
  const dots = Array.from(document.querySelectorAll('.dot'));
  const prev = document.querySelector('[data-carousel-prev]');
  const next = document.querySelector('[data-carousel-next]');

  if (!slides.length) return;

  let currentIndex = 0;

  const showSlide = (index) => {
    currentIndex = (index + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle('active', slideIndex === currentIndex);
    });
    dots.forEach((dot, dotIndex) => {
      dot.classList.toggle('active', dotIndex === currentIndex);
    });
  };

  prev?.addEventListener('click', () => showSlide(currentIndex - 1));
  next?.addEventListener('click', () => showSlide(currentIndex + 1));
  dots.forEach((dot, index) => dot.addEventListener('click', () => showSlide(index)));

  setInterval(() => showSlide(currentIndex + 1), 4500);
}

function renderCart() {
  const cartContainer = document.getElementById('cart-items');
  const subtotalEl = document.getElementById('subtotal');
  const itemCountEl = document.getElementById('item-count');

  if (!cartContainer || !subtotalEl || !itemCountEl) return;

  const cart = getCart();

  if (!cart.length) {
    cartContainer.innerHTML = `
      <div class="empty-cart">
        <h3>Your cart is empty</h3>
        <p>Add a few favorites and they will appear here.</p>
        <a href="index.html" class="primary-btn">Continue shopping</a>
      </div>
    `;
    subtotalEl.textContent = '$0.00';
    itemCountEl.textContent = '0';
    return;
  }

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);

  cartContainer.innerHTML = cart
    .map(
      (item) => `
        <div class="cart-item">
          <div class="cart-item-image" style="background-image: url('${item.image}')"></div>
          <div class="cart-item-details">
            <div>
              <h3>${item.name}</h3>
              <p class="cart-item-meta">${item.category || 'Amazon Essentials'}</p>
            </div>
            <div class="cart-item-actions">
              <div class="qty-selector">
                <button class="qty-button" data-qty-change="${item.id}|-1">-</button>
                <span>${item.qty}</span>
                <button class="qty-button" data-qty-change="${item.id}|1">+</button>
              </div>
              <button class="remove-link" data-remove-id="${item.id}">Remove</button>
            </div>
            <p class="cart-price">$${(item.price * item.qty).toFixed(2)}</p>
          </div>
        </div>
      `
    )
    .join('');

  subtotalEl.textContent = `$${total.toFixed(2)}`;
  itemCountEl.textContent = totalItems;

  cartContainer.querySelectorAll('[data-remove-id]').forEach((button) => {
    button.addEventListener('click', () => removeFromCart(button.dataset.removeId));
  });

  cartContainer.querySelectorAll('[data-qty-change]').forEach((button) => {
    button.addEventListener('click', () => {
      const [id, delta] = button.dataset.qtyChange.split('|');
      changeQty(id, Number(delta));
    });
  });
}

function initProductButtons() {
  const buttons = document.querySelectorAll('[data-add-to-cart]');

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const product = {
        id: button.dataset.productId || 'product-1',
        name: button.dataset.productName || 'Amazon Everyday Product',
        price: Number(button.dataset.productPrice || 49.99),
        image: button.dataset.productImage || 'image3.jpg',
        category: button.dataset.productCategory || 'Featured product',
      };

      addToCart(product);
    });
  });
}

function initThumbnails() {
  const mainImage = document.querySelector('.product-image-main');
  const thumbnails = document.querySelectorAll('.thumbnail');

  if (!mainImage || !thumbnails.length) return;

  thumbnails.forEach((thumbnail) => {
    thumbnail.addEventListener('click', () => {
      const bgValue = thumbnail.style.backgroundImage;
      const nextImage = bgValue.replace(/^url\((['"]?)(.*?)(\1)\)$/i, '$2');
      mainImage.style.backgroundImage = `url('${nextImage}')`;
      thumbnails.forEach((item) => item.classList.toggle('active', item === thumbnail));
    });
  });
}

function initPage() {
  updateCartCounter();
  initModal();
  initCarousel();
  initProductButtons();
  initThumbnails();
  renderCart();
}

document.addEventListener('DOMContentLoaded', initPage);
