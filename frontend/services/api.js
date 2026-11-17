const API_URL = process.env.EXPO_PUBLIC_API_URL || "";

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

  let resposta;

  try {
    resposta = await fetch(`${API_URL}${rota}`, {
      ...opcoes,
      headers: {
        "Content-Type": "application/json",
        ...opcoes.headers,
      },
    });
  } catch (erro) {
    console.log("ERRO DE CONEXÃO COM A API:", erro);

    throw new Error(
      "Não foi possível conectar ao servidor. Verifique se o backend está ativo."
    );
  }

  // Ler resposta do servidor
  const texto = await resposta.text();

  let dados = null;

  try {
    dados = texto ? JSON.parse(texto) : null;
  } catch {
    console.log("RESPOSTA NÃO JSON DO SERVIDOR:", texto);
  }

  // Tratar erros HTTP
  if (!resposta.ok) {
    console.log("STATUS DA API:", resposta.status);
    console.log("RESPOSTA DO BACKEND:", dados || texto);

    if (resposta.status === 401) {
      throw new Error("E-mail ou senha incorretos.");
    }

    throw new Error(
      dados?.erro ||
      dados?.message ||
      `Erro na API: ${resposta.status}`
    );
  }

  // Resposta sem conteúdo
  if (resposta.status === 204) {
    return null;
  }

  return dados;
};
