import React, { createContext, useContext, useState } from "react";

const PerfilContext = createContext(null);

export function PerfilProvider({ children }) {
  const [perfil, setPerfil] = useState({
    nome: "Christopher Eduardo",
    email: "usuario@cineverse.com",
    foto: "",
  });

  const atualizarPerfil = (novosDados) => {
    setPerfil((anterior) => ({
      ...anterior,
      ...novosDados,
    }));
  };

  return (
    <PerfilContext.Provider value={{ perfil, atualizarPerfil }}>
      {children}
    </PerfilContext.Provider>
  );
}

export function usePerfil() {
  const contexto = useContext(PerfilContext);

  if (!contexto) {
    throw new Error("usePerfil precisa estar dentro de PerfilProvider");
  }

  return contexto;
}
