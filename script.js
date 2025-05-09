import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getDatabase, ref, push, set, onValue, update, remove } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyCbYPpH8kBvd3w0G99xrlsqcvJ51OyItS4",
  authDomain: "lugane-estoque-a76a6.firebaseapp.com",
  databaseURL: "https://lugane-estoque-a76a6-default-rtdb.firebaseio.com",
  projectId: "lugane-estoque-a76a6",
  storageBucket: "lugane-estoque-a76a6.appspot.com",
  messagingSenderId: "218820542563",
  appId: "1:218820542563:web:5c39fe1643bdb6cfed7856"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const estoqueRef = ref(db, 'estoque');
const orcamentosRef = ref(db, 'orcamentos');

let dadosEstoque = [];
let dadosOrcamentos = [];

function normalizarTexto(texto) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function formatarDataBR(dataISO) {
  if (!dataISO) return '';
  const partes = dataISO.split('-');
  if (partes.length !== 3) return dataISO;
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

window.salvarPeca = function () {
  const modelo = document.getElementById('modelo').value.trim();
  const peca = document.getElementById('peca').value.trim();
  const quantidade = parseInt(document.getElementById('quantidade').value);

  if (!modelo || !peca || isNaN(quantidade)) {
    alert("Preencha todos os campos corretamente.");
    return;
  }

  const novaRef = push(estoqueRef);
  set(novaRef, { modelo, peca, quantidade });

  document.getElementById('modelo').value = '';
  document.getElementById('peca').value = '';
  document.getElementById('quantidade').value = '';
};

onValue(estoqueRef, (snapshot) => {
  const tbody = document.getElementById('tabela-corpo');
  tbody.innerHTML = '';
  dadosEstoque = [];

  snapshot.forEach((child) => {
    const item = child.val();
    const key = child.key;
    dadosEstoque.push({ ...item, key });

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.modelo}</td>
      <td>${item.peca}</td>
      <td>${item.quantidade}</td>
      <td>
        <div class="acoes-estoque">
            <button onclick="alterarQuantidade('${key}', 1)">+</button>
            <button onclick="alterarQuantidade('${key}', -1)" ${item.quantidade === 0 ? 'disabled' : ''}>−</button>
            <button onclick="deletarPeca('${key}')" class="excluir-botao">
                <img src="delete.png" alt="Excluir">
            </button>
        </div>
        </td>
    `;
    tbody.appendChild(tr);
  });
});

window.alterarQuantidade = function (key, delta) {
  const item = dadosEstoque.find(i => i.key === key);
  if (!item) return;

  const novaQuantidade = item.quantidade + delta;
  if (novaQuantidade < 0) return;

  const itemRef = ref(db, `estoque/${key}`);
  update(itemRef, { quantidade: novaQuantidade });
};

window.deletarPeca = function (key) {
  if (confirm("Tem certeza que deseja excluir esta peça?")) {
    const itemRef = ref(db, `estoque/${key}`);
    remove(itemRef)
      .then(() => console.log("Peça excluída com sucesso."))
      .catch((error) => console.error("Erro ao excluir peça:", error));
  }
};

window.registrarOrcamento = function () {
  const modelo = document.getElementById('modeloOrc').value.trim();
  const data = document.getElementById('dataOrc').value;
  const quantidade = parseInt(document.getElementById('quantidadeOrc').value);
  const descricao = document.getElementById('descricaoOrc').value.trim().toLowerCase();
  const tecnico = document.getElementById('tecnicoOrc').value.trim();
  const autorizado = document.getElementById('autorizadoOrc').value;
  const empresa = document.getElementById('empresaOrc')?.value.trim() || '';
  const patrimonio = document.getElementById('patrimonioOrc')?.value.trim() || '';
  const entrada = document.getElementById('entradaOrc').value;
  const os = document.getElementById('osOrc')?.value.trim() || '';
  const ddcd = document.getElementById('ddcdOrc')?.value.trim() || '';

  if (!modelo || !entrada || isNaN(quantidade) || !descricao || !tecnico) {
    alert("Preencha todos os campos corretamente.");
    return;
  }

  if (autorizado === "NÃO") {
    return salvarOrcamento({ modelo, data, quantidade, descricao, tecnico, autorizado, patrimonio, os, ddcd, empresa, entrada });
  }

  const modeloNormalizado = normalizarTexto(modelo);
  const descricaoNormalizada = normalizarTexto(descricao);

  const itemEncontrado = dadosEstoque.find(item =>
    normalizarTexto(item.modelo) === modeloNormalizado &&
    descricaoNormalizada.includes(normalizarTexto(item.peca))
  );

  if (!itemEncontrado) {
    alert("Peça não encontrada no estoque para esse modelo e descrição.");
    return;
  }

  if (itemEncontrado.quantidade < quantidade) {
    alert("Estoque insuficiente para a quantidade informada.");
    return;
  }

  const itemRef = ref(db, `estoque/${itemEncontrado.key}`);
  update(itemRef, { quantidade: itemEncontrado.quantidade - quantidade })
    .then(() => {
      salvarOrcamento({ modelo, data, quantidade, descricao, tecnico, autorizado, patrimonio, os, ddcd, empresa });
    })
    .catch((error) => {
      console.error("Erro ao atualizar o estoque:", error);
      alert("Erro ao atualizar o estoque.");
    });
};

window.deletarOrcamento = function (key) {
  if (confirm("Tem certeza que deseja excluir este orçamento?")) {
    const orcamentoRef = ref(db, `orcamentos/${key}`);
    remove(orcamentoRef)
      .then(() => alert("Orçamento excluído com sucesso!"))
      .catch((error) => {
        console.error("Erro ao excluir orçamento:", error);
        alert("Erro ao excluir orçamento.");
      });
  }
};

function salvarOrcamento(orcamento) {
  const novaRef = push(orcamentosRef);
  set(novaRef, orcamento)
    .then(() => {
      alert("Orçamento registrado com sucesso.");
      document.getElementById('modeloOrc').value = '';
      document.getElementById('dataOrc').value = '';
      document.getElementById('quantidadeOrc').value = '';
      document.getElementById('entradaOrc').value = '';
      document.getElementById('descricaoOrc').value = '';
      document.getElementById('tecnicoOrc').value = '';
      document.getElementById('patrimonioOrc').value = '';
      document.getElementById('osOrc').value = '';
      document.getElementById('ddcdOrc').value = '';
      document.getElementById('empresaOrc').value = '';
      document.getElementById('autorizadoOrc').value = 'SIM';
    })
    .catch((error) => {
      console.error("Erro ao registrar orçamento:", error);
      alert("Erro ao registrar orçamento.");
    });
}

onValue(orcamentosRef, (snapshot) => {
  const tbody = document.getElementById('tabela-orcamentos');
  tbody.innerHTML = '';
  dadosOrcamentos = [];

  snapshot.forEach((child) => {
    const item = child.val();
    const key = child.key;
    dadosOrcamentos.push({ ...item, key });

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.ddcd || ''}</td>
      <td>${item.patrimonio || ''}</td>
      <td>${item.os || ''}</td>
      <td>${item.empresa || ''}</td>
      <td>${item.modelo}</td>
      <td>${formatarDataBR(item.entrada)}</td>
      <td>${formatarDataBR(item.data)}</td>
      <td>${item.quantidade}</td>
      <td>${item.descricao}</td>
      <td>${item.tecnico}</td>
      <td class="acoes-botoes">
        ${item.autorizado === "SIM" ? '' : `
            <button onclick="alterarStatusOrcamento('${key}')" class="autorizar-botao">
            <img src="checked.png" alt="Autorizar">
            </button>`}
        <button onclick="deletarOrcamento('${key}')" class="excluir-botao">
            <img src="delete.png" alt="Excluir">
        </button>
    </td>

    `;
    tbody.appendChild(tr);
  });
});

