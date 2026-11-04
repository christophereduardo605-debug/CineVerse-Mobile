const API_URL = "";

export const configurarApi = () => {
  if (!API_URL) {
    console.log("CineVerse: aguardando endereço do Back-end.");

    return false;
  }

  return true;
};

export const api = async (rota, opcoes = {}) => {
  if (!API_URL) {
    throw new Error("A API do CineVerse ainda não foi configurada.");
  }

  const resposta = await fetch(`${API_URL}${rota}`, {
    ...opcoes,
    headers: {
      "Content-Type": "application/json",
      ...opcoes.headers,
    },
  });

  if (!resposta.ok) {
    throw new Error(`Erro na API: ${resposta.status}`);
  }

  if (resposta.status === 204) {
    return null;
  }

  return resposta.json();
};
