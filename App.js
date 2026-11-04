import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { PerfilProvider } from "./context/PerfilContext";

import LoginScreen from "./screens/LoginScreen";
import HomeScreen from "./screens/HomeScreen";
import FilmesScreen from "./screens/FilmesScreen";
import SeriesScreen from "./screens/SeriesScreen";
import MinhaListaScreen from "./screens/MinhaListaScreen";
import PerfilScreen from "./screens/PerfilScreen";
import EditarPerfilScreen from "./screens/EditarPerfilScreen";
import ConfiguracoesScreen from "./screens/ConfiguracoesScreen";
import DetalhesScreen from "./screens/DetalhesScreen";
import { ListaProvider } from "./context/ListaContext";
import PlayerScreen from "./screens/PlayerScreen";
import DetalhesSerieScreen from "./screens/DetalhesSerieScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <PerfilProvider>
      <ListaProvider>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="Login"
            screenOptions={{ headerShown: false }}
          >
            <Stack.Screen name="Login" component={LoginScreen} />

            <Stack.Screen name="Home" component={HomeScreen} />

            <Stack.Screen name="Filmes" component={FilmesScreen} />

            <Stack.Screen name="Series" component={SeriesScreen} />

            <Stack.Screen name="MinhaLista" component={MinhaListaScreen} />

            <Stack.Screen name="Perfil" component={PerfilScreen} />

            <Stack.Screen name="EditarPerfil" component={EditarPerfilScreen} />

            <Stack.Screen name="Player" component={PlayerScreen} />

            <Stack.Screen
              name="DetalhesSerie"
              component={DetalhesSerieScreen}
              options={{ headerShown: false }}
            />

            <Stack.Screen
              name="Configuracoes"
              component={ConfiguracoesScreen}
            />

            <Stack.Screen name="Detalhes" component={DetalhesScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </ListaProvider>
    </PerfilProvider>
  );
}