window.alterarStatusOrcamento = function (key) {
  const item = dadosOrcamentos.find(i => i.key === key);
  if (!item) return;

  const modeloNormalizado = normalizarTexto(item.modelo);
  const descricaoNormalizada = normalizarTexto(item.descricao);

  const itemEstoque = dadosEstoque.find(i =>
    normalizarTexto(i.modelo) === modeloNormalizado &&
    descricaoNormalizada.includes(normalizarTexto(i.peca))
  );

  if (!itemEstoque) {
    alert("Peça correspondente não encontrada no estoque.");
    return;
  }

  if (itemEstoque.quantidade < item.quantidade) {
    alert("Estoque insuficiente.");
    return;
  }

  const estoqueRefItem = ref(db, `estoque/${itemEstoque.key}`);
  update(estoqueRefItem, {
    quantidade: itemEstoque.quantidade - item.quantidade
  })
    .then(() => {
      const itemRef = ref(db, `orcamentos/${key}`);
      update(itemRef, { autorizado: "SIM" })
        .then(() => alert("Orçamento autorizado e estoque atualizado!"))
        .catch((error) => {
          console.error("Erro ao autorizar orçamento:", error);
          alert("Erro ao autorizar orçamento.");
        });
    })
    .catch((error) => {
      console.error("Erro ao atualizar estoque:", error);
      alert("Erro ao atualizar estoque.");
    });
};

