import React, { useEffect, useState } from "react";

import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
  StatusBar,
  Alert,
  ActivityIndicator,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";

const CHAVE_CONFIGURACOES = "@cineverse_configuracoes";

const configuracoesIniciais = {
  notificacoes: true,
  reproducaoAutomatica: true,
  legendas: false,
  perfilPrivado: false,
  qualidade: "Automática",
};

// COMPONENTE DE OPÇÃO
function OpcaoSwitch({ titulo, descricao, valor, alterar }) {
  return (
    <View style={styles.opcao}>
      <View style={styles.textosOpcao}>
        <Text style={styles.nomeOpcao}>{titulo}</Text>

        <Text style={styles.descricaoOpcao}>{descricao}</Text>
      </View>

      <Switch
        value={valor}
        onValueChange={alterar}
        trackColor={{
          false: "#444444",
          true: "#8F151B",
        }}
        thumbColor={valor ? "#E50914" : "#BBBBBB"}
      />
    </View>
  );
}

export default function ConfiguracoesScreen({ navigation }) {
  const [configuracoes, setConfiguracoes] = useState(configuracoesIniciais);

  const [carregando, setCarregando] = useState(true);

  // CARREGAR PREFERÊNCIAS SALVAS
  useEffect(() => {
    const carregarConfiguracoes = async () => {
      try {
        const dados = await AsyncStorage.getItem(CHAVE_CONFIGURACOES);

        if (dados) {
          const salvas = JSON.parse(dados);

          if (salvas && typeof salvas === "object" && !Array.isArray(salvas)) {
            setConfiguracoes({
              ...configuracoesIniciais,
              ...salvas,
            });
          }
        }
      } catch (erro) {
        console.log("Erro ao carregar configurações:", erro);

        Alert.alert("Aviso", "Não foi possível carregar suas preferências.");
      } finally {
        setCarregando(false);
      }
    };

    carregarConfiguracoes();
  }, []);

  // SALVAR PREFERÊNCIAS
  useEffect(() => {
    if (carregando) {
      return;
    }

    const salvarConfiguracoes = async () => {
      try {
        await AsyncStorage.setItem(
          CHAVE_CONFIGURACOES,
          JSON.stringify(configuracoes),
        );
      } catch (erro) {
        console.log("Erro ao salvar configurações:", erro);
      }
    };

    salvarConfiguracoes();
  }, [configuracoes, carregando]);

  // ALTERAR UMA PREFERÊNCIA
  const alterarConfiguracao = (chave, valor) => {
    setConfiguracoes((anteriores) => ({
      ...anteriores,
      [chave]: valor,
    }));
  };

  // ESCOLHER QUALIDADE
  const escolherQualidade = () => {
    Alert.alert("Qualidade de reprodução", "Escolha a qualidade desejada:", [
      {
        text: "Automática",
        onPress: () => alterarConfiguracao("qualidade", "Automática"),
      },
      {
        text: "Alta (1080p)",
        onPress: () => alterarConfiguracao("qualidade", "Alta (1080p)"),
      },
      {
        text: "Média (720p)",
        onPress: () => alterarConfiguracao("qualidade", "Média (720p)"),
      },
      {
        text: "Baixa (480p)",
        onPress: () => alterarConfiguracao("qualidade", "Baixa (480p)"),
      },
      {
        text: "Cancelar",
        style: "cancel",
      },
    ]);
  };

  // AGUARDAR CARREGAMENTO
  if (carregando) {
    return (
      <View style={styles.containerCarregando}>
        <ActivityIndicator size="large" color="#E50914" />

        <Text style={styles.textoCarregando}>Carregando configurações...</Text>
      </View>
    );
  }

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

        {/* TÍTULO */}
        <Text style={styles.titulo}>Configurações</Text>

        <Text style={styles.subtitulo}>
          Personalize sua experiência no CineVerse
        </Text>

        {/* PREFERÊNCIAS */}
        <Text style={styles.tituloSecao}>Preferências</Text>

        <View style={styles.cartao}>
          <OpcaoSwitch
            titulo="Notificações"
            descricao="Receber novidades e lançamentos"
            valor={configuracoes.notificacoes}
            alterar={(valor) => alterarConfiguracao("notificacoes", valor)}
          />

          <View style={styles.divisor} />

          <OpcaoSwitch
            titulo="Reprodução automática"
            descricao="Reproduzir o próximo episódio automaticamente"
            valor={configuracoes.reproducaoAutomatica}
            alterar={(valor) =>
              alterarConfiguracao("reproducaoAutomatica", valor)
            }
          />

          <View style={styles.divisor} />

          <OpcaoSwitch
            titulo="Legendas"
            descricao="Ativar legendas por padrão"
            valor={configuracoes.legendas}
            alterar={(valor) => alterarConfiguracao("legendas", valor)}
          />

          <View style={styles.divisor} />

          <OpcaoSwitch
            titulo="Perfil privado"
            descricao="Manter suas atividades privadas"
            valor={configuracoes.perfilPrivado}
            alterar={(valor) => alterarConfiguracao("perfilPrivado", valor)}
          />
        </View>

        {/* REPRODUÇÃO */}
        <Text style={styles.tituloSecao}>Reprodução</Text>

        <TouchableOpacity
          style={styles.cartaoQualidade}
          onPress={escolherQualidade}
          activeOpacity={0.7}
        >
          <View style={styles.textosOpcao}>
            <Text style={styles.nomeOpcao}>Qualidade de reprodução</Text>

            <Text style={styles.descricaoOpcao}>{configuracoes.qualidade}</Text>
          </View>

          <Text style={styles.seta}>›</Text>
        </TouchableOpacity>

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

  containerCarregando: {
    flex: 1,
    backgroundColor: "#090909",
    justifyContent: "center",
    alignItems: "center",
  },

  textoCarregando: {
    color: "#AAAAAA",
    fontSize: 14,
    marginTop: 15,
  },

  conteudo: {
    paddingHorizontal: 20,
    paddingTop: 65,
    paddingBottom: 40,
  },

  voltar: {
    marginBottom: 25,
  },

  textoVoltar: {
    color: "#AAAAAA",
    fontSize: 17,
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
    marginBottom: 30,
  },

  tituloSecao: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "bold",
    marginBottom: 15,
    marginTop: 10,
  },

  cartao: {
    backgroundColor: "#1B1B20",
    borderRadius: 15,
    paddingHorizontal: 18,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "#303036",
    marginBottom: 30,
  },

  opcao: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 20,
  },

  textosOpcao: {
    flex: 1,
    paddingRight: 15,
  },

  nomeOpcao: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
  },

  descricaoOpcao: {
    color: "#999999",
    fontSize: 12,
    marginTop: 6,
  },

  divisor: {
    height: 1,
    backgroundColor: "#303036",
  },

  cartaoQualidade: {
    backgroundColor: "#1B1B20",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "#303036",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  seta: {
    color: "#999999",
    fontSize: 26,
  },

  rodape: {
    color: "#666666",
    fontSize: 12,
    textAlign: "center",
    marginTop: 40,
  },
});
