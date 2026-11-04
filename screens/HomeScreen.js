import React from "react";
import BottomMenu from "../components/BottomMenu";

import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
} from "react-native";

// FILMES
const filmes = [
  "Código Sombrio",
  "Além do Horizonte",
  "Distrito Neon",
  "Último Sinal",
  "O Observador",
  "Entre Mundos",
];

const capasFilmes = {
  "Código Sombrio": require("../assets/posters/codigo-sombrio.png"),
  "Além do Horizonte": require("../assets/posters/alem-do-horizonte.png"),
  "Distrito Neon": require("../assets/posters/distrito-neon.png"),
  "Último Sinal": require("../assets/posters/ultimo-sinal.png"),
  "O Observador": require("../assets/posters/o-observador.png"),
  "Entre Mundos": require("../assets/posters/entre-mundos.png"),
};

// SÉRIES
const series = [
  "Inverno Eterno",
  "Cidade Oculta",
  "Fronteira Zero",
  "Maré Negra",
];

const capasSeries = {
  "Inverno Eterno": require("../assets/posters/inverno-eterno.png"),
  "Cidade Oculta": require("../assets/posters/cidade-oculta.png"),
  "Fronteira Zero": require("../assets/posters/fronteira-zero.png"),
  "Maré Negra": require("../assets/posters/mare-negra.png"),
};

// SEÇÃO COM CARROSSEL
function Secao({ titulo, itens, abrirItem }) {
  return (
    <View style={styles.secao}>
      <Text style={styles.tituloSecao}>{titulo}</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {itens.map((item, index) => {
          const ehSerie = Boolean(capasSeries[item]);
          const capa = capasFilmes[item] || capasSeries[item];

          return (
            <TouchableOpacity
              key={`${item}-${index}`}
              style={[styles.card, ehSerie && styles.cardSerie]}
              onPress={() => abrirItem(item)}
              activeOpacity={0.75}
            >
              <View style={[styles.poster, ehSerie && styles.posterSerie]}>
                {capa ? (
                  <Image
                    source={capa}
                    style={styles.imagemPoster}
                    resizeMode="cover"
                  />
                ) : (
                  <Text style={styles.posterIcone}>▶</Text>
                )}
              </View>

              <Text style={styles.nomeCard}>{item}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

export default function HomeScreen({ navigation }) {
  // IDENTIFICAR SE É FILME OU SÉRIE
  const abrirItem = (titulo) => {
    if (capasSeries[titulo]) {
      navigation.navigate("DetalhesSerie", {
        titulo,
      });
      return;
    }

    if (capasFilmes[titulo]) {
      navigation.navigate("Detalhes", {
        titulo,
      });
    }
  };

  // ASSISTIR AO DESTAQUE
  const assistirDestaque = () => {
    navigation.navigate("Player", {
      titulo: "VÉRTICE",
    });
  };

  // INFORMAÇÕES DO DESTAQUE
  const informacoesDestaque = () => {
    Alert.alert(
      "VÉRTICE",
      "Uma jornada intensa entre mistérios, escolhas e descobertas que podem mudar tudo.\n\nO filme ainda não foi adicionado ao catálogo completo.",
    );
  };

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
            CINE
            <Text style={styles.logoVermelho}>VERSE</Text>
          </Text>

          <TouchableOpacity
            onPress={() => navigation.navigate("Perfil")}
            activeOpacity={0.75}
          >
            <Text style={styles.avatar}>CE</Text>
          </TouchableOpacity>
        </View>

        {/* DESTAQUE PRINCIPAL */}
        <View style={styles.destaque}>
          <Text style={styles.etiqueta}>DESTAQUE DO CINEVERSE</Text>

          <Text style={styles.tituloFilme}>VÉRTICE</Text>

          <Text style={styles.informacoes}>
            98% relevante • 2025 • 14+ • 4K
          </Text>

          <Text style={styles.sinopse}>
            Uma jornada intensa entre mistérios, escolhas e descobertas que
            podem mudar tudo.
          </Text>

          <TouchableOpacity
            style={styles.botaoAssistir}
            onPress={assistirDestaque}
            activeOpacity={0.8}
          >
            <Text style={styles.textoBotao}>▶ Assistir agora</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.botaoInfo}
            onPress={informacoesDestaque}
            activeOpacity={0.8}
          >
            <Text style={styles.textoBotao}>Mais informações</Text>
          </TouchableOpacity>
        </View>

        {/* CONTINUAR ASSISTINDO */}
        <Secao
          titulo="Continuar assistindo"
          itens={series.slice(0, 3)}
          abrirItem={abrirItem}
        />

        {/* FILMES EM DESTAQUE */}
        <Secao
          titulo="Filmes em destaque"
          itens={filmes}
          abrirItem={abrirItem}
        />

        {/* SÉRIES EM DESTAQUE */}
        <Secao
          titulo="Séries em destaque"
          itens={series}
          abrirItem={abrirItem}
        />

        {/* LANÇAMENTOS */}
        <Secao
          titulo="Lançamentos"
          itens={["Distrito Neon", "Maré Negra", "Último Sinal"]}
          abrirItem={abrirItem}
        />

        <View style={styles.espacoFinal} />
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
    padding: 24,
    borderRadius: 16,
    minHeight: 330,
    justifyContent: "center",
  },

  etiqueta: {
    color: "#E50914",
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 2,
  },

  tituloFilme: {
    color: "#FFFFFF",
    fontSize: 43,
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

  botaoInfo: {
    backgroundColor: "#44444B",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },

  textoBotao: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },

  secao: {
    marginTop: 30,
    paddingLeft: 20,
  },

  tituloSecao: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
  },

  card: {
    width: 135,
    marginRight: 12,
  },

  cardSerie: {
    width: 180,
  },

  poster: {
    height: 175,
    borderRadius: 10,
    backgroundColor: "#27272F",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },

  posterSerie: {
    height: 95,
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

  espacoFinal: {
    height: 30,
  },

  menu: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#161616",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#333333",
  },

  menuAtivo: {
    color: "#E50914",
    textAlign: "center",
    fontSize: 11,
  },

  menuItem: {
    color: "#AAAAAA",
    textAlign: "center",
    fontSize: 11,
  },
});
