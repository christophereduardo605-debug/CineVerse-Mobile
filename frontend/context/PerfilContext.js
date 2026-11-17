
import React, { createContext, useContext } from "react";

import { useAuth } from "./AuthContext";

const PerfilContext = createContext(null);

export function PerfilProvider({ children }) {
  const { usuario, atualizarUsuario } = useAuth();

  const perfil = {
    nome: usuario?.nome || "",
    email: usuario?.email || "",
    foto: usuario?.foto || "",
  };

  async function atualizarPerfil(novosDados) {
    await atualizarUsuario(novosDados);
  }

  return (
    <PerfilContext.Provider
      value={{ perfil, atualizarPerfil }}
    >
      {children}
    </PerfilContext.Provider>
  );
}

export function usePerfil() {
  const contexto = useContext(PerfilContext);

  if (!contexto) {
    throw new Error(
      "usePerfil precisa estar dentro de PerfilProvider"
    );
  }

  return contexto;
}
