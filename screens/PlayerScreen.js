import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Alert,
} from "react-native";

export default function PlayerScreen({ navigation, route }) {
  const titulo = route.params?.titulo || "Distrito Neon";

  const [reproduzindo, setReproduzindo] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [telaCheia, setTelaCheia] = useState(false);

  const alternarReproducao = () => {
    setReproduzindo((anterior) => !anterior);
  };

  const avancar = () => {
    setProgresso((anterior) => Math.min(anterior + 10, 100));
  };

  const voltarVideo = () => {
    setProgresso((anterior) => Math.max(anterior - 10, 0));
  };

  const alternarTelaCheia = () => {
    setTelaCheia((anterior) => !anterior);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView contentContainerStyle={styles.conteudo}>
        <TouchableOpacity
          style={styles.botaoVoltar}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.textoVoltar}>‹ Voltar</Text>
        </TouchableOpacity>

        <Text style={styles.tituloPagina}>Reproduzindo</Text>

        <Text style={styles.nomeFilme}>{titulo}</Text>

        {/* ÁREA DO PLAYER */}
        <View style={[styles.player, telaCheia && styles.playerExpandido]}>
          <Text style={styles.logo}>CINEVERSE</Text>

          <TouchableOpacity
            style={styles.botaoCentral}
            onPress={alternarReproducao}
          >
            <Text style={styles.iconeCentral}>{reproduzindo ? "Ⅱ" : "▶"}</Text>
          </TouchableOpacity>

          <Text style={styles.aviso}>Player demonstrativo</Text>

          {/* BARRA DE PROGRESSO */}
          <View style={styles.areaProgresso}>
            <View style={styles.barraFundo}>
              <View
                style={[styles.barraPreenchida, { width: `${progresso}%` }]}
              />
            </View>

            <View style={styles.tempos}>
              <Text style={styles.tempo}>{progresso}%</Text>

              <Text style={styles.tempo}>Demonstração</Text>
            </View>
          </View>
        </View>

        {/* CONTROLES */}
        <View style={styles.controles}>
          <TouchableOpacity style={styles.controle} onPress={voltarVideo}>
            <Text style={styles.iconeControle}>↶</Text>
            <Text style={styles.legendaControle}>Voltar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlePrincipal}
            onPress={alternarReproducao}
          >
            <Text style={styles.iconePrincipal}>
              {reproduzindo ? "Ⅱ" : "▶"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.controle} onPress={avancar}>
            <Text style={styles.iconeControle}>↷</Text>
            <Text style={styles.legendaControle}>Avançar</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.botaoTelaCheia}
          onPress={alternarTelaCheia}
        >
          <Text style={styles.textoTelaCheia}>
            {telaCheia ? "⤡ Reduzir player" : "⛶ Expandir player"}
          </Text>
        </TouchableOpacity>

        <View style={styles.informacoes}>
          <Text style={styles.tituloSecao}>Sobre a reprodução</Text>

          <Text style={styles.descricao}>
            Você está visualizando a interface de reprodução de {titulo}.
          </Text>

          <Text style={styles.descricao}>
            Os controles desta versão são demonstrativos. A reprodução real será
            integrada posteriormente com uma fonte de vídeo autorizada.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.botaoAjuda}
          onPress={() =>
            Alert.alert(
              "CineVerse",
              "O player de vídeo será integrado em uma próxima etapa.",
            )
          }
        >
          <Text style={styles.textoAjuda}>Sobre o player</Text>
        </TouchableOpacity>
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
    paddingTop: 65,
    paddingBottom: 50,
  },

  botaoVoltar: {
    marginHorizontal: 20,
    marginBottom: 25,
  },

  textoVoltar: {
    color: "#AAAAAA",
    fontSize: 17,
  },

  tituloPagina: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "900",
    marginHorizontal: 20,
  },

  nomeFilme: {
    color: "#AAAAAA",
    fontSize: 15,
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 25,
  },

  player: {
    width: "100%",
    height: 250,
    backgroundColor: "#151519",
    justifyContent: "center",
    alignItems: "center",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#303036",
  },

  playerExpandido: {
    height: 380,
  },

  logo: {
    color: "#E50914",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 4,
    marginBottom: 20,
  },

  botaoCentral: {
    width: 75,
    height: 75,
    backgroundColor: "#E50914",
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },

  iconeCentral: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "bold",
  },

  aviso: {
    color: "#888888",
    fontSize: 12,
    marginTop: 20,
  },

  areaProgresso: {
    position: "absolute",
    bottom: 15,
    left: 20,
    right: 20,
  },

  barraFundo: {
    height: 5,
    backgroundColor: "#444444",
    borderRadius: 5,
    overflow: "hidden",
  },

  barraPreenchida: {
    height: "100%",
    backgroundColor: "#E50914",
  },

  tempos: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },

  tempo: {
    color: "#AAAAAA",
    fontSize: 11,
  },

  controles: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 30,
    gap: 40,
  },

  controle: {
    alignItems: "center",
  },

  iconeControle: {
    color: "#FFFFFF",
    fontSize: 36,
  },

  legendaControle: {
    color: "#AAAAAA",
    fontSize: 12,
    marginTop: 5,
  },

  controlePrincipal: {
    backgroundColor: "#E50914",
    width: 65,
    height: 65,
    borderRadius: 35,
    alignItems: "center",
    justifyContent: "center",
  },

  iconePrincipal: {
    color: "#FFFFFF",
    fontSize: 25,
  },

  botaoTelaCheia: {
    backgroundColor: "#25252A",
    marginHorizontal: 20,
    marginTop: 30,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
  },

  textoTelaCheia: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },

  informacoes: {
    marginHorizontal: 20,
    marginTop: 35,
  },

  tituloSecao: {
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "bold",
    marginBottom: 15,
  },

  descricao: {
    color: "#AAAAAA",
    fontSize: 14,
    lineHeight: 23,
    marginBottom: 12,
  },

  botaoAjuda: {
    marginHorizontal: 20,
    marginTop: 15,
    alignItems: "center",
    padding: 15,
  },

  textoAjuda: {
    color: "#E50914",
    fontSize: 14,
    fontWeight: "bold",
  },
});
