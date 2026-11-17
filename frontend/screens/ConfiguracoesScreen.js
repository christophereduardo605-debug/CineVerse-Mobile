
import React, { useEffect, useState } from "react";

import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Modal,
  Platform,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";

import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";

const CHAVE_CONFIGURACOES = "@cineverse_configuracoes";

const configuracoesIniciais = {
  notificacoes: true,
  reproducaoAutomatica: true,
  legendas: false,
  perfilPrivado: false,
  qualidade: "Automática",
};

const qualidades = [
  "Automática",
  "Alta (1080p)",
  "Média (720p)",
  "Baixa (480p)",
];

// ======================================
// COMPONENTE DE OPÇÃO
// ======================================

function OpcaoSwitch({ titulo, descricao, valor, alterar, desabilitado }) {
  return (
    <View style={styles.opcao}>
      <View style={styles.textosOpcao}>
        <Text style={styles.nomeOpcao}>{titulo}</Text>

        <Text style={styles.descricaoOpcao}>{descricao}</Text>
      </View>

      <Switch
        value={valor}
        onValueChange={alterar}
        disabled={desabilitado}
        trackColor={{
          false: "#444444",
          true: "#8F151B",
        }}
        thumbColor={valor ? "#E50914" : "#BBBBBB"}
      />
    </View>
  );
}

// ======================================
// TELA DE CONFIGURAÇÕES
// ======================================

