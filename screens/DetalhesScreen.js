import React from "react";
import { useLista } from "../context/ListaContext";

import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from "react-native";

const filmes = {
  "Código Sombrio": {
    imagem: require("../assets/posters/codigo-sombrio.png"),
    ano: "2025",
    genero: "Suspense",
    classificacao: "16",
    sinopse:
      "Uma investigação perigosa revela segredos que deveriam permanecer escondidos.",
  },

  "Além do Horizonte": {
    imagem: require("../assets/posters/alem-do-horizonte.png"),
    ano: "2024",
    genero: "Ficção científica",
    classificacao: "12",
    sinopse:
      "Uma jornada além dos limites conhecidos transforma o destino de seus protagonistas.",
  },

  "Distrito Neon": {
    imagem: require("../assets/posters/distrito-neon.png"),
    ano: "2025",
    genero: "Ação",
    classificacao: "14",
    sinopse:
      "Em uma cidade futurista, uma descoberta ameaça mudar a ordem de toda a sociedade.",
  },

  "Último Sinal": {
    imagem: require("../assets/posters/ultimo-sinal.png"),
    ano: "2023",
    genero: "Mistério",
    classificacao: "14",
    sinopse:
      "Um sinal misterioso desencadeia acontecimentos que ninguém consegue explicar.",
  },

  "O Observador": {
    imagem: require("../assets/posters/o-observador.png"),
    ano: "2025",
    genero: "Drama",
    classificacao: "16",
    sinopse:
      "Uma presença desconhecida acompanha cada movimento, transformando o medo em realidade.",
  },

  "Entre Mundos": {
    imagem: require("../assets/posters/entre-mundos.png"),
    ano: "2024",
    genero: "Fantasia",
    classificacao: "12",
    sinopse:
      "Dois mundos se encontram em uma aventura repleta de mistérios e descobertas.",
  },
};

export default function DetalhesScreen({ navigation, route }) {
  const tituloRecebido = route.params?.titulo || "Distrito Neon";

  const titulo = filmes[tituloRecebido] ? tituloRecebido : "Distrito Neon";

  const filme = filmes[titulo];

  const { alternarFavorito, verificarFavorito } = useLista();

  const favorito = verificarFavorito(titulo);

  const assistir = () => {
    navigation.navigate("Player", {
      titulo,
    });
  };

  const adicionarOuRemover = () => {
    alternarFavorito({
      titulo,
      ano: filme.ano,
      genero: filme.genero,
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        contentContainerStyle={styles.conteudo}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={styles.voltar}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.textoVoltar}>‹ Voltar</Text>
        </TouchableOpacity>

        {/* CAPA DO FILME */}
        <Image source={filme.imagem} style={styles.capa} resizeMode="contain" />

        {/* TÍTULO */}
        <Text style={styles.titulo}>{titulo}</Text>

        {/* INFORMAÇÕES */}
        <View style={styles.informacoes}>
          <Text style={styles.info}>{filme.ano}</Text>

          <Text style={styles.separador}>•</Text>

          <Text style={styles.info}>{filme.genero}</Text>

          <Text style={styles.separador}>•</Text>

          <Text style={styles.info}>{filme.classificacao} anos</Text>
        </View>

        {/* BOTÕES */}
        <View style={styles.botoes}>
          <TouchableOpacity
            style={styles.botaoAssistir}
            onPress={assistir}
            activeOpacity={0.8}
          >
            <Text style={styles.textoAssistir}>▶ Assistir agora</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.botaoFavorito,
              favorito && styles.botaoFavoritoAtivo,
            ]}
            onPress={adicionarOuRemover}
            activeOpacity={0.8}
          >
            <Text style={styles.textoFavorito}>
              {favorito
                ? "♥ Adicionado à Minha Lista"
                : "♡ Adicionar à Minha Lista"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* SINOPSE */}
        <Text style={styles.tituloSecao}>Sinopse</Text>

        <Text style={styles.sinopse}>{filme.sinopse}</Text>

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
    paddingBottom: 45,
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
    height: 350,
    backgroundColor: "#1B1B20",
  },

  titulo: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "900",
    marginTop: 25,
    marginHorizontal: 20,
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

  botoes: {
    paddingHorizontal: 20,
    marginTop: 30,
    gap: 12,
  },

  botaoAssistir: {
    backgroundColor: "#E50914",
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: "center",
  },

  textoAssistir: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },

  botaoFavorito: {
    backgroundColor: "#25252A",
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#38383E",
  },

  botaoFavoritoAtivo: {
    borderColor: "#E50914",
    backgroundColor: "#35191D",
  },

  textoFavorito: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },

  tituloSecao: {
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "bold",
    marginTop: 35,
    marginHorizontal: 20,
  },

  sinopse: {
    color: "#AAAAAA",
    fontSize: 15,
    lineHeight: 24,
    marginHorizontal: 20,
    marginTop: 12,
  },

  rodape: {
    color: "#666666",
    fontSize: 12,
    textAlign: "center",
    marginTop: 50,
  },
});
