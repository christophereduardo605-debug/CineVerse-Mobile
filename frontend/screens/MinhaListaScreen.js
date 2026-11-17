
import React from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from "react-native";

import BottomMenu from "../components/BottomMenu";
import { useLista } from "../context/ListaContext";

const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

export default function MinhaListaScreen({ navigation }) {
  const { favoritos, alternarFavorito, carregando } = useLista();

  // RECUPERAR IMAGEM DO FAVORITO
  const obterImagem = (filme) => {
    if (filme.imagem) {
      return filme.imagem.startsWith("http")
        ? filme.imagem
        : `${IMAGE_BASE_URL}${filme.imagem}`;
    }

    if (filme.poster_path) {
      return filme.poster_path.startsWith("http")
        ? filme.poster_path
        : `${IMAGE_BASE_URL}${filme.poster_path}`;
    }

    return null;
  };

  // ABRIR DETALHES
  const abrirDetalhes = (filme) => {
    const id = filme.id || filme.tmdb_id;

    if (!id) {
      console.log("FAVORITO SEM ID:", filme);
      return;
    }

    const tmdbId =
      filme.tmdb_id ||
      (filme.origem === "tmdb" ? filme.id : null);

    navigation.navigate("Detalhes", {
      id,
      tmdb_id: tmdbId,
      origem: filme.origem || "mysql",
      titulo: filme.titulo,
      tipo: filme.tipo,
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        style={styles.rolagem}
        contentContainerStyle={[
          styles.conteudo,
          favoritos.length === 0 && styles.conteudoVazio,
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.titulo}>Minha Lista</Text>

        <Text style={styles.subtitulo}>
          Seus filmes e séries favoritos em um só lugar.
        </Text>

        {carregando ? (
          <View style={styles.areaVazia}>
            <Text style={styles.descricao}>
              Carregando seus favoritos...
            </Text>
          </View>
        ) : favoritos.length === 0 ? (
          <View style={styles.areaVazia}>
            <Text style={styles.icone}>♡</Text>

            <Text style={styles.tituloVazio}>
              Sua lista está vazia
            </Text>

            <Text style={styles.descricao}>
              Você ainda não adicionou nenhum filme ou série aos seus favoritos.
            </Text>

            <TouchableOpacity
              style={styles.botao}
              onPress={() => navigation.navigate("Filmes")}
            >
              <Text style={styles.textoBotao}>
                Explorar filmes
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.quantidade}>
              {favoritos.length}{" "}
              {favoritos.length === 1
                ? "item salvo"
                : "itens salvos"}
            </Text>

            <View style={styles.grade}>
              {favoritos.map((filme, index) => {
                const imagem = obterImagem(filme);

                return (
                  <View
                    key={`${filme.origem || "local"}-${filme.tipo || "filme"}-${filme.id || filme.tmdb_id || filme.titulo}-${index}`}
                    style={styles.card}
                  >
                    <TouchableOpacity
                      onPress={() => abrirDetalhes(filme)}
                      activeOpacity={0.75}
                    >
                      {imagem ? (
                        <Image
                          source={{ uri: imagem }}
                          style={styles.capa}
                          resizeMode="contain"
                        />
                      ) : (
                        <View style={styles.capaSemImagem}>
                          <Text style={styles.iconeCapa}>▶</Text>
                          <Text style={styles.textoSemImagem}>
                            Imagem indisponível
                          </Text>
                        </View>
                      )}

                      <Text style={styles.nome} numberOfLines={2}>
                        {filme.titulo}
                      </Text>

                      <Text style={styles.detalhes}>
                        {filme.ano || "Ano não informado"}
                        {filme.genero ? ` • ${filme.genero}` : ""}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.botaoRemover}
                      onPress={() => alternarFavorito(filme)}
                    >
                      <Text style={styles.textoRemover}>
                        ♥ Remover
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
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

  rolagem: {
    flex: 1,
  },

  conteudo: {
    paddingHorizontal: 20,
    paddingTop: 65,
    paddingBottom: 40,
    flexGrow: 1,
  },

  conteudoVazio: {
    flexGrow: 1,
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
  },

  areaVazia: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 50,
  },

  icone: {
    color: "#E50914",
    fontSize: 75,
    marginBottom: 15,
  },

  tituloVazio: {
    color: "#FFFFFF",
    fontSize: 23,
    fontWeight: "bold",
    textAlign: "center",
  },

  descricao: {
    color: "#999999",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
    marginTop: 12,
    marginBottom: 25,
    paddingHorizontal: 15,
  },

  botao: {
    backgroundColor: "#E50914",
    paddingVertical: 15,
    paddingHorizontal: 35,
    borderRadius: 10,
  },

  textoBotao: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
  },

  quantidade: {
    color: "#AAAAAA",
    fontSize: 13,
    marginTop: 28,
    marginBottom: 20,
  },

  grade: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  card: {
    width: "47%",
    marginBottom: 28,
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

  textoSemImagem: {
    color: "#888888",
    fontSize: 11,
    marginTop: 8,
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

  botaoRemover: {
    backgroundColor: "#251518",
    borderColor: "#6B1B22",
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    marginTop: 12,
    alignItems: "center",
  },

  textoRemover: {
    color: "#E50914",
    fontSize: 13,
    fontWeight: "bold",
  },
});