window.filtrarOrcamentos = function () {
  const termo = document.getElementById('buscaOrcamentos').value.toLowerCase();
  const tbody = document.getElementById('tabela-orcamentos');
  tbody.innerHTML = '';

  dadosOrcamentos.forEach(({ ddcd, patrimonio, os, empresa, modelo, entrada, data, quantidade, descricao, tecnico, autorizado, key }) => {
  const valoresConcatenados = `
    ${ddcd || ''}
    ${patrimonio || ''}
    ${os || ''}
    ${empresa || ''}
    ${modelo || ''}
    ${entrada || ''}
    ${data || ''}
    ${quantidade || ''}
    ${descricao || ''}
    ${tecnico || ''}
  `.toLowerCase();

  if (valoresConcatenados.includes(termo)) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${ddcd || ''}</td>
      <td>${patrimonio || ''}</td>
      <td>${os || ''}</td>
      <td>${empresa || ''}</td>
      <td>${modelo}</td>
      <td>${formatarDataBR(entrada)}</td>
      <td>${formatarDataBR(data)}</td>
      <td>${quantidade}</td>
      <td>${descricao}</td>
      <td>${tecnico}</td>
      <td class="acoes-botoes">
        ${autorizado === "SIM" ? '' : `
          <button onclick="alterarStatusOrcamento('${key}')" class="autorizar-botao">
            <img src="checked.png" alt="Autorizar">
          </button>`}
        <button onclick="deletarOrcamento('${key}')" class="excluir-botao">
          <img src="delete.png" alt="Excluir">
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  }
});
};

window.filtrarTabela = function () {
  const termo = document.getElementById('busca').value.toLowerCase().trim();
  const tbody = document.getElementById('tabela-corpo');
  tbody.innerHTML = '';

  dadosEstoque.forEach(item => {
    const valoresConcatenados = `${item.modelo} ${item.peca} ${item.quantidade}`.toLowerCase();

    if (valoresConcatenados.includes(termo)) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${item.modelo}</td>
        <td>${item.peca}</td>
        <td>${item.quantidade}</td>
        <td>
          <div class="acoes-estoque">
            <button onclick="alterarQuantidade('${item.key}', 1)">+</button>
            <button onclick="alterarQuantidade('${item.key}', -1)" ${item.quantidade === 0 ? 'disabled' : ''}>−</button>
            <button onclick="deletarPeca('${item.key}')" class="excluir-botao">
              <img src="delete.png" alt="Excluir">
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    }
  });
};






