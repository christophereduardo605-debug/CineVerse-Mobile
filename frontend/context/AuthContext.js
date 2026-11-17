import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../services/api";

const AuthContext = createContext(null);
const CHAVE_SESSAO = "@cineverse_auth";

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [token, setToken] = useState(null);
  const [carregando, setCarregando] = useState(true);

  // Restaurar sessão salva
  useEffect(() => {
    async function restaurarSessao() {
      try {
        const sessaoSalva = await AsyncStorage.getItem(CHAVE_SESSAO);

        if (sessaoSalva) {
          const sessao = JSON.parse(sessaoSalva);

          if (sessao.token && sessao.usuario) {
            setToken(sessao.token);
            setUsuario(sessao.usuario);
          }
        }
      } catch (erro) {
        console.log("Erro ao restaurar sessão:", erro);
        await AsyncStorage.removeItem(CHAVE_SESSAO);
      } finally {
        setCarregando(false);
      }
    }

    restaurarSessao();
  }, []);

  // Salvar usuário e token após o login
  async function salvarSessao(resposta) {
    if (!resposta.token || !resposta.usuario) {
      throw new Error(
        "O servidor não retornou os dados de autenticação."
      );
    }

    const sessao = {
      token: resposta.token,
      usuario: resposta.usuario,
    };

    await AsyncStorage.setItem(
      CHAVE_SESSAO,
      JSON.stringify(sessao)
    );

    setToken(sessao.token);
    setUsuario(sessao.usuario);
  }

  // Fazer login
  async function login(email, senha) {
    const resposta = await api("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, senha }),
    });

    await salvarSessao(resposta);

    return resposta.usuario;
  }

  // Criar conta sem iniciar uma sessão automaticamente
  async function cadastrar(nome, email, senha) {
    const resposta = await api("/auth/cadastro", {
      method: "POST",
      body: JSON.stringify({ nome, email, senha }),
    });

    return resposta.usuario;
  }

  // Atualizar dados do usuário em memória e no armazenamento
  async function atualizarUsuario(novosDados) {
    if (!usuario || !token) {
      throw new Error("Nenhum usuário autenticado.");
    }

    const usuarioAtualizado = {
      ...usuario,
      ...novosDados,
    };

    const sessao = {
      token,
      usuario: usuarioAtualizado,
    };

    await AsyncStorage.setItem(
      CHAVE_SESSAO,
      JSON.stringify(sessao)
    );

    setUsuario(usuarioAtualizado);
  }

  // Encerrar sessão
  async function logout() {
    await AsyncStorage.removeItem(CHAVE_SESSAO);
    setUsuario(null);
    setToken(null);
  }

  return (
    <AuthContext.Provider
      value={{
        usuario,
        token,
        carregando,
        autenticado: !!token && !!usuario,
        login,
        cadastrar,
        logout,
        atualizarUsuario,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const contexto = useContext(AuthContext);

  if (!contexto) {
    throw new Error(
      "useAuth precisa estar dentro de AuthProvider"
    );
  }

  return contexto;
}
