import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";

const itens = [
  { nome: "Início", rota: "Home", icone: "⌂" },
  { nome: "Filmes", rota: "Filmes", icone: "▣" },
  { nome: "Séries", rota: "Series", icone: "▤" },
  { nome: "Minha Lista", rota: "MinhaLista", icone: "♡" },
  { nome: "Perfil", rota: "Perfil", icone: "◉" },
];

export default function BottomMenu() {
  const navigation = useNavigation();
  const route = useRoute();

  return (
    <View style={styles.menu}>
      {itens.map((item) => {
        const ativo = route.name === item.rota;

        return (
          <TouchableOpacity
            key={item.rota}
            style={styles.botao}
            onPress={() => {
              if (ativo) return;

              const rotasDisponiveis = navigation.getState()?.routeNames || [];

              if (rotasDisponiveis.includes(item.rota)) {
                navigation.navigate(item.rota);
              }
            }}
          >
            <Text style={[styles.icone, ativo && styles.ativo]}>
              {item.icone}
            </Text>

            <Text style={[styles.texto, ativo && styles.ativo]}>
              {item.nome}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  menu: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#171719",
    borderTopWidth: 1,
    borderTopColor: "#333333",
    paddingTop: 12,
    paddingBottom: 24,
  },
  botao: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  icone: {
    color: "#999999",
    fontSize: 20,
    marginBottom: 4,
  },
  texto: {
    color: "#999999",
    fontSize: 11,
    textAlign: "center",
  },
  ativo: {
    color: "#E50914",
  },
});
