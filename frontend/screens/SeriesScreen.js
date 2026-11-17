
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
} from "react-native";

import BottomMenu from "../components/BottomMenu";

import {
  buscarSeriesPopularesPaginadas,
  buscarSeriesEmAltaPaginadas,
  buscarSeriesPorNome,
} from "../services/seriesService";

export default function SeriesScreen({ navigation }) {
  const [series, setSeries] = useState([]);
  const [pesquisa, setPesquisa] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [erro, setErro] = useState("");

  const paginaRef = useRef(1);
  const temMaisRef = useRef(true);
  const carregandoRef = useRef(false);
  const pesquisaRef = useRef("");

  const extrairLista = (dados) => {
    if (Array.isArray(dados)) return dados;

    return (
      dados?.resultados ||
      dados?.series ||
      dados?.results ||
      []
    );
  };

  const extrairTemMais = (dados, lista) => {
    if (typeof dados?.tem_mais === "boolean") {
      return dados.tem_mais;
    }

    if (typeof dados?.total_paginas === "number") {
      return dados.pagina < dados.total_paginas;
    }

    return lista.length >= 20;
  };

  const prepararSeries = (lista, categoria) => {
    return lista
      .map((serie) => {
        const id = serie.tmdb_id || serie.id;

        if (!id) return null;

        return {
          ...serie,
          id,
          tmdb_id: id,
          origem: "tmdb",
          categoria,
        };
      })
      .filter(Boolean);
  };

  const juntarSeries = (populares, emAlta) => {
    const mapaSeries = new Map();

    emAlta.forEach((serie) => {
      mapaSeries.set(String(serie.tmdb_id), {
        ...serie,
        categoria: "Em alta",
      });
    });

    populares.forEach((serie) => {
      const chave = String(serie.tmdb_id);

      if (mapaSeries.has(chave)) {
        mapaSeries.set(chave, {
          ...mapaSeries.get(chave),
          categoria: "Popular e em alta",
        });
      } else {
        mapaSeries.set(chave, {
          ...serie,
          categoria: "Popular",
        });
      }
    });

    return Array.from(mapaSeries.values());
  };

  const carregarPagina = async (
    pagina,
    termoPesquisa = "",
    reiniciar = false
  ) => {
    if (carregandoRef.current) return;

    carregandoRef.current = true;

    if (reiniciar) {
      setCarregando(true);
      setErro("");
      setSeries([]);
      paginaRef.current = 1;
      temMaisRef.current = true;
    } else {
      setCarregandoMais(true);
    }

    try {
      if (termoPesquisa.trim()) {
        const resposta = await buscarSeriesPorNome(
          termoPesquisa.trim(),
          pagina
        );

        const lista = extrairLista(resposta);
        const novasSeries = prepararSeries(
          lista,
          "Resultado da pesquisa"
        );

        setSeries((anteriores) =>
          pagina === 1
            ? novasSeries
            : [...anteriores, ...novasSeries]
        );

        temMaisRef.current = extrairTemMais(resposta, lista);
      } else {
        const resultados = await Promise.allSettled([
          buscarSeriesPopularesPaginadas(pagina),
          buscarSeriesEmAltaPaginadas(pagina),
        ]);

        const popularesResposta =
          resultados[0].status === "fulfilled"
            ? resultados[0].value
            : null;

        const emAltaResposta =
          resultados[1].status === "fulfilled"
            ? resultados[1].value
            : null;

        if (!popularesResposta && !emAltaResposta) {
          throw new Error("Falha ao consultar o TMDB.");
        }

        const popularesLista = extrairLista(popularesResposta);
        const emAltaLista = extrairLista(emAltaResposta);

        const populares = prepararSeries(
          popularesLista,
          "Popular"
        );

        const emAlta = prepararSeries(
          emAltaLista,
          "Em alta"
        );

        const novasSeries = juntarSeries(populares, emAlta);

        setSeries((anteriores) => {
          if (pagina === 1) return novasSeries;

          const mapa = new Map();

          anteriores.forEach((serie) => {
            mapa.set(String(serie.tmdb_id), serie);
          });

          novasSeries.forEach((serie) => {
            const chave = String(serie.tmdb_id);

            if (mapa.has(chave)) {
              const anterior = mapa.get(chave);

              mapa.set(chave, {
                ...anterior,
                ...serie,
                categoria:
                  anterior.categoria === "Popular e em alta" ||
                  serie.categoria === "Popular e em alta"
                    ? "Popular e em alta"
                    : serie.categoria,
              });
            } else {
              mapa.set(chave, serie);
            }
          });

          return Array.from(mapa.values());
        });

        const popularesTemMais = popularesResposta
          ? extrairTemMais(popularesResposta, popularesLista)
          : false;

        const emAltaTemMais = emAltaResposta
          ? extrairTemMais(emAltaResposta, emAltaLista)
          : false;

        temMaisRef.current =
          popularesTemMais || emAltaTemMais;
      }

      paginaRef.current = pagina;
    } catch (error) {
      console.error("Erro ao carregar séries:", error);

      if (pagina === 1) {
        setErro(
          "Não foi possível carregar as séries do TMDB."
        );
      } else {
        console.error(
          "Não foi possível carregar a próxima página."
        );
      }
    } finally {
      carregandoRef.current = false;
      setCarregando(false);
      setCarregandoMais(false);
    }
  };

  useEffect(() => {
    pesquisaRef.current = pesquisa;

    const temporizador = setTimeout(() => {
      carregarPagina(1, pesquisa, true);
    }, 450);

    return () => clearTimeout(temporizador);
  }, [pesquisa]);

  const carregarMais = () => {
    if (
      carregandoRef.current ||
      !temMaisRef.current ||
      carregando ||
      carregandoMais
    ) {
      return;
    }

    carregarPagina(
      paginaRef.current + 1,
      pesquisaRef.current
    );
  };

  const verificarFimDaLista = ({ nativeEvent }) => {
    const { layoutMeasurement, contentOffset, contentSize } =
      nativeEvent;

    const chegouAoFinal =
      layoutMeasurement.height + contentOffset.y >=
      contentSize.height - 500;

    if (chegouAoFinal) {
      carregarMais();
    }
  };

  const seriesFiltradas = series;

  const abrirDetalhes = (serie) => {
    const id = serie.tmdb_id || serie.id;

    navigation.navigate("DetalhesSerie", {
      origem: "tmdb",
      id,
      tmdb_id: id,
      titulo: serie.titulo || serie.nome,
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        contentContainerStyle={styles.conteudo}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        onScroll={verificarFimDaLista}
        scrollEventThrottle={400}
      >
        <Text style={styles.titulo}>Séries</Text>

        <Text style={styles.subtitulo}>
          Explore séries populares e as maiores tendências
        </Text>

        <TextInput
          style={styles.campoPesquisa}
          placeholder="Pesquisar séries..."
          placeholderTextColor="#888888"
          value={pesquisa}
          onChangeText={setPesquisa}
          autoCorrect={false}
        />

        <Text style={styles.quantidade}>
          {seriesFiltradas.length} séries carregadas
        </Text>

        {carregando ? (
          <ActivityIndicator
            size="large"
            color="#E50914"
            style={styles.carregando}
          />
        ) : erro ? (
          <View>
            <Text style={styles.semResultados}>{erro}</Text>

            <TouchableOpacity
              style={styles.botaoTentar}
              onPress={() =>
                carregarPagina(1, pesquisaRef.current, true)
              }
            >
              <Text style={styles.textoBotaoTentar}>
                Tentar novamente
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.grade}>
              {seriesFiltradas.map((serie, index) => {
                const id = serie.tmdb_id || serie.id;
                const titulo = serie.titulo || serie.nome;

                return (
                  <TouchableOpacity
                    key={`tmdb-${id || index}`}
                    style={styles.card}
                    onPress={() => abrirDetalhes(serie)}
                    activeOpacity={0.75}
                  >
                    {serie.imagem ? (
                      <Image
                        source={{ uri: serie.imagem }}
                        style={styles.capa}
                        resizeMode="contain"
                      />
                    ) : (
                      <View style={styles.capaSemImagem}>
                        <Text style={styles.iconeCapa}>▶</Text>
                      </View>
                    )}

                    <Text style={styles.categoria}>
                      {serie.categoria}
                    </Text>

                    <Text
                      style={styles.nome}
                      numberOfLines={2}
                    >
                      {titulo || "Série sem título"}
                    </Text>

                    <Text style={styles.detalhes}>
                      {serie.ano || "Ano não informado"} • Série
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {seriesFiltradas.length === 0 && (
              <Text style={styles.semResultados}>
                {pesquisa
                  ? "Nenhuma série encontrada para essa pesquisa."
                  : "Nenhuma série encontrada no TMDB."}
              </Text>
            )}

            {carregandoMais && (
              <ActivityIndicator
                size="large"
                color="#E50914"
                style={styles.carregandoMais}
              />
            )}

            {!temMaisRef.current && series.length > 0 && (
              <Text style={styles.finalLista}>
                Você chegou ao final dos resultados.
              </Text>
            )}
          </>
        )}
      </ScrollView>

      <BottomMenu />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#090909",
  },

  conteudo: {
    paddingHorizontal: 20,
    paddingTop: 65,
    paddingBottom: 40,
  },

  titulo: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "900",
  },

  subtitulo: {
    color: "#AAAAAA",
    fontSize: 14,
    marginTop: 8,
    marginBottom: 25,
  },

  campoPesquisa: {
    backgroundColor: "#1D1D22",
    color: "#FFFFFF",
    padding: 15,
    borderRadius: 10,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#333333",
  },

  quantidade: {
    color: "#AAAAAA",
    marginTop: 22,
    marginBottom: 20,
    fontSize: 13,
  },

  grade: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    width: "100%",
  },

  card: {
    width: "47%",
    marginBottom: 25,
    flexShrink: 0,
  },

  capa: {
    width: "100%",
    aspectRatio: 2 / 3,
    borderRadius: 12,
    backgroundColor: "#151515",
  },

  capaSemImagem: {
    width: "100%",
    aspectRatio: 2 / 3,
    borderRadius: 12,
    backgroundColor: "#25252A",
    justifyContent: "center",
    alignItems: "center",
  },

  iconeCapa: {
    color: "#E50914",
    fontSize: 35,
  },

  categoria: {
    color: "#E50914",
    fontSize: 11,
    fontWeight: "bold",
    marginTop: 9,
  },

  nome: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
    marginTop: 5,
  },

  detalhes: {
    color: "#999999",
    fontSize: 12,
    marginTop: 5,
  },

  carregando: {
    marginTop: 50,
  },

  carregandoMais: {
    marginVertical: 25,
  },

  finalLista: {
    color: "#777777",
    textAlign: "center",
    marginTop: 15,
    marginBottom: 20,
    fontSize: 12,
  },

  semResultados: {
    color: "#AAAAAA",
    textAlign: "center",
    marginTop: 35,
  },

  botaoTentar: {
    backgroundColor: "#E50914",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },

  textoBotaoTentar: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
});
