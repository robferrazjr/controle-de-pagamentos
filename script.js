const modal = document.getElementById("modal");
const modalTitulo = document.getElementById("modalTitulo");
const modalInput = document.getElementById("modalInput");
const modalSalvar = document.getElementById("modalSalvar");
const modalCancelar = document.getElementById("modalCancelar");
let acaoAtual = null;
let indiceAtual = null;

function abrirModal(titulo, valor, callback) {
    modal.style.display = "flex";

    modalTitulo.innerText = titulo;

    modalInput.value = valor || "";

    acaoAtual = callback;
}

function fecharModal() {
    modal.style.display = "none";

    modalInput.style.display = "block";

    modalSalvar.innerText = "Salvar";

    modalInput.value = "";
}

modalSalvar.addEventListener("click", () => {
    if (modalInput.style.display === "none") {
        acaoAtual();

        fecharModal();

        return;
    }

    const valor = parseFloat(modalInput.value);

    if (isNaN(valor) || valor <= 0) {
        alert("Valor inválido.");
        return;
    }

    acaoAtual(valor);

    fecharModal();
});

modalCancelar.addEventListener("click", () => {
    fecharModal();
});
let emprestimos = [];

function salvarDados() {
    localStorage.setItem("emprestimos", JSON.stringify(emprestimos));
}

function carregarDados() {
    try {
        const dados = localStorage.getItem("emprestimos");

        if (dados) {
            emprestimos = JSON.parse(dados);

            if (!Array.isArray(emprestimos)) {
                emprestimos = [];
            }
        }
    } catch (error) {
        console.error("Erro ao carregar dados:", error);

        localStorage.removeItem("emprestimos");

        emprestimos = [];
    }
}

function formatarData(dataISO) {
    if (!dataISO) return "";

    const [ano, mes, dia] = dataISO.split("-");
    return `${dia}-${mes}-${ano}`;
}

function converterData(dataISO) {
    return new Date(dataISO + "T00:00:00");
}

function adicionarEmprestimo() {
    const nome = document.getElementById("nome").value.trim();

    const dataEmprestimo = document.getElementById("dataEmprestimo").value;

    const dataLimite = document.getElementById("dataLimite").value;

    const valor = parseFloat(document.getElementById("valor").value);

    const tipoJuros = document.getElementById("tipoJuros").value;

    const juros = parseFloat(document.getElementById("juros").value);

    if (
        nome === "" ||
        dataEmprestimo === "" ||
        dataLimite === "" ||
        isNaN(valor) ||
        isNaN(juros)
    ) {
        alert("Preencha todos os campos corretamente.");
        return;
    }

    let total = valor;

    if (tipoJuros === "percentual") {
        total += valor * (juros / 100);
    } else {
        total += juros;
    }

    emprestimos.push({
        nome,
        dataEmprestimo,
        dataLimite,
        valor,
        tipoJuros,
        juros,
        total,
        pago: 0,
    });

    salvarDados();

    atualizarTabela();

    limparCampos();
}

function limparCampos() {
    document.getElementById("nome").value = "";
    document.getElementById("dataEmprestimo").value = "";
    document.getElementById("dataLimite").value = "";
    document.getElementById("valor").value = "";
    document.getElementById("juros").value = "";
}

function atualizarTabela() {
    const tbody = document.querySelector("#tabela tbody");
    tbody.innerHTML = "";

    const hoje = new Date();

    const busca = document.getElementById("buscaNome").value.toLowerCase();

    emprestimos.forEach((emp, index) => {
        if (!emp.nome.toLowerCase().includes(busca)) {
            return;
        }
        hoje.setHours(0, 0, 0, 0);

        const aberto = emp.total - emp.pago;

        const dataLimite = converterData(emp.dataLimite);

        dataLimite.setHours(0, 0, 0, 0);

        const vencido = dataLimite < hoje && aberto > 0;

        const tr = document.createElement("tr");

        if (aberto <= 0) {
            tr.classList.add("quitado");
        } else if (vencido) {
            tr.classList.add("vencido");
        } else {
            tr.classList.add("em-dia");
        }

        tr.innerHTML = `
            <td>${emp.nome}</td>

            <td>${formatarData(emp.dataEmprestimo)}</td>

            <td>${formatarData(emp.dataLimite)}</td>

            <td>R$ ${emp.valor.toFixed(2)}</td>

            <td>
                ${
                    emp.tipoJuros === "percentual"
                        ? emp.juros + "%"
                        : "R$ " + emp.juros.toFixed(2)
                }
            </td>

            <td>R$ ${emp.total.toFixed(2)}</td>

            <td>R$ ${emp.pago.toFixed(2)}</td>

           <td>
                <span class="em-aberto ${aberto > 0 ? "aberto-positivo" : "aberto-quitado"}">
                    R$ ${aberto.toFixed(2)}
                </span>
            </td>


            <td>
                ${aberto <= 0 ? "Quitado" : vencido ? "Vencido" : "Em Dia"}
            </td>

            <td class="acoes">

                <button class="pagar" data-index="${index}">
                    Pagamento
                </button>

                <button class="editar" data-index="${index}">
                    Editar
                </button>

                <button class="remover" data-index="${index}">
                    Excluir
                </button>

            </td>
        `;

        tbody.appendChild(tr);

        tr.querySelector(".pagar").addEventListener("click", () => {
            registrarPagamento(index);
        });

        tr.querySelector(".editar").addEventListener("click", () => {
            editarEmprestimo(index);
        });

        tr.querySelector(".remover").addEventListener("click", () => {
            removerEmprestimo(index);
        });
    });
}

function registrarPagamento(index) {
    abrirModal("Registrar Pagamento", "", (valor) => {
        emprestimos[index].pago += valor;

        salvarDados();

        atualizarTabela();
    });
}

function editarEmprestimo(index) {
    abrirModal(
        "Adicionar valor ao empréstimo",
        "",

        (valorAdicional) => {
            emprestimos[index].valor += valorAdicional;

            let novoTotal = emprestimos[index].valor;

            if (emprestimos[index].tipoJuros === "percentual") {
                novoTotal +=
                    emprestimos[index].valor * (emprestimos[index].juros / 100);
            } else {
                novoTotal += emprestimos[index].juros;
            }

            emprestimos[index].total = novoTotal;

            salvarDados();

            atualizarTabela();
        },
    );
}

function removerEmprestimo(index) {
    modal.style.display = "flex";

    modalTitulo.innerText = "Deseja excluir este empréstimo?";

    modalInput.style.display = "none";

    modalSalvar.innerText = "Excluir";

    acaoAtual = () => {
        emprestimos.splice(index, 1);

        salvarDados();

        atualizarTabela();

        fecharModal();
    };
}

function exportarExcel() {
    const tabela = document.getElementById("tabela");

    const workbook = XLSX.utils.table_to_book(tabela, {
        sheet: "Empréstimos",
    });

    XLSX.writeFile(workbook, "controle_emprestimos.xlsx");
}

carregarDados();
atualizarTabela();

window.adicionarEmprestimo = adicionarEmprestimo;
window.exportarExcel = exportarExcel;
window.atualizarTabela = atualizarTabela;
