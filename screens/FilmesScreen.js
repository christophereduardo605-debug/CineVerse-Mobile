import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from "react-native";

import BottomMenu from "../components/BottomMenu";

const filmes = [
  {
    nome: "Código Sombrio",
    ano: "2025",
    genero: "Suspense",
    capa: require("../assets/posters/codigo-sombrio.png"),
  },
  {
    nome: "Além do Horizonte",
    ano: "2024",
    genero: "Ficção científica",
    capa: require("../assets/posters/alem-do-horizonte.png"),
  },
  {
    nome: "Distrito Neon",
    ano: "2025",
    genero: "Ação",
    capa: require("../assets/posters/distrito-neon.png"),
  },
  {
    nome: "Último Sinal",
    ano: "2023",
    genero: "Mistério",
    capa: require("../assets/posters/ultimo-sinal.png"),
  },
  {
    nome: "O Observador",
    ano: "2025",
    genero: "Drama",
    capa: require("../assets/posters/o-observador.png"),
  },
  {
    nome: "Entre Mundos",
    ano: "2024",
    genero: "Fantasia",
    capa: require("../assets/posters/entre-mundos.png"),
  },
];

const generos = [
  "Todos",
  "Ação",
  "Suspense",
  "Drama",
  "Ficção científica",
  "Mistério",
  "Fantasia",
];

export default function FilmesScreen({ navigation }) {
  const [pesquisa, setPesquisa] = useState("");
  const [genero, setGenero] = useState("Todos");

  const filmesFiltrados = filmes.filter((filme) => {
    const correspondePesquisa = filme.nome
      .toLowerCase()
      .includes(pesquisa.trim().toLowerCase());

    const correspondeGenero = genero === "Todos" || filme.genero === genero;

    return correspondePesquisa && correspondeGenero;
  });

  const abrirDetalhes = (filme) => {
    navigation.navigate("Detalhes", {
      titulo: filme.nome,
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        contentContainerStyle={styles.conteudo}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.titulo}>Filmes</Text>

        <Text style={styles.subtitulo}>Explore nosso catálogo de filmes</Text>

        {/* PESQUISA */}
        <TextInput
          style={styles.campoPesquisa}
          placeholder="Pesquisar filmes..."
          placeholderTextColor="#888888"
          value={pesquisa}
          onChangeText={setPesquisa}
          autoCorrect={false}
        />

        {/* FILTROS */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtros}
        >
          {generos.map((item) => (
            <TouchableOpacity
              key={item}
              style={[styles.filtro, genero === item && styles.filtroAtivo]}
              onPress={() => setGenero(item)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.textoFiltro,
                  genero === item && styles.textoFiltroAtivo,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* QUANTIDADE */}
        <Text style={styles.quantidade}>
          {filmesFiltrados.length} filmes encontrados
        </Text>

        {/* CATÁLOGO */}
        <View style={styles.grade}>
          {filmesFiltrados.map((filme) => (
            <TouchableOpacity
              key={filme.nome}
              style={styles.card}
              onPress={() => abrirDetalhes(filme)}
              activeOpacity={0.75}
            >
              <Image
                source={filme.capa}
                style={styles.capa}
                resizeMode="cover"
              />

              <Text style={styles.nome}>{filme.nome}</Text>

              <Text style={styles.detalhes}>
                {filme.ano} • {filme.genero}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* SEM RESULTADOS */}
        {filmesFiltrados.length === 0 && (
          <Text style={styles.semResultados}>Nenhum filme encontrado.</Text>
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

  filtros: {
    marginTop: 20,
    marginBottom: 20,
  },

  filtro: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: "#222228",
    borderRadius: 20,
    marginRight: 8,
  },

  filtroAtivo: {
    backgroundColor: "#E50914",
  },

  textoFiltro: {
    color: "#BBBBBB",
    fontSize: 13,
  },

  textoFiltroAtivo: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },

  quantidade: {
    color: "#AAAAAA",
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

  semResultados: {
    color: "#AAAAAA",
    textAlign: "center",
    marginTop: 35,
  },
});
