import React, { useState, useEffect } from "react";
import ClientHub from "../../components/Home/ClientHub";
import HomeLoader from "../../components/Loaders/HomeLoader";
import { useAuth } from "../../context/AuthContext";

const ClientHome = () => {
  const { perfilLoading } = useAuth();
  const [dataReady, setDataReady] = useState(false);
  
  if (perfilLoading) return <HomeLoader />;
  
  return (
    <>
      {!dataReady && <HomeLoader />}
      <div className={!dataReady ? "opacity-0 h-0 overflow-hidden" : ""}>
        <ClientHub onDataReady={() => setDataReady(true)} />
      </div>
    </>
  );
};

export default ClientHome;
