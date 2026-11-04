import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

import { usePerfil } from "../context/PerfilContext";

export default function EditarPerfilScreen({ navigation }) {
  // Dados compartilhados do perfil
  const { perfil, atualizarPerfil } = usePerfil();

  // Campos editáveis
  const [nome, setNome] = useState(perfil.nome);
  const [email, setEmail] = useState(perfil.email);
  const [foto, setFoto] = useState(perfil.foto || "");

  // Iniciais atualizadas automaticamente
  const iniciais =
    nome
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((parte) => parte.charAt(0).toUpperCase())
      .join("") || "CV";

  // Salvar alterações no contexto compartilhado
  const salvar = () => {
    const nomeLimpo = nome.trim();
    const emailLimpo = email.trim();
    const fotoLimpa = foto.trim();

    // Validação dos campos
    if (!nomeLimpo) {
      Alert.alert("Atenção", "Digite seu nome completo.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLimpo)) {
      Alert.alert("Atenção", "Digite um e-mail válido.");
      return;
    }

    // Atualiza os dados compartilhados
    atualizarPerfil({
      nome: nomeLimpo,
      email: emailLimpo,
      foto: fotoLimpa,
    });

    // Volta para Meu Perfil
    navigation.goBack();
  };

  // Cancelar sem salvar
  const cancelar = () => {
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar barStyle="light-content" />

      <ScrollView
        contentContainerStyle={styles.conteudo}
        keyboardShouldPersistTaps="handled"
      >
        {/* VOLTAR */}
        <TouchableOpacity
          style={styles.voltar}
          onPress={cancelar}
          activeOpacity={0.7}
        >
          <Text style={styles.textoVoltar}>‹ Voltar</Text>
        </TouchableOpacity>

        {/* CABEÇALHO */}
        <Text style={styles.titulo}>Editar Perfil</Text>

        <Text style={styles.subtitulo}>Atualize suas informações pessoais</Text>

        {/* FORMULÁRIO */}
        <View style={styles.cartao}>
          {/* AVATAR */}
          <View style={styles.avatar}>
            <Text style={styles.iniciais}>{iniciais}</Text>
          </View>

          {/* NOME */}
          <Text style={styles.label}>Nome completo</Text>

          <TextInput
            style={styles.campo}
            value={nome}
            onChangeText={setNome}
            placeholder="Digite seu nome"
            placeholderTextColor="#777777"
            autoCapitalize="words"
            autoCorrect={false}
          />

          {/* EMAIL */}
          <Text style={styles.label}>E-mail</Text>

          <TextInput
            style={styles.campo}
            value={email}
            onChangeText={setEmail}
            placeholder="Digite seu e-mail"
            placeholderTextColor="#777777"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          {/* FOTO */}
          <Text style={styles.label}>URL da foto de perfil</Text>

          <TextInput
            style={styles.campo}
            value={foto}
            onChangeText={setFoto}
            placeholder="https://exemplo.com/foto.jpg"
            placeholderTextColor="#777777"
            keyboardType="url"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.ajuda}>A foto de perfil é opcional.</Text>

          {/* SALVAR */}
          <TouchableOpacity
            style={styles.botaoSalvar}
            onPress={salvar}
            activeOpacity={0.7}
          >
            <Text style={styles.textoSalvar}>Salvar alterações</Text>
          </TouchableOpacity>

          {/* CANCELAR */}
          <TouchableOpacity
            style={styles.botaoCancelar}
            onPress={cancelar}
            activeOpacity={0.7}
          >
            <Text style={styles.textoCancelar}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    paddingBottom: 40,
    flexGrow: 1,
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
    marginBottom: 25,
  },

  cartao: {
    backgroundColor: "#1B1B20",
    borderRadius: 15,
    padding: 22,
    borderWidth: 1,
    borderColor: "#303036",
  },

  avatar: {
    width: 85,
    height: 85,
    borderRadius: 45,
    backgroundColor: "#E50914",
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 25,
  },

  iniciais: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "900",
  },

  label: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 9,
  },

  campo: {
    backgroundColor: "#25252A",
    borderWidth: 1,
    borderColor: "#38383E",
    borderRadius: 9,
    padding: 14,
    color: "#FFFFFF",
    fontSize: 15,
    marginBottom: 20,
  },

  ajuda: {
    color: "#888888",
    fontSize: 12,
    marginTop: -10,
    marginBottom: 25,
  },

  botaoSalvar: {
    backgroundColor: "#E50914",
    padding: 16,
    borderRadius: 9,
    alignItems: "center",
  },

  textoSalvar: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 15,
  },

  botaoCancelar: {
    backgroundColor: "#333338",
    padding: 16,
    borderRadius: 9,
    alignItems: "center",
    marginTop: 12,
  },

  textoCancelar: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 15,
  },
});
