
import React, { useState } from "react";

import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Image,
  Modal,
  ActivityIndicator,
} from "react-native";

import BottomMenu from "../components/BottomMenu";
import { usePerfil } from "../context/PerfilContext";
import { useLista } from "../context/ListaContext";
import { useAuth } from "../context/AuthContext";

export default function PerfilScreen({ navigation }) {
  const { perfil } = usePerfil();
  const { favoritos } = useLista();
  const { logout } = useAuth();

  const [modalSair, setModalSair] = useState(false);
  const [saindo, setSaindo] = useState(false);
  const [erroLogout, setErroLogout] = useState("");

  const nome = perfil.nome || "Usuário CineVerse";
  const email = perfil.email || "";
  const foto = perfil.foto;

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

  // ABRIR CONFIRMAÇÃO DE SAÍDA
  const sairDaConta = () => {
    setErroLogout("");
    setModalSair(true);
  };

  // CONFIRMAR LOGOUT
  const confirmarSaida = async () => {
    try {
      setSaindo(true);
      setErroLogout("");

      await logout();

      setModalSair(false);

      navigation.reset({
        index: 0,
        routes: [{ name: "Login" }],
      });
    } catch (erro) {
      console.error("Erro ao sair da conta:", erro);
      setErroLogout(
        "Não foi possível sair da conta. Tente novamente."
      );
    } finally {
      setSaindo(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        contentContainerStyle={styles.conteudo}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.titulo}>Meu Perfil</Text>

        <Text style={styles.subtitulo}>
          Gerencie sua conta e suas preferências
        </Text>

        {/* CARTÃO DO PERFIL */}
        <View style={styles.cartaoPerfil}>
          <View style={styles.avatar}>
            {foto ? (
              <Image
                source={{ uri: foto }}
                style={styles.imagemPerfil}
              />
            ) : (
              <Text style={styles.iniciais}>{iniciais}</Text>
            )}
          </View>

          <Text style={styles.nome}>{nome}</Text>

          <Text style={styles.email}>{email}</Text>

          <TouchableOpacity
            style={styles.botaoEditar}
            onPress={editarPerfil}
            activeOpacity={0.7}
          >
            <Text style={styles.textoEditar}>
              ✎ Editar perfil
            </Text>
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

        <TouchableOpacity
          style={styles.opcao}
          onPress={() => navigation.navigate("MinhaLista")}
          activeOpacity={0.7}
        >
          <Text style={styles.textoOpcao}>♡ Minha Lista</Text>
          <Text style={styles.seta}>›</Text>
        </TouchableOpacity>

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
          <Text style={styles.textoSair}>
            Sair da conta
          </Text>

          <Text style={styles.seta}>›</Text>
        </TouchableOpacity>
      </ScrollView>

      <BottomMenu />

      {/* MODAL DE CONFIRMAÇÃO */}
      <Modal
        visible={modalSair}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!saindo) setModalSair(false);
        }}
      >
        <View style={styles.fundoModal}>
          <View style={styles.caixaModal}>
            <Text style={styles.tituloModal}>
              Sair da conta?
            </Text>

            <Text style={styles.mensagemModal}>
              Deseja realmente sair do CineVerse?
            </Text>

            {erroLogout ? (
              <Text style={styles.erroModal}>
                {erroLogout}
              </Text>
            ) : null}

            {saindo ? (
              <ActivityIndicator
                size="large"
                color="#E50914"
                style={styles.carregando}
              />
            ) : (
              <View style={styles.botoesModal}>
                <TouchableOpacity
                  style={styles.botaoCancelar}
                  onPress={() => setModalSair(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.textoCancelar}>
                    Cancelar
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.botaoConfirmar}
                  onPress={confirmarSaida}
                  activeOpacity={0.7}
                >
                  <Text style={styles.textoConfirmar}>
                    Sair
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
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
    overflow: "hidden",
  },

  imagemPerfil: {
    width: "100%",
    height: "100%",
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

  // MODAL
  fundoModal: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 25,
  },

  caixaModal: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#1B1B20",
    borderRadius: 15,
    padding: 25,
    borderWidth: 1,
    borderColor: "#383838",
  },

  tituloModal: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
  },

  mensagemModal: {
    color: "#AAAAAA",
    fontSize: 14,
    textAlign: "center",
    marginTop: 12,
    marginBottom: 25,
  },

  botoesModal: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },

  botaoCancelar: {
    flex: 1,
    backgroundColor: "#333333",
    padding: 13,
    borderRadius: 8,
    alignItems: "center",
  },

  textoCancelar: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },

  botaoConfirmar: {
    flex: 1,
    backgroundColor: "#E50914",
    padding: 13,
    borderRadius: 8,
    alignItems: "center",
  },

  textoConfirmar: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },

  erroModal: {
    color: "#FF5555",
    textAlign: "center",
    marginBottom: 15,
  },

  carregando: {
    marginVertical: 15,
  },
});
