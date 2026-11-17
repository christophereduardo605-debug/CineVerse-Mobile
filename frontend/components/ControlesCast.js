
import React, { useEffect, useState } from "react";
import Constants from "expo-constants";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";

const estaNoExpoGo =
  Constants.executionEnvironment === "storeClient";

const GoogleCast =
  Platform.OS === "web" || estaNoExpoGo
    ? null
    : require("react-native-google-cast");

export default function ControlesCast() {
  if (!GoogleCast) return null;

  return <ControlesCastAtivo />;
}

function ControlesCastAtivo() {
  const { CastButton, useRemoteMediaClient } = GoogleCast;

  const client = useRemoteMediaClient();

  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    if (!client) return;

    console.log("CAST - Cliente conectado!");

    const listenerStatus = client.onMediaStatusUpdated(
      (status) => {
        console.log("CAST - STATUS:", status);
      }
    );

    const listenerInicio = client.onMediaPlaybackStarted(
      (status) => {
        console.log("CAST - Reprodução iniciada:", status);
      }
    );

    const listenerFim = client.onMediaPlaybackEnded(
      (status) => {
        console.log("CAST - Reprodução finalizada:", status);
      }
    );

    return () => {
      listenerStatus.remove();
      listenerInicio.remove();
      listenerFim.remove();
    };
  }, [client]);

  const transmitirVideoTeste = async () => {
    if (!client) {
      Alert.alert(
        "TV não conectada",
        "Conecte-se à televisão primeiro."
      );
      return;
    }

    if (carregando) return;

    try {
      setCarregando(true);

      await client.loadMedia({
        autoplay: true,
        mediaInfo: {
          contentUrl:
            "https://commondatastorage.googleapis.com/gtv-videos-bucket/CastVideos/mp4/BigBuckBunny.mp4",
          contentType: "video/mp4",
          streamType: "buffered",
          metadata: {
            title: "Vídeo de teste CineVerse",
            subtitle: "Teste de transmissão",
            type: "movie",
          },
        },
      });

      await client.requestStatus();

      Alert.alert(
        "Solicitação enviada",
        "Verifique se o vídeo começou a reproduzir na televisão."
      );
    } catch (error) {
      console.error("CAST - ERRO:", error);

      Alert.alert(
        "Erro na transmissão",
        error?.message || "Não foi possível reproduzir o vídeo."
      );
    } finally {
      setCarregando(false);
    }
  };

  return (
    <View style={styles.areaCast}>
      <View style={styles.textosCast}>
        <Text style={styles.textoCast}>
          Transmitir para TV
        </Text>

        <Text style={styles.subtextoCast}>
          Conecte e envie um vídeo de teste
        </Text>

        {client ? (
          <TouchableOpacity
            style={styles.botaoTeste}
            onPress={transmitirVideoTeste}
            disabled={carregando}
          >
            <Text style={styles.textoBotao}>
              {carregando
                ? "Carregando vídeo..."
                : "▶ Testar vídeo na TV"}
            </Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.subtextoCast}>
            Aguardando conexão com a TV...
          </Text>
        )}
      </View>

      <CastButton style={styles.botaoCast} />
    </View>
  );
}

const styles = StyleSheet.create({
  areaCast: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 20,
    marginTop: 15,
    padding: 15,
    backgroundColor: "#202024",
    borderRadius: 10,
  },

  textosCast: {
    flex: 1,
  },

  textoCast: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },

  subtextoCast: {
    color: "#AAAAAA",
    fontSize: 12,
    marginTop: 5,
  },

  botaoCast: {
    width: 44,
    height: 44,
    tintColor: "#FFFFFF",
  },

  botaoTeste: {
    backgroundColor: "#E50914",
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    alignSelf: "flex-start",
  },

  textoBotao: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "bold",
  },
});
