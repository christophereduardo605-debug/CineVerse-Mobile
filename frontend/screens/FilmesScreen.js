
import React, { useEffect, useState } from "react";
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
import { buscarCatalogoFilmesTMDB } from "../services/filmesService";

const extrairFilmes = (dados) => {
  if (Array.isArray(dados)) return dados;
  if (Array.isArray(dados?.resultados)) return dados.resultados;
  if (Array.isArray(dados?.results)) return dados.results;

  return [];
};

export default function FilmesScreen({ navigation }) {
  const [filmes, setFilmes] = useState([]);
  const [pesquisa, setPesquisa] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [erro, setErro] = useState("");
  const [pagina, setPagina] = useState(1);
  const [temMais, setTemMais] = useState(true);

  useEffect(() => {
    carregarFilmes();
  }, []);

  // CARREGAR CATÁLOGO
  const carregarFilmes = async () => {
    try {
      setCarregando(true);
      setErro("");
      setPagina(1);
      setTemMais(true);

      const dados = await buscarCatalogoFilmesTMDB(1);
      const lista = extrairFilmes(dados);

      setFilmes(lista);
      setPagina(1);

      setTemMais(
        typeof dados?.tem_mais === "boolean"
          ? dados.tem_mais
          : lista.length > 0
      );
    } catch (error) {
      console.error("Erro ao carregar catálogo de filmes:", error);

      setErro(
        "Não foi possível carregar os filmes. Verifique sua conexão."
      );

      setFilmes([]);
    } finally {
      setCarregando(false);
    }
  };

  // CARREGAR MAIS FILMES
  const carregarMaisFilmes = async () => {
    if (carregandoMais || !temMais) return;

    try {
      setCarregandoMais(true);
      setErro("");

      const proximaPagina = pagina + 1;
      const dados = await buscarCatalogoFilmesTMDB(proximaPagina);
      const lista = extrairFilmes(dados);

      if (lista.length > 0) {
        setFilmes((anteriores) => {
          const idsExistentes = new Set(
            anteriores.map((filme) => filme.tmdb_id ?? filme.id)
          );

          const novosFilmes = lista.filter((filme) => {
            const id = filme.tmdb_id ?? filme.id;
            return id != null && !idsExistentes.has(id);
          });

          return [...anteriores, ...novosFilmes];
        });

        setPagina(proximaPagina);

        setTemMais(
          typeof dados?.tem_mais === "boolean"
            ? dados.tem_mais
            : lista.length > 0
        );
      } else {
        setTemMais(false);
      }
    } catch (error) {
      console.error("Erro ao carregar mais filmes:", error);
      setErro("Não foi possível carregar mais filmes.");
    } finally {
      setCarregandoMais(false);
    }
  };

  // FILTRAR FILMES
  const filmesFiltrados = filmes.filter((filme) => {
    const termo = pesquisa.trim().toLowerCase();

    return (
      filme.titulo?.toLowerCase().includes(termo) ||
      filme.descricao?.toLowerCase().includes(termo)
    );
  });

  // ABRIR DETALHES
  const abrirDetalhes = (filme) => {
    const id = filme.tmdb_id ?? filme.id;

    navigation.navigate("Detalhes", {
      id,
      tmdb_id: id,
      origem: "tmdb",
      titulo: filme.titulo,
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        contentContainerStyle={styles.conteudo}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.titulo}>Filmes</Text>

        <Text style={styles.subtitulo}>
          Explore nosso catálogo de filmes
        </Text>

        <TextInput
          style={styles.campoPesquisa}
          placeholder="Pesquisar filmes..."
          placeholderTextColor="#888888"
          value={pesquisa}
          onChangeText={setPesquisa}
          autoCorrect={false}
        />

        <Text style={styles.quantidade}>
          {filmesFiltrados.length} filmes encontrados
        </Text>

        {carregando ? (
          <ActivityIndicator
            size="large"
            color="#E50914"
            style={styles.carregando}
          />
        ) : erro && filmes.length === 0 ? (
          <View>
            <Text style={styles.semResultados}>{erro}</Text>

            <TouchableOpacity
              style={styles.botaoTentar}
              onPress={carregarFilmes}
            >
              <Text style={styles.textoBotao}>
                Tentar novamente
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.grade}>
              {filmesFiltrados.map((filme, index) => {
                const id = filme.tmdb_id ?? filme.id;

                return (
                  <TouchableOpacity
                    key={id ?? `filme-${index}`}
                    style={styles.card}
                    onPress={() => abrirDetalhes(filme)}
                    activeOpacity={0.75}
                  >
                    {filme.imagem ? (
                      <Image
                        source={{ uri: filme.imagem }}
                        style={styles.capa}
                        resizeMode="contain"
                      />
                    ) : (
                      <View style={[styles.capa, styles.capaVazia]}>
                        <Text style={styles.textoCapa}>
                          {filme.titulo}
                        </Text>
                      </View>
                    )}

                    <Text style={styles.nome} numberOfLines={2}>
                      {filme.titulo}
                    </Text>

                    <Text style={styles.detalhes}>
                      {filme.ano || "Ano não informado"} • Filme
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {filmesFiltrados.length === 0 && (
              <Text style={styles.semResultados}>
                Nenhum filme encontrado.
              </Text>
            )}

            {erro !== "" && filmes.length > 0 && (
              <Text style={styles.erroSecundario}>{erro}</Text>
            )}

            {!pesquisa.trim() && temMais && (
              <TouchableOpacity
                style={styles.botaoCarregarMais}
                onPress={carregarMaisFilmes}
                disabled={carregandoMais}
              >
                {carregandoMais ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.textoBotao}>
                    Carregar mais filmes
                  </Text>
                )}
              </TouchableOpacity>
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
    marginTop: 20,
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

  capaVazia: {
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
  },

  textoCapa: {
    color: "#AAAAAA",
    textAlign: "center",
    fontWeight: "bold",
  },

  nome: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
    marginTop: 10,
  },

  detalhes: {
    color: "#999999",
    fontSize: 12,
    marginTop: 5,
  },

  carregando: {
    marginTop: 40,
  },

  semResultados: {
    color: "#AAAAAA",
    textAlign: "center",
    marginTop: 35,
  },

  erroSecundario: {
    color: "#FF7777",
    textAlign: "center",
    marginTop: 15,
  },

  botaoTentar: {
    backgroundColor: "#E50914",
    padding: 12,
    borderRadius: 8,
    alignSelf: "center",
    marginTop: 15,
  },

  botaoCarregarMais: {
    backgroundColor: "#E50914",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
  },

  textoBotao: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
});