export default function ConfiguracoesScreen({ navigation }) {
  const { token } = useAuth();

  const [configuracoes, setConfiguracoes] = useState(
    configuracoesIniciais
  );

  const [carregando, setCarregando] = useState(true);
  const [modalQualidade, setModalQualidade] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  // ======================================
  // CARREGAR CONFIGURAÇÕES
  // ======================================

  useEffect(() => {
    let ativo = true;

    const carregarConfiguracoes = async () => {
      try {
        const dados = await AsyncStorage.getItem(
          CHAVE_CONFIGURACOES
        );

        if (dados) {
          const salvas = JSON.parse(dados);

          if (
            salvas &&
            typeof salvas === "object" &&
            !Array.isArray(salvas)
          ) {
            const configuracoesValidas = {
              ...configuracoesIniciais,
              ...salvas,
            };

            if (!qualidades.includes(configuracoesValidas.qualidade)) {
              configuracoesValidas.qualidade = "Automática";
            }

            if (ativo) {
              setConfiguracoes(configuracoesValidas);
            }
          }
        }
      } catch (erro) {
        console.error(
          "Erro ao carregar configurações:",
          erro
        );

        if (ativo) {
          setErro("Não foi possível carregar suas preferências.");
        }
      } finally {
        if (ativo) {
          setCarregando(false);
        }
      }
    };

    carregarConfiguracoes();

    return () => {
      ativo = false;
    };
  }, []);

  // ======================================
  // SALVAR CONFIGURAÇÕES LOCAIS
  // ======================================

  const salvarConfiguracoes = async (novasConfiguracoes) => {
    try {
      await AsyncStorage.setItem(
        CHAVE_CONFIGURACOES,
        JSON.stringify(novasConfiguracoes)
      );

      return true;
    } catch (erro) {
      console.error(
        "Erro ao salvar configurações:",
        erro
      );

      setErro("Não foi possível salvar sua preferência.");
      return false;
    }
  };

  // ======================================
  // OBTER PERMISSÃO E TOKEN EXPO
  // ======================================

  const registrarDispositivo = async () => {
    if (Platform.OS === "web") {
      throw new Error(
        "As notificações push devem ser configuradas em um dispositivo Android ou iOS."
      );
    }

    if (!token) {
      throw new Error(
        "Sua sessão expirou. Entre novamente na sua conta."
      );
    }

    // Canal de notificações para Android
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync(
        "novidades",
        {
          name: "Novidades e lançamentos",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#E50914",
        }
      );
    }

    // Consultar permissão atual
    const permissaoAtual =
      await Notifications.getPermissionsAsync();

    let status = permissaoAtual.status;

    // Solicitar permissão se necessário
    if (status !== "granted") {
      const permissaoSolicitada =
        await Notifications.requestPermissionsAsync();

      status = permissaoSolicitada.status;
    }

    if (status !== "granted") {
      throw new Error(
        "Permissão de notificações não autorizada no celular."
      );
    }

    // Identificar projeto Expo
    const projectId =
      Constants.easConfig?.projectId ||
      Constants.expoConfig?.extra?.eas?.projectId;

    if (!projectId) {
      throw new Error(
        "ID do projeto Expo não encontrado."
      );
    }

    // Gerar token push
    const respostaToken =
      await Notifications.getExpoPushTokenAsync({
        projectId,
      });

    const expoPushToken = respostaToken.data;

    if (!expoPushToken) {
      throw new Error(
        "Não foi possível gerar o token de notificações."
      );
    }

    // Registrar token no backend
    await api("/usuarios/me/notificacoes/dispositivo", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        expo_push_token: expoPushToken,
      }),
    });

    return expoPushToken;
  };

  // ======================================
  // ATIVAR / DESATIVAR NOTIFICAÇÕES
  // ======================================

  const alterarNotificacoes = async (valor) => {
    const anteriores = configuracoes;

    setSalvando(true);
    setErro("");

    try {
      if (valor) {
        // Ativar: solicitar permissão e registrar dispositivo
        await registrarDispositivo();
      } else {
        // Desativar: atualizar preferência no backend
        if (!token) {
          throw new Error(
            "Sua sessão expirou. Entre novamente na sua conta."
          );
        }

        await api("/usuarios/me/notificacoes", {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ativo: false,
          }),
        });
      }

      const novasConfiguracoes = {
        ...anteriores,
        notificacoes: valor,
      };

      const sucesso = await salvarConfiguracoes(
        novasConfiguracoes
      );

      if (!sucesso) {
        throw new Error(
          "Não foi possível salvar sua preferência."
        );
      }

      setConfiguracoes(novasConfiguracoes);

    } catch (erro) {
      console.error(
        "Erro ao alterar notificações:",
        erro
      );

      setConfiguracoes(anteriores);

      setErro(
        erro.message ||
        "Não foi possível atualizar as notificações."
      );
    } finally {
      setSalvando(false);
    }
  };

  // ======================================
  // ALTERAR OUTRAS PREFERÊNCIAS
  // ======================================

  const alterarConfiguracao = async (chave, valor) => {
    const anteriores = configuracoes;

    const novasConfiguracoes = {
      ...anteriores,
      [chave]: valor,
    };

    setConfiguracoes(novasConfiguracoes);

    const sucesso = await salvarConfiguracoes(
      novasConfiguracoes
    );

    if (!sucesso) {
      setConfiguracoes(anteriores);
    }
  };

  // ======================================
  // ESCOLHER QUALIDADE
  // ======================================

  const escolherQualidade = async (qualidade) => {
    const anteriores = configuracoes;

    const novasConfiguracoes = {
      ...anteriores,
      qualidade,
    };

    setConfiguracoes(novasConfiguracoes);

    const sucesso = await salvarConfiguracoes(
      novasConfiguracoes
    );

    if (sucesso) {
      setModalQualidade(false);
    } else {
      setConfiguracoes(anteriores);
    }
  };

  // ======================================
  // CARREGAMENTO INICIAL
  // ======================================

  if (carregando) {
    return (
      <View style={styles.containerCarregando}>
        <ActivityIndicator
          size="large"
          color="#E50914"
        />

        <Text style={styles.textoCarregando}>
          Carregando configurações...
        </Text>
      </View>
    );
  }

  // ======================================
  // INTERFACE
  // ======================================

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        contentContainerStyle={styles.conteudo}
        showsVerticalScrollIndicator={false}
      >
       <TouchableOpacity
  style={styles.voltar}
  onPress={() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate("Perfil");
    }
  }}
  activeOpacity={0.7}
>
  <Text style={styles.textoVoltar}>
    ‹ Voltar
  </Text>
