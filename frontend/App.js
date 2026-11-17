
import React from "react";

import {
  ActivityIndicator,
  View,
  StyleSheet,
} from "react-native";

import {
  NavigationContainer,
} from "@react-navigation/native";

import {
  createNativeStackNavigator,
} from "@react-navigation/native-stack";

// Contextos
import { AuthProvider, useAuth } from "./context/AuthContext";
import { PerfilProvider } from "./context/PerfilContext";
import { ListaProvider } from "./context/ListaContext";

// Telas
import LoginScreen from "./screens/LoginScreen";
import CadastroScreen from "./screens/CadastroScreen";
import HomeScreen from "./screens/HomeScreen";
import PesquisaScreen from "./screens/PesquisaScreen";
import FilmesScreen from "./screens/FilmesScreen";
import SeriesScreen from "./screens/SeriesScreen";
import MinhaListaScreen from "./screens/MinhaListaScreen";
import PerfilScreen from "./screens/PerfilScreen";
import EditarPerfilScreen from "./screens/EditarPerfilScreen";
import PlayerScreen from "./screens/PlayerScreen";
import DetalhesSerieScreen from "./screens/DetalhesSerieScreen";
import ConfiguracoesScreen from "./screens/ConfiguracoesScreen";
import DetalhesScreen from "./screens/DetalhesScreen";
import AvaliacoesScreen from "./screens/AvaliacoesScreen";
import NotificacoesScreen from "./screens/NotificacoesScreen";

const Stack = createNativeStackNavigator();

const linking = {
  config: {
    screens: {
      Login: "login",
      Cadastro: "cadastro",
      Home: "home",
      Pesquisa: "pesquisa",
      Filmes: "filmes",
      Series: "series",
      MinhaLista: "minha-lista",
      Perfil: "perfil",
      EditarPerfil: "editar-perfil",
      Player: "player",
      DetalhesSerie: "detalhes-serie",
      Configuracoes: "configuracoes",
      Detalhes: "detalhes",
      Avaliacoes: "avaliacoes",
      Notificacoes: "notificacoes",
    },
  },
};

function AppNavigator() {
  const { carregando, autenticado } = useAuth();

  if (carregando) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E50914" />
      </View>
    );
  }

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator
        initialRouteName={autenticado ? "Home" : "Login"}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Cadastro" component={CadastroScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Pesquisa" component={PesquisaScreen} />
        <Stack.Screen name="Filmes" component={FilmesScreen} />
        <Stack.Screen name="Series" component={SeriesScreen} />
        <Stack.Screen name="MinhaLista" component={MinhaListaScreen} />
        <Stack.Screen name="Perfil" component={PerfilScreen} />
        <Stack.Screen name="EditarPerfil" component={EditarPerfilScreen} />
        <Stack.Screen name="Player" component={PlayerScreen} />
        <Stack.Screen name="DetalhesSerie" component={DetalhesSerieScreen} />
        <Stack.Screen name="Configuracoes" component={ConfiguracoesScreen} />
        <Stack.Screen name="Detalhes" component={DetalhesScreen} />
        <Stack.Screen name="Avaliacoes" component={AvaliacoesScreen} />

        <Stack.Screen
          name="Notificacoes"
          component={NotificacoesScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <PerfilProvider>
        <ListaProvider>
          <AppNavigator />
        </ListaProvider>
      </PerfilProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: "#080808",
    justifyContent: "center",
    alignItems: "center",
  },
});
