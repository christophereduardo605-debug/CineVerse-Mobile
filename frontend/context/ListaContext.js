import React, { createContext, useContext, useEffect, useState } from "react";

import AsyncStorage from "@react-native-async-storage/async-storage";

const ListaContext = createContext(null);

const CHAVE_FAVORITOS = "@cineverse_favoritos";

export function ListaProvider({ children }) {
  const [favoritos, setFavoritos] = useState([]);
  const [carregando, setCarregando] = useState(true);

  // Carregar os favoritos salvos no celular
  useEffect(() => {
    let ativo = true;

    async function carregarFavoritos() {
      try {
        const dados = await AsyncStorage.getItem(CHAVE_FAVORITOS);

        console.log("FAVORITOS CARREGADOS:", dados);

        if (ativo && dados !== null) {
          const lista = JSON.parse(dados);

          if (Array.isArray(lista)) {
            setFavoritos(lista);
          }
        }
      } catch (erro) {
        console.error("ERRO AO CARREGAR FAVORITOS:", erro);
      } finally {
        if (ativo) {
          setCarregando(false);
        }
      }
    }

    carregarFavoritos();

    return () => {
      ativo = false;
    };
  }, []);

  // Salvar os favoritos automaticamente
  useEffect(() => {
    if (carregando) return;

    async function salvarFavoritos() {
      try {
        const dados = JSON.stringify(favoritos);

        await AsyncStorage.setItem(CHAVE_FAVORITOS, dados);

        console.log("FAVORITOS SALVOS:", dados);
      } catch (erro) {
        console.error("ERRO AO SALVAR FAVORITOS:", erro);
      }
    }

    salvarFavoritos();
  }, [favoritos, carregando]);

  // Adicionar ou remover favoritos
  const alternarFavorito = (filme) => {
    if (carregando) {
      console.log("Aguarde o carregamento dos favoritos.");
      return;
    }

    setFavoritos((listaAtual) => {
      const existe = listaAtual.some((item) => item.titulo === filme.titulo);

      if (existe) {
        return listaAtual.filter((item) => item.titulo !== filme.titulo);
      }

      return [...listaAtual, filme];
    });
  };

  // Verificar se o filme já é favorito
  const verificarFavorito = (titulo) => {
    return favoritos.some((item) => item.titulo === titulo);
  };

  return (
    <ListaContext.Provider
      value={{
        favoritos,
        alternarFavorito,
        verificarFavorito,
        carregando,
      }}
    >
      {children}
    </ListaContext.Provider>
  );
}

export function useLista() {
  const contexto = useContext(ListaContext);

  if (!contexto) {
    throw new Error("useLista precisa estar dentro de ListaProvider");
  }

  return contexto;
}
