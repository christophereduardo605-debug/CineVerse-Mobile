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
} from "react-native";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);

  function entrar() {
    if (!email.includes("@") || senha.length < 4) {
      Alert.alert(
        "Atenção",
        "Digite um e-mail válido e uma senha com pelo menos 4 caracteres.",
      );
      return;
    }

    navigation.replace("Home");
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
          <Text style={styles.eyebrow}>🔴 BEM-VINDO DE VOLTA</Text>

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
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>Senha</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Digite sua senha"
              placeholderTextColor="#888"
              secureTextEntry={!mostrarSenha}
              value={senha}
              onChangeText={setSenha}
            />
            <TouchableOpacity onPress={() => setMostrarSenha(!mostrarSenha)}>
              <Text style={styles.showPassword}>
                {mostrarSenha ? "Ocultar" : "Mostrar"}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.button} onPress={entrar}>
            <Text style={styles.buttonText}>▶ Entrar no CineVerse</Text>
          </TouchableOpacity>

          <Text style={styles.info}>
            Acesso demonstrativo: use qualquer e-mail válido e uma senha com
            pelo menos 4 caracteres.
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
  button: {
    backgroundColor: "#E50914",
    borderRadius: 7,
    paddingVertical: 18,
    alignItems: "center",
    marginBottom: 24,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 15,
  },
  info: {
    color: "#999999",
    fontSize: 12,
    lineHeight: 20,
  },
});
