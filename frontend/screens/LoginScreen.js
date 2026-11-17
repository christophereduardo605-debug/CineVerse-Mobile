
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator,
} from "react-native";

import { useAuth } from "../context/AuthContext";

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erroLogin, setErroLogin] = useState("");

  async function entrar() {
    const emailLimpo = email.trim().toLowerCase();

    setErroLogin("");

    // VALIDAR E-MAIL
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLimpo)) {
      setErroLogin("Digite um e-mail válido.");
      return;
    }

    // VALIDAR SENHA
    if (senha.length < 8) {
      setErroLogin("A senha deve ter pelo menos 8 caracteres.");
      return;
    }

    try {
      setCarregando(true);

      await login(emailLimpo, senha);

      navigation.replace("Home");
    } catch (erro) {
      console.error("Erro no login:", erro);

      setErroLogin(
        "E-mail ou senha incorretos. Verifique seus dados e tente novamente."
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor="#080808" />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logo}>
          <View style={styles.logoIcon}>
            <Text style={styles.playIcon}>▶</Text>
          </View>

          <Text style={styles.logoText}>CINEVERSE</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.eyebrow}>
            🔴 BEM-VINDO DE VOLTA
          </Text>

          <Text style={styles.title}>Entrar</Text>

          <Text style={styles.subtitle}>
            Acesse seu universo de filmes e séries.
          </Text>

          <Text style={styles.label}>E-mail</Text>

          <TextInput
            style={styles.input}
            placeholder="seu@email.com"
            placeholderTextColor="#888"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={(valor) => {
              setEmail(valor);
              setErroLogin("");
            }}
            editable={!carregando}
          />

          <Text style={styles.label}>Senha</Text>

          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Digite sua senha"
              placeholderTextColor="#888"
              secureTextEntry={!mostrarSenha}
              value={senha}
              onChangeText={(valor) => {
                setSenha(valor);
                setErroLogin("");
              }}
              editable={!carregando}
            />

            <TouchableOpacity
              onPress={() => setMostrarSenha(!mostrarSenha)}
              disabled={carregando}
            >
              <Text style={styles.showPassword}>
                {mostrarSenha ? "Ocultar" : "Mostrar"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* MENSAGEM DE ERRO */}
          {erroLogin ? (
            <View style={styles.caixaErro}>
              <Text style={styles.iconeErro}>!</Text>

              <View style={styles.conteudoErro}>
                <Text style={styles.tituloErro}>
                  Não foi possível entrar
                </Text>

                <Text style={styles.textoErro}>
                  {erroLogin}
                </Text>
              </View>
            </View>
          ) : null}

          <TouchableOpacity
            style={[
              styles.button,
              carregando && styles.buttonDisabled,
            ]}
            onPress={entrar}
            disabled={carregando}
          >
            {carregando ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>
                ▶ Entrar no CineVerse
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cadastroContainer}
            onPress={() => navigation.navigate("Cadastro")}
            disabled={carregando}
          >
            <Text style={styles.cadastroText}>
              Ainda não tem uma conta?{" "}
              <Text style={styles.cadastroDestaque}>
                Criar conta
              </Text>
            </Text>
          </TouchableOpacity>

          <Text style={styles.info}>
            Entre com o e-mail e a senha utilizados no seu cadastro.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#080808",
  },

  content: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 50,
  },

  logo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 35,
  },

  logoIcon: {
    backgroundColor: "#E50914",
    width: 38,
    height: 38,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  playIcon: {
    color: "#FFFFFF",
    fontSize: 20,
  },

  logoText: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: 2,
  },

  card: {
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "#333333",
    borderRadius: 14,
    padding: 25,
  },

  eyebrow: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 2,
    marginBottom: 22,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 36,
    fontWeight: "900",
    marginBottom: 12,
  },

  subtitle: {
    color: "#A1A1A1",
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 30,
  },

  label: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 10,
  },

  input: {
    backgroundColor: "#1E1E1E",
    color: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#383838",
    borderRadius: 7,
    padding: 15,
    marginBottom: 24,
    fontSize: 15,
  },

  passwordContainer: {
    backgroundColor: "#1E1E1E",
    borderWidth: 1,
    borderColor: "#383838",
    borderRadius: 7,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    marginBottom: 25,
  },

  passwordInput: {
    flex: 1,
    color: "#FFFFFF",
    paddingVertical: 15,
    fontSize: 15,
  },

  showPassword: {
    color: "#CCCCCC",
    fontSize: 12,
  },

  // MENSAGEM DE ERRO
  caixaErro: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#2A1113",
    borderWidth: 1,
    borderColor: "#702027",
    borderRadius: 8,
    padding: 13,
    marginBottom: 20,
    gap: 10,
  },

  iconeErro: {
    color: "#FFFFFF",
    backgroundColor: "#E50914",
    width: 21,
    height: 21,
    borderRadius: 11,
    textAlign: "center",
    fontWeight: "bold",
    overflow: "hidden",
  },

  conteudoErro: {
    flex: 1,
  },

  tituloErro: {
    color: "#FF6666",
    fontSize: 13,
    fontWeight: "bold",
    marginBottom: 5,
  },

  textoErro: {
    color: "#FFB3B3",
    fontSize: 12,
    lineHeight: 18,
  },

  button: {
    backgroundColor: "#E50914",
    borderRadius: 7,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
    minHeight: 55,
  },

  buttonDisabled: {
    opacity: 0.7,
  },

  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 15,
  },

  cadastroContainer: {
    marginBottom: 20,
    alignItems: "center",
  },

  cadastroText: {
    color: "#AAAAAA",
    fontSize: 13,
    textAlign: "center",
  },

  cadastroDestaque: {
    color: "#E50914",
    fontWeight: "bold",
  },

  info: {
    color: "#999999",
    fontSize: 12,
    lineHeight: 20,
  },
});
