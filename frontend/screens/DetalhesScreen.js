import React, { useEffect, useRef, useState } from "react";
import Constants from "expo-constants";
import { useLista } from "../context/ListaContext";
import { useAuth } from "../context/AuthContext";
import YoutubePlayer from "react-native-youtube-iframe";

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
  Alert,
  Platform,
  TextInput,
  useWindowDimensions,
} from "react-native";

import {
  buscarFilmePorId,
  buscarDetalhesFilmeTMDB,
  buscarTrailerFilmeTMDB,
  buscarOndeAssistirFilmeTMDB,
  sincronizarFilmeTMDB,
  buscarAvaliacoesFilme,
  cadastrarAvaliacao,
  editarAvaliacao,
  excluirAvaliacao,
  buscarRespostasAvaliacao,
  cadastrarRespostaAvaliacao,
} from "../services/filmesService";

// ======================================
// GOOGLE CAST
// ======================================

const estaNoExpoGo =
  Constants.executionEnvironment === "storeClient";

const GoogleCast =
  Platform.OS === "web" || estaNoExpoGo
    ? null
    : require("react-native-google-cast");

// ======================================
// COMPONENTE DE TRANSMISSÃO
// ======================================

function ControlesCast() {
  if (!GoogleCast) {
    return null;
  }

  return <ControlesCastAtivo />;
}

