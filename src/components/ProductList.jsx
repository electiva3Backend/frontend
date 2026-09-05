import { useEffect, useState } from 'react'

const PRODUCTS_URL = 'http://localhost:8080/api/product'

function ProductList() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', category: '', price: '' })
  const [submitting, setSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const loadProducts = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(PRODUCTS_URL)

      if (!response.ok) {
        throw new Error(`La API respondió con ${response.status}`)
      }

      const payload = await response.json()
      const productList = Array.isArray(payload) ? payload : payload.data
      setProducts(Array.isArray(productList) ? productList : [])
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'No fue posible cargar los productos.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((currentForm) => ({ ...currentForm, [name]: value }))
  }

  const handleEdit = (product) => {
    const productId = product.id ?? product._id

    if (productId === undefined) {
      return
    }

    setEditingId(productId)
    setForm({
      name: product.name ?? product.nombre ?? '',
      category: product.category ?? product.categoria ?? '',
      price: product.price ?? product.precio ?? '',
    })
    setError('')
    setSuccessMessage('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setForm({ name: '', category: '', price: '' })
    setError('')
    setSuccessMessage('')
  }

  const handleDelete = async (productId) => {
    if (!window.confirm('¿Deseas eliminar este producto?')) {
      return
    }

    setDeletingId(productId)
    setError('')
    setSuccessMessage('')

    try {
      const response = await fetch(`${PRODUCTS_URL}/id/${productId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error(`La API respondió con ${response.status}`)
      }

      if (editingId === productId) {
        handleCancelEdit()
      }
      setSuccessMessage('Producto eliminado correctamente.')
      await loadProducts()
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'No fue posible eliminar el producto.',
      )
    } finally {
      setDeletingId(null)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccessMessage('')

    try {
      const response = await fetch(
        editingId === null ? PRODUCTS_URL : `${PRODUCTS_URL}/id/${editingId}`,
        {
        method: editingId === null ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          category: form.category,
          price: Number(form.price),
        }),
        },
      )

      if (!response.ok) {
        throw new Error(`La API respondió con ${response.status}`)
      }

      setForm({ name: '', category: '', price: '' })
      setSuccessMessage(
        editingId === null
          ? 'Producto creado correctamente.'
          : 'Producto actualizado correctamente.',
      )
      setEditingId(null)
      await loadProducts()
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : editingId === null
            ? 'No fue posible crear el producto.'
            : 'No fue posible actualizar el producto.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <form className="product-form" onSubmit={handleSubmit}>
        <div className="product-form__field">
          <label htmlFor="name">Nombre</label>
          <input id="name" name="name" value={form.name} onChange={handleChange} required />
        </div>
        <div className="product-form__field">
          <label htmlFor="category">Categoría</label>
          <input
            id="category"
            name="category"
            value={form.category}
            onChange={handleChange}
            required
          />
        </div>
        <div className="product-form__field">
          <label htmlFor="price">Precio</label>
          <input
            id="price"
            name="price"
            type="number"
            min="0"
            step="0.01"
            value={form.price}
            onChange={handleChange}
            required
          />
        </div>
        <div className="product-form__actions">
          <button type="submit" disabled={submitting}>
            {submitting
              ? 'Guardando...'
              : editingId === null
                ? 'Agregar producto'
                : 'Guardar cambios'}
          </button>
          {editingId !== null && (
            <button type="button" className="button-secondary" onClick={handleCancelEdit}>
              Cancelar
            </button>
          )}
        </div>
      </form>

      {successMessage && <p className="form-message">{successMessage}</p>}
      {error && (
        <div className="status-message status-message--error">
          <p>{error}</p>
          <button type="button" onClick={loadProducts}>
            Reintentar
          </button>
        </div>
      )}
      {loading && <p className="status-message">Cargando productos...</p>}
      {!loading && !error && products.length === 0 && (
        <p className="status-message">No hay productos disponibles.</p>
      )}
      {!loading && !error && products.length > 0 && (
        <div className="product-grid">
          {products.map((product, index) => {
            const productId = product.id ?? product._id
            const productKey = productId ?? index
            const productName = product.name ?? product.nombre ?? 'Producto sin nombre'
            const productDescription =
              product.description ?? product.descripcion ?? 'Sin descripción disponible.'
            const productPrice = product.price ?? product.precio

            return (
              <article className="product-card" key={productKey}>
                {product.image && (
                  <img className="product-card__image" src={product.image} alt="" />
                )}
                <div className="product-card__content">
                  <p className="product-card__eyebrow">{product.category ?? 'Producto'}</p>
                  <h2>{productName}</h2>
                  <p>{productDescription}</p>
                  {productPrice !== undefined && (
                    <strong className="product-card__price">${productPrice}</strong>
                  )}
                  {productId !== undefined && (
                    <div className="product-card__actions">
                      <button
                        type="button"
                        className="button-edit"
                        onClick={() => handleEdit(product)}
                        disabled={deletingId !== null}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="button-delete"
                        onClick={() => handleDelete(productId)}
                        disabled={deletingId !== null}
                      >
                        {deletingId === productId ? 'Eliminando...' : 'Eliminar'}
                      </button>
                    </div>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </>
  )
}

export default ProductList
