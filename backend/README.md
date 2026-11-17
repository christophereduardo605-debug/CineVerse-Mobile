# CineVerse API
Backend REST em **Node.js + Express + JavaScript** para o CineVerse Mobile (React Native/Expo). Não usa banco de dados.

## Requisitos e instalação
- Node.js 20 ou superior e npm.
- Abra o terminal nesta pasta `backend` e execute `npm install`.
- Copie `.env.example` para `.env` e troque `JWT_SECRET` por uma chave aleatória longa (mínimo 24 caracteres).
- Execute `npm run dev` (desenvolvimento) ou `npm start`.
- API: `http://localhost:3333`.

## Sem banco de dados
Contas, favoritos e preferências ficam em memória e são apagados ao reiniciar o servidor. O catálogo fictício fica em `src/data/catalogo.js`. Senhas são protegidas com hash bcrypt e sessões usam JWT.

## Rotas públicas
| Método | Rota | Função |
|---|---|---|
| GET | `/health` | Estado da API |
| GET | `/home` | Seções da Home |
| GET | `/filmes?busca=&genero=` | Listar e filtrar filmes |
| GET | `/filmes/:id` | Detalhes do filme |
| GET | `/series?busca=&genero=` | Listar e filtrar séries |
| GET | `/series/:id` | Detalhes da série |
| GET | `/series/:id/episodios` | Episódios |
| POST | `/auth/cadastro` | Cadastro: `{ "nome":"Nome", "email":"email@teste.com", "senha":"senha12345" }` |
| POST | `/auth/login` | Login: `{ "email":"email@teste.com", "senha":"senha12345" }` |

## Rotas autenticadas
Enviar `Authorization: Bearer TOKEN`.
| Método | Rota | Função |
|---|---|---|
| GET | `/usuarios/me/perfil` | Consultar perfil |
| PATCH | `/usuarios/me/perfil` | Atualizar nome, email ou foto |
| GET | `/usuarios/me/favoritos` | Listar favoritos |
| POST | `/usuarios/me/favoritos` | Adicionar `{ "conteudoId":"distrito-neon", "tipo":"filme" }` |
| DELETE | `/usuarios/me/favoritos/:tipo/:conteudoId` | Remover favorito |
| GET | `/usuarios/me/configuracoes` | Consultar preferências |
| PATCH | `/usuarios/me/configuracoes` | Atualizar preferências |

## Testes rápidos
`curl http://localhost:3333/health` e `curl http://localhost:3333/filmes`.

## Conectar o app Expo
Esta entrega implementa a API separada, não altera as telas do app ainda. O `services/api.js` do frontend precisa receber a URL do servidor e enviar o JWT nas rotas autenticadas. No celular físico, use o IPv4 do computador na mesma rede Wi-Fi (ex.: `http://192.168.0.10:3333`), não `localhost`. No Android Emulator, use `http://10.0.2.2:3333`. No iOS Simulator, use `http://localhost:3333`.

## Limites desta versão
- Reiniciar o Node apaga contas, favoritos e preferências. Para persistir entre reinícios, será necessário adicionar armazenamento ou banco numa etapa futura.
- Os posters continuam como imagens locais do app. O backend devolve metadados e caminhos de referência.
- Player é apenas a tela do protótipo: não existem vídeos, URLs de streaming ou DRM nesta entrega.
