
import React, { useEffect, useState, useRef } from "react";

import {
  View,
  Text,
  Image,
  ImageBackground,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
} from "react-native";

import BottomMenu from "../components/BottomMenu";
import { useAuth } from "../context/AuthContext";

import {
  buscarFilmesPopularesPaginados,
  buscarLancamentosPaginados,
  buscarFilmesEmAltaPaginados,
} from "../services/filmesService";

import {
  buscarSeriesPopularesPaginadas,
  buscarSeriesEmAltaPaginadas,
} from "../services/seriesService";

// ======================================
// GARANTIR QUE A RESPOSTA SEJA UMA LISTA
// ======================================

const extrairLista = (dados) => {
  if (Array.isArray(dados)) return dados;
  if (Array.isArray(dados?.results)) return dados.results;
  if (Array.isArray(dados?.resultados)) return dados.resultados;
  return [];
};

// ======================================
// IDENTIFICAR E REMOVER TÍTULOS DUPLICADOS
// ======================================

const removerDuplicados = (lista) => {
  const encontrados = new Set();

  return lista.filter((item) => {
    const id = item.tmdb_id || item.id;

    const identificador = id
      ? String(id)
      : `${item.titulo || item.nome || ""}-${item.ano || ""}`
          .toLowerCase()
          .trim();

    if (!identificador || encontrados.has(identificador)) {
      return false;
    }

    encontrados.add(identificador);
    return true;
  });
};

// ======================================
// VERIFICAR SE EXISTEM MAIS PÁGINAS
// ======================================

const verificarTemMais = (dados, pagina) => {
  if (typeof dados?.tem_mais === "boolean") {
    return dados.tem_mais;
  }

  if (dados?.total_paginas) {
    return pagina < dados.total_paginas;
  }

  return false;
};

// ======================================
// CARD DE CADA FILME OU SÉRIE
// ======================================