function ControlesCastAtivo() {
  const { CastButton, useRemoteMediaClient } = GoogleCast;

  const client = useRemoteMediaClient();

  const [carregandoCast, setCarregandoCast] = useState(false);

  // ======================================
  // MONITORAR ESTADO DA TV
  // ======================================

  useEffect(() => {
    if (!client) return;

    console.log("CAST - Cliente conectado!");

    const listenerStatus = client.onMediaStatusUpdated((status) => {
      console.log("CAST - STATUS DA TV:", status);

      console.log(
        "CAST - ESTADO:",
        status?.playerState,
        "| MOTIVO:",
        status?.idleReason
      );
    });

    const listenerInicio = client.onMediaPlaybackStarted((status) => {
      console.log("CAST - REPRODUÇÃO INICIADA!", status);
    });

    const listenerFim = client.onMediaPlaybackEnded((status) => {
      console.log("CAST - REPRODUÇÃO FINALIZADA!", status);
    });

    return () => {
      listenerStatus.remove();
      listenerInicio.remove();
      listenerFim.remove();
    };
  }, [client]);

  // ======================================
// TRANSMITIR VÍDEO DE TESTE
// ======================================

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

    console.log("CAST - ENVIANDO VÍDEO DE TESTE...");

    await client.loadMedia({
      autoplay: true,
      mediaInfo: {
        contentUrl:
          "https://commondatastorage.googleapis.com/gtv-videos-bucket/CastVideos/mp4/BigBuckBunny.mp4",

        contentType: "video/mp4",

        // NOVO: informa que o conteúdo é um vídeo sob demanda
        streamType: "buffered",

        metadata: {
          title: "Vídeo de teste CineVerse",
          subtitle: "Teste de transmissão",
          type: "movie",
        },
      },
    });

    console.log("CAST - COMANDO LOAD MEDIA ENVIADO!");

    await client.requestStatus();

    const status = await client.getMediaStatus();

    console.log("CAST - STATUS ATUAL:", status);

    if (status) {
      console.log(
        "CAST - PLAYER STATE:",
        status.playerState
      );
    } else {
      console.log("CAST - A TV AINDA NÃO RETORNOU STATUS.");
    }

    Alert.alert(
      "Solicitação enviada",
      "Verifique se o vídeo começou a reproduzir na televisão."
    );
  } catch (error) {
    console.error("CAST - ERRO AO TRANSMITIR:", error);

    Alert.alert(
      "Erro na transmissão",
      error?.message || "Não foi possível reproduzir o vídeo."
    );
  } finally {
    setCarregandoCast(false);
  }
};

  // ======================================
  // INTERFACE
  // ======================================

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
            style={styles.botaoTesteCast}
            onPress={transmitirVideoTeste}
            activeOpacity={0.8}
            disabled={carregandoCast}
          >
            <Text style={styles.textoTesteCast}>
              {carregandoCast
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

// ======================================
// CONFIGURAÇÕES
// ======================================

const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w92";

const CATEGORIAS = [
  { chave: "assinatura", titulo: "Assinatura" },
  { chave: "aluguel", titulo: "Aluguel" },
  { chave: "compra", titulo: "Compra" },
  { chave: "gratuito", titulo: "Gratuito" },
  { chave: "com_anuncios", titulo: "Grátis com anúncios" },
];

// ======================================
// TELA DE DETALHES
// ======================================

export default function DetalhesScreen({ navigation, route }) {
  const { width: larguraTela } = useWindowDimensions();

  const scrollRef = useRef(null);

  const larguraCapa = Math.min(larguraTela * 0.62, 300);
  const alturaCapa = larguraCapa * 1.5;

  const larguraVideo = Math.max(larguraTela - 40, 280);
  const alturaVideo = larguraVideo * (9 / 16);

  const { alternarFavorito, verificarFavorito } = useLista();
  const { usuario, token } = useAuth();

  const origem = route.params?.origem || "mysql";
  const id = route.params?.id;

  const tmdbId =
    origem === "tmdb"
      ? route.params?.tmdb_id || id
      : route.params?.tmdb_id || null;

  const [filme, setFilme] = useState(null);
  const [trailer, setTrailer] = useState(null);
  const [ondeAssistir, setOndeAssistir] = useState(null);

  const [carregando, setCarregando] = useState(true);
  const [carregandoTrailer, setCarregandoTrailer] = useState(false);
  const [carregandoPlataformas, setCarregandoPlataformas] = useState(false);
  const [erro, setErro] = useState("");

  // ======================================
  // ESTADOS DAS AVALIAÇÕES
  // ======================================

  const [filmeSerieId, setFilmeSerieId] = useState(null);
  const [avaliacoes, setAvaliacoes] = useState([]);

  const [estatisticas, setEstatisticas] = useState({
    media: 0,
    total_avaliacoes: 0,
  });

  const [carregandoAvaliacoes, setCarregandoAvaliacoes] = useState(false);
  const [erroAvaliacoes, setErroAvaliacoes] = useState("");

  const [notaSelecionada, setNotaSelecionada] = useState(5);
  const [comentario, setComentario] = useState("");
  const [avaliacaoEditando, setAvaliacaoEditando] = useState(null);
  const [enviandoAvaliacao, setEnviandoAvaliacao] = useState(false);
  const [excluindoAvaliacao, setExcluindoAvaliacao] = useState(null);

  const [respostas, setRespostas] = useState({});
  const [respostasAbertas, setRespostasAbertas] = useState({});
  const [textosResposta, setTextosResposta] = useState({});
  const [carregandoRespostas, setCarregandoRespostas] = useState({});
  const [enviandoResposta, setEnviandoResposta] = useState({});

  // ======================================
  // ESTADOS DO MODAL PERSONALIZADO
  // ======================================

  const [modalVisivel, setModalVisivel] = useState(false);
  const [modalTitulo, setModalTitulo] = useState("");
  const [modalMensagem, setModalMensagem] = useState("");
  const [modalTipo, setModalTipo] = useState("sucesso");
  const [acaoConfirmacao, setAcaoConfirmacao] = useState(null);
  const [processandoModal, setProcessandoModal] = useState(false);

  // ======================================
  // FUNÇÕES DO MODAL
  // ======================================

  const mostrarMensagem = (
    titulo,
    mensagem,
    tipo = "sucesso"
  ) => {
    setModalTitulo(titulo);
    setModalMensagem(mensagem);
    setModalTipo(tipo);
    setAcaoConfirmacao(null);
    setProcessandoModal(false);
    setModalVisivel(true);
  };

  const mostrarConfirmacao = (titulo, mensagem, acao) => {
    setModalTitulo(titulo);
    setModalMensagem(mensagem);
    setModalTipo("confirmacao");
    setAcaoConfirmacao(() => acao);
    setProcessandoModal(false);
    setModalVisivel(true);
  };

  const fecharModal = () => {
    if (processandoModal) return;

    setModalVisivel(false);
    setAcaoConfirmacao(null);
  };

  const executarConfirmacao = async () => {
    if (!acaoConfirmacao || processandoModal) return;

    try {
      setProcessandoModal(true);
      await acaoConfirmacao();
    } catch (error) {
      console.error("Erro na confirmação:", error);

      mostrarMensagem(
        "Não foi possível concluir",
        error.message || "Tente novamente.",
        "erro"
      );
    } finally {
      setProcessandoModal(false);
    }
  };

  // ======================================
  // CARREGAR FILME
  // ======================================

  useEffect(() => {
    carregarFilme();
  }, [id, tmdbId, origem]);

  const carregarFilme = async () => {
    try {
      if (origem === "tmdb" && !tmdbId) {
        throw new Error("ID do TMDB não recebido.");
      }

      if (origem !== "tmdb" && !id) {
        throw new Error("ID do filme não recebido.");
      }

      setCarregando(true);
      setErro("");
      setFilme(null);
      setTrailer(null);
      setOndeAssistir(null);
      setFilmeSerieId(null);
      setAvaliacoes([]);
      setRespostas({});
      setRespostasAbertas({});
      setAvaliacaoEditando(null);

      const dados =
        origem === "tmdb"
          ? await buscarDetalhesFilmeTMDB(tmdbId)
          : await buscarFilmePorId(id);

      setFilme(dados);

      let idInterno = null;

      try {
        if (origem === "tmdb") {
          const resultado = await sincronizarFilmeTMDB(tmdbId);
          idInterno = resultado?.conteudo?.id;
        } else {
          idInterno = dados?.id;
        }

        if (idInterno) {
          const idNumerico = Number(idInterno);

          setFilmeSerieId(idNumerico);
          await carregarAvaliacoes(idNumerico);
        } else {
          setErroAvaliacoes(
            "Não foi possível identificar este filme no catálogo."
          );
        }
      } catch (error) {
        console.error("Erro ao sincronizar filme:", error);

        setErroAvaliacoes(
          "Não foi possível conectar este filme ao sistema de avaliações."
        );
      }

      const idTMDB =
        origem === "tmdb"
          ? tmdbId
          : dados?.tmdb_id;

      if (idTMDB) {
        carregarPlataformas(idTMDB);
      }

      if (origem === "tmdb" && idTMDB) {
        carregarTrailer(idTMDB);
      }
    } catch (error) {
      console.error("Erro ao carregar detalhes:", error);
      setErro("Não foi possível carregar os detalhes deste filme.");
    } finally {
      setCarregando(false);
    }
  };

  // ======================================
  // CARREGAR AVALIAÇÕES
  // ======================================

  const carregarAvaliacoes = async (idInterno = filmeSerieId) => {
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
      console.error("Erro ao carregar avaliações:", error);

      setErroAvaliacoes(
        error.message || "Erro ao carregar avaliações."
      );

      throw error;
    } finally {
      setCarregandoAvaliacoes(false);
    }
  };

  // ======================================
  // PUBLICAR OU EDITAR AVALIAÇÃO
  // ======================================

  const publicarAvaliacao = async () => {
    if (enviandoAvaliacao) return;

    if (!token || !usuario) {
      mostrarMensagem(
        "Entre na sua conta",
        "Você precisa estar conectado para avaliar este filme.",
        "erro"
      );
      return;
    }

    if (!filmeSerieId) {
      mostrarMensagem(
        "Aguarde",
        "O filme ainda não foi vinculado ao catálogo.",
        "erro"
      );
      return;
    }

    const nota = Number(notaSelecionada);

    if (!Number.isFinite(nota) || nota < 1 || nota > 5) {
      mostrarMensagem(
        "Nota inválida",
        "Escolha uma nota entre 1 e 5.",
        "erro"
      );
      return;
    }

    try {
      setEnviandoAvaliacao(true);

      const estavaEditando = Boolean(avaliacaoEditando);

      if (avaliacaoEditando) {
        await editarAvaliacao(
          avaliacaoEditando.id,
          nota,
          comentario.trim(),
          token
        );
      } else {
        await cadastrarAvaliacao(
          filmeSerieId,
          nota,
          comentario.trim(),
          token
        );
      }

      setComentario("");
      setNotaSelecionada(5);
      setAvaliacaoEditando(null);

      await carregarAvaliacoes(filmeSerieId);

      mostrarMensagem(
        estavaEditando ? "Avaliação atualizada!" : "Avaliação publicada!",
        estavaEditando
          ? "Sua avaliação foi atualizada com sucesso."
          : "Sua avaliação foi publicada com sucesso."
      );
    } catch (error) {
      console.error("Erro ao salvar avaliação:", error);

      mostrarMensagem(
        "Não foi possível salvar",
        error.message || "Tente novamente.",
        "erro"
      );
    } finally {
      setEnviandoAvaliacao(false);
    }
  };

  // ======================================
  // PREPARAR EDIÇÃO
  // ======================================

  const iniciarEdicaoAvaliacao = (avaliacao) => {
    if (!avaliacao?.id) {
      mostrarMensagem(
        "Erro",
        "Não foi possível identificar esta avaliação.",
        "erro"
      );
      return;
    }

    console.log("CINEVERSE: iniciando edição:", avaliacao.id);

    setAvaliacaoEditando(avaliacao);
    setNotaSelecionada(Number(avaliacao.nota));
    setComentario(avaliacao.comentario || "");
  };

  const cancelarEdicaoAvaliacao = () => {
    setAvaliacaoEditando(null);
    setNotaSelecionada(5);
    setComentario("");
  };

  // ======================================
  // EXCLUIR AVALIAÇÃO
  // ======================================

  const confirmarExclusaoAvaliacao = (avaliacao) => {
    if (!avaliacao?.id) {
      mostrarMensagem(
        "Erro",
        "Não foi possível identificar esta avaliação.",
        "erro"
      );
      return;
    }

    if (!token) {
      mostrarMensagem(
        "Sessão expirada",
        "Entre novamente na sua conta para excluir a avaliação.",
        "erro"
      );
      return;
    }

    mostrarConfirmacao(
      "Excluir avaliação",
      "Tem certeza de que deseja excluir sua avaliação? Essa ação não poderá ser desfeita.",
      async () => {
        await removerAvaliacao(avaliacao.id);
      }
    );
  };

  const removerAvaliacao = async (avaliacaoId) => {
    if (excluindoAvaliacao) return;

    try {
      setExcluindoAvaliacao(avaliacaoId);

      await excluirAvaliacao(avaliacaoId, token);

      if (
        Number(avaliacaoEditando?.id) === Number(avaliacaoId)
      ) {
        cancelarEdicaoAvaliacao();
      }

      setRespostas((estado) => {
        const novoEstado = { ...estado };
        delete novoEstado[avaliacaoId];
        return novoEstado;
      });

      setRespostasAbertas((estado) => {
        const novoEstado = { ...estado };
        delete novoEstado[avaliacaoId];
        return novoEstado;
      });

      await carregarAvaliacoes(filmeSerieId);

      mostrarMensagem(
        "Avaliação excluída!",
        "Sua avaliação foi excluída com sucesso."
      );
    } catch (error) {
      console.error("Erro ao excluir avaliação:", error);

      mostrarMensagem(
        "Não foi possível excluir",
        error.message || "Não foi possível excluir a avaliação.",
        "erro"
      );
    } finally {
      setExcluindoAvaliacao(null);
    }
  };

  // ======================================
  // CARREGAR RESPOSTAS
  // ======================================

  const alternarRespostas = async (avaliacaoId) => {
    const estavaAberta = respostasAbertas[avaliacaoId];

    setRespostasAbertas((estado) => ({
      ...estado,
      [avaliacaoId]: !estavaAberta,
    }));

    if (estavaAberta || respostas[avaliacaoId]) {
      return;
    }

    try {
      setCarregandoRespostas((estado) => ({
        ...estado,
        [avaliacaoId]: true,
      }));

      const dados = await buscarRespostasAvaliacao(avaliacaoId);

      setRespostas((estado) => ({
        ...estado,
        [avaliacaoId]: Array.isArray(dados) ? dados : [],
      }));
    } catch (error) {
      console.error("Erro ao carregar respostas:", error);

      mostrarMensagem(
        "Erro ao carregar respostas",
        error.message || "Não foi possível carregar as respostas.",
        "erro"
      );
    } finally {
      setCarregandoRespostas((estado) => ({
        ...estado,
        [avaliacaoId]: false,
      }));
    }
  };

  // ======================================
  // ENVIAR RESPOSTA
  // ======================================

  const enviarResposta = async (avaliacaoId) => {
    if (!token || !usuario) {
      mostrarMensagem(
        "Entre na sua conta",
        "Você precisa estar conectado para responder.",
        "erro"
      );
      return;
    }

    const texto = textosResposta[avaliacaoId]?.trim();

    if (!texto) {
      mostrarMensagem(
        "Resposta vazia",
        "Digite uma mensagem antes de enviar.",
        "erro"
      );
      return;
    }

    try {
      setEnviandoResposta((estado) => ({
        ...estado,
        [avaliacaoId]: true,
      }));

      await cadastrarRespostaAvaliacao(
        avaliacaoId,
        texto,
        token
      );

      setTextosResposta((estado) => ({
        ...estado,
        [avaliacaoId]: "",
      }));

      const dados = await buscarRespostasAvaliacao(avaliacaoId);

      setRespostas((estado) => ({
        ...estado,
        [avaliacaoId]: Array.isArray(dados) ? dados : [],
      }));

      setRespostasAbertas((estado) => ({
        ...estado,
        [avaliacaoId]: true,
      }));

      mostrarMensagem(
        "Resposta publicada!",
        "Sua resposta foi publicada com sucesso."
      );
    } catch (error) {
      console.error("Erro ao enviar resposta:", error);

      mostrarMensagem(
        "Não foi possível responder",
        error.message || "Não foi possível publicar a resposta.",
        "erro"
      );
    } finally {
      setEnviandoResposta((estado) => ({
        ...estado,
        [avaliacaoId]: false,
      }));
    }
  };

  // ======================================
  // TRAILER
  // ======================================

  const carregarTrailer = async (filmeId) => {
    try {
      setCarregandoTrailer(true);

      const dadosTrailer = await buscarTrailerFilmeTMDB(filmeId);

      setTrailer(dadosTrailer);
    } catch (error) {
      console.error("Erro ao buscar trailer:", error);
      setTrailer(null);
    } finally {
      setCarregandoTrailer(false);
    }
  };

  // ======================================
  // PLATAFORMAS
  // ======================================

  const carregarPlataformas = async (filmeId) => {
    try {
      setCarregandoPlataformas(true);

      const dados = await buscarOndeAssistirFilmeTMDB(filmeId);

      setOndeAssistir(dados);
    } catch (error) {
      console.error("Erro ao buscar plataformas:", error);
      setOndeAssistir(null);
    } finally {
      setCarregandoPlataformas(false);
    }
  };

  // ======================================
  // FAVORITOS
  // ======================================

  const titulo = filme?.titulo || route.params?.titulo || "Filme";

  const favorito = filme ? verificarFavorito(titulo) : false;

  const adicionarOuRemover = () => {
    if (!filme) return;

    alternarFavorito({
      id: filme.id || filme.tmdb_id,
      tmdb_id: filme.tmdb_id || null,
      origem,
      titulo: filme.titulo,
      ano: filme.ano,
      genero: filme.genero || "Não informado",
      imagem: filme.imagem,
    });
  };

  // ======================================
  // ABRIR PLATAFORMA
  // ======================================

  const abrirPlataforma = async (link) => {
    try {
      if (!link) {
        throw new Error("Link não informado.");
      }

      await Linking.openURL(link);
    } catch (error) {
      console.error("Erro ao abrir link:", error);

      mostrarMensagem(
        "Não foi possível abrir",
        "Verifique sua conexão e tente novamente.",
        "erro"
      );
    }
  };

  // ======================================
  // VERIFICAR PLATAFORMAS
  // ======================================

  const temPlataformasTMDB =
    ondeAssistir &&
    CATEGORIAS.some((categoria) => {
      const lista = ondeAssistir[categoria.chave];
      return Array.isArray(lista) && lista.length > 0;
    });

  const disponibilidades = Array.isArray(filme?.disponibilidades)
    ? filme.disponibilidades
    : [];

  // ======================================
  // COMPONENTE VISUAL DE NOTA
  // ======================================

  const renderEstrelas = (
    nota,
    selecionavel = false,
    aoSelecionar = null
  ) => {
    return (
      <View style={styles.linhaEstrelas}>
        {Array.from({ length: 10 }, (_, indice) => {
          const valor = (indice + 1) / 2;
          const preenchida = Number(nota) >= valor;

          return (
            <TouchableOpacity
              key={indice}
              disabled={!selecionavel}
              onPress={() => aoSelecionar?.(valor)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.estrela,
                  preenchida && styles.estrelaAtiva,
                  !selecionavel && styles.estrelaPequena,
                ]}
              >
                {preenchida ? "★" : "☆"}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  // ======================================
  // TELA
  // ======================================

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        ref={scrollRef}
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
          <View style={styles.mensagem}>
            <Text style={styles.textoErro}>{erro}</Text>

            <TouchableOpacity
              style={styles.botaoAssistir}
              onPress={carregarFilme}
            >
              <Text style={styles.textoAssistir}>
                Tentar novamente
              </Text>
            </TouchableOpacity>
          </View>
        ) : filme ? (
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
              {filme.imagem ? (
                <Image
                  source={{ uri: filme.imagem }}
                  style={styles.capa}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.capaSemImagem}>
                  <Text style={styles.iconeCapa}>▶</Text>
                  <Text style={styles.textoSemImagem}>
                    Imagem não cadastrada
                  </Text>
                </View>
              )}
            </View>

            {/* TÍTULO */}
            <Text style={styles.titulo}>
              {filme.titulo}
            </Text>

            {/* INFORMAÇÕES */}
            <View style={styles.informacoes}>
              {filme.ano ? (
                <Text style={styles.info}>{filme.ano}</Text>
              ) : null}

              {filme.tipo ? (
                <>
                  <Text style={styles.separador}>•</Text>
                  <Text style={styles.info}>{filme.tipo}</Text>
                </>
              ) : null}
            </View>

            {/* FAVORITOS */}
            <View style={styles.botoes}>
              <TouchableOpacity
                style={[
                  styles.botaoFavorito,
                  favorito && styles.botaoFavoritoAtivo,
                ]}
                onPress={adicionarOuRemover}
                activeOpacity={0.8}
              >
                <Text style={styles.textoFavorito}>
                  {favorito
                    ? "♥ Adicionado à Minha Lista"
                    : "♡ Adicionar à Minha Lista"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* GOOGLE CAST */}
            {Platform.OS !== "web" && !estaNoExpoGo && <ControlesCast />}

            {/* TRAILER */}
            {origem === "tmdb" && (
              <>
                <Text style={styles.tituloSecao}>
                  Trailer oficial
                </Text>

                {carregandoTrailer ? (
                  <ActivityIndicator
                    size="large"
                    color="#E50914"
                    style={styles.carregandoTrailer}
                  />
                ) : trailer?.chave ? (
                  <View
                    style={[
                      styles.areaTrailer,
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
                      videoId={trailer.chave}
                      webViewStyle={styles.player}
                    />
                  </View>
                ) : (
                  <Text style={styles.semTrailer}>
                    Trailer não disponível para este filme.
                  </Text>
                )}

                {trailer?.nome ? (
                  <Text style={styles.nomeTrailer}>
                    {trailer.nome}
                  </Text>
                ) : null}
              </>
            )}

            {/* SINOPSE */}
            <Text style={styles.tituloSecao}>
              Sinopse
            </Text>

            <Text style={styles.sinopse}>
              {filme.descricao || "Sinopse ainda não cadastrada."}
            </Text>

            {/* ONDE ASSISTIR */}
            <Text style={styles.tituloSecao}>
              Onde assistir
            </Text>

            {carregandoPlataformas ? (
              <ActivityIndicator
                size="large"
                color="#E50914"
                style={styles.carregandoTrailer}
              />
            ) : temPlataformasTMDB ? (
              <View style={styles.listaPlataformas}>
                {CATEGORIAS.map((categoria) => {
                  const provedores =
                    ondeAssistir[categoria.chave] || [];

                  if (provedores.length === 0) {
                    return null;
                  }

                  return (
                    <View
                      key={categoria.chave}
                      style={styles.grupoPlataformas}
                    >
                      <Text style={styles.tituloCategoria}>
                        {categoria.titulo}
                      </Text>

                      {provedores.map((provedor) => (
                        <TouchableOpacity
                          key={`${categoria.chave}-${provedor.provider_id}`}
                          style={styles.botaoPlataforma}
                          onPress={() =>
                            abrirPlataforma(ondeAssistir.link)
                          }
                          activeOpacity={0.8}
                        >
                          <View style={styles.infoPlataforma}>
                            {provedor.logo_path ? (
                              <Image
                                source={{
                                  uri: `${IMAGE_BASE_URL}${provedor.logo_path}`,
                                }}
                                style={styles.logoPlataforma}
                                resizeMode="contain"
                              />
                            ) : (
                              <View style={styles.logoSemImagem}>
                                <Text style={styles.logoTexto}>▶</Text>
                              </View>
                            )}

                            <Text style={styles.nomePlataforma}>
                              {provedor.provider_name}
                            </Text>
                          </View>

                          <Text style={styles.iconeAbrir}>↗</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  );
                })}

                {ondeAssistir?.link ? (
                  <TouchableOpacity
                    style={styles.botaoVerOndeAssistir}
                    onPress={() => abrirPlataforma(ondeAssistir.link)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.textoAssistir}>
                      Ver onde assistir
                    </Text>
                  </TouchableOpacity>
                ) : null}

                <Text style={styles.avisoTMDB}>
                  Disponibilidade informada pelo TMDB para o Brasil.
                  Os serviços e condições podem mudar.
                </Text>
              </View>
            ) : disponibilidades.length > 0 ? (
              <View style={styles.listaPlataformas}>
                {disponibilidades.map((item, index) => (
                  <TouchableOpacity
                    key={`${item.plataforma}-${index}`}
                    style={styles.botaoPlataforma}
                    onPress={() => abrirPlataforma(item.link)}
                    activeOpacity={0.8}
                  >
                    <View>
                      <Text style={styles.nomePlataforma}>
                        {item.plataforma}
                      </Text>

                      <Text style={styles.subtextoPlataforma}>
                        Abrir plataforma externa
                      </Text>
                    </View>

                    <Text style={styles.iconeAbrir}>↗</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.mensagemPlataformas}>
                <Text style={styles.semPlataforma}>
                  Não foram encontradas opções de streaming para este
                  filme no Brasil.
                </Text>
              </View>
            )}

            {/* AVALIAÇÕES E COMENTÁRIOS */}
            <View style={styles.areaAvaliacoes}>
              <Text style={styles.tituloSecao}>
                Avaliações da comunidade
              </Text>

              {carregandoAvaliacoes ? (
                <ActivityIndicator
                  size="large"
                  color="#E50914"
                  style={styles.carregandoTrailer}
                />
              ) : erroAvaliacoes ? (
                <View style={styles.caixaErroAvaliacao}>
                  <Text style={styles.textoErro}>
                    {erroAvaliacoes}
                  </Text>

                  <TouchableOpacity
                    style={styles.botaoAtualizar}
                    onPress={() => carregarAvaliacoes(filmeSerieId)}
                  >
                    <Text style={styles.textoBotaoAtualizar}>
                      Tentar novamente
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  {/* MÉDIA */}
                  <View style={styles.caixaMedia}>
                    <Text style={styles.mediaNumero}>
                      {estatisticas.media.toFixed(1)}
                    </Text>

                    {renderEstrelas(estatisticas.media)}

                    <Text style={styles.textoTotalAvaliacoes}>
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
                        : "Deixe sua avaliação"}
                    </Text>

                    <Text style={styles.rotuloNota}>
                      Escolha sua nota:
                    </Text>

                    {renderEstrelas(
                      notaSelecionada,
                      true,
                      setNotaSelecionada
                    )}

                    <Text style={styles.valorNota}>
                      {Number(notaSelecionada).toFixed(1)} / 5
                    </Text>

                    <TextInput
                      style={styles.campoComentario}
                      placeholder="Escreva um comentário sobre este filme (opcional)..."
                      placeholderTextColor="#777777"
                      value={comentario}
                      onChangeText={setComentario}
                      multiline
                      maxLength={2000}
                      textAlignVertical="top"
                    />

                    <TouchableOpacity
                      style={[
                        styles.botaoPublicar,
                        enviandoAvaliacao && styles.botaoDesabilitado,
                      ]}
                      onPress={publicarAvaliacao}
                      disabled={enviandoAvaliacao}
                      activeOpacity={0.8}
                    >
                      {enviandoAvaliacao ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <Text style={styles.textoPublicar}>
                          {avaliacaoEditando
                            ? "Salvar alterações"
                            : "Publicar avaliação"}
                        </Text>
                      )}
                    </TouchableOpacity>

                    {avaliacaoEditando ? (
                      <TouchableOpacity
                        style={styles.botaoCancelarEdicao}
                        onPress={cancelarEdicaoAvaliacao}
                      >
                        <Text style={styles.textoCancelarEdicao}>
                          Cancelar edição
                        </Text>
                      </TouchableOpacity>
                    ) : null}

                    {!token ? (
                      <Text style={styles.avisoLogin}>
                        Entre na sua conta para publicar uma avaliação.
                      </Text>
                    ) : null}
                  </View>

                  {/* LISTA DE AVALIAÇÕES */}
                  <Text style={styles.subtituloAvaliacoes}>
                    Comentários dos usuários
                  </Text>

                  {avaliacoes.length === 0 ? (
                    <Text style={styles.semAvaliacoes}>
                      Este filme ainda não recebeu avaliações.
                      Seja o primeiro a comentar!
                    </Text>
                  ) : (
                    avaliacoes.map((avaliacao) => {
                      const minhaAvaliacao =
                        Number(avaliacao.usuario_id) ===
                        Number(usuario?.id);

                      const respostasDaAvaliacao =
                        respostas[avaliacao.id] || [];

                      return (
                        <View
                          key={avaliacao.id}
                          style={styles.cardAvaliacao}
                        >
                          <View style={styles.cabecalhoAvaliacao}>
                            <View style={styles.avatarUsuario}>
                              <Text style={styles.letraAvatar}>
                                {(avaliacao.usuario || "?")
                                  .charAt(0)
                                  .toUpperCase()}
                              </Text>
                            </View>

                            <View style={styles.dadosUsuario}>
                              <Text style={styles.nomeUsuario}>
                                {avaliacao.usuario}
                              </Text>

                              <Text style={styles.dataAvaliacao}>
                                {avaliacao.data_avaliacao
                                  ? new Date(
                                      avaliacao.data_avaliacao
                                    ).toLocaleDateString("pt-BR")
                                  : ""}
                              </Text>
                            </View>

                            {minhaAvaliacao ? (
                              <Text style={styles.seloMinhaAvaliacao}>
                                Minha avaliação
                              </Text>
                            ) : null}
                          </View>

                          {renderEstrelas(Number(avaliacao.nota))}

                          {avaliacao.comentario ? (
                            <Text style={styles.comentarioAvaliacao}>
                              {avaliacao.comentario}
                            </Text>
                          ) : (
                            <Text style={styles.comentarioVazio}>
                              Avaliou sem deixar comentário.
                            </Text>
                          )}

                          {minhaAvaliacao ? (
                            <View style={styles.acoesAvaliacao}>
                              <TouchableOpacity
                                style={styles.botaoAcao}
                                onPress={() =>
                                  iniciarEdicaoAvaliacao(avaliacao)
                                }
                                activeOpacity={0.7}
                              >
                                <Text style={styles.acaoEditar}>
                                  Editar
                                </Text>
                              </TouchableOpacity>

                              <TouchableOpacity
                                style={styles.botaoAcao}
                                onPress={() =>
                                  confirmarExclusaoAvaliacao(avaliacao)
                                }
                                disabled={
                                  excluindoAvaliacao === avaliacao.id
                                }
                                activeOpacity={0.7}
                              >
                                <Text style={styles.acaoExcluir}>
                                  {excluindoAvaliacao === avaliacao.id
                                    ? "Excluindo..."
                                    : "Excluir"}
                                </Text>
                              </TouchableOpacity>
                            </View>
                          ) : null}

                          {/* RESPOSTAS */}
                          <TouchableOpacity
                            style={styles.botaoRespostas}
                            onPress={() =>
                              alternarRespostas(avaliacao.id)
                            }
                          >
                            <Text style={styles.textoBotaoRespostas}>
                              {respostasAbertas[avaliacao.id]
                                ? "Ocultar respostas"
                                : `Responder / Ver respostas (${respostasDaAvaliacao.length})`}
                            </Text>
                          </TouchableOpacity>

                          {respostasAbertas[avaliacao.id] ? (
                            <View style={styles.areaRespostas}>
                              {carregandoRespostas[avaliacao.id] ? (
                                <ActivityIndicator color="#E50914" />
                              ) : (
                                <>
                                  {respostasDaAvaliacao.map((resposta) => (
                                    <View
                                      key={resposta.id}
                                      style={styles.cardResposta}
                                    >
                                      <Text style={styles.nomeResposta}>
                                        {resposta.usuario}
                                      </Text>

                                      <Text style={styles.textoResposta}>
                                        {resposta.comentario}
                                      </Text>

                                      <Text style={styles.dataResposta}>
                                        {resposta.data_resposta
                                          ? new Date(
                                              resposta.data_resposta
                                            ).toLocaleDateString("pt-BR")
                                          : ""}
                                      </Text>
                                    </View>
                                  ))}

                                  {respostasDaAvaliacao.length === 0 ? (
                                    <Text style={styles.semRespostas}>
                                      Ainda não há respostas.
                                    </Text>
                                  ) : null}

                                  <TextInput
                                    style={styles.campoResposta}
                                    placeholder="Escreva sua resposta..."
                                    placeholderTextColor="#777777"
                                    value={
                                      textosResposta[avaliacao.id] || ""
                                    }
                                    onChangeText={(texto) =>
                                      setTextosResposta((estado) => ({
                                        ...estado,
                                        [avaliacao.id]: texto,
                                      }))
                                    }
                                    multiline
                                    maxLength={1000}
                                  />

                                  <TouchableOpacity
                                    style={styles.botaoEnviarResposta}
                                    onPress={() =>
                                      enviarResposta(avaliacao.id)
                                    }
                                    disabled={
                                      !!enviandoResposta[avaliacao.id]
                                    }
                                  >
                                    {enviandoResposta[avaliacao.id] ? (
                                      <ActivityIndicator color="#FFFFFF" />
                                    ) : (
                                      <Text style={styles.textoPublicar}>
                                        Enviar resposta
                                      </Text>
                                    )}
                                  </TouchableOpacity>
                                </>
                              )}
                            </View>
                          ) : null}
                        </View>
                      );
                    })
                  )}
                </>
              )}
            </View>
          </>
        ) : null}

        <Text style={styles.rodape}>
          CineVerse Mobile
        </Text>
      </ScrollView>

      {/* MODAL PERSONALIZADO CINEVERSE */}
      {modalVisivel && (
        <View style={styles.fundoModal}>
          <View style={styles.caixaModal}>
            <View style={styles.cabecalhoModal}>
              <View
                style={[
                  styles.iconeModal,
                  modalTipo === "erro" && styles.iconeModalErro,
                  modalTipo === "confirmacao" &&
                    styles.iconeModalConfirmacao,
                ]}
              >
                <Text style={styles.textoIconeModal}>
                  {modalTipo === "erro"
                    ? "!"
                    : modalTipo === "confirmacao"
                    ? "?"
                    : "✓"}
                </Text>
              </View>

              <Text style={styles.tituloModal}>
                {modalTitulo}
              </Text>
            </View>

            <Text style={styles.mensagemModal}>
              {modalMensagem}
            </Text>

            {modalTipo === "confirmacao" ? (
              <View style={styles.acoesModal}>
                <TouchableOpacity
                  style={styles.botaoCancelarModal}
                  onPress={fecharModal}
                  disabled={processandoModal}
                  activeOpacity={0.8}
                >
                  <Text style={styles.textoCancelarModal}>
                    Cancelar
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.botaoExcluirModal,
                    processandoModal && styles.botaoDesabilitado,
                  ]}
                  onPress={executarConfirmacao}
                  disabled={processandoModal}
                  activeOpacity={0.8}
                >
                  {processandoModal ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.textoExcluirModal}>
                      Excluir
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.botaoFecharModal}
                onPress={fecharModal}
                activeOpacity={0.8}
              >
                <Text style={styles.textoFecharModal}>
                  Entendi
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
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
    paddingBottom: 45,
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

  textoSemImagem: {
    color: "#888888",
    marginTop: 12,
  },

  titulo: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "900",
    marginTop: 25,
    marginHorizontal: 20,
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

  botoes: {
    paddingHorizontal: 20,
    marginTop: 30,
  },

  botaoFavorito: {
    backgroundColor: "#25252A",
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#38383E",
  },

  botaoFavoritoAtivo: {
    borderColor: "#E50914",
    backgroundColor: "#35191D",
  },

  textoFavorito: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },

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

  botaoTesteCast: {
    backgroundColor: "#E50914",
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    alignSelf: "flex-start",
  },

  textoTesteCast: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "bold",
  },

  tituloSecao: {
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "bold",
    marginTop: 35,
    marginHorizontal: 20,
  },

  areaTrailer: {
    alignSelf: "center",
    marginTop: 15,
    backgroundColor: "#000000",
    borderRadius: 14,
    overflow: "hidden",
    aspectRatio: 16 / 9,
  },

  player: {
    backgroundColor: "#000000",
  },

  nomeTrailer: {
    color: "#AAAAAA",
    fontSize: 12,
    padding: 12,
    marginHorizontal: 15,
  },

  carregandoTrailer: {
    marginTop: 25,
  },

  semTrailer: {
    color: "#999999",
    marginHorizontal: 20,
    marginTop: 15,
  },

  sinopse: {
    color: "#AAAAAA",
    fontSize: 15,
    lineHeight: 24,
    marginHorizontal: 20,
    marginTop: 12,
  },

  listaPlataformas: {
    paddingHorizontal: 20,
    marginTop: 15,
    gap: 12,
  },

  grupoPlataformas: {
    gap: 10,
    marginBottom: 10,
  },

  tituloCategoria: {
    color: "#E50914",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 3,
  },

  botaoPlataforma: {
    backgroundColor: "#202027",
    padding: 13,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#38383E",
  },

  infoPlataforma: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },

  logoPlataforma: {
    width: 42,
    height: 42,
    borderRadius: 8,
  },

  logoSemImagem: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: "#38383E",
    justifyContent: "center",
    alignItems: "center",
  },

  logoTexto: {
    color: "#FFFFFF",
    fontSize: 18,
  },

  nomePlataforma: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
    flexShrink: 1,
  },

  subtextoPlataforma: {
    color: "#999999",
    fontSize: 12,
    marginTop: 5,
  },

  iconeAbrir: {
    color: "#E50914",
    fontSize: 24,
    fontWeight: "bold",
  },

  botaoVerOndeAssistir: {
    backgroundColor: "#E50914",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },

  avisoTMDB: {
    color: "#777777",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 10,
  },

  semPlataforma: {
    color: "#999999",
    marginHorizontal: 20,
    marginTop: 15,
    lineHeight: 21,
  },

  mensagemPlataformas: {
    marginTop: 5,
  },

  carregando: {
    marginTop: 80,
  },

  mensagem: {
    paddingHorizontal: 20,
    marginTop: 50,
  },

  textoErro: {
    color: "#FF7777",
    textAlign: "center",
    marginBottom: 20,
  },

  botaoAssistir: {
    backgroundColor: "#E50914",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },

  textoAssistir: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },

  // AVALIAÇÕES

  areaAvaliacoes: {
    marginTop: 5,
  },

  caixaMedia: {
    backgroundColor: "#202024",
    marginHorizontal: 20,
    marginTop: 18,
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
  },

  mediaNumero: {
    color: "#FFFFFF",
    fontSize: 42,
    fontWeight: "bold",
  },

  linhaEstrelas: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },

  estrela: {
    color: "#777777",
    fontSize: 23,
    marginHorizontal: 1,
  },

  estrelaAtiva: {
    color: "#FFC107",
  },

  estrelaPequena: {
    fontSize: 15,
  },

  textoTotalAvaliacoes: {
    color: "#AAAAAA",
    fontSize: 13,
    marginTop: 8,
  },

  formularioAvaliacao: {
    backgroundColor: "#202024",
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
  },

  tituloFormulario: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },

  rotuloNota: {
    color: "#BBBBBB",
    marginTop: 16,
  },

  valorNota: {
    color: "#FFC107",
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 5,
  },

  campoComentario: {
    minHeight: 105,
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "#38383E",
    borderRadius: 8,
    color: "#FFFFFF",
    padding: 12,
    marginTop: 16,
    fontSize: 14,
  },

  botaoPublicar: {
    backgroundColor: "#E50914",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 14,
  },

  botaoDesabilitado: {
    opacity: 0.6,
  },

  textoPublicar: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 14,
  },

  botaoCancelarEdicao: {
    padding: 12,
    alignItems: "center",
  },

  textoCancelarEdicao: {
    color: "#AAAAAA",
  },

  avisoLogin: {
    color: "#AAAAAA",
    fontSize: 12,
    textAlign: "center",
    marginTop: 12,
  },

  subtituloAvaliacoes: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    marginHorizontal: 20,
    marginTop: 28,
    marginBottom: 12,
  },

  semAvaliacoes: {
    color: "#999999",
    marginHorizontal: 20,
    lineHeight: 22,
    marginTop: 8,
  },

  cardAvaliacao: {
    backgroundColor: "#202024",
    marginHorizontal: 20,
    marginBottom: 14,
    padding: 15,
    borderRadius: 12,
  },

  cabecalhoAvaliacao: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },

  avatarUsuario: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#E50914",
    alignItems: "center",
    justifyContent: "center",
  },

  letraAvatar: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 17,
  },

  dadosUsuario: {
    flex: 1,
    marginLeft: 10,
  },

  nomeUsuario: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },

  dataAvaliacao: {
    color: "#888888",
    fontSize: 11,
    marginTop: 3,
  },

  seloMinhaAvaliacao: {
    color: "#E50914",
    fontSize: 10,
    fontWeight: "bold",
  },

  comentarioAvaliacao: {
    color: "#DDDDDD",
    fontSize: 14,
    lineHeight: 22,
    marginTop: 12,
  },

  comentarioVazio: {
    color: "#888888",
    fontSize: 13,
    fontStyle: "italic",
    marginTop: 12,
  },

  acoesAvaliacao: {
    flexDirection: "row",
    gap: 20,
    marginTop: 14,
  },

  botaoAcao: {
    paddingVertical: 8,
    paddingHorizontal: 5,
  },

  acaoEditar: {
    color: "#65A9FF",
    fontWeight: "bold",
  },

  acaoExcluir: {
    color: "#FF6666",
    fontWeight: "bold",
  },

  botaoRespostas: {
    borderTopWidth: 1,
    borderTopColor: "#38383E",
    marginTop: 15,
    paddingTop: 13,
  },

  textoBotaoRespostas: {
    color: "#E50914",
    fontWeight: "bold",
    fontSize: 13,
  },

  areaRespostas: {
    marginTop: 12,
    paddingLeft: 10,
  },

  cardResposta: {
    backgroundColor: "#151515",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },

  nomeResposta: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 13,
  },

  textoResposta: {
    color: "#CCCCCC",
    fontSize: 13,
    lineHeight: 20,
    marginTop: 5,
  },

  dataResposta: {
    color: "#777777",
    fontSize: 10,
    marginTop: 7,
  },

  semRespostas: {
    color: "#888888",
    fontSize: 12,
    marginBottom: 10,
  },

  campoResposta: {
    minHeight: 65,
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "#38383E",
    borderRadius: 8,
    color: "#FFFFFF",
    padding: 10,
    marginTop: 8,
  },

  botaoEnviarResposta: {
    backgroundColor: "#383838",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },

  caixaErroAvaliacao: {
    marginHorizontal: 20,
    marginTop: 18,
  },

  botaoAtualizar: {
    backgroundColor: "#383838",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },

  textoBotaoAtualizar: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },

  // MODAL PERSONALIZADO CINEVERSE

  fundoModal: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.78)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    zIndex: 9999,
    elevation: 20,
  },

  caixaModal: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#202024",
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: "#38383E",
  },

  cabecalhoModal: {
    alignItems: "center",
  },

  iconeModal: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#173D2B",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },

  iconeModalErro: {
    backgroundColor: "#451D20",
  },

  iconeModalConfirmacao: {
    backgroundColor: "#493719",
  },

  textoIconeModal: {
    color: "#FFFFFF",
    fontSize: 25,
    fontWeight: "bold",
  },

  tituloModal: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
  },

  mensagemModal: {
    color: "#BBBBBB",
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
    marginTop: 14,
    marginBottom: 22,
  },

  acoesModal: {
    flexDirection: "row",
    gap: 12,
  },

  botaoCancelarModal: {
    flex: 1,
    backgroundColor: "#38383E",
    padding: 14,
    borderRadius: 9,
    alignItems: "center",
  },

  textoCancelarModal: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },

  botaoExcluirModal: {
    flex: 1,
    backgroundColor: "#E50914",
    padding: 14,
    borderRadius: 9,
    alignItems: "center",
  },

  textoExcluirModal: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },

  botaoFecharModal: {
    backgroundColor: "#E50914",
    padding: 14,
    borderRadius: 9,
    alignItems: "center",
  },

  textoFecharModal: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
});