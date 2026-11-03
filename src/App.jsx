import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [products, setProducts] = useState([]);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);

  const [showOrders, setShowOrders] = useState(false);
  const [orders, setOrders] = useState([]);
  const [orderCustomerName, setOrderCustomerName] = useState("");

  const [selectedProduct, setSelectedProduct] = useState(null);

  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // =========================================
  // LOAD PRODUCTS
  // =========================================

  const loadProducts = async () => {
    try {
      const response = await fetch(
        "http://localhost:8081/api/products"
      );

      if (!response.ok) {
        throw new Error("Failed to load products");
      }

      const data = await response.json();

      setProducts(data);
    } catch (err) {
      console.error(err);
      setError("Unable to load products");
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // =========================================
  // ADD TO CART
  // =========================================

  const addToCart = (product) => {
    setCart((currentCart) => {
      const existingProduct = currentCart.find(
        (item) => item.id === product.id
      );

      if (existingProduct) {
        if (
          existingProduct.cartQuantity <
          product.quantity
        ) {
          return currentCart.map((item) =>
            item.id === product.id
              ? {
                  ...item,
                  cartQuantity:
                    item.cartQuantity + 1
                }
              : item
          );
        }

        return currentCart;
      }

      return [
        ...currentCart,
        {
          ...product,
          cartQuantity: 1
        }
      ];
    });

    setMessage(
      `${product.name} added to cart`
    );

    setError("");
  };

  // =========================================
  // REMOVE FROM CART
  // =========================================

  const removeFromCart = (productId) => {
    setCart((currentCart) =>
      currentCart.filter(
        (item) => item.id !== productId
      )
    );
  };

  // =========================================
  // INCREASE QUANTITY
  // =========================================

  const increaseQuantity = (productId) => {
    setCart((currentCart) =>
      currentCart.map((item) =>
        item.id === productId &&
        item.cartQuantity < item.quantity
          ? {
              ...item,
              cartQuantity:
                item.cartQuantity + 1
            }
          : item
      )
    );
  };

  // =========================================
  // DECREASE QUANTITY
  // =========================================

  const decreaseQuantity = (productId) => {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.id === productId
            ? {
                ...item,
                cartQuantity:
                  item.cartQuantity - 1
              }
            : item
        )
        .filter(
          (item) => item.cartQuantity > 0
        )
    );
  };

  // =========================================
  // BUY NOW
  // =========================================

  const handlePlaceOrder = (product) => {
    setSelectedProduct(product);

    setQuantity(1);

    setCustomerName("");
    setCardNumber("");
    setCardExpiry("");
    setCardCvv("");

    setMessage("");
    setError("");

    setShowCart(false);
    setShowOrders(false);

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  // =========================================
  // CHECKOUT FROM CART
  // =========================================

  const checkoutCartItem = (item) => {
    const product = products.find(
      (product) => product.id === item.id
    );

    if (!product) {
      setError("Product not found");
      return;
    }

    setSelectedProduct(product);

    setQuantity(item.cartQuantity);

    setCustomerName("");
    setCardNumber("");
    setCardExpiry("");
    setCardCvv("");

    setMessage("");
    setError("");

    setShowCart(false);
    setShowOrders(false);

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  // =========================================
  // CANCEL ORDER
  // =========================================

  const handleCancel = () => {
    setSelectedProduct(null);

    setQuantity(1);

    setCustomerName("");
    setCardNumber("");
    setCardExpiry("");
    setCardCvv("");

    setMessage("");
    setError("");
  };

  // =========================================
  // PLACE ORDER
  // =========================================

  const handleOrderSubmit = async (event) => {
    event.preventDefault();

    if (!selectedProduct) {
      return;
    }

    const orderQuantity = Number(quantity);

    if (orderQuantity <= 0) {
      setError(
        "Quantity must be greater than zero"
      );
      return;
    }

    if (
      orderQuantity >
      selectedProduct.quantity
    ) {
      setError("Insufficient stock");
      return;
    }

    const orderData = {
      productId: selectedProduct.id,
      quantity: orderQuantity,
      customerName: customerName,
      cardNumber: cardNumber,
      cardExpiry: cardExpiry,
      cardCvv: cardCvv
    };

    try {
      setLoading(true);

      setMessage("");
      setError("");

      const response = await fetch(
        "http://localhost:8092/api/orders",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify(orderData)
        }
      );

      const responseText =
        await response.text();

      let data = {};

      if (responseText) {
        try {
          data = JSON.parse(
            responseText
          );
        } catch {
          data = {
            message: responseText
          };
        }
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            "Order failed"
        );
      }

      // Remove ordered quantity from cart
      setCart((currentCart) =>
        currentCart
          .map((item) =>
            item.id === selectedProduct.id
              ? {
                  ...item,
                  cartQuantity:
                    item.cartQuantity -
                    orderQuantity
                }
              : item
          )
          .filter(
            (item) =>
              item.cartQuantity > 0
          )
      );

      setMessage(
        "Order placed successfully!"
      );

      setSelectedProduct(null);

      setQuantity(1);
      setCustomerName("");
      setCardNumber("");
      setCardExpiry("");
      setCardCvv("");

      await loadProducts();

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });

    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Unable to place order"
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================
  // LOAD ORDER HISTORY
  // =========================================

  const loadOrders = async () => {
    if (!orderCustomerName.trim()) {
      setError(
        "Please enter customer name"
      );
      return;
    }

    try {
      setLoading(true);

      setMessage("");
      setError("");

      const response = await fetch(
        `http://localhost:8092/api/orders?customerName=${encodeURIComponent(
          orderCustomerName.trim()
        )}`
      );

      if (!response.ok) {
        throw new Error(
          "Failed to load orders"
        );
      }

      const data = await response.json();

      setOrders(data);

      if (data.length === 0) {
        setMessage(
          "No orders found for this customer."
        );
      }

    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Unable to load orders"
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================
  // OPEN MY ORDERS
  // =========================================

  const handleMyOrders = () => {
    setShowOrders(true);
    setShowCart(false);
    setSelectedProduct(null);

    setMessage("");
    setError("");

    setTimeout(() => {
      const ordersElement =
        document.getElementById(
          "orders-section"
        );

      if (ordersElement) {
        ordersElement.scrollIntoView({
          behavior: "smooth"
        });
      }
    }, 100);
  };

  // =========================================
  // FILTER PRODUCTS
  // =========================================

  const categories = [
    "All",
    ...new Set(
      products.map(
        (product) => product.category
      )
    )
  ];

  const filteredProducts =
    products.filter((product) => {
      const matchesSearch =
        product.name
          .toLowerCase()
          .includes(
            search.toLowerCase()
          );

      const matchesCategory =
        category === "All" ||
        product.category === category;

      return (
        matchesSearch &&
        matchesCategory
      );
    });

  // =========================================
  // CART TOTAL
  // =========================================

  const cartCount = cart.reduce(
    (total, item) =>
      total + item.cartQuantity,
    0
  );

  const cartTotal = cart.reduce(
    (total, item) =>
      total +
      Number(item.price) *
        item.cartQuantity,
    0
  );

  // =========================================
  // FORMAT DATE
  // =========================================

  const formatDate = (date) => {
    if (!date) {
      return "N/A";
    }

    return new Date(
      date
    ).toLocaleString();
  };

  // =========================================
  // MAIN UI
  // =========================================

  return (
    <div className="app">

      {/* HEADER */}

      <header className="header">

        <div className="logo">
          🛒 E-Commerce Store
        </div>

        <div className="header-buttons">

          <button
            className="orders-button"
            onClick={handleMyOrders}
          >
            📦 My Orders
          </button>

          <button
            className="cart-info"
            onClick={() => {
              setShowCart(!showCart);
              setShowOrders(false);
              setSelectedProduct(null);

              setMessage("");
              setError("");

              setTimeout(() => {
                const cartElement =
                  document.getElementById(
                    "cart-section"
                  );

                if (cartElement) {
                  cartElement.scrollIntoView({
                    behavior: "smooth"
                  });
                }
              }, 100);
            }}
          >
            🛒 Cart ({cartCount})
          </button>

        </div>

      </header>

      {/* MAIN */}

      <main className="container">

        <h1>
          Welcome to Our Store
        </h1>

        <p className="subtitle">
          Find the products you need
        </p>

        {/* MESSAGE */}

        {message && (
          <div className="success">
            {message}
          </div>
        )}

        {error && (
          <div className="error">
            {error}
          </div>
        )}

        {/* SEARCH */}

        <div className="filters">

          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

          <select
            value={category}
            onChange={(e) =>
              setCategory(e.target.value)
            }
          >
            {categories.map(
              (cat) => (
                <option
                  key={cat}
                  value={cat}
                >
                  {cat}
                </option>
              )
            )}
          </select>

        </div>

        {/* PRODUCTS */}

        <div className="product-grid">

          {filteredProducts.map(
            (product) => (

              <div
                className="product-card"
                key={product.id}
              >

                <div className="product-image">
                  🛍️
                </div>

                <h2>
                  {product.name}
                </h2>

                <p className="description">
                  {product.description}
                </p>

                <p className="category">
                  {product.category}
                </p>

                <p className="price">
                  ₹{product.price}
                </p>

                <p>
                  Stock:{" "}
                  {product.quantity}
                </p>

                <div className="buttons">

                  <button
                    className="cart-button"
                    onClick={() =>
                      addToCart(product)
                    }
                    disabled={
                      product.quantity === 0
                    }
                  >
                    Add to Cart
                  </button>

                  <button
                    className="order-button"
                    onClick={() =>
                      handlePlaceOrder(
                        product
                      )
                    }
                    disabled={
                      product.quantity === 0
                    }
                  >
                    Buy Now
                  </button>

                </div>

                {/* CHECKOUT */}

                {selectedProduct &&
                  selectedProduct.id ===
                    product.id && (

                    <div className="order-form">

                      <h3>
                        Checkout
                      </h3>

                      <form
                        onSubmit={
                          handleOrderSubmit
                        }
                      >

                        <label>
                          Quantity
                        </label>

                        <input
                          type="number"
                          min="1"
                          max={
                            product.quantity
                          }
                          value={quantity}
                          onChange={(e) =>
                            setQuantity(
                              e.target.value
                            )
                          }
                          required
                        />

                        <label>
                          Customer Name
                        </label>

                        <input
                          type="text"
                          value={
                            customerName
                          }
                          onChange={(e) =>
                            setCustomerName(
                              e.target.value
                            )
                          }
                          required
                        />

                        <label>
                          Card Number
                        </label>

                        <input
                          type="text"
                          value={
                            cardNumber
                          }
                          onChange={(e) =>
                            setCardNumber(
                              e.target.value
                            )
                          }
                          placeholder="Card number"
                          required
                        />

                        <label>
                          Card Expiry
                        </label>

                        <input
                          type="text"
                          value={
                            cardExpiry
                          }
                          onChange={(e) =>
                            setCardExpiry(
                              e.target.value
                            )
                          }
                          placeholder="MM/YY"
                          required
                        />

                        <label>
                          CVV
                        </label>

                        <input
                          type="password"
                          value={cardCvv}
                          onChange={(e) =>
                            setCardCvv(
                              e.target.value
                            )
                          }
                          placeholder="CVV"
                          required
                        />

                        <button
                          type="submit"
                          disabled={loading}
                          className="confirm-button"
                        >
                          {loading
                            ? "Processing..."
                            : "Confirm Order"}
                        </button>

                        <button
                          type="button"
                          className="cancel-button"
                          onClick={
                            handleCancel
                          }
                        >
                          Cancel
                        </button>

                      </form>

                    </div>
                  )}

              </div>
            )
          )}

        </div>

        {/* =====================================
            SHOPPING CART
        ===================================== */}

        {showCart && (

          <section
            id="cart-section"
            className="cart-section"
          >

            <h2>
              🛒 Shopping Cart
            </h2>

            {cart.length === 0 ? (

              <div className="empty-cart">

                <h3>
                  Your cart is empty
                </h3>

                <p>
                  Add some products to
                  your cart.
                </p>

              </div>

            ) : (

              <>

                {cart.map(
                  (item) => (

                    <div
                      className="cart-item"
                      key={item.id}
                    >

                      <div className="cart-product">

                        <div className="cart-image">
                          🛍️
                        </div>

                        <div>

                          <strong>
                            {item.name}
                          </strong>

                          <p>
                            ₹
                            {Number(
                              item.price
                            ).toFixed(2)}
                          </p>

                        </div>

                      </div>

                      <div className="quantity-controls">

                        <button
                          onClick={() =>
                            decreaseQuantity(
                              item.id
                            )
                          }
                        >
                          −
                        </button>

                        <span>
                          {item.cartQuantity}
                        </span>

                        <button
                          onClick={() =>
                            increaseQuantity(
                              item.id
                            )
                          }
                        >
                          +
                        </button>

                      </div>

                      <div className="cart-item-total">

                        ₹
                        {(
                          Number(item.price) *
                          item.cartQuantity
                        ).toFixed(2)}

                      </div>

                      <div className="cart-actions">

                        <button
                          className="checkout-button"
                          onClick={() =>
                            checkoutCartItem(
                              item
                            )
                          }
                        >
                          Checkout
                        </button>

                        <button
                          className="remove-button"
                          onClick={() =>
                            removeFromCart(
                              item.id
                            )
                          }
                        >
                          Remove
                        </button>

                      </div>

                    </div>
                  )
                )}

                <div className="cart-summary">

                  <h3>
                    Total Amount:
                    <span>
                      ₹
                      {cartTotal.toFixed(2)}
                    </span>
                  </h3>

                </div>

              </>
            )}

          </section>
        )}

        {/* =====================================
            MY ORDERS
        ===================================== */}

        {showOrders && (

          <section
            id="orders-section"
            className="orders-section"
          >

            <h2>
              📦 My Orders
            </h2>

            <div className="order-search">

              <input
                type="text"
                placeholder="Enter customer name"
                value={
                  orderCustomerName
                }
                onChange={(e) =>
                  setOrderCustomerName(
                    e.target.value
                  )
                }
              />

              <button
                onClick={loadOrders}
                disabled={loading}
              >
                {loading
                  ? "Loading..."
                  : "View Orders"}
              </button>

            </div>

            {orders.length > 0 && (

              <div className="orders-list">

                {orders.map(
                  (order) => (

                    <div
                      className="order-card"
                      key={order.id}
                    >

                      <div className="order-header">

                        <h3>
                          Order #{order.id}
                        </h3>

                        <span
                          className={`status ${String(
                            order.status
                          ).toLowerCase()}`}
                        >
                          {order.status}
                        </span>

                      </div>

                      <div className="order-details">

                        <p>
                          <strong>
                            Product:
                          </strong>{" "}
                          {order.productName ||
                            `Product #${order.productId}`}
                        </p>

                        <p>
                          <strong>
                            Product ID:
                          </strong>{" "}
                          {order.productId}
                        </p>

                        <p>
                          <strong>
                            Quantity:
                          </strong>{" "}
                          {order.quantity}
                        </p>

                        <p>
                          <strong>
                            Customer:
                          </strong>{" "}
                          {order.customerName}
                        </p>

                        <p>
                          <strong>
                            Total Amount:
                          </strong>{" "}
                          ₹
                          {order.totalAmount}
                        </p>

                        <p>
                          <strong>
                            Payment Transaction:
                          </strong>{" "}
                          {order.paymentTransactionId ||
                            "N/A"}
                        </p>

                        <p>
                          <strong>
                            Order Date:
                          </strong>{" "}
                          {formatDate(
                            order.orderDate
                          )}
                        </p>

                        {order.failureReason && (
                          <p className="failure">
                            <strong>
                              Failure Reason:
                            </strong>{" "}
                            {order.failureReason}
                          </p>
                        )}

                      </div>

                    </div>

                  )
                )}

              </div>
            )}

          </section>
        )}

      </main>

    </div>
  );
}

export default App;