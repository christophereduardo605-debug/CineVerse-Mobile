import React, { useEffect, useState } from "react";
import Constants from "expo-constants";

import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Linking,
  useWindowDimensions,
  TextInput,
  Alert,
  Platform,
} from "react-native";

import YoutubePlayer from "react-native-youtube-iframe";

import { useAuth } from "../context/AuthContext";

import {
  buscarSeriePorId,
  buscarDetalhesSerieTMDB,
  buscarTemporadaTMDB,
  buscarTrailerSerieTMDB,
  buscarTrailerTemporadaTMDB,
  sincronizarSerieTMDB,
} from "../services/seriesService";

import {
  buscarAvaliacoesFilme,
  cadastrarAvaliacao,
  editarAvaliacao,
  excluirAvaliacao,
} from "../services/filmesService";

// ======================================
// GOOGLE CAST
// ======================================

const estaNoExpoGo = Constants.executionEnvironment === "storeClient";

const GoogleCast =
  Platform.OS === "web" || estaNoExpoGo
    ? null
    : require("react-native-google-cast");

function ControlesCast() {
  if (!GoogleCast) return null;

  return <ControlesCastAtivo />;
}

function ControlesCastAtivo() {
  const { CastButton, useRemoteMediaClient } = GoogleCast;
  const client = useRemoteMediaClient();

  const [carregandoCast, setCarregandoCast] = useState(false);

  useEffect(() => {
    if (!client) return undefined;

    console.log("CAST - Cliente conectado!");

    const listenerStatus = client.onMediaStatusUpdated((status) => {
      console.log("CAST - Status da mídia:", status);
    });

    const listenerInicio = client.onMediaPlaybackStarted(() => {
      console.log("CAST - Reprodução iniciada!");
    });

    const listenerFim = client.onMediaPlaybackEnded(() => {
      console.log("CAST - Reprodução finalizada!");
    });

    return () => {
      listenerStatus?.remove?.();
      listenerInicio?.remove?.();
      listenerFim?.remove?.();
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

    if (carregandoCast) return;

    try {
      setCarregandoCast(true);

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

      const status = await client.getMediaStatus();
      console.log("CAST - Mídia carregada:", status);

      Alert.alert(
        "Solicitação enviada",
        "Verifique se o vídeo começou a reproduzir na televisão."
      );
    } catch (error) {
      console.error("Erro ao transmitir vídeo:", error);

      Alert.alert(
        "Erro na transmissão",
        error.message || "Não foi possível transmitir o vídeo."
      );
    } finally {
      setCarregandoCast(false);
    }
  };

  return (
    <View style={styles.areaCast}>
      <View style={styles.textosCast}>
        <Text style={styles.textoCast}>Transmitir para TV</Text>

        <Text style={styles.subtextoCast}>
          Conecte e envie um vídeo de teste
        </Text>

        {client ? (
          <TouchableOpacity
            style={styles.botaoTesteCast}
            onPress={transmitirVideoTeste}
            disabled={carregandoCast}
            activeOpacity={0.8}
          >
            {carregandoCast ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.textoTesteCast}>
                Testar vídeo na TV
              </Text>
            )}
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

const obterVideoId = (trailer) => {
  if (!trailer) return null;

  if (trailer.chave) return trailer.chave;

  if (trailer.url) {
    const encontrado = trailer.url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/
    );

    return encontrado ? encontrado[1] : null;
  }

  return null;
};

export default function DetalhesSerieScreen({ navigation, route }) {
  const { width: larguraTela } = useWindowDimensions();
  const { usuario, token } = useAuth();

  const larguraCapa = Math.min(larguraTela * 0.62, 300);
  const alturaCapa = larguraCapa * 1.5;

  const larguraVideo = Math.max(0, larguraTela - 40);
  const alturaVideo = larguraVideo * (9 / 16);

  const larguraVideoTemporada = Math.max(0, larguraTela - 84);
  const alturaVideoTemporada = larguraVideoTemporada * (9 / 16);

  const [serie, setSerie] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [trailerSerie, setTrailerSerie] = useState(null);
  const [carregandoTrailerSerie, setCarregandoTrailerSerie] =
    useState(false);

  const [temporadasAbertas, setTemporadasAbertas] = useState({});
  const [episodiosPorTemporada, setEpisodiosPorTemporada] = useState({});
  const [temporadasCarregando, setTemporadasCarregando] = useState({});
  const [erroTemporadas, setErroTemporadas] = useState({});

  const [trailersPorTemporada, setTrailersPorTemporada] = useState({});
  const [trailersCarregando, setTrailersCarregando] = useState({});

  // ======================================
  // ESTADOS DAS AVALIAÇÕES
  // ======================================

  const [serieInternaId, setSerieInternaId] = useState(null);
  const [avaliacoes, setAvaliacoes] = useState([]);

  const [estatisticas, setEstatisticas] = useState({
    media: 0,
    total_avaliacoes: 0,
  });

  const [carregandoAvaliacoes, setCarregandoAvaliacoes] =
    useState(false);

  const [erroAvaliacoes, setErroAvaliacoes] = useState("");

  const [notaSelecionada, setNotaSelecionada] = useState(5);
  const [comentario, setComentario] = useState("");

  const [avaliacaoEditando, setAvaliacaoEditando] = useState(null);
  const [enviandoAvaliacao, setEnviandoAvaliacao] = useState(false);
  const [excluindoAvaliacao, setExcluindoAvaliacao] = useState(null);

  const id = route.params?.id;
  const origem = route.params?.origem || "mysql";

  // ======================================
  // CARREGAR AVALIAÇÕES
  // ======================================

  const carregarAvaliacoes = async (idInterno) => {
    if (!idInterno) return;

    try {
      setCarregandoAvaliacoes(true);
      setErroAvaliacoes("");

      const dados = await buscarAvaliacoesFilme(idInterno);

      const lista = Array.isArray(dados?.avaliacoes)
        ? dados.avaliacoes
        : [];

      setAvaliacoes(lista);

      setEstatisticas({
        media: Number(dados?.estatisticas?.media || 0),
        total_avaliacoes: Number(
          dados?.estatisticas?.total_avaliacoes || 0
        ),
      });

      return lista;
    } catch (error) {
      console.error("Erro ao carregar avaliações da série:", error);

      setErroAvaliacoes(
        error.message || "Erro ao carregar avaliações."
      );
    } finally {
      setCarregandoAvaliacoes(false);
    }
  };

  // ======================================
  // CARREGAR TRAILER GERAL
  // ======================================

  const carregarTrailerSerie = async (serieId) => {
    try {
      setCarregandoTrailerSerie(true);

      const trailer = await buscarTrailerSerieTMDB(serieId);

      setTrailerSerie(trailer);
    } catch (error) {
      console.log("Trailer geral não disponível:", error.message);
      setTrailerSerie(null);
    } finally {
      setCarregandoTrailerSerie(false);
    }
  };

  // ======================================
  // CARREGAR DETALHES DA SÉRIE
  // ======================================

  const carregarSerie = async () => {
    try {
      setCarregando(true);
      setErro("");

      setSerie(null);
      setSerieInternaId(null);
      setAvaliacoes([]);

      setEstatisticas({
        media: 0,
        total_avaliacoes: 0,
      });

      setTrailerSerie(null);
      setCarregandoTrailerSerie(false);

      setTemporadasAbertas({});
      setEpisodiosPorTemporada({});
      setTemporadasCarregando({});
      setErroTemporadas({});

      setTrailersPorTemporada({});
      setTrailersCarregando({});

      setNotaSelecionada(5);
      setComentario("");
      setAvaliacaoEditando(null);

      if (!id) {
        throw new Error("ID da série não informado.");
      }

      let dados;
      let idInterno;

      if (origem === "tmdb") {
        dados = await buscarDetalhesSerieTMDB(id);

        // Sincroniza a série com o MySQL
        const resultado = await sincronizarSerieTMDB(id);

        idInterno =
          resultado?.conteudo?.id ??
          resultado?.id ??
          null;

        carregarTrailerSerie(id);
      } else {
        dados = await buscarSeriePorId(id);

        idInterno = dados?.id;
      }

      setSerie(dados);

      if (idInterno) {
        const idNumerico = Number(idInterno);

        setSerieInternaId(idNumerico);

        await carregarAvaliacoes(idNumerico);
      } else {
        setErroAvaliacoes(
          "Não foi possível identificar o registro da série no banco de dados."
        );
      }
    } catch (error) {
      console.error("Erro ao carregar detalhes da série:", error);

      setErro("Não foi possível carregar os detalhes da série.");
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarSerie();
  }, [id, origem]);

  // ======================================
  // CADASTRAR OU EDITAR AVALIAÇÃO
  // ======================================

  const salvarAvaliacao = async () => {
    if (!usuario || !token) {
      Alert.alert(
        "Login necessário",
        "Entre na sua conta para avaliar esta série."
      );
      return;
    }

    if (!serieInternaId) {
      Alert.alert(
        "Erro",
        "Não foi possível identificar esta série no banco de dados."
      );
      return;
    }

    if (notaSelecionada < 1 || notaSelecionada > 5) {
      Alert.alert(
        "Nota inválida",
        "Selecione uma nota entre 1 e 5 estrelas."
      );
      return;
    }

    try {
      setEnviandoAvaliacao(true);

      if (avaliacaoEditando) {
        await editarAvaliacao(
          avaliacaoEditando.id,
          notaSelecionada,
          comentario.trim(),
          token
        );

        Alert.alert(
          "Avaliação atualizada",
          "Sua avaliação foi atualizada com sucesso."
        );
      } else {
        await cadastrarAvaliacao(
          serieInternaId,
          notaSelecionada,
          comentario.trim(),
          token
        );

        Alert.alert(
          "Avaliação enviada",
          "Sua avaliação foi cadastrada com sucesso."
        );
      }

      setNotaSelecionada(5);
      setComentario("");
      setAvaliacaoEditando(null);

      await carregarAvaliacoes(serieInternaId);
    } catch (error) {
      console.error("Erro ao salvar avaliação:", error);

      Alert.alert(
        "Erro",
        error.message || "Não foi possível salvar sua avaliação."
      );
    } finally {
      setEnviandoAvaliacao(false);
    }
  };

  // ======================================
  // INICIAR EDIÇÃO
  // ======================================

  const iniciarEdicaoAvaliacao = (avaliacao) => {
    setAvaliacaoEditando(avaliacao);

    setNotaSelecionada(Number(avaliacao.nota));

    setComentario(avaliacao.comentario || "");
  };

  // ======================================
  // CANCELAR EDIÇÃO
  // ======================================

  const cancelarEdicaoAvaliacao = () => {
    setAvaliacaoEditando(null);
    setNotaSelecionada(5);
    setComentario("");
  };

  // ======================================
  // EXCLUIR AVALIAÇÃO
  // ======================================

  const removerAvaliacao = async (avaliacaoId) => {
    if (!token) {
      Alert.alert("Erro", "Você precisa estar conectado.");
      return;
    }

    try {
      setExcluindoAvaliacao(avaliacaoId);

      await excluirAvaliacao(avaliacaoId, token);

      if (avaliacaoEditando?.id === avaliacaoId) {
        cancelarEdicaoAvaliacao();
      }

      await carregarAvaliacoes(serieInternaId);

      Alert.alert(
        "Avaliação excluída",
        "Sua avaliação foi removida com sucesso."
      );
    } catch (error) {
      console.error("Erro ao excluir avaliação:", error);

      Alert.alert(
        "Erro",
        error.message || "Não foi possível excluir a avaliação."
      );
    } finally {
      setExcluindoAvaliacao(null);
    }
  };

  const confirmarExclusaoAvaliacao = (avaliacao) => {
    Alert.alert(
      "Excluir avaliação",
      "Tem certeza de que deseja excluir sua avaliação?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () => removerAvaliacao(avaliacao.id),
        },
      ]
    );
  };

  // ======================================
  // CARREGAR TRAILER DA TEMPORADA
  // ======================================

  const carregarTrailerTemporada = async (numero) => {
    try {
      setTrailersCarregando((anterior) => ({
        ...anterior,
        [numero]: true,
      }));

      const trailer = await buscarTrailerTemporadaTMDB(id, numero);

      setTrailersPorTemporada((anterior) => ({
        ...anterior,
        [numero]: trailer,
      }));
    } catch (error) {
      console.log(
        `Trailer da temporada ${numero} não disponível:`,
        error.message
      );

      setTrailersPorTemporada((anterior) => ({
        ...anterior,
        [numero]: null,
      }));
    } finally {
      setTrailersCarregando((anterior) => ({
        ...anterior,
        [numero]: false,
      }));
    }
  };

  // ======================================
  // CARREGAR EPISÓDIOS
  // ======================================

  const carregarEpisodiosTemporada = async (numero) => {
    try {
      setTemporadasCarregando((anterior) => ({
        ...anterior,
        [numero]: true,
      }));

      setErroTemporadas((anterior) => ({
        ...anterior,
        [numero]: "",
      }));

      const dados = await buscarTemporadaTMDB(id, numero);

      setEpisodiosPorTemporada((anterior) => ({
        ...anterior,
        [numero]: dados.episodios || [],
      }));
    } catch (error) {
      console.error(
        `Erro ao carregar episódios da temporada ${numero}:`,
        error
      );

      setErroTemporadas((anterior) => ({
        ...anterior,
        [numero]: "Não foi possível carregar os episódios.",
      }));
    } finally {
      setTemporadasCarregando((anterior) => ({
        ...anterior,
        [numero]: false,
      }));
    }
  };

  // ======================================
  // ABRIR OU FECHAR TEMPORADA
  // ======================================

  const alternarTemporada = async (temporada) => {
    const numero = temporada.numero;

    if (temporadasAbertas[numero]) {
      setTemporadasAbertas((anterior) => ({
        ...anterior,
        [numero]: false,
      }));

      return;
    }

    setTemporadasAbertas((anterior) => ({
      ...anterior,
      [numero]: true,
    }));

    if (!episodiosPorTemporada[numero]) {
      carregarEpisodiosTemporada(numero);
    }

    if (
      !Object.prototype.hasOwnProperty.call(
        trailersPorTemporada,
        numero
      )
    ) {
      carregarTrailerTemporada(numero);
    }
  };

  // ======================================
  // ABRIR PLATAFORMA
  // ======================================

  const abrirPlataforma = async (link) => {
    if (!link) return;

    try {
      await Linking.openURL(link);
    } catch (error) {
      console.error("Erro ao abrir plataforma:", error);
    }
  };

  // ======================================
  // DATA DA AVALIAÇÃO
  // ======================================

  const formatarData = (data) => {
    if (!data) return "";

    const dataFormatada = new Date(data);

    if (Number.isNaN(dataFormatada.getTime())) {
      return "";
    }

    return dataFormatada.toLocaleDateString("pt-BR");
  };

  // ======================================
  // TELA
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
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.textoVoltar}>‹ Voltar</Text>
        </TouchableOpacity>

        {carregando ? (
          <ActivityIndicator
            size="large"
            color="#E50914"
            style={styles.carregando}
          />
        ) : erro ? (
          <View style={styles.estado}>
            <Text style={styles.mensagem}>{erro}</Text>

            <TouchableOpacity
              style={styles.botaoTentar}
              onPress={carregarSerie}
            >
              <Text style={styles.textoBotao}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        ) : serie ? (
          <>
            {/* CAPA */}
            <View
              style={[
                styles.areaCapa,
                {
                  width: larguraCapa,
                  height: alturaCapa,
                },
              ]}
            >
              {serie.imagem ? (
                <Image
                  source={{ uri: serie.imagem }}
                  style={styles.capa}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.capaSemImagem}>
                  <Text style={styles.iconeCapa}>▶</Text>
                  <Text style={styles.mensagem}>
                    Imagem não disponível
                  </Text>
                </View>
              )}
            </View>

            {/* INFORMAÇÕES */}
            <Text style={styles.titulo}>{serie.titulo}</Text>

            <View style={styles.informacoes}>
              <Text style={styles.info}>
                {serie.ano || "Ano não informado"}
              </Text>

              <Text style={styles.separador}>•</Text>

              <Text style={styles.info}>Série</Text>
            </View>

            {/* SINOPSE */}
            <Text style={styles.tituloSecao}>Sinopse</Text>

            <Text style={styles.sinopse}>
              {serie.descricao || "Sinopse não disponível."}
            </Text>

            {/* TRAILER GERAL */}
            {origem === "tmdb" && (
              <View style={styles.secaoTrailer}>
                <Text style={styles.tituloSecao}>
                  Trailer da série
                </Text>

                {carregandoTrailerSerie ? (
                  <ActivityIndicator
                    size="small"
                    color="#E50914"
                    style={styles.carregandoTrailer}
                  />
                ) : trailerSerie && obterVideoId(trailerSerie) ? (
                  <View
                    style={[
                      styles.playerContainer,
                      {
                        width: larguraVideo,
                        height: alturaVideo,
                      },
                    ]}
                  >
                    <YoutubePlayer
                      width={larguraVideo}
                      height={alturaVideo}
                      play={false}
                      videoId={obterVideoId(trailerSerie)}
                      webViewStyle={styles.player}
                    />
                  </View>
                ) : (
                  <Text style={styles.mensagem}>
                    Trailer não disponível para esta série.
                  </Text>
                )}

                {trailerSerie?.nome ? (
                  <Text style={styles.nomeTrailer}>
                    {trailerSerie.nome}
                  </Text>
                ) : null}
              </View>
            )}

            {/* GOOGLE CAST */}
            {Platform.OS !== "web" && !estaNoExpoGo && (
              <ControlesCast />
            )}

            {/* TEMPORADAS E EPISÓDIOS */}
            {origem === "tmdb" && (
              <>
                <Text style={styles.tituloSecao}>
                  Temporadas e episódios
                </Text>

                {serie.temporadas?.filter(
                  (temporada) => temporada.numero > 0
                ).length > 0 ? (
                  serie.temporadas
                    .filter((temporada) => temporada.numero > 0)
                    .map((temporada) => {
                      const numero = temporada.numero;
                      const aberta = !!temporadasAbertas[numero];

                      const episodios =
                        episodiosPorTemporada[numero] || [];

                      const trailerTemporada =
                        trailersPorTemporada[numero];

                      return (
                        <View
                          key={temporada.id || numero}
                          style={[
                            styles.blocoTemporada,
                            aberta && styles.blocoTemporadaAberta,
                          ]}
                        >
                          <TouchableOpacity
                            style={styles.cardTemporada}
                            onPress={() => alternarTemporada(temporada)}
                            activeOpacity={0.8}
                          >
                            <View style={styles.numeroTemporada}>
                              <Text style={styles.numeroTemporadaTexto}>
                                {numero}
                              </Text>
                            </View>

                            <View style={styles.infoTemporada}>
                              <Text style={styles.nomeTemporada}>
                                {temporada.titulo ||
                                  `Temporada ${numero}`}
                              </Text>

                              <Text style={styles.quantidadeEpisodios}>
                                {temporada.quantidade_episodios || 0} episódios
                              </Text>
                            </View>

                            <View style={styles.areaSetaTemporada}>
                              <Text style={styles.setaTemporada}>
                                {aberta ? "−" : "+"}
                              </Text>
                            </View>
                          </TouchableOpacity>

                          {aberta && (
                            <View style={styles.listaEpisodios}>
                              <View style={styles.trailerTemporada}>
                                <Text style={styles.tituloTrailerTemporada}>
                                  Trailer da temporada
                                </Text>

                                {trailersCarregando[numero] ? (
                                  <ActivityIndicator
                                    size="small"
                                    color="#E50914"
                                    style={styles.carregandoTrailer}
                                  />
                                ) : trailerTemporada &&
                                  obterVideoId(trailerTemporada) ? (
                                  <View
                                    style={[
                                      styles.playerTemporada,
                                      {
                                        width: larguraVideoTemporada,
                                        height: alturaVideoTemporada,
                                      },
                                    ]}
                                  >
                                    <YoutubePlayer
                                      width={larguraVideoTemporada}
                                      height={alturaVideoTemporada}
                                      play={false}
                                      videoId={obterVideoId(
                                        trailerTemporada
                                      )}
                                      webViewStyle={styles.player}
                                    />
                                  </View>
                                ) : (
                                  <Text style={styles.mensagemTrailer}>
                                    Trailer não disponível para esta
                                    temporada.
                                  </Text>
                                )}

                                {trailerTemporada?.nome ? (
                                  <Text style={styles.nomeTrailer}>
                                    {trailerTemporada.nome}
                                  </Text>
                                ) : null}
                              </View>

                              <Text style={styles.subtituloEpisodios}>
                                Episódios
                              </Text>

                              {temporadasCarregando[numero] ? (
                                <ActivityIndicator
                                  size="large"
                                  color="#E50914"
                                  style={styles.carregandoEpisodios}
                                />
                              ) : erroTemporadas[numero] ? (
                                <View>
                                  <Text style={styles.mensagem}>
                                    {erroTemporadas[numero]}
                                  </Text>

                                  <TouchableOpacity
                                    onPress={() =>
                                      carregarEpisodiosTemporada(numero)
                                    }
                                  >
                                    <Text style={styles.textoTentarEpisodios}>
                                      Tentar novamente
                                    </Text>
                                  </TouchableOpacity>
                                </View>
                              ) : episodios.length > 0 ? (
                                episodios.map((episodio) => (
                                  <View
                                    key={
                                      episodio.tmdb_id || episodio.numero
                                    }
                                    style={styles.cardEpisodio}
                                  >
                                    {episodio.imagem ? (
                                      <Image
                                        source={{ uri: episodio.imagem }}
                                        style={styles.imagemEpisodio}
                                        resizeMode="cover"
                                      />
                                    ) : (
                                      <View
                                        style={styles.imagemEpisodioSemImagem}
                                      >
                                        <Text style={styles.iconeEpisodio}>
                                          ▶
                                        </Text>
                                        <Text style={styles.textoSemImagem}>
                                          Imagem indisponível
                                        </Text>
                                      </View>
                                    )}

                                    <View style={styles.infoEpisodio}>
                                      <Text style={styles.numeroEpisodio}>
                                        EPISÓDIO {episodio.numero}
                                      </Text>

                                      <Text style={styles.nomeEpisodio}>
                                        {episodio.titulo ||
                                          `Episódio ${episodio.numero}`}
                                      </Text>

                                      {episodio.duracao ? (
                                        <Text style={styles.duracaoEpisodio}>
                                          {episodio.duracao} minutos
                                        </Text>
                                      ) : null}

                                      <Text
                                        style={styles.descricaoEpisodio}
                                        numberOfLines={4}
                                      >
                                        {episodio.descricao ||
                                          "Descrição não disponível."}
                                      </Text>
                                    </View>
                                  </View>
                                ))
                              ) : (
                                <Text style={styles.mensagem}>
                                  Nenhum episódio disponível.
                                </Text>
                              )}
                            </View>
                          )}
                        </View>
                      );
                    })
                ) : (
                  <Text style={styles.mensagem}>
                    Nenhuma temporada disponível.
                  </Text>
                )}
              </>
            )}

            {/* ONDE ASSISTIR */}
            <Text style={styles.tituloSecao}>Onde assistir</Text>

            {serie.disponibilidades?.length > 0 ? (
              serie.disponibilidades.map((item, index) => (
                <TouchableOpacity
                  key={`${item.plataforma}-${index}`}
                  style={styles.cardPlataforma}
                  onPress={() => abrirPlataforma(item.link)}
                  disabled={!item.link}
                >
                  <Text style={styles.nomePlataforma}>
                    {item.plataforma}
                  </Text>

                  <Text style={styles.textoPlataforma}>
                    {item.play ? "▶ Assistir" : "Ver disponibilidade"}
                  </Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.mensagem}>
                Nenhuma plataforma cadastrada.
              </Text>
            )}

            {/* ================================== */}
            {/* AVALIAÇÕES DA SÉRIE */}
            {/* ================================== */}

            <View style={styles.secaoAvaliacoes}>
              <Text style={styles.tituloSecao}>
                Avaliações da série
              </Text>

              {carregandoAvaliacoes ? (
                <ActivityIndicator
                  size="large"
                  color="#E50914"
                  style={styles.carregandoAvaliacoes}
                />
              ) : erroAvaliacoes ? (
                <View>
                  <Text style={styles.mensagem}>
                    {erroAvaliacoes}
                  </Text>

                  <TouchableOpacity
                    onPress={() => carregarAvaliacoes(serieInternaId)}
                  >
                    <Text style={styles.textoTentarEpisodios}>
                      Tentar novamente
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  {/* MÉDIA */}
                  <View style={styles.resumoAvaliacoes}>
                    <Text style={styles.mediaAvaliacoes}>
                      {Number(estatisticas.media || 0).toFixed(1)}
                    </Text>

                    <Text style={styles.estrelasResumo}>
                      {"★".repeat(
                        Math.round(Number(estatisticas.media || 0))
                      )}
                    </Text>

                    <Text style={styles.quantidadeAvaliacoes}>
                      {estatisticas.total_avaliacoes}{" "}
                      {estatisticas.total_avaliacoes === 1
                        ? "avaliação"
                        : "avaliações"}
                    </Text>
                  </View>

                  {/* FORMULÁRIO */}
                  <View style={styles.formularioAvaliacao}>
                    <Text style={styles.tituloFormulario}>
                      {avaliacaoEditando
                        ? "Editar minha avaliação"
                        : "Avalie esta série"}
                    </Text>

                    {!usuario || !token ? (
                      <Text style={styles.avisoLogin}>
                        Entre na sua conta para deixar uma avaliação.
                      </Text>
                    ) : (
                      <>
                        <Text style={styles.rotuloNota}>
                          Selecione sua nota
                        </Text>

                        <View style={styles.seletorEstrelas}>
                          {[1, 2, 3, 4, 5].map((nota) => (
                            <TouchableOpacity
                              key={nota}
                              onPress={() => setNotaSelecionada(nota)}
                              activeOpacity={0.7}
                            >
                              <Text
                                style={[
                                  styles.estrelaSelecionavel,
                                  nota <= notaSelecionada &&
                                    styles.estrelaSelecionada,
                                ]}
                              >
                                ★
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>

                        <TextInput
                          style={styles.campoComentario}
                          placeholder="Escreva um comentário sobre a série (opcional)..."
                          placeholderTextColor="#777777"
                          multiline
                          value={comentario}
                          onChangeText={setComentario}
                          textAlignVertical="top"
                        />

                        <TouchableOpacity
                          style={[
                            styles.botaoPublicar,
                            enviandoAvaliacao && styles.botaoDesabilitado,
                          ]}
                          onPress={salvarAvaliacao}
                          disabled={enviandoAvaliacao}
                        >
                          {enviandoAvaliacao ? (
                            <ActivityIndicator color="#FFFFFF" />
                          ) : (
                            <Text style={styles.textoBotaoPublicar}>
                              {avaliacaoEditando
                                ? "Salvar alterações"
                                : "Publicar avaliação"}
                            </Text>
                          )}
                        </TouchableOpacity>

                        {avaliacaoEditando && (
                          <TouchableOpacity
                            style={styles.botaoCancelarEdicao}
                            onPress={cancelarEdicaoAvaliacao}
                          >
                            <Text style={styles.textoCancelarEdicao}>
                              Cancelar edição
                            </Text>
                          </TouchableOpacity>
                        )}
                      </>
                    )}
                  </View>

                  {/* LISTA DE AVALIAÇÕES */}
                  <Text style={styles.tituloListaAvaliacoes}>
                    Comentários dos usuários
                  </Text>

                  {avaliacoes.length > 0 ? (
                    avaliacoes.map((avaliacao) => {
                      const minhaAvaliacao =
                        Number(avaliacao.usuario_id) ===
                        Number(usuario?.id);

                      return (
                        <View
                          key={avaliacao.id}
                          style={styles.cardAvaliacao}
                        >
                          <View style={styles.cabecalhoAvaliacao}>
                            <View style={styles.avatarAvaliacao}>
                              <Text style={styles.letraAvatar}>
                                {(avaliacao.usuario_nome ||
                                  avaliacao.nome_usuario ||
                                  "U")
                                  .charAt(0)
                                  .toUpperCase()}
                              </Text>
                            </View>

                            <View style={styles.dadosUsuario}>
                              <Text style={styles.nomeUsuarioAvaliacao}>
                                {avaliacao.usuario_nome ||
                                  avaliacao.nome_usuario ||
                                  "Usuário"}
                              </Text>

                              <Text style={styles.dataAvaliacao}>
                                {formatarData(
                                  avaliacao.criado_em ||
                                  avaliacao.data_criacao ||
                                  avaliacao.created_at
                                )}
                              </Text>
                            </View>

                            {minhaAvaliacao && (
                              <View style={styles.seloMinhaAvaliacao}>
                                <Text style={styles.textoSelo}>
                                  Minha avaliação
                                </Text>
                              </View>
                            )}
                          </View>

                          <Text style={styles.notaAvaliacao}>
                            {"★".repeat(
                              Math.max(
                                0,
                                Math.min(
                                  5,
                                  Math.round(Number(avaliacao.nota) || 0)
                                )
                              )
                            )}
                            <Text style={styles.notaNumerica}>
                              {" "}
                              {Number(avaliacao.nota).toFixed(1)}/5
                            </Text>
                          </Text>

                          {avaliacao.comentario ? (
                            <Text style={styles.comentarioAvaliacao}>
                              {avaliacao.comentario}
                            </Text>
                          ) : (
                            <Text style={styles.semComentario}>
                              Avaliação sem comentário.
                            </Text>
                          )}

                          {minhaAvaliacao && (
                            <View style={styles.acoesAvaliacao}>
                              <TouchableOpacity
                                onPress={() =>
                                  iniciarEdicaoAvaliacao(avaliacao)
                                }
                                style={styles.botaoEditarAvaliacao}
                              >
                                <Text style={styles.textoEditarAvaliacao}>
                                  Editar
                                </Text>
                              </TouchableOpacity>

                              <TouchableOpacity
                                onPress={() =>
                                  confirmarExclusaoAvaliacao(avaliacao)
                                }
                                style={styles.botaoExcluirAvaliacao}
                                disabled={
                                  excluindoAvaliacao === avaliacao.id
                                }
                              >
                                {excluindoAvaliacao === avaliacao.id ? (
                                  <ActivityIndicator color="#E50914" />
                                ) : (
                                  <Text style={styles.textoExcluirAvaliacao}>
                                    Excluir
                                  </Text>
                                )}
                              </TouchableOpacity>
                            </View>
                          )}
                        </View>
                      );
                    })
                  ) : (
                    <View style={styles.semAvaliacoes}>
                      <Text style={styles.textoSemAvaliacoes}>
                        Esta série ainda não possui avaliações.
                      </Text>

                      <Text style={styles.subtextoSemAvaliacoes}>
                        Seja o primeiro a compartilhar sua opinião!
                      </Text>
                    </View>
                  )}
                </>
              )}
            </View>
          </>
        ) : null}

        <Text style={styles.rodape}>CineVerse Mobile</Text>
      </ScrollView>
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

  conteudo: {
    paddingBottom: 50,
  },

  voltar: {
    paddingHorizontal: 20,
    paddingTop: 65,
    paddingBottom: 20,
  },

  textoVoltar: {
    color: "#AAAAAA",
    fontSize: 17,
  },

  areaCapa: {
    alignSelf: "center",
    backgroundColor: "#151515",
    borderRadius: 14,
    overflow: "hidden",
    marginTop: 5,
    elevation: 8,
  },

  capa: {
    width: "100%",
    height: "100%",
    backgroundColor: "#151515",
  },

  capaSemImagem: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#202024",
  },

  iconeCapa: {
    color: "#E50914",
    fontSize: 55,
  },

  titulo: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "900",
    marginHorizontal: 20,
    marginTop: 25,
  },

  informacoes: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 12,
  },

  info: {
    color: "#BBBBBB",
    fontSize: 14,
  },

  separador: {
    color: "#777777",
    marginHorizontal: 10,
  },

  tituloSecao: {
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "bold",
    marginHorizontal: 20,
    marginTop: 35,
    marginBottom: 12,
  },

  sinopse: {
    color: "#AAAAAA",
    fontSize: 15,
    lineHeight: 24,
    marginHorizontal: 20,
    marginTop: 4,
  },

  secaoTrailer: {
    marginTop: 5,
  },

  playerContainer: {
    alignSelf: "center",
    marginTop: 8,
    backgroundColor: "#000000",
    borderRadius: 14,
    overflow: "hidden",
  },

  playerTemporada: {
    alignSelf: "center",
    marginTop: 12,
    backgroundColor: "#000000",
    borderRadius: 12,
    overflow: "hidden",
  },

  player: {
    backgroundColor: "#000000",
  },

  carregandoTrailer: {
    marginVertical: 15,
  },

  nomeTrailer: {
    color: "#AAAAAA",
    fontSize: 12,
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 8,
  },

  trailerTemporada: {
    backgroundColor: "#19191F",
    padding: 12,
    marginTop: 4,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#303036",
  },

  tituloTrailerTemporada: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
    marginHorizontal: 8,
  },

  mensagemTrailer: {
    color: "#999999",
    fontSize: 12,
    marginHorizontal: 8,
    marginTop: 12,
  },

  blocoTemporada: {
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: "#151519",
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#303036",
  },

  blocoTemporadaAberta: {
    borderColor: "#7D2025",
  },

  cardTemporada: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 17,
    paddingHorizontal: 15,
  },

  numeroTemporada: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#2B171A",
    borderWidth: 1,
    borderColor: "#682329",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 13,
  },

  numeroTemporadaTexto: {
    color: "#E50914",
    fontSize: 19,
    fontWeight: "900",
  },

  infoTemporada: {
    flex: 1,
  },

  nomeTemporada: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },

  quantidadeEpisodios: {
    color: "#999999",
    fontSize: 12,
    marginTop: 5,
  },

  areaSetaTemporada: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#29292F",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },

  setaTemporada: {
    color: "#E50914",
    fontSize: 23,
    fontWeight: "bold",
    lineHeight: 27,
  },

  listaEpisodios: {
    paddingHorizontal: 12,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: "#303036",
  },

  subtituloEpisodios: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 12,
    marginBottom: 2,
  },

  cardEpisodio: {
    marginTop: 14,
    backgroundColor: "#202027",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#303036",
  },

  imagemEpisodio: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: "#303036",
  },

  imagemEpisodioSemImagem: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: "#303036",
    justifyContent: "center",
    alignItems: "center",
  },

  iconeEpisodio: {
    color: "#E50914",
    fontSize: 32,
  },

  textoSemImagem: {
    color: "#999999",
    fontSize: 11,
    marginTop: 5,
  },

  infoEpisodio: {
    padding: 14,
  },

  numeroEpisodio: {
    color: "#E50914",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 5,
  },

  nomeEpisodio: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },

  duracaoEpisodio: {
    color: "#BBBBBB",
    fontSize: 12,
    marginTop: 7,
  },

  descricaoEpisodio: {
    color: "#AAAAAA",
    fontSize: 13,
    lineHeight: 20,
    marginTop: 9,
  },

  carregandoEpisodios: {
    margin: 20,
  },

  textoTentarEpisodios: {
    color: "#E50914",
    textAlign: "center",
    padding: 12,
    fontWeight: "bold",
  },

  cardPlataforma: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1B1B20",
    marginHorizontal: 20,
    marginTop: 12,
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#303036",
  },

  nomePlataforma: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
  },

  textoPlataforma: {
    color: "#E50914",
    fontWeight: "bold",
  },

  // ESTADOS GERAIS

  carregando: {
    marginTop: 70,
  },

  estado: {
    paddingHorizontal: 20,
    alignItems: "center",
    marginTop: 40,
  },

  mensagem: {
    color: "#AAAAAA",
    textAlign: "center",
    marginTop: 15,
  },

  botaoTentar: {
    backgroundColor: "#E50914",
    padding: 14,
    borderRadius: 8,
    marginTop: 20,
  },

  textoBotao: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },

  rodape: {
    color: "#666666",
    fontSize: 12,
    textAlign: "center",
    marginTop: 45,
  },

  // ======================================
  // ESTILOS DAS AVALIAÇÕES
  // ======================================

  secaoAvaliacoes: {
    marginTop: 10,
    paddingBottom: 20,
  },

  carregandoAvaliacoes: {
    marginVertical: 25,
  },

  resumoAvaliacoes: {
    marginHorizontal: 20,
    backgroundColor: "#19191F",
    borderRadius: 12,
    padding: 18,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#303036",
  },

  mediaAvaliacoes: {
    color: "#FFFFFF",
    fontSize: 36,
    fontWeight: "900",
  },

  estrelasResumo: {
    color: "#F5C518",
    fontSize: 23,
    marginTop: 3,
  },

  quantidadeAvaliacoes: {
    color: "#AAAAAA",
    fontSize: 12,
    marginTop: 5,
  },

  formularioAvaliacao: {
    marginHorizontal: 20,
    marginTop: 18,
    padding: 16,
    backgroundColor: "#19191F",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#303036",
  },

  tituloFormulario: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "bold",
    marginBottom: 15,
  },

  avisoLogin: {
    color: "#AAAAAA",
    fontSize: 13,
    lineHeight: 20,
  },

  rotuloNota: {
    color: "#BBBBBB",
    fontSize: 13,
    marginBottom: 8,
  },

  seletorEstrelas: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },

  estrelaSelecionavel: {
    color: "#555555",
    fontSize: 34,
    marginRight: 7,
  },

  estrelaSelecionada: {
    color: "#F5C518",
  },

  campoComentario: {
    minHeight: 100,
    backgroundColor: "#101014",
    borderWidth: 1,
    borderColor: "#38383F",
    borderRadius: 9,
    padding: 12,
    color: "#FFFFFF",
    fontSize: 14,
  },

  botaoPublicar: {
    backgroundColor: "#E50914",
    padding: 14,
    borderRadius: 9,
    alignItems: "center",
    marginTop: 14,
  },

  botaoDesabilitado: {
    opacity: 0.6,
  },

  textoBotaoPublicar: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 14,
  },

  botaoCancelarEdicao: {
    alignItems: "center",
    padding: 12,
    marginTop: 5,
  },

  textoCancelarEdicao: {
    color: "#AAAAAA",
    fontSize: 13,
  },

  tituloListaAvaliacoes: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "bold",
    marginHorizontal: 20,
    marginTop: 25,
    marginBottom: 12,
  },

  cardAvaliacao: {
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 15,
    backgroundColor: "#19191F",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#303036",
  },

  cabecalhoAvaliacao: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatarAvaliacao: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#3A2023",
    justifyContent: "center",
    alignItems: "center",
  },

  letraAvatar: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },

  dadosUsuario: {
    flex: 1,
    marginLeft: 10,
  },

  nomeUsuarioAvaliacao: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "bold",
  },

  dataAvaliacao: {
    color: "#888888",
    fontSize: 11,
    marginTop: 3,
  },

  seloMinhaAvaliacao: {
    backgroundColor: "#382024",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },

  textoSelo: {
    color: "#FF7B83",
    fontSize: 9,
    fontWeight: "bold",
  },

  notaAvaliacao: {
    color: "#F5C518",
    fontSize: 19,
    marginTop: 12,
  },

  notaNumerica: {
    color: "#AAAAAA",
    fontSize: 12,
  },

  comentarioAvaliacao: {
    color: "#DDDDDD",
    fontSize: 13,
    lineHeight: 21,
    marginTop: 10,
  },

  semComentario: {
    color: "#777777",
    fontSize: 12,
    fontStyle: "italic",
    marginTop: 10,
  },

  acoesAvaliacao: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#303036",
    marginTop: 14,
    paddingTop: 10,
  },

  botaoEditarAvaliacao: {
    marginRight: 22,
    paddingVertical: 5,
  },

  textoEditarAvaliacao: {
    color: "#5EA8FF",
    fontSize: 12,
    fontWeight: "bold",
  },

  botaoExcluirAvaliacao: {
    paddingVertical: 5,
  },

  textoExcluirAvaliacao: {
    color: "#E50914",
    fontSize: 12,
    fontWeight: "bold",
  },

  semAvaliacoes: {
    marginHorizontal: 20,
    backgroundColor: "#19191F",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },

  textoSemAvaliacoes: {
    color: "#AAAAAA",
    fontSize: 13,
    textAlign: "center",
  },

  subtextoSemAvaliacoes: {
    color: "#E50914",
    fontSize: 12,
    marginTop: 7,
    textAlign: "center",
  },

  // ======================================
  // ESTILOS DO GOOGLE CAST
  // ======================================

  areaCast: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#19191F",
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#303036",
  },

  textosCast: {
    flex: 1,
    paddingRight: 12,
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
    width: 48,
    height: 48,
  },

  botaoTesteCast: {
    alignSelf: "flex-start",
    backgroundColor: "#E50914",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 12,
  },

  textoTesteCast: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 12,
  },
});