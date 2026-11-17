// Dados temporários: são apagados quando o processo Node é reiniciado.
const usuarios=new Map(); const favoritos=new Map(); const configuracoes=new Map();
module.exports={usuarios,favoritos,configuracoes};
