const jwt=require("jsonwebtoken");
function autenticar(req,res,next){
 const [tipo,token]=(req.headers.authorization||"").split(" ");
 if(tipo!=="Bearer"||!token) return res.status(401).json({erro:"Token de acesso não informado."});
 try{const payload=jwt.verify(token,process.env.JWT_SECRET);req.usuarioId=payload.sub;return next();}
 catch{return res.status(401).json({erro:"Token inválido ou expirado."});}
}
module.exports=autenticar;