</TouchableOpacity>

        <Text style={styles.titulo}>
          Configurações
        </Text>

        <Text style={styles.subtitulo}>
          Personalize sua experiência no CineVerse
        </Text>

        {erro ? (
          <Text style={styles.erro}>
            {erro}
          </Text>
        ) : null}

        <Text style={styles.tituloSecao}>
          Preferências
        </Text>

        <View style={styles.cartao}>
          <OpcaoSwitch
            titulo="Notificações"
            descricao="Receber novidades e lançamentos"
            valor={configuracoes.notificacoes}
            alterar={alterarNotificacoes}
            desabilitado={salvando}
          />

          <View style={styles.divisor} />

          <OpcaoSwitch
            titulo="Reprodução automática"
            descricao="Reproduzir o próximo episódio automaticamente"
            valor={configuracoes.reproducaoAutomatica}
            alterar={(valor) =>
              alterarConfiguracao(
                "reproducaoAutomatica",
                valor
              )
            }
            desabilitado={salvando}
          />

          <View style={styles.divisor} />

          <OpcaoSwitch
            titulo="Legendas"
            descricao="Ativar legendas por padrão"
            valor={configuracoes.legendas}
            alterar={(valor) =>
              alterarConfiguracao("legendas", valor)
            }
            desabilitado={salvando}
          />

          <View style={styles.divisor} />

          <OpcaoSwitch
            titulo="Perfil privado"
            descricao="Manter suas atividades privadas"
            valor={configuracoes.perfilPrivado}
            alterar={(valor) =>
              alterarConfiguracao("perfilPrivado", valor)
            }
            desabilitado={salvando}
          />
        </View>

        <Text style={styles.tituloSecao}>
          Reprodução
        </Text>

        <TouchableOpacity
          style={styles.cartaoQualidade}
          onPress={() => setModalQualidade(true)}
          activeOpacity={0.7}
        >
          <View style={styles.textosOpcao}>
            <Text style={styles.nomeOpcao}>
              Qualidade de reprodução
            </Text>

            <Text style={styles.descricaoOpcao}>
              {configuracoes.qualidade}
            </Text>
          </View>

          <Text style={styles.seta}>›</Text>
        </TouchableOpacity>

        {salvando && (
          <View style={styles.statusSalvamento}>
            <ActivityIndicator
              size="small"
              color="#E50914"
            />

            <Text style={styles.textoSalvamento}>
              Salvando preferência...
            </Text>
          </View>
        )}

        <Text style={styles.rodape}>
          CineVerse Mobile
        </Text>
      </ScrollView>

      {/* MODAL DE QUALIDADE */}

      <Modal
        visible={modalQualidade}
        transparent
        animationType="fade"
        onRequestClose={() => setModalQualidade(false)}
      >
        <View style={styles.fundoModal}>
          <View style={styles.caixaModal}>
            <Text style={styles.tituloModal}>
              Qualidade de reprodução
            </Text>

            <Text style={styles.subtituloModal}>
              Escolha a qualidade dos vídeos.
            </Text>

            {qualidades.map((qualidade) => {
              const selecionada =
                configuracoes.qualidade === qualidade;

              return (
                <TouchableOpacity
                  key={qualidade}
                  style={[
                    styles.opcaoQualidade,
                    selecionada && styles.opcaoSelecionada,
                  ]}
                  onPress={() => escolherQualidade(qualidade)}
                  disabled={salvando}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.textoQualidade,
                      selecionada && styles.textoSelecionado,
                    ]}
                  >
                    {qualidade}
                  </Text>

                  {selecionada && (
                    <Text style={styles.check}>
                      ✓
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              style={styles.botaoFechar}
              onPress={() => setModalQualidade(false)}
              disabled={salvando}
            >
              <Text style={styles.textoFechar}>
                Fechar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ======================================
// ESTILOS
// ======================================

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

  statusSalvamento: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 15,
    gap: 8,
  },

  textoSalvamento: {
    color: "#999999",
    fontSize: 12,
  },

  erro: {
    color: "#FF7777",
    backgroundColor: "#2A1113",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },

  rodape: {
    color: "#666666",
    fontSize: 12,
    textAlign: "center",
    marginTop: 40,
  },

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
    padding: 22,
    borderWidth: 1,
    borderColor: "#383838",
  },

  tituloModal: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
  },

  subtituloModal: {
    color: "#AAAAAA",
    fontSize: 13,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 20,
  },

  opcaoQualidade: {
    backgroundColor: "#292929",
    borderRadius: 8,
    padding: 15,
    marginBottom: 9,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#383838",
  },

  opcaoSelecionada: {
    borderColor: "#E50914",
    backgroundColor: "#351719",
  },

  textoQualidade: {
    color: "#CCCCCC",
    fontSize: 14,
  },

  textoSelecionado: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },

  check: {
    color: "#E50914",
    fontSize: 19,
    fontWeight: "bold",
  },

  botaoFechar: {
    backgroundColor: "#333333",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },

  textoFechar: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
});
