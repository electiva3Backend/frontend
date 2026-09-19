import { useState } from 'react'
import ProductList from './components/ProductList'
import UserList from './components/UserList'

function ProductApp({ user, onLogout }) {
  const [view, setView] = useState('products')

  return (
    <main className="catalog">
      <header className="catalog__header">
        <div className="catalog__topline">
          <p className="catalog__eyebrow">Catálogo</p>
          <button className="catalog__logout" type="button" onClick={onLogout}>
            Cerrar sesión
          </button>
        </div>
        <h1>{view === 'products' ? 'Productos' : 'Usuarios'}</h1>
        <p>Hola, {user?.name || user?.email}. {view === 'products' ? 'Consulta los productos disponibles en el inventario.' : 'Administra las cuentas que tienen acceso al sistema.'}</p>
      </header>
      <nav className="catalog-nav" aria-label="Secciones">
        <button className={view === 'products' ? 'catalog-nav__item catalog-nav__item--active' : 'catalog-nav__item'} type="button" onClick={() => setView('products')}>Productos</button>
        <button className={view === 'users' ? 'catalog-nav__item catalog-nav__item--active' : 'catalog-nav__item'} type="button" onClick={() => setView('users')}>Usuarios</button>
      </nav>
      {view === 'products' ? <ProductList /> : <UserList />}
    </main>
  )
}

export default ProductApp
