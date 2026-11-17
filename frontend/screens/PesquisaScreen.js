
import React, { useEffect, useRef, useState } from "react";

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Keyboard,
} from "react-native";

import { api } from "../services/api";

export default function PesquisaScreen({ navigation }) {
  const [busca, setBusca] = useState("");
  const [tipo, setTipo] = useState("Filme");
  const [resultados, setResultados] = useState([]);
  const [sugestoes, setSugestoes] = useState([]);

  const [carregando, setCarregando] = useState(false);
  const [carregandoSugestoes, setCarregandoSugestoes] = useState(false);

  const [erro, setErro] = useState("");
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);

  const temporizador = useRef(null);
  const requisicaoAtual = useRef(0);

  // ======================================
  // CANCELAR TEMPORIZADOR AO SAIR DA TELA
  // ======================================

  useEffect(() => {
    return () => {
      if (temporizador.current) {
        clearTimeout(temporizador.current);
      }

      requisicaoAtual.current += 1;
    };
  }, []);

  // ======================================
  // VOLTAR PARA A TELA ANTERIOR
  // ======================================

  const voltar = () => {
    Keyboard.dismiss();

    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate("Home");
    }
  };

  // ======================================
  // DEFINIR ROTA DA PESQUISA
  // ======================================

  const obterRotaPesquisa = (termo, categoria) => {
    return categoria === "Filme"
      ? `/tmdb/filmes?busca=${encodeURIComponent(termo)}`
      : `/tmdb/series?busca=${encodeURIComponent(termo)}`;
  };

  // ======================================
  // BUSCAR SUGESTÕES AUTOMATICAMENTE
  // ======================================

  useEffect(() => {
    const termo = busca.trim();

    if (temporizador.current) {
      clearTimeout(temporizador.current);
    }

    if (termo.length < 2) {
      requisicaoAtual.current += 1;
      setSugestoes([]);
      setCarregandoSugestoes(false);
      setMostrarSugestoes(false);
      return;
    }

    const numeroRequisicao = ++requisicaoAtual.current;

    setMostrarSugestoes(true);
    setCarregandoSugestoes(true);
    setErro("");

    temporizador.current = setTimeout(async () => {
      try {
        const dados = await api(obterRotaPesquisa(termo, tipo));

        // Ignora respostas de pesquisas antigas.
        if (numeroRequisicao !== requisicaoAtual.current) {
          return;
        }

        const lista = Array.isArray(dados) ? dados : [];

        setSugestoes(lista.slice(0, 6));
      } catch (error) {
        if (numeroRequisicao === requisicaoAtual.current) {
          console.error("Erro ao carregar sugestões:", error);
          setSugestoes([]);
        }
      } finally {
        if (numeroRequisicao === requisicaoAtual.current) {
          setCarregandoSugestoes(false);
        }
      }
    }, 400);

    return () => {
      if (temporizador.current) {
        clearTimeout(temporizador.current);
      }
    };
  }, [busca, tipo]);

  // ======================================
  // PESQUISAR FILMES E SÉRIES
  // ======================================

  const pesquisar = async () => {
    const termo = busca.trim();

    if (termo.length < 2) {
      setErro("Digite pelo menos 2 caracteres.");
      setResultados([]);
      return;
    }

    if (temporizador.current) {
      clearTimeout(temporizador.current);
    }

    requisicaoAtual.current += 1;

    Keyboard.dismiss();
    setMostrarSugestoes(false);
    setCarregandoSugestoes(false);
    setCarregando(true);
    setErro("");
    setResultados([]);

    try {
      const dados = await api(obterRotaPesquisa(termo, tipo));

      const lista = Array.isArray(dados) ? dados : [];

      setResultados(lista);

      if (lista.length === 0) {
        setErro("Nenhum resultado encontrado.");
      }
    } catch (error) {
      console.error("Erro na pesquisa:", error);

      setErro(
        "Não foi possível realizar a pesquisa. Verifique o servidor."
      );
    } finally {
      setCarregando(false);
    }
  };

  // ======================================
  // ABRIR DETALHES DO FILME OU SÉRIE
  // ======================================

  const abrirDetalhes = (item) => {
    if (!item?.tmdb_id) {
      console.error("Resultado sem ID do TMDB:", item);

      setErro("Não foi possível abrir este título. ID não encontrado.");
      return;
    }

    if (temporizador.current) {
      clearTimeout(temporizador.current);
    }

    requisicaoAtual.current += 1;

    Keyboard.dismiss();
    setMostrarSugestoes(false);

    console.log("CINEVERSE: abrindo detalhes:", {
      titulo: item.titulo,
      tmdb_id: item.tmdb_id,
      tipo: item.tipo,
    });

    navigation.navigate("Detalhes", {
      origem: "tmdb",
      id: item.tmdb_id,
      tmdb_id: item.tmdb_id,
      titulo: item.titulo,
      tipo: item.tipo || tipo,
    });
  };

  // ======================================
  // TROCAR CATEGORIA
  // ======================================

  const trocarTipo = (novoTipo) => {
    if (temporizador.current) {
      clearTimeout(temporizador.current);
    }

    setTipo(novoTipo);
    setResultados([]);
    setSugestoes([]);
    setErro("");

    setMostrarSugestoes(busca.trim().length >= 2);
  };

  // ======================================
  // RENDERIZAR CARD DE RESULTADO
  // ======================================

  const renderizarResultado = (item, compacto = false) => (
    <TouchableOpacity
      key={`${item.tipo || tipo}-${item.tmdb_id}`}
      style={[
        styles.card,
        compacto && styles.cardSugestao,
      ]}
      onPress={() => abrirDetalhes(item)}
      activeOpacity={0.75}
    >
      {item.imagem ? (
        <Image
          source={{ uri: item.imagem }}
          style={[
            styles.poster,
            compacto && styles.posterSugestao,
          ]}
          resizeMode="cover"
        />
      ) : (
        <View
          style={[
            styles.posterSemImagem,
            compacto && styles.posterSugestao,
          ]}
        >
          <Text style={styles.semImagem}>Sem imagem</Text>
        </View>
      )}

      <View style={styles.informacoes}>
        <Text style={styles.titulo} numberOfLines={2}>
          {item.titulo}
        </Text>

        <Text style={styles.detalhes}>
          {item.ano || "Ano não informado"} • {item.tipo || tipo}
        </Text>

        {!compacto && (
          <>
            <Text style={styles.descricao} numberOfLines={4}>
              {item.descricao || "Sinopse não disponível."}
            </Text>

            <Text style={styles.idTMDB}>
              ID TMDB: {item.tmdb_id}
            </Text>

            <Text style={styles.textoAbrir}>
              Ver detalhes →
            </Text>
          </>
        )}
      </View>

      {compacto && (
        <Text style={styles.iconeSugestao}>›</Text>
      )}
    </TouchableOpacity>
  );

  // ======================================
  // TELA DE PESQUISA
  // ======================================

  return (
    <View style={styles.container}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.conteudo}
      >
        {/* BOTÃO VOLTAR */}

        <TouchableOpacity
          style={styles.botaoVoltar}
          onPress={voltar}
          activeOpacity={0.7}
        >
          <Text style={styles.textoVoltar}>‹ Voltar</Text>
        </TouchableOpacity>

        <Text style={styles.cabecalho}>
          PESQUISAR
        </Text>

        <Text style={styles.subtitulo}>
          Encontre filmes e séries no CineVerse
        </Text>

        {/* CAMPO DE PESQUISA */}

        <View style={styles.campoPesquisa}>
          <Text style={styles.iconePesquisa}>⌕</Text>

          <TextInput
            style={styles.input}
            placeholder="Digite o nome do filme ou série..."
            placeholderTextColor="#888"
            value={busca}
            onChangeText={(texto) => {
              setBusca(texto);
              setErro("");
              setResultados([]);
            }}
            onFocus={() => {
              if (busca.trim().length >= 2) {
                setMostrarSugestoes(true);
              }
            }}
            onSubmitEditing={pesquisar}
            returnKeyType="search"
          />

          {busca.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setBusca("");
                setResultados([]);
                setSugestoes([]);
                setErro("");
                setMostrarSugestoes(false);
              }}
              style={styles.botaoLimpar}
            >
              <Text style={styles.textoLimpar}>✕</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.botaoPesquisa}
            onPress={pesquisar}
            disabled={carregando}
          >
            <Text style={styles.textoBotao}>
              Buscar
            </Text>
          </TouchableOpacity>
        </View>

        {/* FILTROS */}

        <View style={styles.filtros}>
          <TouchableOpacity
            style={[
              styles.filtro,
              tipo === "Filme" && styles.filtroAtivo,
            ]}
            onPress={() => trocarTipo("Filme")}
          >
            <Text
              style={[
                styles.textoFiltro,
                tipo === "Filme" && styles.textoFiltroAtivo,
              ]}
            >
              Filmes
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filtro,
              tipo === "Série" && styles.filtroAtivo,
            ]}
            onPress={() => trocarTipo("Série")}
          >
            <Text
              style={[
                styles.textoFiltro,
                tipo === "Série" && styles.textoFiltroAtivo,
              ]}
            >
              Séries
            </Text>
          </TouchableOpacity>
        </View>

        {/* SUGESTÕES AUTOMÁTICAS */}

        {mostrarSugestoes && (
          <View style={styles.areaSugestoes}>
            <Text style={styles.tituloSugestoes}>
              SUGESTÕES
            </Text>

            {carregandoSugestoes && sugestoes.length === 0 && (
              <ActivityIndicator
                color="#E50914"
                style={styles.carregandoSugestoes}
              />
            )}

            {!carregandoSugestoes && sugestoes.length === 0 && (
              <Text style={styles.semSugestoes}>
                Nenhuma sugestão encontrada.
              </Text>
            )}

            {sugestoes.map((item) =>
              renderizarResultado(item, true)
            )}

            {sugestoes.length > 0 && (
              <TouchableOpacity
                style={styles.botaoVerTodos}
                onPress={pesquisar}
              >
                <Text style={styles.textoVerTodos}>
                  Ver todos os resultados →
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* CARREGAMENTO DA PESQUISA COMPLETA */}

        {carregando && (
          <ActivityIndicator
            size="large"
            color="#E50914"
            style={styles.carregando}
          />
        )}

        {/* ERRO */}

        {!!erro && (
          <Text style={styles.erro}>
            {erro}
          </Text>
        )}

        {/* MENSAGEM INICIAL */}

        {!carregando &&
          resultados.length === 0 &&
          !erro &&
          !mostrarSugestoes && (
            <Text style={styles.mensagemInicial}>
              Digite um título para receber sugestões automaticamente.
            </Text>
          )}

        {/* RESULTADOS COMPLETOS */}

        {!carregando &&
          resultados.map((item) =>
            renderizarResultado(item)
          )}
      </ScrollView>
    </View>
  );
}

// ======================================
// ESTILOS
// ======================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#090909",
  },

  conteudo: {
    padding: 20,
    paddingBottom: 110,
  },

  botaoVoltar: {
    alignSelf: "flex-start",
    marginTop: 10,
    marginBottom: 15,
    paddingVertical: 8,
    paddingRight: 15,
  },

  textoVoltar: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },

  cabecalho: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "bold",
    marginTop: 20,
  },

  subtitulo: {
    color: "#AAAAAA",
    fontSize: 14,
    marginTop: 8,
    marginBottom: 24,
  },

  campoPesquisa: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#202020",
    borderRadius: 10,
    paddingLeft: 12,
    marginBottom: 18,
  },

  iconePesquisa: {
    color: "#AAAAAA",
    fontSize: 25,
    marginRight: 7,
  },

  input: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 14,
    paddingVertical: 14,
    minWidth: 0,
  },

  botaoPesquisa: {
    backgroundColor: "#E50914",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
  },

  textoBotao: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },

  botaoLimpar: {
    paddingHorizontal: 8,
    paddingVertical: 10,
  },

  textoLimpar: {
    color: "#AAAAAA",
    fontSize: 16,
  },

  filtros: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },

  filtro: {
    flex: 1,
    backgroundColor: "#252525",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },

  filtroAtivo: {
    backgroundColor: "#E50914",
  },

  textoFiltro: {
    color: "#CCCCCC",
    fontWeight: "bold",
  },

  textoFiltroAtivo: {
    color: "#FFFFFF",
  },

  areaSugestoes: {
    backgroundColor: "#141414",
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#292929",
  },

  tituloSugestoes: {
    color: "#AAAAAA",
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 1,
    marginBottom: 12,
  },

  carregandoSugestoes: {
    marginVertical: 18,
  },

  semSugestoes: {
    color: "#888888",
    textAlign: "center",
    padding: 16,
  },

  card: {
    flexDirection: "row",
    backgroundColor: "#191919",
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#292929",
  },

  cardSugestao: {
    backgroundColor: "#202020",
    alignItems: "center",
    marginBottom: 8,
    padding: 8,
    borderColor: "#303030",
  },

  poster: {
    width: 105,
    height: 155,
    borderRadius: 7,
    backgroundColor: "#333333",
  },

  posterSugestao: {
    width: 48,
    height: 68,
    borderRadius: 5,
  },

  posterSemImagem: {
    width: 105,
    height: 155,
    borderRadius: 7,
    backgroundColor: "#333333",
    alignItems: "center",
    justifyContent: "center",
  },

  semImagem: {
    color: "#AAAAAA",
    fontSize: 12,
  },

  informacoes: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "center",
  },

  titulo: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 6,
  },

  detalhes: {
    color: "#E50914",
    fontSize: 12,
    marginBottom: 8,
  },

  descricao: {
    color: "#BBBBBB",
    fontSize: 12,
    lineHeight: 18,
  },

  idTMDB: {
    color: "#777777",
    fontSize: 10,
    marginTop: 8,
  },

  textoAbrir: {
    color: "#E50914",
    fontSize: 13,
    fontWeight: "bold",
    marginTop: 10,
  },

  iconeSugestao: {
    color: "#888888",
    fontSize: 25,
    paddingHorizontal: 8,
  },

  botaoVerTodos: {
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 5,
  },

  textoVerTodos: {
    color: "#E50914",
    fontWeight: "bold",
    fontSize: 13,
  },

  carregando: {
    marginTop: 30,
  },

  erro: {
    color: "#FF5555",
    textAlign: "center",
    marginTop: 20,
  },

  mensagemInicial: {
    color: "#888888",
    textAlign: "center",
    marginTop: 35,
  },
});
