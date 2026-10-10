import { useEffect, useState } from 'react'

const ORDERS_URL = 'http://localhost:8083/api/order'
const USERS_URL = 'http://localhost:8080/api/user'
const PRODUCTS_URL = 'http://localhost:8080/api/product'
const EMPTY_DETAIL = { idProduct: '', quantity: '1' }
const EMPTY_FILTERS = { orderId: '', userId: '', status: '' }
const STATUS_LABELS = {
  CONFIRMED: 'Confirmada',
  CANCELLED: 'Cancelada',
}

async function getResponseError(response) {
  const message = await response.text()
  return new Error(message || `La API respondió con ${response.status}`)
}

function getOrderId(order) {
  return order.id ?? order.idOrder ?? order.orderId
}

function getOrderUserId(order) {
  return order.idUser ?? order.idUSer ?? order.iduser ?? order.userId ?? order.user?.id
}

function getOrderDetails(order) {
  const details = order.orderDetails ?? order.details
  return Array.isArray(details) ? details : []
}

function getCollection(payload) {
  if (Array.isArray(payload)) return payload
  return Array.isArray(payload?.data) ? payload.data : []
}

function OrdersPage({ user }) {
  const currentUserId = user?.id ?? ''
  const isAdmin = String(user?.rol ?? '').toUpperCase() === 'ADMIN'
  const canViewAllOrders = isAdmin
  const [orders, setOrders] = useState([])
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [form, setForm] = useState({
    idUser: currentUserId,
    information: '',
    orderDetails: [{ ...EMPTY_DETAIL }],
  })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [cancellingId, setCancellingId] = useState(null)
  const [error, setError] = useState('')
  const [referenceError, setReferenceError] = useState('')
  const [usersById, setUsersById] = useState({})
  const [productsById, setProductsById] = useState({})
  const [successMessage, setSuccessMessage] = useState('')

  const loadReferenceData = async () => {
    setReferenceError('')

    try {
      const [usersResponse, productsResponse] = await Promise.all([
        fetch(USERS_URL),
        fetch(PRODUCTS_URL),
      ])
      if (!usersResponse.ok) throw await getResponseError(usersResponse)
      if (!productsResponse.ok) throw await getResponseError(productsResponse)

      const [usersPayload, productsPayload] = await Promise.all([
        usersResponse.json(),
        productsResponse.json(),
      ])
      const users = getCollection(usersPayload)
      const products = getCollection(productsPayload)

      setUsersById(Object.fromEntries(users.map((entry) => {
        const id = entry.id ?? entry.idUser ?? entry.idUsuario
        const name = [entry.name ?? entry.nombre, entry.lastName ?? entry.apellido]
          .filter(Boolean)
          .join(' ')
        return [id, name]
      }).filter(([id]) => id !== undefined)))
      setProductsById(Object.fromEntries(products.map((entry) => {
        const id = entry.id ?? entry.idProduct ?? entry.idProducto
        return [id, entry.name ?? entry.nombre]
      }).filter(([id]) => id !== undefined)))
    } catch (requestError) {
      setReferenceError(
        requestError instanceof Error
          ? requestError.message
          : 'No fue posible cargar los nombres de usuarios y productos.',
      )
    }
  }

  const loadOrders = async (activeFilters = filters) => {
    setLoading(true)
    setError('')

    const orderId = activeFilters.orderId.trim()
    const userId = activeFilters.userId.trim()
    const status = activeFilters.status
    let endpoint = ORDERS_URL

    if (!canViewAllOrders && !currentUserId) {
      setOrders([])
      setError('No se pudo identificar al usuario en sesión para cargar sus órdenes.')
      setLoading(false)
      return
    }

    if (!canViewAllOrders && status) {
      endpoint = `${ORDERS_URL}/userid/${encodeURIComponent(currentUserId)}/status/${encodeURIComponent(status)}`
    } else if (!canViewAllOrders) {
      endpoint = `${ORDERS_URL}/userid/${encodeURIComponent(currentUserId)}`
    } else if (orderId) {
      endpoint = `${ORDERS_URL}/id/${encodeURIComponent(orderId)}`
    } else if (userId && status) {
      endpoint = `${ORDERS_URL}/userid/${encodeURIComponent(userId)}/status/${encodeURIComponent(status)}`
    } else if (userId) {
      endpoint = `${ORDERS_URL}/userid/${encodeURIComponent(userId)}`
    } else if (status) {
      endpoint = `${ORDERS_URL}/status/${encodeURIComponent(status)}`
    }

    try {
      const response = await fetch(endpoint)
      if (!response.ok) throw await getResponseError(response)

      const payload = await response.json()
      const results = Array.isArray(payload)
        ? payload
        : payload && Array.isArray(payload.data)
          ? payload.data
          : payload
            ? [payload]
            : []
      const visibleResults = canViewAllOrders
        ? results
        : results.filter((order) => String(getOrderUserId(order)) === String(currentUserId))
      setOrders(
        orderId
            ? visibleResults.filter((order) => String(getOrderId(order)) === orderId)
            : visibleResults,
      )
    } catch (requestError) {
      setOrders([])
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'No fue posible cargar las órdenes.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
    loadReferenceData()
  }, [])

  const handleFilterChange = (event) => {
    const { name, value } = event.target
    setFilters((currentFilters) => ({ ...currentFilters, [name]: value }))
  }

  const handleFormChange = (event) => {
    const { name, value } = event.target
    setForm((currentForm) => ({ ...currentForm, [name]: value }))
  }

  const handleDetailChange = (index, event) => {
    const { name, value } = event.target
    setForm((currentForm) => ({
      ...currentForm,
      orderDetails: currentForm.orderDetails.map((detail, detailIndex) =>
        detailIndex === index ? { ...detail, [name]: value } : detail,
      ),
    }))
  }

  const addDetail = () => {
    setForm((currentForm) => ({
      ...currentForm,
      orderDetails: [...currentForm.orderDetails, { ...EMPTY_DETAIL }],
    }))
  }

  const removeDetail = (index) => {
    setForm((currentForm) => ({
      ...currentForm,
      orderDetails: currentForm.orderDetails.filter((_, detailIndex) => detailIndex !== index),
    }))
  }

  const handleCreateOrder = async (event) => {
    event.preventDefault()

    if (!canViewAllOrders && !currentUserId) {
      setError('No se pudo identificar al usuario en sesión para crear la orden.')
      return
    }

    setSubmitting(true)
    setError('')
    setSuccessMessage('')

    const payload = {
      idUser: Number(canViewAllOrders ? form.idUser : currentUserId),
      information: form.information.trim() || null,
      orderDetails: form.orderDetails.map((detail) => ({
        idProduct: Number(detail.idProduct),
        quantity: Number(detail.quantity),
      })),
    }

    try {
      const response = await fetch(ORDERS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!response.ok) throw await getResponseError(response)

      setForm({
        idUser: currentUserId,
        information: '',
        orderDetails: [{ ...EMPTY_DETAIL }],
      })
      setSuccessMessage('La orden se creó correctamente.')
      await loadOrders()
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'No fue posible crear la orden.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm(`¿Deseas cancelar la orden #${orderId}?`)) return

    setCancellingId(orderId)
    setError('')
    setSuccessMessage('')

    try {
      const response = await fetch(`${ORDERS_URL}/id/${encodeURIComponent(orderId)}`, {
        method: 'PUT',
      })
      if (!response.ok) throw await getResponseError(response)

      setSuccessMessage(`La orden #${orderId} se canceló correctamente.`)
      await loadOrders()
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'No fue posible cancelar la orden.',
      )
    } finally {
      setCancellingId(null)
    }
  }

  return (
    <section className="orders-panel" aria-labelledby="orders-title">
      <div className="orders-panel__heading">
        <div>
          <p className="catalog__eyebrow">Gestión de pedidos</p>
          <h2 id="orders-title">Órdenes de compra</h2>
        </div>
        <span className="orders-count">{orders.length} {orders.length === 1 ? 'orden' : 'órdenes'}</span>
      </div>

      <form className="order-form" onSubmit={handleCreateOrder}>
        <div className="order-form__intro">
          <div>
            <h3>Nueva orden</h3>
            <p>Agrega uno o más productos a la compra.</p>
          </div>
        </div>
        <div className="order-form__main-fields">
          {canViewAllOrders && (
            <div className="order-field">
              <label htmlFor="order-user-id">ID de usuario</label>
              <input
                id="order-user-id"
                name="idUser"
                type="number"
                min="1"
                step="1"
                value={form.idUser}
                onChange={handleFormChange}
                required
              />
            </div>
          )}
          <div className="order-field order-field--wide">
            <label htmlFor="order-information">Información adicional <span>(opcional)</span></label>
            <input
              id="order-information"
              name="information"
              value={form.information}
              onChange={handleFormChange}
              placeholder="Notas o instrucciones para esta orden"
            />
          </div>
        </div>

        <div className="order-details">
          <div className="order-details__heading">
            <h4>Productos</h4>
            <button className="order-add-detail" type="button" onClick={addDetail}>
              + Agregar producto
            </button>
          </div>
          {form.orderDetails.map((detail, index) => (
            <div className="order-detail-row" key={index}>
              <div className="order-field">
                <label htmlFor={`order-product-${index}`}>ID de producto</label>
                <input
                  id={`order-product-${index}`}
                  name="idProduct"
                  type="number"
                  min="1"
                  step="1"
                  value={detail.idProduct}
                  onChange={(event) => handleDetailChange(index, event)}
                  required
                />
              </div>
              <div className="order-field">
                <label htmlFor={`order-quantity-${index}`}>Cantidad</label>
                <input
                  id={`order-quantity-${index}`}
                  name="quantity"
                  type="number"
                  min="1"
                  step="1"
                  value={detail.quantity}
                  onChange={(event) => handleDetailChange(index, event)}
                  required
                />
              </div>
              <button
                className="order-remove-detail"
                type="button"
                onClick={() => removeDetail(index)}
                disabled={form.orderDetails.length === 1}
                aria-label={`Quitar producto ${index + 1}`}
              >
                Quitar
              </button>
            </div>
          ))}
        </div>

        <div className="order-form__actions">
          <button className="order-primary-button" type="submit" disabled={submitting}>
            {submitting ? 'Creando orden...' : 'Crear orden'}
          </button>
        </div>
      </form>

      <form
        className="order-filters"
        onSubmit={(event) => {
          event.preventDefault()
          loadOrders(filters)
        }}
      >
        <div className="order-filters__heading">
          <div>
            <h3>Buscar órdenes</h3>
            <p>Filtra por identificador, usuario o estado.</p>
          </div>
          <button
            className="order-reset-button"
            type="button"
            onClick={() => {
              setFilters(EMPTY_FILTERS)
              loadOrders(EMPTY_FILTERS)
            }}
          >
            Limpiar filtros
          </button>
        </div>
        <div className="order-filters__fields">
          <div className="order-field">
            <label htmlFor="filter-order-id">ID de orden</label>
            <input
              id="filter-order-id"
              name="orderId"
              type="number"
              min="1"
              step="1"
              value={filters.orderId}
              onChange={handleFilterChange}
              placeholder="Ej. 1024"
            />
          </div>
          {canViewAllOrders && (
            <div className="order-field">
              <label htmlFor="filter-user-id">ID de usuario</label>
              <input
                id="filter-user-id"
                name="userId"
                type="number"
                min="1"
                step="1"
                value={filters.userId}
                onChange={handleFilterChange}
                placeholder="Todos los usuarios"
                disabled={Boolean(filters.orderId)}
              />
            </div>
          )}
          <div className="order-field">
            <label htmlFor="filter-status">Estado</label>
            <select
              id="filter-status"
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              disabled={canViewAllOrders && Boolean(filters.orderId)}
            >
              <option value="">Todos los estados</option>
              <option value="CONFIRMED">Confirmada</option>
              <option value="CANCELLED">Cancelada</option>
            </select>
          </div>
          <button className="order-primary-button" type="submit" disabled={loading}>
            {loading ? 'Buscando...' : 'Aplicar filtros'}
          </button>
        </div>
      </form>

      {successMessage && <p className="form-message" role="status">{successMessage}</p>}
      {error && (
        <div className="status-message status-message--error" role="alert">
          <p>{error}</p>
          <button type="button" onClick={() => loadOrders(filters)}>Reintentar</button>
        </div>
      )}
      {referenceError && (
        <div className="status-message status-message--error" role="alert">
          <p>No se pudieron cargar los nombres de usuarios y productos: {referenceError}</p>
          <button type="button" onClick={loadReferenceData}>Reintentar</button>
        </div>
      )}
      {loading && <p className="status-message">Cargando órdenes...</p>}
      {!loading && !error && orders.length === 0 && (
        <p className="status-message">No se encontraron órdenes con esos criterios.</p>
      )}
      {!loading && !error && orders.length > 0 && (
        <div className="orders-table-wrap">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Orden</th>
                <th>Usuario</th>
                <th>Productos</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Información</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, index) => {
                const orderId = getOrderId(order)
                const userId = getOrderUserId(order)
                const status = String(order.status ?? order.orderStatus ?? '').toUpperCase()
                const details = getOrderDetails(order)
                const createdAt = order.createdAt ?? order.creationDate
                const parsedDate = createdAt ? new Date(createdAt) : null
                const formattedDate =
                  parsedDate && !Number.isNaN(parsedDate.getTime())
                    ? new Intl.DateTimeFormat('es-CO', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      }).format(parsedDate)
                    : '—'

                return (
                  <tr key={orderId ?? index}>
                    <td><strong>#{orderId ?? 'N/D'}</strong></td>
                    <td>
                      {order.userName ?? order.user?.name ?? usersById[userId] ??
                        (userId !== undefined ? `Usuario #${userId}` : '—')}
                    </td>
                    <td>
                      {details.length > 0 ? (
                        <ul className="order-product-list">
                          {details.map((detail, detailIndex) => {
                            const productId = detail && typeof detail === 'object'
                              ? detail.idProduct ?? detail.productId ?? detail.product?.id
                              : undefined
                            const productName = productId !== undefined
                              ? productsById[productId] ?? detail.product?.name
                              : undefined
                            const productLabel = productId !== undefined
                              ? `${productName ?? `Producto #${productId}`} (#${productId})`
                              : typeof detail === 'number'
                                ? `Detalle #${detail} (sin datos del producto)`
                                : 'Producto no disponible'

                            return (
                              <li key={detail?.id ?? detailIndex}>
                                {productLabel}
                                {detail && typeof detail === 'object' && (
                                  <span> × {detail.quantity ?? '—'}</span>
                                )}
                              </li>
                            )
                          })}
                        </ul>
                      ) : '—'}
                    </td>
                    <td>{formattedDate}</td>
                    <td>
                      <span className={`order-status order-status--${status.toLowerCase() || 'unknown'}`}>
                        {STATUS_LABELS[status] ?? order.status ?? order.orderStatus ?? 'Sin estado'}
                      </span>
                    </td>
                    <td className="order-information">{order.information ?? '—'}</td>
                    <td>
                      {orderId !== undefined && status === 'CONFIRMED' ? (
                        <button
                          className="button-delete"
                          type="button"
                          onClick={() => handleCancelOrder(orderId)}
                          disabled={cancellingId !== null}
                        >
                          {cancellingId === orderId ? 'Cancelando...' : 'Cancelar'}
                        </button>
                      ) : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

export default OrdersPage
