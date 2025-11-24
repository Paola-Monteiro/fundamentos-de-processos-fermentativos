const cardContainer = document.querySelector(".card-container");
const searchInput = document.querySelector("#search-input");
const searchButton = document.querySelector("#search-button");
const pDescricaoFase = document.getElementById('descricaoFase');

// Variáveis globais para os dados e a instância do gráfico
let dados = [];
let graficoCrescimento;

async function iniciarBusca() {
    const termoBusca = searchInput.value.toLowerCase();

    if (termoBusca.trim() === '') {
        renderizarCards([]); // Chama a função com um array vazio para limpar a tela
        return;
    }

    const dadosFiltrados = dados.filter(dado => {
        return dado.nome.toLowerCase().includes(termoBusca) ||
               dado.descrição.toLowerCase().includes(termoBusca);
    });
    renderizarCards(dadosFiltrados);
}

// Carrega os dados do JSON, renderiza os cards e o gráfico
async function carregarDadosIniciais() {
    try {
        const resposta = await fetch("data.json");
        dados = await resposta.json();
        renderizarCards([]); // Renderiza com array vazio para mostrar a mensagem inicial
        renderizarGrafico();
    } catch (error) {
        console.error("Erro ao carregar dados:", error);
    }
}

function renderizarCards(dadosParaRenderizar) { 
    cardContainer.innerHTML = ""; // Limpa os cards existentes
    if (dadosParaRenderizar.length === 0) {
        cardContainer.innerHTML = `<p class="info-text">Digite um termo na busca para exibir os cards correspondentes.</p>`;
        return;
    }

    dadosParaRenderizar.forEach(dado => {
        const article = document.createElement("article");
        article.className = 'card';
        article.innerHTML = `
            <h2>${dado.nome}</h2>
            <p>${dado.descrição}</p>
        `;
        cardContainer.appendChild(article);
    });
}

// Centraliza toda a lógica de criação e renderização do gráfico
function renderizarGrafico() {
    const ctx = document.getElementById('graficoCrescimento');
    if (!ctx) return;

    // Dados do gráfico
    const tempos = ['0h', '2h', '4h', '6h', '8h', '10h', '12h'];
    const biomassa = [0.1, 0.11, 0.4, 0.9, 1.8, 1.9, 1.7];

    // Cores padrão e de destaque para as fases
    const defaultBorderColor = 'rgba(150,150,150,0.8)';
    const phaseColors = {
        lag: 'purple',
        expo: 'green',
        estacionaria: 'orange',
        declinio: 'red',
    };

    // Monta o gráfico com datasets por fase
    graficoCrescimento = new Chart(ctx, {
        type: 'line',
        data: {
            labels: tempos,
            datasets: [
                {
                    label: 'Biomassa total (OD600)',
                    data: biomassa,
                    borderWidth: 2,
                    borderColor: defaultBorderColor,
                    tension: 0.3,
                },
            ],
        },
        options: {
            responsive: true,
            scales: {
                y: { title: { display: true, text: 'OD600' } },
                x: { title: { display: true, text: 'Tempo (horas)' } },
            },
        },
    });
}

// Função chamada pelos botões
function destacarFase(fase) {
    if (!graficoCrescimento) return;
    const mainDataset = graficoCrescimento.data.datasets[0];
    const todosOsTempos = graficoCrescimento.data.labels;
    const todaABiomassa = mainDataset.data;

    const phaseColors = {
        lag: 'purple',
        expo: 'green',
        estacionaria: 'orange',
        declinio: 'red',
    };

    // Remove qualquer dataset de destaque anterior (qualquer um além do principal)
    while (graficoCrescimento.data.datasets.length > 1) {
        graficoCrescimento.data.datasets.pop();
    }

    // Mapeia o botão para os índices do gráfico e o nome no JSON
    const mapaFases = {
        lag: { nomeJson: "Fase Lag (Fase de Adaptação)", start: 0, end: 1 }, // Segmento entre 0h-2h
        expo: { nomeJson: "Fase Exponencial (Log)", start: 1, end: 4 }, // Pontos de 2h a 8h
        estacionaria: { nomeJson: "Fase Estacionária", start: 4, end: 5 }, // Pontos de 8h a 10h
        declinio: { nomeJson: "Fase de Morte (ou Declínio)", start: 5, end: 6 }, // Pontos de 10h a 12h
    };

    const faseInfo = mapaFases[fase];
    if (!faseInfo) {
        // Se a fase não for encontrada ou for um clique para "desselecionar"
        pDescricaoFase.textContent = 'Clique em uma fase para ver a descrição.';
        graficoCrescimento.update();
        return;
    }

    // Cria um novo dataset SÓ para a fase destacada
    const highlightDataset = {
        label: faseInfo.nomeJson,
        data: todaABiomassa.slice(faseInfo.start, faseInfo.end + 1), // Pega a fatia dos dados
        borderColor: phaseColors[fase],
        borderWidth: 4, // Mais grosso para destacar
        tension: 0.3,
        // Para alinhar com o gráfico principal, preenchemos o início com nulls
        data: Array(faseInfo.start).fill(null).concat(todaABiomassa.slice(faseInfo.start, faseInfo.end + 1)),
    };

    graficoCrescimento.data.datasets.push(highlightDataset);
    graficoCrescimento.update();

    // Atualiza o texto da descrição buscando do array de dados
    const dadoFase = dados.find(d => d.nome === faseInfo.nomeJson);
    pDescricaoFase.textContent = dadoFase ? dadoFase.descrição : '';
}

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', carregarDadosIniciais);

searchButton.addEventListener('click', iniciarBusca);
searchInput.addEventListener('keyup', (event) => { if (event.key === 'Enter') { iniciarBusca(); } });