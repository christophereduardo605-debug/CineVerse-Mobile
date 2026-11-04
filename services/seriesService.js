import { api } from "./api";

// Buscar todas as séries
export const buscarSeries = async () => {
  return await api("/series");
};

// Buscar uma série pelo ID
export const buscarSeriePorId = async (id) => {
  return await api(`/series/${encodeURIComponent(id)}`);
};

// Buscar episódios de uma série
export const buscarEpisodios = async (serieId) => {
  return await api(`/series/${encodeURIComponent(serieId)}/episodios`);
};
