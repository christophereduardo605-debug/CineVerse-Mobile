
import React, { useCallback, useEffect, useState } from "react";

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native";

import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";

const IMAGEM_BASE = "https://image.tmdb.org/t/p/w500";

export default function NotificacoesScreen({ navigation }) {
  const { token } = useAuth();

  const [notificacoes, setNotificacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState("");

  // Preparar endereço da imagem
  function obterImagem(imagem) {
    if (!imagem) return null;

    if (imagem.startsWith("http")) {
      return imagem;
    }

    return `${IMAGEM_BASE}${imagem.startsWith("/") ? "" : "/"}${imagem}`;
  }

  // Buscar notificações do usuário
  const carregarNotificacoes = useCallback(async (atualizacao = false) => {
    if (!token) {
      setCarregando(false);
      setErro("Faça login para visualizar suas notificações.");
      return;
    }

    try {
      if (atualizacao) {
        setAtualizando(true);
      } else {
        setCarregando(true);
      }

      setErro("");

      const resposta = await api("/usuarios/me/notificacoes", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setNotificacoes(Array.isArray(resposta) ? resposta : []);

    } catch (error) {
      console.log("Erro ao carregar notificações:", error);
      setErro(error.message || "Não foi possível carregar as notificações.");
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, [token]);

  useEffect(() => {
    carregarNotificacoes();
  }, [carregarNotificacoes]);

  // Marcar notificação como lida
  async function marcarComoLida(id) {
    const notificacao = notificacoes.find((item) => item.id === id);

    if (!notificacao || Boolean(notificacao.lida)) {
      return;
    }

    // Atualização visual imediata
    setNotificacoes((anteriores) =>
      anteriores.map((item) =>
        item.id === id ? { ...item, lida: 1 } : item
      )
    );

    try {
      await api(`/usuarios/me/notificacoes/${id}/lida`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.log("Erro ao marcar notificação como lida:", error);

      // Restaurar estado caso a operação falhe
      setNotificacoes((anteriores) =>
        anteriores.map((item) =>
          item.id === id ? { ...item, lida: 0 } : item
        )
      );
    }
  }

  // Formatar data da notificação
  function formatarData(data) {
    if (!data) return "";

    const dataFormatada = new Date(data);

    if (Number.isNaN(dataFormatada.getTime())) {
      return "";
    }

    return dataFormatada.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* CABEÇALHO */}
      <View style={styles.cabecalho}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.botaoVoltar}
        >
          <Text style={styles.voltar}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.titulo}>
          Notificações
        </Text>

        <TouchableOpacity
          style={styles.botaoAtualizar}
          onPress={() => carregarNotificacoes(true)}
        >
          <Text style={styles.iconeAtualizar}>↻</Text>
        </TouchableOpacity>
      </View>

      {/* CONTEÚDO */}
      {carregando ? (
        <View style={styles.estado}>
          <ActivityIndicator size="large" color="#E50914" />
          <Text style={styles.textoEstado}>
            Carregando notificações...
          </Text>
        </View>
      ) : erro ? (
        <View style={styles.estado}>
          <Text style={styles.iconeEstado}>⚠️</Text>

          <Text style={styles.tituloEstado}>
            Não foi possível carregar
          </Text>

          <Text style={styles.textoEstado}>
            {erro}
          </Text>

          <TouchableOpacity
            style={styles.botaoTentar}
            onPress={() => carregarNotificacoes()}
          >
            <Text style={styles.textoBotaoTentar}>
              Tentar novamente
            </Text>
          </TouchableOpacity>
        </View>
      ) : notificacoes.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.conteudoVazio}
          refreshControl={
            <RefreshControl
              refreshing={atualizando}
              onRefresh={() => carregarNotificacoes(true)}
              tintColor="#E50914"
            />
          }
        >
          <View style={styles.vazio}>
            <Text style={styles.icone}>🔔</Text>

            <Text style={styles.tituloVazio}>
              Suas novidades aparecem aqui
            </Text>

            <Text style={styles.descricao}>
              Quando novos filmes e séries forem
              adicionados ao CineVerse, você poderá
              acompanhar as novidades nesta tela.
            </Text>
          </View>
        </ScrollView>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.lista}
          refreshControl={
            <RefreshControl
              refreshing={atualizando}
              onRefresh={() => carregarNotificacoes(true)}
              tintColor="#E50914"
            />
          }
        >
          <Text style={styles.subtitulo}>
            {notificacoes.length}{" "}
            {notificacoes.length === 1
              ? "notificação"
              : "notificações"}
          </Text>

          {notificacoes.map((item) => {
            const lida = Boolean(item.lida);
            const imagem = obterImagem(item.imagem);

            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.8}
                onPress={() => marcarComoLida(item.id)}
                style={[
                  styles.cartao,
                  !lida && styles.cartaoNaoLido,
                ]}
              >
                {imagem ? (
                  <Image
                    source={{ uri: imagem }}
                    style={styles.imagem}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.imagemSemCapa}>
                    <Text style={styles.iconeCapa}>🎬</Text>
                  </View>
                )}

                <View style={styles.informacoes}>
                  <View style={styles.linhaTitulo}>
                    <Text style={styles.tituloNotificacao}>
                      {item.titulo}
                    </Text>

                    {!lida && (
                      <View style={styles.pontoNaoLido} />
                    )}
                  </View>

                  <Text style={styles.mensagem}>
                    {item.mensagem}
                  </Text>

                  <Text style={styles.data}>
                    {formatarData(item.criada_em)}
                  </Text>

                  <Text style={styles.status}>
                    {lida ? "Lida" : "Toque para marcar como lida"}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#090909",
  },

  cabecalho: {
    paddingTop: 55,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#252525",
  },

  botaoVoltar: {
    width: 40,
    height: 40,
    justifyContent: "center",
  },

  voltar: {
    color: "#FFFFFF",
    fontSize: 38,
  },

  titulo: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
  },

  botaoAtualizar: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  iconeAtualizar: {
    color: "#FFFFFF",
    fontSize: 28,
  },

  lista: {
    padding: 20,
    paddingBottom: 40,
  },

  subtitulo: {
    color: "#999999",
    fontSize: 13,
    marginBottom: 16,
  },

  cartao: {
    flexDirection: "row",
    backgroundColor: "#151515",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#252525",
  },

  cartaoNaoLido: {
    borderColor: "#E50914",
    backgroundColor: "#1B1112",
  },

  imagem: {
    width: 75,
    height: 105,
    borderRadius: 7,
    backgroundColor: "#252525",
  },

  imagemSemCapa: {
    width: 75,
    height: 105,
    borderRadius: 7,
    backgroundColor: "#252525",
    justifyContent: "center",
    alignItems: "center",
  },

  iconeCapa: {
    fontSize: 30,
  },

  informacoes: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "center",
  },

  linhaTitulo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  tituloNotificacao: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
    flex: 1,
  },

  pontoNaoLido: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#E50914",
    marginLeft: 8,
  },

  mensagem: {
    color: "#CCCCCC",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 7,
  },

  data: {
    color: "#777777",
    fontSize: 11,
    marginTop: 9,
  },

  status: {
    color: "#E50914",
    fontSize: 11,
    marginTop: 5,
  },

  estado: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },

  iconeEstado: {
    fontSize: 40,
    marginBottom: 15,
  },

  tituloEstado: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },

  textoEstado: {
    color: "#999999",
    fontSize: 14,
    textAlign: "center",
    marginTop: 12,
    lineHeight: 21,
  },

  botaoTentar: {
    backgroundColor: "#E50914",
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },

  textoBotaoTentar: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },

  conteudoVazio: {
    flexGrow: 1,
    padding: 20,
  },

  vazio: {
    flex: 1,
    minHeight: 400,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  icone: {
    fontSize: 55,
    marginBottom: 20,
  },

  tituloVazio: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },

  descricao: {
    color: "#999999",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
    marginTop: 12,
  },
});
