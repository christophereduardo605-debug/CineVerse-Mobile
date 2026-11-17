
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
  Image,
} from "react-native";

import * as DocumentPicker from "expo-document-picker";

import { usePerfil } from "../context/PerfilContext";

export default function EditarPerfilScreen({ navigation }) {
  const { perfil, atualizarPerfil } = usePerfil();

  const [nome, setNome] = useState(perfil.nome || "");
  const [email, setEmail] = useState(perfil.email || "");
  const [foto, setFoto] = useState(perfil.foto || "");
  const [salvando, setSalvando] = useState(false);

  const iniciais =
    nome
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((parte) => parte.charAt(0).toUpperCase())
      .join("") || "CV";

  // Selecionar imagem pelo explorador de arquivos
  const selecionarArquivo = async () => {
    try {
      const resultado = await DocumentPicker.getDocumentAsync({
        type: ["image/jpeg", "image/png", "image/webp"],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (!resultado.canceled && resultado.assets?.length > 0) {
        setFoto(resultado.assets[0].uri);
      }
    } catch (erro) {
      console.log("Erro ao selecionar arquivo:", erro);
      Alert.alert("Erro", "Não foi possível selecionar a imagem.");
    }
  };

  // Escolher foto de perfil
  const escolherFoto = () => {
    selecionarArquivo();
  };

  // Salvar alterações
  const salvar = async () => {
    const nomeLimpo = nome.trim();
    const emailLimpo = email.trim();

    if (!nomeLimpo) {
      Alert.alert("Atenção", "Digite seu nome completo.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLimpo)) {
      Alert.alert("Atenção", "Digite um e-mail válido.");
      return;
    }

    try {
      setSalvando(true);

      await atualizarPerfil({
        nome: nomeLimpo,
        email: emailLimpo,
        foto,
      });

      Alert.alert("Sucesso", "Perfil atualizado!");
      navigation.goBack();
    } catch (erro) {
      console.log("Erro ao salvar perfil:", erro);
      Alert.alert("Erro", "Não foi possível salvar as alterações.");
    } finally {
      setSalvando(false);
    }
  };

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
        <TouchableOpacity
          style={styles.voltar}
          onPress={cancelar}
          activeOpacity={0.7}
        >
          <Text style={styles.textoVoltar}>‹ Voltar</Text>
        </TouchableOpacity>

        <Text style={styles.titulo}>Editar Perfil</Text>

        <Text style={styles.subtitulo}>
          Atualize suas informações pessoais
        </Text>

        <View style={styles.cartao}>
          {/* FOTO DE PERFIL */}
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

          <TouchableOpacity
            style={styles.botaoFoto}
            onPress={escolherFoto}
            activeOpacity={0.7}
          >
            <Text style={styles.textoBotaoFoto}>
              Escolher foto
            </Text>
          </TouchableOpacity>

          <Text style={styles.ajuda}>
            Selecione uma imagem do seu dispositivo.
          </Text>

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

          {/* SALVAR */}
          <TouchableOpacity
            style={[
              styles.botaoSalvar,
              salvando && styles.botaoDesabilitado,
            ]}
            onPress={salvar}
            disabled={salvando}
            activeOpacity={0.7}
          >
            <Text style={styles.textoSalvar}>
              {salvando ? "Salvando..." : "Salvar alterações"}
            </Text>
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
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#E50914",
    alignSelf: "center",
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

  botaoFoto: {
    backgroundColor: "#333338",
    padding: 12,
    borderRadius: 9,
    alignItems: "center",
    marginBottom: 10,
  },

  textoBotaoFoto: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 14,
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
    textAlign: "center",
    marginBottom: 25,
  },

  botaoSalvar: {
    backgroundColor: "#E50914",
    padding: 16,
    borderRadius: 9,
    alignItems: "center",
  },

  botaoDesabilitado: {
    opacity: 0.6,
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
