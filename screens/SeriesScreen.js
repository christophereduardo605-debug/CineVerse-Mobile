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

const series = [
  {
    nome: "Inverno Eterno",
    ano: "2025",
    genero: "Drama",
    capa: require("../assets/posters/inverno-eterno.png"),
  },
  {
    nome: "Cidade Oculta",
    ano: "2025",
    genero: "Suspense",
    capa: require("../assets/posters/cidade-oculta.png"),
  },
  {
    nome: "Fronteira Zero",
    ano: "2024",
    genero: "Aventura",
    capa: require("../assets/posters/fronteira-zero.png"),
  },
  {
    nome: "Maré Negra",
    ano: "2025",
    genero: "Mistério",
    capa: require("../assets/posters/mare-negra.png"),
  },
];

const generos = ["Todos", "Drama", "Suspense", "Aventura", "Mistério"];

export default function SeriesScreen({ navigation }) {
  const [pesquisa, setPesquisa] = useState("");
  const [genero, setGenero] = useState("Todos");

  // Filtrar séries por nome e gênero
  const seriesFiltradas = series.filter((serie) => {
    const correspondePesquisa = serie.nome
      .toLowerCase()
      .includes(pesquisa.trim().toLowerCase());

    const correspondeGenero = genero === "Todos" || serie.genero === genero;

    return correspondePesquisa && correspondeGenero;
  });

  // Abrir detalhes da série selecionada
  const abrirDetalhes = (serie) => {
    navigation.navigate("DetalhesSerie", {
      titulo: serie.nome,
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        contentContainerStyle={styles.conteudo}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.titulo}>Séries</Text>

        <Text style={styles.subtitulo}>Explore nosso catálogo de séries</Text>

        {/* PESQUISA */}
        <TextInput
          style={styles.campoPesquisa}
          placeholder="Pesquisar séries..."
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
          {seriesFiltradas.length} séries encontradas
        </Text>

        {/* CATÁLOGO */}
        <View style={styles.grade}>
          {seriesFiltradas.map((serie) => (
            <TouchableOpacity
              key={serie.nome}
              style={styles.card}
              onPress={() => abrirDetalhes(serie)}
              activeOpacity={0.75}
            >
              <Image
                source={serie.capa}
                style={styles.capa}
                resizeMode="cover"
              />

              <Text style={styles.nome}>{serie.nome}</Text>

              <Text style={styles.detalhes}>
                {serie.ano} • {serie.genero}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* SEM RESULTADOS */}
        {seriesFiltradas.length === 0 && (
          <Text style={styles.semResultados}>Nenhuma série encontrada.</Text>
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
    height: 105,
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