function Secao({
  titulo,
  itens,
  tipo,
  navigation,
  carregarMais,
  carregandoMais,
}) {
  const listaRef = useRef(null);

  const [posicao, setPosicao] = useState(0);
  const [larguraLista, setLarguraLista] = useState(0);
  const [larguraConteudo, setLarguraConteudo] = useState(0);

  const maximoScroll = Math.max(
    0,
    larguraConteudo - larguraLista
  );

  // ======================================
  // ABRIR DETALHES
  // ======================================

  const abrirItem = (item) => {
    const id = item.tmdb_id || item.id;

    if (tipo === "serie") {
      navigation.navigate("DetalhesSerie", {
        origem: "tmdb",
        id,
        tmdb_id: id,
        titulo: item.titulo || item.nome,
      });

      return;
    }

    navigation.navigate("Detalhes", {
      origem: "tmdb",
      id,
      tmdb_id: id,
      titulo: item.titulo || item.nome,
    });
  };

  // ======================================
  // MOVIMENTAR CARROSSEL
  // ======================================

  const moverLista = (direcao) => {
    if (maximoScroll <= 0) return;

    const novoOffset = Math.max(
      0,
      Math.min(
        posicao + direcao * 350,
        maximoScroll
      )
    );

    listaRef.current?.scrollTo({
      x: novoOffset,
      animated: true,
    });

    setPosicao(novoOffset);
  };

  // ======================================
  // DETECTAR CHEGADA PERTO DO FINAL
  // ======================================

  const verificarFinal = (event) => {
    const {
      contentOffset,
      contentSize,
      layoutMeasurement,
    } = event.nativeEvent;

    const distanciaPercorrida =
      contentOffset.x + layoutMeasurement.width;

    const distanciaFinal =
      contentSize.width - 450;

    if (
      contentSize.width > layoutMeasurement.width + 50 &&
      distanciaPercorrida >= distanciaFinal
    ) {
      carregarMais();
    }
  };

  if (!itens || itens.length === 0) return null;

  return (
    <View style={styles.secao}>
      <View style={styles.cabecalhoSecao}>
        <Text style={styles.tituloSecao}>{titulo}</Text>

        <View style={styles.controlesLista}>
          <TouchableOpacity
            style={[
              styles.setaLista,
              posicao <= 5 && styles.setaDesativada,
            ]}
            onPress={() => moverLista(-1)}
            activeOpacity={0.7}
            disabled={posicao <= 5}
          >
            <Text style={styles.textoSeta}>‹</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.setaLista,
              posicao >= maximoScroll - 5 &&
                styles.setaDesativada,
            ]}
            onPress={() => moverLista(1)}
            activeOpacity={0.7}
            disabled={posicao >= maximoScroll - 5}
          >
            <Text style={styles.textoSeta}>›</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        ref={listaRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        nestedScrollEnabled
        onLayout={(event) => {
          setLarguraLista(event.nativeEvent.layout.width);
        }}
        onContentSizeChange={(width) => {
          setLarguraConteudo(width);
        }}
        onScroll={(event) => {
          setPosicao(event.nativeEvent.contentOffset.x);
          verificarFinal(event);
        }}
        scrollEventThrottle={16}
      >
        {itens.map((item, index) => (
          <TouchableOpacity
            key={`${tipo}-${item.tmdb_id || item.id || index}`}
            style={styles.card}
            onPress={() => abrirItem(item)}
            activeOpacity={0.75}
          >
            <View style={styles.poster}>
              {item.imagem ? (
                <Image
                  source={{ uri: item.imagem }}
                  style={styles.imagemPoster}
                  resizeMode="cover"
                />
              ) : (
                <Text style={styles.posterIcone}>▶</Text>
              )}
            </View>

            <Text style={styles.nomeCard} numberOfLines={2}>
              {item.titulo || item.nome || "Sem título"}
            </Text>

            {item.ano ? (
              <Text style={styles.anoCard}>
                {item.ano}
              </Text>
            ) : null}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {carregandoMais && (
        <ActivityIndicator
          size="small"
          color="#E50914"
          style={styles.carregandoMais}
        />
      )}
    </View>
  );
}

// ======================================
// HOME
// ======================================

export default function HomeScreen({ navigation }) {
  // Dados do usuário autenticado
  const { usuario } = useAuth();

  // Gerar iniciais do usuário
  const iniciaisUsuario = usuario?.nome
    ?.trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join("")
    .toUpperCase() || "US";

  const [seriesPopulares, setSeriesPopulares] = useState([]);
  const [seriesEmAlta, setSeriesEmAlta] = useState([]);

  const [filmesParaVoce, setFilmesParaVoce] = useState([]);
  const [lancamentos, setLancamentos] = useState([]);
  const [filmesEmAlta, setFilmesEmAlta] = useState([]);

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [carregandoMais, setCarregandoMais] = useState({
    filmesParaVoce: false,
    lancamentos: false,
    filmesEmAlta: false,
    seriesPopulares: false,
    seriesEmAlta: false,
  });

  // ======================================
  // CONTROLE DAS PÁGINAS
  // ======================================

  const paginacaoRef = useRef({
    filmesParaVoce: {
      pagina: 1,
      temMais: true,
      carregando: false,
    },
    lancamentos: {
      pagina: 1,
      temMais: true,
      carregando: false,
    },
    filmesEmAlta: {
      pagina: 1,
      temMais: true,
      carregando: false,
    },
    seriesPopulares: {
      pagina: 1,
      temMais: true,
      carregando: false,
    },
    seriesEmAlta: {
      pagina: 1,
      temMais: true,
      carregando: false,
    },
  });

  // ======================================
  // FUNÇÕES DE BUSCA
  // ======================================

  const funcoesPaginadas = {
    filmesParaVoce: buscarFilmesPopularesPaginados,
    lancamentos: buscarLancamentosPaginados,
    filmesEmAlta: buscarFilmesEmAltaPaginados,
    seriesPopulares: buscarSeriesPopularesPaginadas,
    seriesEmAlta: buscarSeriesEmAltaPaginadas,
  };

  const atualizarLista = {
    filmesParaVoce: setFilmesParaVoce,
    lancamentos: setLancamentos,
    filmesEmAlta: setFilmesEmAlta,
    seriesPopulares: setSeriesPopulares,
    seriesEmAlta: setSeriesEmAlta,
  };

  // ======================================
  // CARREGAR PRIMEIRA PÁGINA
  // ======================================

  const carregarCatalogo = async () => {
    try {
      setCarregando(true);
      setErro("");

      Object.keys(paginacaoRef.current).forEach((chave) => {
        paginacaoRef.current[chave] = {
          pagina: 1,
          temMais: true,
          carregando: false,
        };
      });

      const chaves = Object.keys(funcoesPaginadas);

      const resultados = await Promise.allSettled(
        chaves.map((chave) => funcoesPaginadas[chave](1))
      );

      let algumaRequisicaoFuncionou = false;

      resultados.forEach((resultado, index) => {
        const chave = chaves[index];

        if (resultado.status === "fulfilled") {
          algumaRequisicaoFuncionou = true;

          const dados = resultado.value;
          const lista = removerDuplicados(extrairLista(dados));

          atualizarLista[chave](lista);

          paginacaoRef.current[chave] = {
            pagina: 1,
            temMais: verificarTemMais(dados, 1),
            carregando: false,
          };
        } else {
          atualizarLista[chave]([]);

          paginacaoRef.current[chave] = {
            pagina: 1,
            temMais: false,
            carregando: false,
          };

          console.error(
            `Erro ao carregar ${chave}:`,
            resultado.reason
          );
        }
      });

      if (!algumaRequisicaoFuncionou) {
        setErro("Não foi possível carregar o catálogo.");
      }
    } catch (error) {
      console.error("Erro ao carregar catálogo:", error);
      setErro("Não foi possível carregar o catálogo.");
    } finally {
      setCarregando(false);
    }
  };

  // ======================================
  // CARREGAR PRÓXIMA PÁGINA
  // ======================================

  const carregarProximaPagina = async (chave) => {
    const controle = paginacaoRef.current[chave];

    if (
      !controle ||
      !controle.temMais ||
      controle.carregando
    ) {
      return;
    }

    controle.carregando = true;

    setCarregandoMais((anterior) => ({
      ...anterior,
      [chave]: true,
    }));

    const proximaPagina = controle.pagina + 1;

    try {
      const resposta = await funcoesPaginadas[chave](
        proximaPagina
      );

      const novosItens = extrairLista(resposta);

      atualizarLista[chave]((anteriores) => {
        return removerDuplicados([
          ...anteriores,
          ...novosItens,
        ]);
      });

      controle.pagina = proximaPagina;
      controle.temMais = verificarTemMais(
        resposta,
        proximaPagina
      );
    } catch (error) {
      console.error(
        `Erro ao carregar próxima página de ${chave}:`,
        error
      );
    } finally {
      controle.carregando = false;

      setCarregandoMais((anterior) => ({
        ...anterior,
        [chave]: false,
      }));
    }
  };

  // ======================================
  // INICIALIZAÇÃO
  // ======================================

  useEffect(() => {
    carregarCatalogo();
  }, []);

  // ======================================
  // DESTAQUE PRINCIPAL
  // ======================================

  const filmeDestaque =
    filmesParaVoce[0] ||
    filmesEmAlta[0] ||
    lancamentos[0] ||
    null;

  const abrirDestaque = () => {
    if (!filmeDestaque) return;

    const tmdbId =
      filmeDestaque.tmdb_id || filmeDestaque.id;

    navigation.navigate("Detalhes", {
      origem: "tmdb",
      id: tmdbId,
      tmdb_id: tmdbId,
      titulo: filmeDestaque.titulo,
    });
  };

  // ======================================
  // CONTEÚDO DO DESTAQUE
  // ======================================

  const conteudoDestaque = (
    <>
      <Text style={styles.etiqueta}>
        DESTAQUE DO CINEVERSE
      </Text>

      <Text style={styles.tituloFilme}>
        {filmeDestaque?.titulo || "CINEVERSE"}
      </Text>

      <Text style={styles.informacoes}>
        {filmeDestaque?.ano || "Explore nosso catálogo"} • Filme
      </Text>

      <Text style={styles.sinopse} numberOfLines={4}>
        {filmeDestaque?.descricao ||
          "Explore filmes, lançamentos e produções em alta."}
      </Text>

      {filmeDestaque && (
        <TouchableOpacity
          style={styles.botaoAssistir}
          onPress={abrirDestaque}
          activeOpacity={0.8}
        >
          <Text style={styles.textoBotao}>
            Ver detalhes
          </Text>
        </TouchableOpacity>
      )}
    </>
  );

  // ======================================
  // RENDERIZAÇÃO
  // ======================================

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.conteudo}
      >
        {/* CABEÇALHO */}

        <View style={styles.cabecalho}>
          <Text style={styles.logo}>
            CINE<Text style={styles.logoVermelho}>VERSE</Text>
          </Text>

          {/* AÇÕES DO CABEÇALHO */}

          <View style={styles.acoesCabecalho}>
            <TouchableOpacity
              style={styles.botaoNotificacoes}
              onPress={() => navigation.navigate("Notificacoes")}
              activeOpacity={0.75}
              accessibilityLabel="Abrir notificações"
            >
              <Text style={styles.iconeNotificacao}>
                🔔
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate("Perfil")}
              activeOpacity={0.75}
            >
              <Text style={styles.avatar}>
                {iniciaisUsuario}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {carregando ? (
          <ActivityIndicator
            size="large"
            color="#E50914"
            style={styles.carregando}
          />
        ) : erro ? (
          <View style={styles.mensagem}>
            <Text style={styles.textoMensagem}>
              {erro}
            </Text>

            <TouchableOpacity
              style={styles.botaoAssistir}
              onPress={carregarCatalogo}
            >
              <Text style={styles.textoBotao}>
                Tentar novamente
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* DESTAQUE PRINCIPAL */}

            {filmeDestaque?.imagem ? (
              <ImageBackground
                source={{ uri: filmeDestaque.imagem }}
                style={styles.destaque}
                imageStyle={styles.imagemDestaque}
                resizeMode="cover"
              >
                <View style={styles.overlayDestaque}>
                  {conteudoDestaque}
                </View>
              </ImageBackground>
            ) : (
              <View style={styles.destaque}>
                {conteudoDestaque}
              </View>
            )}

            {/* FILMES PARA VOCÊ */}

            <Secao
              titulo="Filmes para você"
              itens={filmesParaVoce}
              tipo="filme"
              navigation={navigation}
              carregarMais={() =>
                carregarProximaPagina("filmesParaVoce")
              }
              carregandoMais={carregandoMais.filmesParaVoce}
            />

            {/* LANÇAMENTOS */}

            <Secao
              titulo="Lançamentos recentes"
              itens={lancamentos}
              tipo="filme"
              navigation={navigation}
              carregarMais={() =>
                carregarProximaPagina("lancamentos")
              }
              carregandoMais={carregandoMais.lancamentos}
            />

            {/* FILMES EM ALTA */}

            <Secao
              titulo="Filmes em alta"
              itens={filmesEmAlta}
              tipo="filme"
              navigation={navigation}
              carregarMais={() =>
                carregarProximaPagina("filmesEmAlta")
              }
              carregandoMais={carregandoMais.filmesEmAlta}
            />

            {/* SÉRIES POPULARES */}

            <Secao
              titulo="Séries populares"
              itens={seriesPopulares}
              tipo="serie"
              navigation={navigation}
              carregarMais={() =>
                carregarProximaPagina("seriesPopulares")
              }
              carregandoMais={carregandoMais.seriesPopulares}
            />

            {/* SÉRIES EM ALTA */}

            <Secao
              titulo="Séries em alta"
              itens={seriesEmAlta}
              tipo="serie"
              navigation={navigation}
              carregarMais={() =>
                carregarProximaPagina("seriesEmAlta")
              }
              carregandoMais={carregandoMais.seriesEmAlta}
            />

            {/* CATÁLOGO VAZIO */}

            {filmesParaVoce.length === 0 &&
              lancamentos.length === 0 &&
              filmesEmAlta.length === 0 &&
              seriesPopulares.length === 0 &&
              seriesEmAlta.length === 0 && (
                <Text style={styles.textoMensagem}>
                  Nenhum título disponível no momento.
                </Text>
              )}
          </>
        )}

        <View style={styles.espacoFinal} />
      </ScrollView>

      <BottomMenu />
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
    paddingBottom: 20,
  },

  cabecalho: {
    paddingTop: 55,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  logo: {
    fontSize: 24,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  logoVermelho: {
    color: "#E50914",
  },

  // NOVOS ESTILOS DO CABEÇALHO

  acoesCabecalho: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },

  botaoNotificacoes: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#252525",
    justifyContent: "center",
    alignItems: "center",
  },

  iconeNotificacao: {
    fontSize: 21,
  },

  avatar: {
    backgroundColor: "#E50914",
    color: "#FFFFFF",
    fontWeight: "bold",
    padding: 12,
    borderRadius: 30,
    overflow: "hidden",
  },

  destaque: {
    backgroundColor: "#202027",
    marginHorizontal: 15,
    borderRadius: 16,
    minHeight: 350,
    overflow: "hidden",
    justifyContent: "flex-end",
  },

  imagemDestaque: {
    borderRadius: 16,
  },

  overlayDestaque: {
    flex: 1,
    minHeight: 350,
    justifyContent: "flex-end",
    padding: 24,
    backgroundColor: "rgba(0,0,0,0.65)",
  },

  etiqueta: {
    color: "#E50914",
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 2,
  },

  tituloFilme: {
    color: "#FFFFFF",
    fontSize: 35,
    fontWeight: "900",
    marginTop: 12,
  },

  informacoes: {
    color: "#53D769",
    marginTop: 12,
    fontSize: 12,
  },

  sinopse: {
    color: "#CCCCCC",
    fontSize: 14,
    lineHeight: 22,
    marginTop: 15,
    marginBottom: 20,
  },

  botaoAssistir: {
    backgroundColor: "#E50914",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },

  textoBotao: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },

  secao: {
    marginTop: 30,
    paddingLeft: 20,
  },

  cabecalhoSecao: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingRight: 20,
  },

  tituloSecao: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
  },

  controlesLista: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 15,
  },

  setaLista: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#292929",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#444444",
  },

  setaDesativada: {
    opacity: 0.35,
  },

  textoSeta: {
    color: "#FFFFFF",
    fontSize: 30,
    lineHeight: 32,
    marginTop: -4,
  },

  card: {
    width: 135,
    marginRight: 12,
  },

  poster: {
    height: 190,
    borderRadius: 10,
    backgroundColor: "#27272F",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },

  imagemPoster: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },

  posterIcone: {
    color: "#E50914",
    fontSize: 35,
  },

  nomeCard: {
    color: "#FFFFFF",
    fontSize: 13,
    marginTop: 8,
  },

  anoCard: {
    color: "#999999",
    fontSize: 11,
    marginTop: 3,
  },

  carregando: {
    marginTop: 60,
  },

  carregandoMais: {
    marginTop: 12,
    marginBottom: 5,
  },

  mensagem: {
    paddingHorizontal: 20,
    marginTop: 40,
  },

  textoMensagem: {
    color: "#AAAAAA",
    textAlign: "center",
    marginTop: 25,
  },

  espacoFinal: {
    height: 30,
  },
});
