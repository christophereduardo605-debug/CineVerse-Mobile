
import React, { useCallback, useEffect, useRef, useState } from "react";

import {
    View,
    Text,
    Image,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    RefreshControl,
    StatusBar,
} from "react-native";

import { buscarCatalogoAvaliacoes } from "../services/filmesService";

export default function AvaliacoesScreen({ navigation }) {
    const [abaAtiva, setAbaAtiva] = useState("Filme");

    const [filmes, setFilmes] = useState([]);
    const [series, setSeries] = useState([]);

    const [carregando, setCarregando] = useState(true);
    const [atualizando, setAtualizando] = useState(false);
    const [erro, setErro] = useState("");

    const [carregandoMaisFilmes, setCarregandoMaisFilmes] = useState(false);
    const [carregandoMaisSeries, setCarregandoMaisSeries] = useState(false);

    const [temMaisFilmes, setTemMaisFilmes] = useState(true);
    const [temMaisSeries, setTemMaisSeries] = useState(true);

    // Controle independente das páginas

    const paginaFilmes = useRef(1);
    const paginaSeries = useRef(1);

    const buscandoFilmes = useRef(false);
    const buscandoSeries = useRef(false);

    const temMaisFilmesRef = useRef(true);
    const temMaisSeriesRef = useRef(true);

    // ======================================
    // REMOVER CONTEÚDOS DUPLICADOS
    // ======================================

    const adicionarSemDuplicados = (anteriores, novos) => {
        const idsExistentes = new Set(
            anteriores.map((item) => String(item.tmdb_id))
        );

        const unicos = novos.filter(
            (item) => !idsExistentes.has(String(item.tmdb_id))
        );

        return [...anteriores, ...unicos];
    };

    // ======================================
    // CARREGAR PRIMEIRA PÁGINA
    // ======================================

    const carregarCatalogo = useCallback(async (atualizacao = false) => {
        try {
            if (atualizacao) {
                setAtualizando(true);
            } else {
                setCarregando(true);
            }

            setErro("");

            paginaFilmes.current = 1;
            paginaSeries.current = 1;

            temMaisFilmesRef.current = true;
            temMaisSeriesRef.current = true;

            setTemMaisFilmes(true);
            setTemMaisSeries(true);

            buscandoFilmes.current = false;
            buscandoSeries.current = false;

            setCarregandoMaisFilmes(false);
            setCarregandoMaisSeries(false);

            const [respostaFilmes, respostaSeries] = await Promise.all([
                buscarCatalogoAvaliacoes("Filme", 1),
                buscarCatalogoAvaliacoes("Série", 1),
            ]);

            setFilmes(respostaFilmes.resultados || []);
            setSeries(respostaSeries.resultados || []);

            temMaisFilmesRef.current = respostaFilmes.tem_mais === true;
            temMaisSeriesRef.current = respostaSeries.tem_mais === true;

            setTemMaisFilmes(respostaFilmes.tem_mais === true);
            setTemMaisSeries(respostaSeries.tem_mais === true);

        } catch (error) {
            console.error("Erro ao carregar catálogo de avaliações:", error);
            setErro("Não foi possível carregar o catálogo.");
        } finally {
            setCarregando(false);
            setAtualizando(false);
        }
    }, []);

    // ======================================
    // CARREGAR MAIS FILMES
    // ======================================

    const carregarMaisFilmes = useCallback(async () => {
        if (
            buscandoFilmes.current ||
            !temMaisFilmesRef.current
        ) {
            return;
        }

        buscandoFilmes.current = true;
        setCarregandoMaisFilmes(true);

        const proximaPagina = paginaFilmes.current + 1;

        try {
            const resposta = await buscarCatalogoAvaliacoes(
                "Filme",
                proximaPagina
            );

            const novosFilmes = resposta.resultados || [];

            setFilmes((anteriores) =>
                adicionarSemDuplicados(anteriores, novosFilmes)
            );

            paginaFilmes.current = proximaPagina;

            temMaisFilmesRef.current = resposta.tem_mais === true;
            setTemMaisFilmes(resposta.tem_mais === true);

        } catch (error) {
            console.error("Erro ao carregar mais filmes:", error);
        } finally {
            buscandoFilmes.current = false;
            setCarregandoMaisFilmes(false);
        }
    }, []);

    // ======================================
    // CARREGAR MAIS SÉRIES
    // ======================================

    const carregarMaisSeries = useCallback(async () => {
        if (
            buscandoSeries.current ||
            !temMaisSeriesRef.current
        ) {
            return;
        }

        buscandoSeries.current = true;
        setCarregandoMaisSeries(true);

        const proximaPagina = paginaSeries.current + 1;

        try {
            const resposta = await buscarCatalogoAvaliacoes(
                "Série",
                proximaPagina
            );

            const novasSeries = resposta.resultados || [];

            setSeries((anteriores) =>
                adicionarSemDuplicados(anteriores, novasSeries)
            );

            paginaSeries.current = proximaPagina;

            temMaisSeriesRef.current = resposta.tem_mais === true;
            setTemMaisSeries(resposta.tem_mais === true);

        } catch (error) {
            console.error("Erro ao carregar mais séries:", error);
        } finally {
            buscandoSeries.current = false;
            setCarregandoMaisSeries(false);
        }
    }, []);

    // ======================================
    // CARREGAR MAIS DA ABA ATIVA
    // ======================================

    const carregarMaisConteudos = useCallback(() => {
        if (abaAtiva === "Filme") {
            carregarMaisFilmes();
        } else {
            carregarMaisSeries();
        }
    }, [abaAtiva, carregarMaisFilmes, carregarMaisSeries]);

    // ======================================
    // DETECTAR FINAL DA ROLAGEM
    // ======================================

    const verificarFinalDaLista = (evento) => {
        const {
            contentOffset,
            contentSize,
            layoutMeasurement,
        } = evento.nativeEvent;

        const distanciaDoFinal =
            contentSize.height -
            (contentOffset.y + layoutMeasurement.height);

        if (distanciaDoFinal < 500) {
            carregarMaisConteudos();
        }
    };

    // ======================================
    // CARREGAMENTO INICIAL
    // ======================================

    useEffect(() => {
        carregarCatalogo();
    }, [carregarCatalogo]);

    // ======================================
    // ABRIR DETALHES
    // ======================================

    const abrirDetalhes = (item) => {
        console.log("========== CLIQUE EM AVALIAÇÕES ==========");
        console.log("Item completo:", item);
        console.log("Título:", item.titulo);
        console.log("Tipo:", item.tipo);
        console.log("ID TMDB:", item.tmdb_id);

        if (!item.tmdb_id) {
            console.error("Conteúdo sem ID do TMDB:", item);
            return;
        }

        if (item.tipo === "Série") {
            console.log("NAVEGANDO PARA: DetalhesSerie");

            navigation.navigate("DetalhesSerie", {
                origem: "tmdb",
                id: item.tmdb_id,
                tmdb_id: item.tmdb_id,
            });
        } else {
            console.log("NAVEGANDO PARA: Detalhes");

            navigation.navigate("Detalhes", {
                origem: "tmdb",
                id: item.tmdb_id,
                tmdb_id: item.tmdb_id,
            });
        }

        console.log("==========================================");
    };

    // ======================================
    // RENDERIZAR CARD
    // ======================================

    const renderItem = (item) => {
        const totalAvaliacoes = Number(item.total_avaliacoes) || 0;
        const media = Number(item.media) || 0;

        return (
            <TouchableOpacity
                key={`${item.tipo}-${item.tmdb_id}`}
                style={styles.card}
                activeOpacity={0.8}
                onPress={() => abrirDetalhes(item)}
            >
                {item.imagem ? (
                    <Image
                        source={{ uri: item.imagem }}
                        style={styles.poster}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={styles.posterSemImagem}>
                        <Text style={styles.semImagem}>
                            Sem imagem
                        </Text>
                    </View>
                )}

                <View style={styles.informacoes}>
                    <Text style={styles.titulo} numberOfLines={2}>
                        {item.titulo}
                    </Text>

                    <Text style={styles.tipo}>
                        {item.tipo} • {item.ano || "Ano não informado"}
                    </Text>

                    {totalAvaliacoes > 0 ? (
                        <>
                            <View style={styles.mediaContainer}>
                                <Text style={styles.estrela}>★</Text>

                                <Text style={styles.media}>
                                    {media.toFixed(1)}
                                </Text>

                                <Text style={styles.notaMaxima}>
                                    / 5
                                </Text>
                            </View>

                            <Text style={styles.quantidade}>
                                {totalAvaliacoes}{" "}
                                {totalAvaliacoes === 1
                                    ? "avaliação"
                                    : "avaliações"}
                            </Text>
                        </>
                    ) : (
                        <View style={styles.semAvaliacoesContainer}>
                            <Text style={styles.semAvaliacoes}>
                                Ainda sem avaliações
                            </Text>

                            <Text style={styles.primeiraAvaliacao}>
                                Seja o primeiro a avaliar!
                            </Text>
                        </View>
                    )}

                    <Text style={styles.abrir}>
                        Ver detalhes ›
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    // ======================================
    // DADOS DA ABA ATIVA
    // ======================================

    const dadosAtivos = abaAtiva === "Filme" ? filmes : series;

    const carregandoMaisAtivo =
        abaAtiva === "Filme"
            ? carregandoMaisFilmes
            : carregandoMaisSeries;

    const temMaisAtivo =
        abaAtiva === "Filme"
            ? temMaisFilmes
            : temMaisSeries;

    const tituloSecao =
        abaAtiva === "Filme"
            ? "Explore os filmes"
            : "Explore as séries";

    const descricaoSecao =
        abaAtiva === "Filme"
            ? "Descubra filmes e compartilhe sua opinião"
            : "Descubra séries e compartilhe sua opinião";

    const iconeSecao = abaAtiva === "Filme" ? "🎬" : "📺";

    // ======================================
    // TELA
    // ======================================

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            <View style={styles.cabecalho}>

                {/* BOTÃO VOLTAR PARA HOME */}

                <TouchableOpacity
                    style={styles.botaoVoltar}
                    onPress={() => navigation.navigate("Home")}
                    activeOpacity={0.7}
                >
                    <Text style={styles.textoVoltar}>
                        ‹ Voltar
                    </Text>
                </TouchableOpacity>

                <Text style={styles.subtitulo}>
                    CINEVERSE
                </Text>

                <Text style={styles.tituloPagina}>
                    Avaliações
                </Text>

                <Text style={styles.descricao}>
                    Explore filmes e séries, confira as notas
                    e deixe sua avaliação.
                </Text>
            </View>

            {/* ABAS FILMES E SÉRIES */}

            <View style={styles.abas}>
                <TouchableOpacity
                    style={[
                        styles.aba,
                        abaAtiva === "Filme" && styles.abaAtiva,
                    ]}
                    activeOpacity={0.8}
                    onPress={() => setAbaAtiva("Filme")}
                >
                    <Text
                        style={[
                            styles.textoAba,
                            abaAtiva === "Filme" && styles.textoAbaAtiva,
                        ]}
                    >
                        🎬 Filmes
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.aba,
                        abaAtiva === "Série" && styles.abaAtiva,
                    ]}
                    activeOpacity={0.8}
                    onPress={() => setAbaAtiva("Série")}
                >
                    <Text
                        style={[
                            styles.textoAba,
                            abaAtiva === "Série" && styles.textoAbaAtiva,
                        ]}
                    >
                        📺 Séries
                    </Text>
                </TouchableOpacity>
            </View>

            {carregando ? (
                <ActivityIndicator
                    size="large"
                    color="#E50914"
                    style={styles.carregando}
                />
            ) : erro ? (
                <View style={styles.estado}>
                    <Text style={styles.mensagem}>
                        {erro}
                    </Text>

                    <TouchableOpacity
                        style={styles.botaoTentar}
                        onPress={() => carregarCatalogo()}
                    >
                        <Text style={styles.textoBotao}>
                            Tentar novamente
                        </Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView
                    key={abaAtiva}
                    contentContainerStyle={styles.lista}
                    showsVerticalScrollIndicator={false}
                    onScroll={verificarFinalDaLista}
                    scrollEventThrottle={400}
                    refreshControl={
                        <RefreshControl
                            refreshing={atualizando}
                            onRefresh={() => carregarCatalogo(true)}
                            tintColor="#E50914"
                            colors={["#E50914"]}
                        />
                    }
                >
                    <View style={styles.secao}>
                        <View style={styles.cabecalhoSecao}>
                            <Text style={styles.iconeSecao}>
                                {iconeSecao}
                            </Text>

                            <View style={styles.textosSecao}>
                                <Text style={styles.tituloSecao}>
                                    {tituloSecao}
                                </Text>

                                <Text style={styles.descricaoSecao}>
                                    {descricaoSecao}
                                </Text>
                            </View>
                        </View>

                        {dadosAtivos.length > 0 ? (
                            dadosAtivos.map((item) =>
                                renderItem(item)
                            )
                        ) : (
                            <Text style={styles.vazioSecao}>
                                Nenhum conteúdo encontrado nesta categoria.
                            </Text>
                        )}

                        {carregandoMaisAtivo && (
                            <ActivityIndicator
                                size="small"
                                color="#E50914"
                                style={styles.indicadorMais}
                            />
                        )}

                        {!temMaisAtivo && dadosAtivos.length > 0 && (
                            <Text style={styles.fimDaLista}>
                                Você chegou ao final desta categoria.
                            </Text>
                        )}
                    </View>
                </ScrollView>
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

    cabecalho: {
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
    },

    // BOTÃO VOLTAR

    botaoVoltar: {
        alignSelf: "flex-start",
        marginBottom: 22,
        paddingVertical: 5,
    },

    textoVoltar: {
        color: "#AAAAAA",
        fontSize: 17,
        fontWeight: "bold",
    },

    subtitulo: {
        color: "#E50914",
        fontSize: 12,
        fontWeight: "bold",
        letterSpacing: 3,
    },

    tituloPagina: {
        color: "#FFFFFF",
        fontSize: 30,
        fontWeight: "900",
        marginTop: 8,
    },

    descricao: {
        color: "#AAAAAA",
        fontSize: 14,
        lineHeight: 21,
        marginTop: 8,
    },

    // ABAS

    abas: {
        flexDirection: "row",
        marginHorizontal: 16,
        marginBottom: 18,
        backgroundColor: "#19191D",
        borderRadius: 12,
        padding: 5,
        borderWidth: 1,
        borderColor: "#303036",
    },

    aba: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 13,
        borderRadius: 9,
    },

    abaAtiva: {
        backgroundColor: "#E50914",
    },

    textoAba: {
        color: "#AAAAAA",
        fontSize: 14,
        fontWeight: "bold",
    },

    textoAbaAtiva: {
        color: "#FFFFFF",
    },

    lista: {
        paddingHorizontal: 16,
        paddingBottom: 35,
    },

    secao: {
        marginBottom: 25,
    },

    cabecalhoSecao: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 14,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#303036",
    },

    iconeSecao: {
        fontSize: 25,
        marginRight: 11,
    },

    textosSecao: {
        flex: 1,
    },

    tituloSecao: {
        color: "#FFFFFF",
        fontSize: 18,
        fontWeight: "900",
    },

    descricaoSecao: {
        color: "#999999",
        fontSize: 12,
        marginTop: 4,
    },

    card: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#19191D",
        borderRadius: 13,
        padding: 12,
        marginBottom: 13,
        borderWidth: 1,
        borderColor: "#303036",
    },

    poster: {
        width: 82,
        height: 120,
        borderRadius: 8,
        backgroundColor: "#292929",
    },

    posterSemImagem: {
        width: 82,
        height: 120,
        borderRadius: 8,
        backgroundColor: "#292929",
        justifyContent: "center",
        alignItems: "center",
    },

    semImagem: {
        color: "#AAAAAA",
        fontSize: 10,
    },

    informacoes: {
        flex: 1,
        marginLeft: 13,
    },

    titulo: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "bold",
    },

    tipo: {
        color: "#999999",
        fontSize: 12,
        marginTop: 6,
    },

    mediaContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 10,
    },

    estrela: {
        color: "#F5C518",
        fontSize: 19,
        marginRight: 5,
    },

    media: {
        color: "#FFFFFF",
        fontSize: 18,
        fontWeight: "bold",
    },

    notaMaxima: {
        color: "#999999",
        fontSize: 12,
        marginLeft: 3,
    },

    quantidade: {
        color: "#AAAAAA",
        fontSize: 11,
        marginTop: 5,
    },

    semAvaliacoesContainer: {
        marginTop: 10,
    },

    semAvaliacoes: {
        color: "#AAAAAA",
        fontSize: 12,
    },

    primeiraAvaliacao: {
        color: "#E50914",
        fontSize: 11,
        fontWeight: "bold",
        marginTop: 4,
    },

    abrir: {
        color: "#E50914",
        fontSize: 12,
        fontWeight: "bold",
        marginTop: 9,
    },

    vazioSecao: {
        color: "#888888",
        fontSize: 13,
        textAlign: "center",
        paddingVertical: 22,
        backgroundColor: "#19191D",
        borderRadius: 10,
    },

    carregando: {
        marginTop: 60,
    },

    indicadorMais: {
        marginVertical: 15,
    },

    fimDaLista: {
        color: "#666666",
        fontSize: 11,
        textAlign: "center",
        marginVertical: 12,
    },

    estado: {
        alignItems: "center",
        padding: 25,
    },

    mensagem: {
        color: "#AAAAAA",
        textAlign: "center",
        marginTop: 25,
    },

    botaoTentar: {
        backgroundColor: "#E50914",
        padding: 13,
        borderRadius: 8,
        marginTop: 18,
    },

    textoBotao: {
        color: "#FFFFFF",
        fontWeight: "bold",
    },
});
