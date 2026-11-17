
import { api } from "./api";

// ======================================
// SÉRIES DO MYSQL
// ======================================

export const buscarSeries = async () => {
  return await api("/series");
};

export const buscarSeriePorId = async (id) => {
  return await api(`/series/${encodeURIComponent(id)}`);
};

// ======================================
// SÉRIES DO TMDB
// ======================================

// SÉRIES POPULARES
export const buscarSeriesPopulares = async () => {
  return await api("/tmdb/series/populares");
};

// SÉRIES EM ALTA
export const buscarSeriesEmAlta = async () => {
  return await api("/tmdb/series/em-alta");
};

// DETALHES DA SÉRIE
export const buscarDetalhesSerieTMDB = async (id) => {
  return await api(`/tmdb/series/${encodeURIComponent(id)}`);
};

// ======================================
// SINCRONIZAR SÉRIE DO TMDB COM MYSQL
// ======================================

export const sincronizarSerieTMDB = async (tmdbId) => {
  return await api("/tmdb/conteudo", {
    method: "POST",
    body: JSON.stringify({
      tmdb_id: Number(tmdbId),
      tipo: "Série",
    }),
  });
};

// ======================================
// SÉRIES COM PAGINAÇÃO
// ======================================

// POPULARES PAGINADAS
export const buscarSeriesPopularesPaginadas = async (pagina = 1) => {
  return await api(`/tmdb/series/populares/paginadas?page=${pagina}`);
};

// EM ALTA PAGINADAS
export const buscarSeriesEmAltaPaginadas = async (pagina = 1) => {
  return await api(`/tmdb/series/em-alta/paginadas?page=${pagina}`);
};

// PESQUISAR SÉRIES COM PAGINAÇÃO
export const buscarSeriesPorNome = async (busca, pagina = 1) => {
  return await api(
    `/tmdb/series/buscar?busca=${encodeURIComponent(busca)}&page=${pagina}`
  );
};

// ======================================
// TEMPORADAS E EPISÓDIOS DO TMDB
// ======================================

export const buscarTemporadaTMDB = async (id, numeroTemporada) => {
  return await api(
    `/tmdb/series/${encodeURIComponent(id)}/temporadas/${encodeURIComponent(numeroTemporada)}`
  );
};

// ======================================
// TRAILER GERAL DA SÉRIE
// ======================================

export const buscarTrailerSerieTMDB = async (id) => {
  return await api(
    `/tmdb/series/${encodeURIComponent(id)}/videos`
  );
};

// ======================================
// TRAILER DA TEMPORADA
// ======================================

export const buscarTrailerTemporadaTMDB = async (
  id,
  numeroTemporada
) => {
  return await api(
    `/tmdb/series/${encodeURIComponent(id)}/temporadas/${encodeURIComponent(numeroTemporada)}/videos`
  );
};

// ======================================
// EPISÓDIOS DO MYSQL
// ======================================

export const buscarEpisodios = async (serieId) => {
  return await api(`/series/${encodeURIComponent(serieId)}/episodios`);
};
