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

const series = {
  "Inverno Eterno": {
    imagem: require("../assets/posters/inverno-eterno.png"),
    ano: "2025",
    genero: "Drama",
    temporadas: 1,
    sinopse:
      "Em um mundo marcado por um inverno sem fim, um grupo de sobreviventes enfrenta desafios e descobre segredos sobre o que aconteceu.",
    episodios: [
      "O Começo do Frio",
      "Além da Neve",
      "Segredos Congelados",
      "O Último Refúgio",
    ],
  },

  "Cidade Oculta": {
    imagem: require("../assets/posters/cidade-oculta.png"),
    ano: "2025",
    genero: "Suspense",
    temporadas: 1,
    sinopse:
      "Uma cidade aparentemente tranquila esconde mistérios que começam a surgir após acontecimentos inexplicáveis.",
    episodios: [
      "O Desaparecimento",
      "Ruas Silenciosas",
      "Pistas Escondidas",
      "A Verdade",
    ],
  },

  "Fronteira Zero": {
    imagem: require("../assets/posters/fronteira-zero.png"),
    ano: "2024",
    genero: "Aventura",
    temporadas: 1,
    sinopse:
      "Em uma região onde as regras deixaram de existir, uma equipe precisa enfrentar perigos para completar sua missão.",
    episodios: [
      "A Missão",
      "Território Desconhecido",
      "Sem Retorno",
      "Fronteira Final",
    ],
  },

  "Maré Negra": {
    imagem: require("../assets/posters/mare-negra.png"),
    ano: "2025",
    genero: "Mistério",
    temporadas: 1,
    sinopse:
      "Após eventos misteriosos no litoral, uma investigação revela segredos que ameaçam toda uma comunidade.",
    episodios: [
      "O Primeiro Sinal",
      "Águas Profundas",
      "O Segredo",
      "A Última Maré",
    ],
  },
};

export default function DetalhesSerieScreen({ navigation, route }) {
  const tituloRecebido = route.params?.titulo || "Inverno Eterno";

  const titulo = series[tituloRecebido] ? tituloRecebido : "Inverno Eterno";

  const serie = series[titulo];

  const assistirEpisodio = (episodio, numero) => {
    navigation.navigate("Player", {
      titulo: `${titulo} - EP ${numero}: ${episodio}`,
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        contentContainerStyle={styles.conteudo}
        showsVerticalScrollIndicator={false}
      >
        {/* VOLTAR */}
        <TouchableOpacity
          style={styles.voltar}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.textoVoltar}>‹ Voltar</Text>
        </TouchableOpacity>

        {/* CAPA */}
        <Image source={serie.imagem} style={styles.capa} resizeMode="contain" />

        {/* TÍTULO */}
        <Text style={styles.titulo}>{titulo}</Text>

        {/* INFORMAÇÕES */}
        <View style={styles.informacoes}>
          <Text style={styles.info}>{serie.ano}</Text>

          <Text style={styles.separador}>•</Text>

          <Text style={styles.info}>{serie.genero}</Text>

          <Text style={styles.separador}>•</Text>

          <Text style={styles.info}>
            {serie.temporadas}{" "}
            {serie.temporadas === 1 ? "temporada" : "temporadas"}
          </Text>
        </View>

        {/* ASSISTIR PRIMEIRO EPISÓDIO */}
        <TouchableOpacity
          style={styles.botaoAssistir}
          onPress={() => assistirEpisodio(serie.episodios[0], 1)}
          activeOpacity={0.8}
        >
          <Text style={styles.textoAssistir}>▶ Assistir primeiro episódio</Text>
        </TouchableOpacity>

        {/* SINOPSE */}
        <Text style={styles.tituloSecao}>Sinopse</Text>

        <Text style={styles.sinopse}>{serie.sinopse}</Text>

        {/* EPISÓDIOS */}
        <Text style={styles.tituloSecao}>Episódios</Text>

        <Text style={styles.subtituloEpisodios}>
          Temporada 1 • {serie.episodios.length} episódios
        </Text>

        {serie.episodios.map((episodio, index) => (
          <TouchableOpacity
            key={`${titulo}-${index}`}
            style={styles.cardEpisodio}
            onPress={() => assistirEpisodio(episodio, index + 1)}
            activeOpacity={0.75}
          >
            <View style={styles.numeroEpisodio}>
              <Text style={styles.textoNumero}>{index + 1}</Text>
            </View>

            <View style={styles.informacoesEpisodio}>
              <Text style={styles.nomeEpisodio}>{episodio}</Text>

              <Text style={styles.descricaoEpisodio}>Episódio {index + 1}</Text>
            </View>

            <Text style={styles.playEpisodio}>▶</Text>
          </TouchableOpacity>
        ))}

        <Text style={styles.rodape}>CineVerse Mobile</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#090909",
  },

  conteudo: {
    paddingBottom: 50,
  },

  voltar: {
    paddingHorizontal: 20,
    paddingTop: 65,
    paddingBottom: 20,
  },

  textoVoltar: {
    color: "#AAAAAA",
    fontSize: 17,
  },

  capa: {
    width: "100%",
    height: 300,
    backgroundColor: "#1B1B20",
  },

  titulo: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "900",
    marginHorizontal: 20,
    marginTop: 25,
  },

  informacoes: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 12,
  },

  info: {
    color: "#BBBBBB",
    fontSize: 14,
  },

  separador: {
    color: "#777777",
    marginHorizontal: 10,
  },

  botaoAssistir: {
    backgroundColor: "#E50914",
    marginHorizontal: 20,
    marginTop: 30,
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: "center",
  },

  textoAssistir: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
  },

  tituloSecao: {
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "bold",
    marginHorizontal: 20,
    marginTop: 35,
  },

  sinopse: {
    color: "#AAAAAA",
    fontSize: 15,
    lineHeight: 24,
    marginHorizontal: 20,
    marginTop: 12,
  },

  subtituloEpisodios: {
    color: "#AAAAAA",
    fontSize: 14,
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 18,
  },

  cardEpisodio: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1B1B20",
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#303036",
  },

  numeroEpisodio: {
    width: 45,
    height: 45,
    borderRadius: 9,
    backgroundColor: "#302024",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },

  textoNumero: {
    color: "#E50914",
    fontSize: 18,
    fontWeight: "bold",
  },

  informacoesEpisodio: {
    flex: 1,
  },

  nomeEpisodio: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
  },

  descricaoEpisodio: {
    color: "#999999",
    fontSize: 12,
    marginTop: 5,
  },

  playEpisodio: {
    color: "#E50914",
    fontSize: 20,
    marginLeft: 10,
  },

  rodape: {
    color: "#666666",
    fontSize: 12,
    textAlign: "center",
    marginTop: 45,
  },
});
