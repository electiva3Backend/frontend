import { useState } from 'react'
import ProductList from './components/ProductList'
import UserList from './components/UserList'
import OrdersPage from './components/OrdersPage'

function ProductApp({ user, onLogout }) {
  const [view, setView] = useState('products')
  const viewCopy = {
    products: {
      title: 'Productos',
      description: 'Consulta los productos disponibles en el inventario.',
    },
    users: {
      title: 'Usuarios',
      description: 'Administra las cuentas que tienen acceso al sistema.',
    },
    orders: {
      title: 'Órdenes',
      description: 'Consulta, crea y gestiona las órdenes de compra.',
    },
  }[view]

  return (
    <main className="catalog">
      <header className="catalog__header">
        <div className="catalog__topline">
          <p className="catalog__eyebrow">Panel de gestión</p>
          <button className="catalog__logout" type="button" onClick={onLogout}>
            Cerrar sesión
          </button>
        </div>
        <h1>{viewCopy.title}</h1>
        <p>Hola, {user?.name || user?.email}. {viewCopy.description}</p>
      </header>
      <nav className="catalog-nav" aria-label="Secciones">
        <button className={view === 'products' ? 'catalog-nav__item catalog-nav__item--active' : 'catalog-nav__item'} type="button" onClick={() => setView('products')}>Productos</button>
        <button className={view === 'orders' ? 'catalog-nav__item catalog-nav__item--active' : 'catalog-nav__item'} type="button" onClick={() => setView('orders')}>Órdenes</button>
        <button className={view === 'users' ? 'catalog-nav__item catalog-nav__item--active' : 'catalog-nav__item'} type="button" onClick={() => setView('users')}>Usuarios</button>
      </nav>
      {view === 'products' && <ProductList />}
      {view === 'orders' && <OrdersPage user={user} />}
      {view === 'users' && <UserList />}
    </main>
  )
}

export default ProductApp
