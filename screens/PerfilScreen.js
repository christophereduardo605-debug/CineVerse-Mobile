import React from "react";

import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
} from "react-native";

import BottomMenu from "../components/BottomMenu";
import { usePerfil } from "../context/PerfilContext";
import { useLista } from "../context/ListaContext";

export default function PerfilScreen({ navigation }) {
  // DADOS DO PERFIL
  const { perfil } = usePerfil();

  // FAVORITOS SALVOS
  const { favoritos } = useLista();

  const nome = perfil.nome || "Usuário CineVerse";
  const email = perfil.email || "";
  const foto = perfil.foto;

  // QUANTIDADE REAL DE FAVORITOS
  const totalFavoritos = favoritos.length;

  // INICIAIS DO AVATAR
  const iniciais =
    nome
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((parte) => parte.charAt(0).toUpperCase())
      .join("") || "CV";

  // EDITAR PERFIL
  const editarPerfil = () => {
    navigation.navigate("EditarPerfil", {
      nome,
      email,
      foto,
    });
  };

  // SAIR DA CONTA
  const sairDaConta = () => {
    Alert.alert("Sair da conta", "Deseja realmente sair do CineVerse?", [
      {
        text: "Cancelar",
        style: "cancel",
      },
      {
        text: "Sair",
        onPress: () => navigation.replace("Login"),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        contentContainerStyle={styles.conteudo}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* TÍTULO */}
        <Text style={styles.titulo}>Meu Perfil</Text>

        <Text style={styles.subtitulo}>
          Gerencie sua conta e suas preferências
        </Text>

        {/* CARTÃO DO PERFIL */}
        <View style={styles.cartaoPerfil}>
          <View style={styles.avatar}>
            <Text style={styles.iniciais}>{iniciais}</Text>
          </View>

          <Text style={styles.nome}>{nome}</Text>

          <Text style={styles.email}>{email}</Text>

          <TouchableOpacity
            style={styles.botaoEditar}
            onPress={editarPerfil}
            activeOpacity={0.7}
          >
            <Text style={styles.textoEditar}>✎ Editar perfil</Text>
          </TouchableOpacity>
        </View>

        {/* ESTATÍSTICAS */}
        <View style={styles.estatisticas}>
          <View style={styles.estatistica}>
            <Text style={styles.numero}>0</Text>

            <Text style={styles.rotulo}>Filmes assistidos</Text>
          </View>

          <View style={styles.estatistica}>
            <Text style={styles.numero}>0</Text>

            <Text style={styles.rotulo}>Séries assistidas</Text>
          </View>

          <View style={styles.estatistica}>
            <Text style={styles.numero}>{totalFavoritos}</Text>

            <Text style={styles.rotulo}>Favoritos</Text>
          </View>
        </View>

        {/* MINHA CONTA */}
        <Text style={styles.tituloSecao}>Minha conta</Text>

        {/* MINHA LISTA */}
        <TouchableOpacity
          style={styles.opcao}
          onPress={() => navigation.navigate("MinhaLista")}
          activeOpacity={0.7}
        >
          <Text style={styles.textoOpcao}>♡ Minha Lista</Text>

          <Text style={styles.seta}>›</Text>
        </TouchableOpacity>

        {/* CONFIGURAÇÕES */}
        <TouchableOpacity
          style={styles.opcao}
          onPress={() => navigation.navigate("Configuracoes")}
          activeOpacity={0.7}
        >
          <Text style={styles.textoOpcao}>⚙ Configurações</Text>

          <Text style={styles.seta}>›</Text>
        </TouchableOpacity>

        {/* SAIR DA CONTA */}
        <TouchableOpacity
          style={[styles.opcao, styles.opcaoSair]}
          onPress={sairDaConta}
          activeOpacity={0.7}
        >
          <Text style={styles.textoSair}>Sair da conta</Text>

          <Text style={styles.seta}>›</Text>
        </TouchableOpacity>
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
    paddingBottom: 35,
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

  cartaoPerfil: {
    backgroundColor: "#1B1B20",
    borderRadius: 15,
    padding: 25,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#303036",
  },

  avatar: {
    width: 85,
    height: 85,
    borderRadius: 45,
    backgroundColor: "#E50914",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },

  iniciais: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "900",
  },

  nome: {
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "bold",
    textAlign: "center",
  },

  email: {
    color: "#999999",
    fontSize: 13,
    marginTop: 7,
    marginBottom: 20,
    textAlign: "center",
  },

  botaoEditar: {
    backgroundColor: "#E50914",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 9,
  },

  textoEditar: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },

  estatisticas: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    marginBottom: 30,
  },

  estatistica: {
    width: "31%",
    backgroundColor: "#1B1B20",
    paddingVertical: 20,
    paddingHorizontal: 5,
    borderRadius: 12,
    alignItems: "center",
  },

  numero: {
    color: "#E50914",
    fontSize: 25,
    fontWeight: "900",
  },

  rotulo: {
    color: "#AAAAAA",
    fontSize: 11,
    textAlign: "center",
    marginTop: 6,
  },

  tituloSecao: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "bold",
    marginBottom: 15,
  },

  opcao: {
    backgroundColor: "#1B1B20",
    borderRadius: 10,
    padding: 18,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  textoOpcao: {
    color: "#FFFFFF",
    fontSize: 15,
  },

  seta: {
    color: "#999999",
    fontSize: 24,
  },

  opcaoSair: {
    marginTop: 15,
    borderWidth: 1,
    borderColor: "#702027",
  },

  textoSair: {
    color: "#E50914",
    fontSize: 15,
    fontWeight: "bold",
  },
});
