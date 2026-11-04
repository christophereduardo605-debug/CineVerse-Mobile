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

// Capas dos filmes
const capas = {
  "Código Sombrio": require("../assets/posters/codigo-sombrio.png"),
  "Além do Horizonte": require("../assets/posters/alem-do-horizonte.png"),
  "Distrito Neon": require("../assets/posters/distrito-neon.png"),
  "Último Sinal": require("../assets/posters/ultimo-sinal.png"),
  "O Observador": require("../assets/posters/o-observador.png"),
  "Entre Mundos": require("../assets/posters/entre-mundos.png"),
};

export default function MinhaListaScreen({ navigation }) {
  const { favoritos, alternarFavorito } = useLista();

  const abrirDetalhes = (filme) => {
    navigation.navigate("Detalhes", {
      titulo: filme.titulo,
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
      >
        <Text style={styles.titulo}>Minha Lista</Text>

        <Text style={styles.subtitulo}>
          Seus filmes e séries favoritos em um só lugar.
        </Text>

        {favoritos.length === 0 ? (
          <View style={styles.areaVazia}>
            <Text style={styles.icone}>♡</Text>

            <Text style={styles.tituloVazio}>Sua lista está vazia</Text>

            <Text style={styles.descricao}>
              Você ainda não adicionou nenhum filme ou série aos seus favoritos.
            </Text>

            <TouchableOpacity
              style={styles.botao}
              onPress={() => navigation.navigate("Filmes")}
            >
              <Text style={styles.textoBotao}>Explorar filmes</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.quantidade}>
              {favoritos.length}{" "}
              {favoritos.length === 1 ? "filme salvo" : "filmes salvos"}
            </Text>

            <View style={styles.grade}>
              {favoritos.map((filme) => (
                <View key={filme.titulo} style={styles.card}>
                  <TouchableOpacity
                    onPress={() => abrirDetalhes(filme)}
                    activeOpacity={0.75}
                  >
                    <Image
                      source={capas[filme.titulo]}
                      style={styles.capa}
                      resizeMode="cover"
                    />

                    <Text style={styles.nome}>{filme.titulo}</Text>

                    <Text style={styles.detalhes}>
                      {filme.ano} • {filme.genero}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.botaoRemover}
                    onPress={() => alternarFavorito(filme)}
                  >
                    <Text style={styles.textoRemover}>♥ Remover</Text>
                  </TouchableOpacity>
                </View>
              ))}
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
    height: 230,
    borderRadius: 10,
    backgroundColor: "#25252A",
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
