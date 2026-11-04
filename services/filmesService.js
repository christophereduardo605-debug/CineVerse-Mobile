import { api } from "./api";

// Buscar todos os filmes
export const buscarFilmes = async () => {
  return await api("/filmes");
};

// Buscar um filme pelo ID
export const buscarFilmePorId = async (id) => {
  return await api(`/filmes/${encodeURIComponent(id)}`);
};
