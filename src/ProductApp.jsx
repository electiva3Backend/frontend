import ProductList from './components/ProductList'

function ProductApp() {
  return (
    <main className="catalog">
      <header className="catalog__header">
        <p className="catalog__eyebrow">Catálogo</p>
        <h1>Productos</h1>
        <p>Consulta los productos disponibles en el inventario.</p>
      </header>
      <ProductList />
    </main>
  )
}

export default ProductApp
