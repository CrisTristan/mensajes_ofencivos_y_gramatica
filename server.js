const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(cors());
app.use(express.static("public"));

// Colores para los usuarios
const colores = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEEAD",
  "#D4A5A5", "#9B59B6", "#3498DB", "#E67E22", "#2ECC71"
];

const usuariosConectados = new Map();

function esMensajeOfensivo(mensaje) {
  const palabrasOfensivas = [
    /est[uú]pido/i,
    /idiota/i,
    /imb[eé]cil/i,
    /p[uú]t[ao]/i,
    /maldit[oa]/i,
    /cabr[oó]n/i,
    /gilipollas/i,
    /capullo/i,
    /mam[oó]n/i,
    /payaso/i,
    /in[úu]til/i,
    /burro/i,
    /tonto/i,
    /bobo/i,
    /cretino/i,
    /zoquete/i,
    /memo/i,
    /palurdo/i,
    /paleto/i,
    /inculto/i
  ];
  return palabrasOfensivas.some((exp) => exp.test(mensaje));
}

io.on("connection", (socket) => {
  console.log("Usuario conectado");
  let nombreUsuario = "";

  socket.on("nuevoUsuario", (usuario) => {
    nombreUsuario = usuario;
    const colorIndex = usuariosConectados.size % colores.length;
    usuariosConectados.set(socket.id, {
      nombre: usuario,
      color: colores[colorIndex]
    });
    socket.emit("colorAsignado", colores[colorIndex]);
  });

  socket.on("nuevoMensaje", (msg) => {
    const esOfensivo = esMensajeOfensivo(msg.texto);
    const usuarioInfo = usuariosConectados.get(socket.id);
    msg.usuario = nombreUsuario;
    msg.esOfensivo = esOfensivo;
    msg.color = usuarioInfo ? usuarioInfo.color : "#000000";
    io.emit("mensajeRecibido", msg);
  });

  socket.on("disconnect", () => {
    usuariosConectados.delete(socket.id);
  });

  socket.on("AnalisisGramatical", (oracion) => {
    const analisisLexico = analizarLexico(oracion);
    console.log("Análisis léxico:", analisisLexico);
    const tokens = analisisLexico.map(item => {
      const partes = item.split(":");
        return partes[0].trim();
    });
    console.log("Tokens:", tokens);
    const resultadoSintactico = parse(tokens);
    console.log("Resultado sintáctico:", resultadoSintactico);
    const respuesta = {
      oracion: oracion,
      analisisLexico: analisisLexico,
      tokens: tokens,
      resultadoSintactico: resultadoSintactico
    };
    socket.emit("resultadoAnalisis", respuesta);
  }
  );

});

function analizarLexico(oracion) {
  const palabras = oracion.toLowerCase().split(" ");
  const tokens = [];

  for (let palabra of palabras) {
    if (["el", "la", "los", "las", "un", "una"].includes(palabra)) {
      tokens.push(`Det : ${palabra}`);
    } else if (["gato", "perro", "pelota", "croquetas"].includes(palabra)) {
      tokens.push(`N : ${palabra}`);
    } else if (["come", "ve", "ladra", "juega", "salta"].includes(palabra)) {
      tokens.push(`V : ${palabra}`);
    } else {
      tokens.push("DESCONOCIDO");
    }
  }

  return tokens;
}

// Tokens válidos por tipo
const tokensValidos = {
  Det: ["el", "la", "los", "las", "un", "una"],
  N: ["gato", "perro", "pelota", "croquetas"],
  V: ["come", "ve", "ladra", "juega", "salta"]
};

// Analizador sintáctico (parser)
function parse(tokenArray) {
  let i = 0;

  function match(expectedType) {
    if (i < tokenArray.length && tokenArray[i] === expectedType) {
      i++;
      return true;
    }
    return false;
  }

  function Det() {
    return match("Det");
  }

  function N() {
    return match("N");
  }

  function V() {
    return match("V");
  }

  function NP() {
    const posInicial = i;
    if (Det() && N()) return true;
    i = posInicial;
    return false;
  }

  function VP() {
    const posInicial = i;
    if (V() && NP()) return true;
    i = posInicial;
    return false;
  }

  function S() {
    const posInicial = i;
    if (NP() && VP() && i === tokenArray.length) return true;
    i = posInicial;
    return false;
  }

  return S();
}


server.listen(3000, "0.0.0.0", () => {
  console.log("Servidor corriendo en red local http://localhost:3000 en el puerto 3000");
});

