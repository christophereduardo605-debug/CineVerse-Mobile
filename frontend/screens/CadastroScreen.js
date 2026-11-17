
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
  Alert,
  ActivityIndicator,
} from "react-native";

import { useAuth } from "../context/AuthContext";

export default function CadastroScreen({ navigation }) {
  const { cadastrar } = useAuth();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [cadastroConcluido, setCadastroConcluido] = useState(false);

  async function criarConta() {
    const nomeLimpo = nome.trim();
    const emailLimpo = email.trim().toLowerCase();

    if (nomeLimpo.length < 2) {
      Alert.alert("Atenção", "Informe seu nome completo.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLimpo)) {
      Alert.alert("Atenção", "Digite um e-mail válido.");
      return;
    }

    if (senha.length < 8) {
      Alert.alert("Atenção", "A senha deve ter pelo menos 8 caracteres.");
      return;
    }

    if (senha !== confirmarSenha) {
      Alert.alert("Atenção", "As senhas não são iguais.");
      return;
    }

    try {
      setCarregando(true);

      await cadastrar(nomeLimpo, emailLimpo, senha);

      setCadastroConcluido(true);
    } catch (erro) {
      console.log("ERRO NO CADASTRO:", erro);

      Alert.alert(
        "Não foi possível cadastrar",
        erro.message || "Verifique seus dados e tente novamente."
      );
    } finally {
      setCarregando(false);
    }
  }

  function irParaLogin() {
    navigation.replace("Login");
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
          {cadastroConcluido ? (
            <View style={styles.sucessoContainer}>
              <Text style={styles.sucessoIcone}>✓</Text>

              <Text style={styles.sucessoTitulo}>
                Conta criada com sucesso!
              </Text>

              <Text style={styles.sucessoTexto}>
                Seu cadastro foi realizado. Agora você já pode entrar
                no CineVerse com seu e-mail e senha.
              </Text>

              <TouchableOpacity
                style={styles.button}
                onPress={irParaLogin}
              >
                <Text style={styles.buttonText}>
                  Ir para o Login
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.eyebrow}>
                🔴 SEU UNIVERSO COMEÇA AQUI
              </Text>

              <Text style={styles.title}>Criar conta</Text>

              <Text style={styles.subtitle}>
                Cadastre-se para aproveitar filmes e séries.
              </Text>

              <Text style={styles.label}>Nome completo</Text>

              <TextInput
                style={styles.input}
                placeholder="Digite seu nome"
                placeholderTextColor="#888"
                autoCapitalize="words"
                value={nome}
                onChangeText={setNome}
                editable={!carregando}
              />

              <Text style={styles.label}>E-mail</Text>

              <TextInput
                style={styles.input}
                placeholder="seu@email.com"
                placeholderTextColor="#888"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
                editable={!carregando}
              />

              <Text style={styles.label}>Senha</Text>

              <TextInput
                style={styles.input}
                placeholder="Mínimo de 8 caracteres"
                placeholderTextColor="#888"
                secureTextEntry
                value={senha}
                onChangeText={setSenha}
                editable={!carregando}
              />

              <Text style={styles.label}>Confirmar senha</Text>

              <TextInput
                style={styles.input}
                placeholder="Digite novamente sua senha"
                placeholderTextColor="#888"
                secureTextEntry
                value={confirmarSenha}
                onChangeText={setConfirmarSenha}
                editable={!carregando}
              />

              <TouchableOpacity
                style={[
                  styles.button,
                  carregando && styles.buttonDisabled,
                ]}
                onPress={criarConta}
                disabled={carregando}
              >
                {carregando ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>
                    Criar minha conta
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.goBack()}
                disabled={carregando}
              >
                <Text style={styles.voltar}>
                  Já tem uma conta?{" "}
                  <Text style={styles.destaque}>Entrar</Text>
                </Text>
              </TouchableOpacity>
            </>
          )}
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
    paddingVertical: 40,
  },
  logo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
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
    letterSpacing: 1,
    marginBottom: 18,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 34,
    fontWeight: "900",
    marginBottom: 10,
  },
  subtitle: {
    color: "#A1A1A1",
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 25,
  },
  label: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 9,
  },
  input: {
    backgroundColor: "#1E1E1E",
    color: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#383838",
    borderRadius: 7,
    padding: 14,
    marginBottom: 18,
    fontSize: 15,
  },
  button: {
    backgroundColor: "#E50914",
    borderRadius: 7,
    paddingVertical: 17,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 54,
    marginTop: 8,
    marginBottom: 22,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 15,
  },
  voltar: {
    color: "#AAAAAA",
    fontSize: 13,
    textAlign: "center",
  },
  destaque: {
    color: "#E50914",
    fontWeight: "bold",
  },
  sucessoContainer: {
    alignItems: "center",
    paddingVertical: 15,
  },
  sucessoIcone: {
    color: "#FFFFFF",
    backgroundColor: "#168A45",
    width: 64,
    height: 64,
    borderRadius: 32,
    textAlign: "center",
    textAlignVertical: "center",
    fontSize: 38,
    fontWeight: "bold",
    overflow: "hidden",
    marginBottom: 22,
  },
  sucessoTitulo: {
    color: "#FFFFFF",
    fontSize: 23,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 14,
  },
  sucessoTexto: {
    color: "#A1A1A1",
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 25,
  },
});
