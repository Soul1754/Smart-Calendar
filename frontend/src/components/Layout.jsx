import React, { useContext } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import { AuthContext } from "../App";

const Layout = () => {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const isDashboardHome = location.pathname === "/dashboard";

  return (
    <div className="min-h-screen bg-[#0a0e27]">
      {!isDashboardHome && <Navbar />}
      <main className={isDashboardHome ? "" : "container mx-auto px-4 py-8"}>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
