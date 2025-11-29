import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Auth0Provider } from "@auth0/auth0-react";
import "./styles/theme.css";
import "./styles/Global.css";
import "./styles/App.css";
import authConfig from "./authConfig";

import Homepage from "./components/Homepage";
import BudgetOverview from "./components/ProtectedPage";
import ProtectedRoute from "./components/ProtectedRoutes";
import Navigation from "./components/Navigation";
import Footer from "./components/Footer";
import ExpenseTracker from "./components/ExpenseTracker";
import BudgetManager from "./components/BudgetManager";

function App() {
  return (
    <Auth0Provider
      domain={authConfig.domain}
      clientId={authConfig.clientId}
      authorizationParams={{
        redirect_uri: authConfig.redirectUri,
        audience: authConfig.audience,
        scope: "openid profile email read:budget write:budget",
      }}
    >
      <Router>
        <Navigation />
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route
            path="/budget-overview"
            element={
              <ProtectedRoute>
                <BudgetOverview />
              </ProtectedRoute>
            }
          />
          <Route path="/BudgetManager" element={<BudgetManager />} />
          <Route path="/expense-tracker" element={<ExpenseTracker />} />
        </Routes>
        <Footer />
      </Router>
    </Auth0Provider>
  );
}

export default App;
