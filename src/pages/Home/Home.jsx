import React from "react";
import ClientHub from "../../components/Home/ClientHub";
import HomeLoader from "../../components/Loaders/HomeLoader";
import { useAuth } from "../../context/AuthContext";

const ClientHome = () => {
  const { perfilLoading } = useAuth();
  
  if (perfilLoading) return <HomeLoader />;
  
  return <ClientHub />;
};

export default ClientHome;
