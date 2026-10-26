import { useState } from "react";
import AuthPage from "./components/AuthPage";
import ProductApp from "./ProductApp";
import "./App.css";

function App() {
  const [auth, setAuth] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("inventory-auth"));
    } catch {
      return null;
    }
  });

  const handleAuthenticated = (authResponse) => {
    localStorage.setItem("inventory-auth", JSON.stringify(authResponse));
    setAuth(authResponse);
  };

  const handleLogout = () => {
    localStorage.removeItem("inventory-auth");
    setAuth(null);
  };

return auth ? (
  <ProductApp
    user={auth.user}
    accessToken={auth.accessToken}
    tokenType={auth.tokenType}
    onLogout={handleLogout}
  />
) : (
  <AuthPage onAuthenticated={handleAuthenticated} />
)
}

export default App;
